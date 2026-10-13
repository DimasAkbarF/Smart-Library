# ADR-001: Sentralisasi Autentikasi Staf dan Penghapusan Cloudflare Turnstile

## Status
Accepted

## Date
2026-10-14

## Context
Aplikasi Smart Library SMPN 17 Tangerang Selatan awalnya mengimplementasikan integrasi widget bot Cloudflare Turnstile (`@marsidev/react-turnstile`) pada formulir login dan memiliki dua rute masuk yang terpisah: `/admin/login` dan `/login`.

Dalam pengujian dan deployment produksi, implementasi ini menimbulkan beberapa kendala:
1. **Galat Token Kedaluwarsa/Replay:** Pengguna sah kerap menemui pesan *"Token verifikasi keamanan sudah pernah digunakan. Silakan muat ulang halaman."* akibat race condition antara verifikasi iframe client dan validasi server-side saat koneksi internet sekolah mengalami fluktuasi.
2. **Ketergantungan Layanan Pihak Ketiga:** Endpoint `challenges.cloudflare.com` memerlukan injeksi skrip eksternal, penyesuaian CSP (`script-src`, `frame-src`), serta latensi jaringan tambahan untuk verifikasi siteverify di setiap percobaan login.
3. **Konteks Pengguna:** Smart Library merupakan sistem perpustakaan sekolah internal di mana akses login hanya diperuntukkan bagi admin dan petugas perpustakaan (siswa mengakses katalog buku dan kartu anggota digital tanpa akun login).

## Decision
1. **Hapus Seluruh Dependensi Cloudflare & Turnstile:** Menghapus paket `@marsidev/react-turnstile`, modul helper verifikasi token, komponen widget client, variabel lingkungan `TURNSTILE_*`, serta domain Cloudflare dari Content Security Policy (CSP).
2. **Pemusatan Portal Masuk di `/login`:** Mengalihkan rute lama `/admin/login` secara permanen (HTTP 301 `permanentRedirect`) ke `/login`.
3. **Penguatan Keamanan Berbasis Server (Defense-in-Depth):**
   - **Persistent Rate Limiting:** Membatasi percobaan masuk gagal maksimal 5 kali per identifier akun dan 10 kali per alamat IP (lockout dinamis dengan pesan sisa waktu tunggu).
   - **Anti-Timing Attack (`dummyCryptoDelay`):** Mengeksekusi hashing PBKDF2 konstan dengan `timingSafeEqual` saat akun tidak ditemukan agar waktu respons seragam dan penyerang tidak dapat melakukan *username enumeration*.
   - **Audit Trail:** Mencatat seluruh peristiwa autentikasi (`auth.login_success`, `auth.failed`, `auth.rate_limited`) ke dalam tabel basis data `audit_logs`.
   - **Role-Based Access Control (RBAC):** Menolak secara tegas pengguna dengan `role` selain `admin` dan `librarian`.

## Alternatives Considered

### Opsi A: Mempertahankan Cloudflare Turnstile dengan Relaksasi Cache
- **Kelebihan:** Tetap memiliki perlindungan CAPTCHA grafis.
- **Kekurangan:** Tetap bergantung pada pihak ketiga, risiko kegagalan verifikasi saat jaringan lambat, serta menambah bundle JavaScript client.
- **Alasan Ditolak:** Menambah kompleksitas tanpa memberikan nilai tambah signifikan pada sistem internal sekolah dengan jumlah staf terbatas.

### Opsi B: Google reCAPTCHA v3
- **Kelebihan:** Populer dan tidak memerlukan interaksi klik checkbox jika skor tinggi.
- **Kekurangan:** Masalah privasi data siswa/sekolah, skrip pelacak Google, dan kompleksitas verifikasi backend yang serupa.
- **Alasan Ditolak:** Tidak sejalan dengan prinsip privasi data institusi pendidikan dan membebani performa client.

## Consequences
- **Positif:**
  - Zero false-positive login failures akibat token bot kedaluwarsa.
  - Performa muat halaman `/login` meningkat karena penghapusan skrip eksternal.
  - CSP menjadi lebih ketat tanpa celah iframe eksternal.
  - Antarmuka masuk menjadi tunggal, konsisten, dan mudah dipahami staf sekolah.
- **Negatif / Mitigasi:**
  - Tidak ada proteksi visual CAPTCHA di client-side. Dimitigasi sepenuhnya melalui *dual-key server-side rate limiting* (per-IP dan per-akun) serta *anti-timing delays*.
