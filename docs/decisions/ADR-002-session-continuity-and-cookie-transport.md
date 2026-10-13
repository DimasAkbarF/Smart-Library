# ADR-002: Kontinuitas Sesi dan Manajemen Cookie dengan Supabase SSR

## Status
Accepted

## Date
2026-10-14

## Context
Pada integrasi Next.js 16 App Router dan `@supabase/ssr`, terdapat kendala di mana staf admin berhasil login pada formulir, namun segera terpental (*session dropped*) kembali ke `/login` saat diarahkan ke `/admin`.

Analisis akar masalah menemukan dua faktor utama:
1. **Revokasi Sesi oleh `updateUserById`:** Server action autentikasi sebelumnya memanggil `auth.admin.updateUserById(userId, { password })` di setiap proses login. Pada Supabase Auth, pembaruan password secara administratif secara otomatis membatalkan (*revoke*) seluruh refresh token aktif akun tersebut, sehingga sesi yang baru saja dibuat langsung tidak valid.
2. **Atribut `secure: true` pada HTTP / Localhost:** Cookie auth di-set dengan flag `secure: true` secara statis. Saat server dijalankan di lingkungan pengujian lokal (HTTP pada port 3000), browser menolak menyimpan cookie secure melalui protokol tanpa TLS, menyebabkan kegagalan sesi instan.

## Decision
1. **Hentikan Pembaruan Password Otomatis Saat Login:**
   - Autentikasi diserahkan sepenuhnya ke `supabase.auth.signInWithPassword({ email, password })`.
   - Modifikasi kata sandi hanya diizinkan melalui alur resmi ganti kata sandi (`changePassword`) saat pengguna sudah memiliki sesi terotentikasi atau melalui alur reset kata sandi resmi.
2. **Deteksi Skema Transportasi Cookie Dinamis:**
   - Evaluasi atribut `secure` pada cookie berdasarkan header reverse proxy (`x-forwarded-proto === "https"`) dan status host.
   - Pengecualian otomatis untuk host lokal (`localhost` atau `127.0.0.1`) agar cookie dapat diterima pada HTTP lokal tanpa mengorbankan keamanan di lingkungan produksi HTTPS (Vercel).
3. **Hardening Cookie Flags:**
   - Semua cookie sesi Supabase (`sb-*-auth-token`) wajib diset dengan:
     - `httpOnly: true` (mencegah pencurian token via skrip XSS)
     - `sameSite: "lax"` (mencegah eksploitasi CSRF pada navigasi lintas situs)
     - `path: "/"` (berlaku seragam di seluruh rute aplikasi)
     - `secure: isSecure` (wajib HTTPS di produksi)

## Alternatives Considered

### Opsi A: Memaksa Penggunaan HTTPS di Lingkungan Lokal dengan Self-Signed Certificates
- **Kelebihan:** Konsistensi protokol TLS di semua lingkungan.
- **Kekurangan:** Memerlukan konfigurasi `mkcert` atau sertifikat SSL lokal pada setiap mesin developer dan runner CI, menimbulkan hambatan instalasi bagi tim.
- **Alasan Ditolak:** Menambah beban operasional lokal yang tidak diperlukan jika deteksi lingkungan (`isLocal`) sudah cukup aman dan terisolasi.

### Opsi B: Mengelola Sesi Kustom Melalui In-Memory Store / Redis
- **Kelebihan:** Kontrol penuh atas siklus hidup sesi.
- **Kekurangan:** Memerlukan infrastruktur database memori tambahan dan menduplikasi fitur bawaan Supabase Auth SSR.
- **Alasan Ditolak:** Menambah kompleksitas arsitektur; `@supabase/ssr` sudah memiliki standar industri untuk Next.js App Router.

## Consequences
- **Positif:**
  - Sesi login admin persisten dan stabil tanpa putus di production maupun lingkungan pengujian lokal.
  - Alur pengujian otomatis (headless Chrome / Puppeteer) berjalan lancar dengan tingkat keberhasilan 100%.
  - Perlindungan terhadap kebocoran sesi XSS dan serangan CSRF tetap maksimal berkat `httpOnly` dan `sameSite: "lax"`.
- **Negatif / Mitigasi:**
  - Logika deteksi cookie memerlukan pembacaan header (`headers()` di Server Components dan `request.headers` di middleware). Dimitigasi dengan blok `try/catch` aman jika konteks headers belum tersedia.
