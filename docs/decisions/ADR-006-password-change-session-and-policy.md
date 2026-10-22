# ADR-006: Ganti Kata Sandi Berbasis Sesi dan Kebijakan Kekuatan Kata Sandi

## Status
Accepted

## Date
2026-10-22

## Context
Halaman `/change-password` (wajib saat login pertama, `profiles.must_change_password`) sebelumnya:

- hanya menanyakan **kata sandi baru + konfirmasi** (tanpa verifikasi sandi lama);
- memakai `svc.auth.admin.updateUserById(userId, { password })` — API yang **mencabut
  seluruh refresh token aktif** (aturan proyek melarang pemakaiannya di jalur login
  karena alasan yang sama);
- hanya memvalidasi panjang minimal 8 karakter (`validatePassword`), tanpa aturan
  komposisi karakter, dan tanpa rate limit khusus — sehingga halaman ini bisa
  dipakai untuk brute-force tanpaelisah;
- pesan error tunggal di atas form, tanpa indikator kekuatan maupun daftar syarat.

Risiko yang relevan untuk portal sekolah: sesi yang dibajak (XSS, cookie dicuri di
perangkat bersama) bisa mengambil alih akun secara permanen dengan mengganti sandi
tanpa membuktikan kepemilikan; dan kebijakan sandi yang lemah membuat akun perpustakaan mudah ditebak.

Catatan: akun admin disimpan di Supabase Auth, sehingga **tidak ada hash lokal** yang bisa dibandingkan — verifikasi "sandi saat ini" harus lewat Supabase Auth.

## Decision

1. **Verifikasi kata sandi saat ini (re-auth) di server.** `changePassword` menerima
   `current_password` dan memverifikasinya lewat `signInWithPassword` memakai
   **klien tanpa sesi** (`createAnonClient()`, `persistSession: false`) sehingga cookie sesi pengguna yang sedang aktif tidak tersentuh.
2. **Rate limit terpisah dari login.** Kunci `change_password:id:<username>` (maks 5)
   dan `change_password:ip:<ip>` (maks 10). Percobaan gagal di halaman ini tidak
   pernah menyentuh penghitung `admin_login:*` / `login:*`, jadi tidak mengunci akun
   secara global. Kegagalan dicatat ke `audit_logs` dengan alasan
   `current_password_mismatch` — **tanpa nilai kata sandi**.
3. **Perubahan sandi lewat jalur sesi.** `supabase.auth.updateUser({ password })`
   pada klien server berbasis cookie. Refresh token aktif tidak dicabut.
   `auth.admin.updateUserById` hanya jadi fallback bila jalur sesi ditolak
   (mis. reauthentication required), dan fallback itu dicatat di log.
4. **Satu sumber kebenaran kebijakan.** `src/lib/password.ts` export `PASSWORD_POLICY` (min 12 karakter, minimal 3 dari 4 jenis karakter), daftar
   `PASSWORD_RULES` (dipakai untuk centang di UI), `checkPasswordStrength()` untuk
   indikator 4 level, dan `validatePassword()` untuk server. Larangan tambahan:
   kata sandi umum/bawaan, dan kata sandi yang memuat username/NIS/email.
5. **UI memvalidasi, server memutuskan.** Indikator kekuatan dan daftar syarat
   dihitung client-side dari `PASSWORD_RULES` yang sama, tetapi penolakan tetap
   berasal dari server. Pesan kesalahan per-field ditampilkan tepat di bawah
   field-nya (`state.field`), bukan hanya toast/alert global.
6. **Anti-leak.** Nilai kata sandi tidak pernah masuk query string, log, metadata
   audit, atau pesan error. State form dikosongkan setelah sukses (redirect).

## Alternatives Considered

### Opsi A: Verifikasi sandi lama lewat hash lokal
- **Kelebihan:** tidak ada panggilan jaringan tambahan.
- **Kekurangan:** repo **tidak punya** hash kata sandi lokal (authentikasi memakai
  Supabase Auth), jadi opsi ini menuntut penyimpanan hash kedua = dua sumber
  kebenaran. Ditolak.

### Opsi B: Melewati verifikasi sandi lama (status quo)
- **Kelebihan:** paling sederhana, tanpa panggilan Auth tambahan.
- **Kekurangan:** sesi yang dibajak dapat mengunci pemilik akun secara permanen.
  Ditolak.

### Opsi C: `auth.admin.updateUserById` untuk perubahan sandi (status quo)
- **Kelebihan:** selalu berhasil, tidak bergantung pada sesi.
- **Kekurangan:** mencabut refresh token aktif di perangkat lain — pengguna
  sebaliknya logout paksa. Ditolak sebagai jalur utama.

### Opsi D: Kebijakan 12 karakter + 4 jenis karakter (huruf besar, huruf kecil, angka, simbol) semuanya wajib
- **Kelebihan:** entropy lebih tinggi per karakter.
- **Kekurangan:** memaksa pola yang tidak nyaman di keyboard sekolah, dan
  membatalkan frasa acak 3 kata yang secara entropi setara. Ditolak; dipilih
  **3 dari 4 kelas** + panjang minimum 12 (lihat ADR-006 §4).

## Consequences

- **Positif:** takeover lewat sesi curian perlu sandi lama; brute force pada form
  ter-limitasi tanpa mengunci login; kebijakan sandi terpusat dan teruji otomatis
  (`scripts/test-password-policy.mjs`, 18 assertion).
- **Negatif:** satu panggilan Auth tambahan per penggantian sandi; akun lama
  dengan sandi 8 karakter harus memilih sandi baru yang memenuhi kebijakan baru
  (memang itu tujuan migrasi `must_change_password`).
- **Catatan operasional:** jalur sukses **tidak** diuji otomatis karena akan
  mengubah kata sandi akun admin sungguhan; hanya jalur penolakan yang diuji
  (`scripts/test-all-features.mjs` §3.16).
- **Catatan:** "Too many re-renders" (React #441) tidak ditemukan pada 20 halaman
  utama dengan sesi aktif (probe `.browser-tests/probe-console-errors.mjs`) —
  0 error console. Error 400 yang muncul pada `/admin/transactions` berasal dari
  prefetch RSC ke `/api/export` (bukan React) dan sudah diperbaiki dengan
  `prefetch={false}`.

## Addendum (22 Okt 2026, hasil audit "bug di server")

Tiga celah ditemukan dan diperbaiki setelah implementasi awal:

1. **Halaman admin masih menyebut aturan lama.** `src/features/admin/users.ts`
   memakai zod `.min(8, "…minimal 8 karakter.")` dan `user-client.tsx` memakai
   `minLength={6}`/8, sementara `validatePassword` sudah menolak < 12 karakter.
   Akibatnya admin melihat galat yang membingungkan. Sekarang **semua** batas
   minimum membaca `PASSWORD_POLICY` (sumber kebenaran tunggal), termasuk
   zod, hint UI, dan atribut `minLength`.
2. **Tidak ada cara membuka kunci `change_password:*`.** `unlockIdentifier` dan
   `scripts/reset-lockout.mjs` hanya mengenal key `login:*`/`admin_login:*`,
   sehingga staf yang terkunci di form ganti sandi tidak bisa dibuka kuncinya.
   Keduanya kini reset `change_password:id:*` dan `change_password:ip:*` juga.
3. **Counter rate limit di memori tidak mengikuti penghapusan baris database.**
   `checkRateLimit` memakai `memoryStore` sebagai cache; menghapus baris
   `auth_rate_limits` (lewat script pemulihan atau admin) **tidak** menghapus
   counter di memori server yang sedang berjalan → akun tetap terkunci sampai
   server restart. Sekarang: bila query DB sukses dan **tidak ada** baris,
   entri memori ikut dibuang (database = sumber kebenaran). Bila query DB
   **gagal** (jaringan mati), entri memori **dipertahankan** agar proteksi
   brute-force tidak runtuh saat DB down.

   Efek samping yang diinginkan: test suite tidak lagi meninggalkan akun admin
   terkunci (terverifikasi: counter tetap `1` setelah 2× run berurutan,
   sebelumnya `2 → 4 → 6 …` sampai terkunci).
