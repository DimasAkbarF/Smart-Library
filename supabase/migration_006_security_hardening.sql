-- =============================================================
-- Migration 006: Security & Hardening Schema Updates
-- SMP Negeri 17 Tangerang Selatan
--
-- 1. Tambah kolom keamanan profil:
--    - must_change_password: wajib ganti kata sandi di login pertama
--    - totp_secret: secret key TOTP RFC 6238 untuk 2FA admin
--    - totp_enabled: status aktifasi 2FA
-- 2. Migrasi token QR siswa menjadi token acak berentropi tinggi
--    (bukan lagi format SIS-{NIS} yang mudah ditebak)
-- =============================================================

-- 1. Kolom keamanan akun di tabel profiles
alter table profiles add column if not exists must_change_password boolean not null default false;
alter table profiles add column if not exists totp_secret text;
alter table profiles add column if not exists totp_enabled boolean not null default false;

-- Indeks status ganti password untuk mempercepat pengecekan sesi
create index if not exists profiles_must_change_pwd_idx on profiles (must_change_password) where must_change_password = true;

-- 2. Perbarui token QR siswa yang masih berupa format tertebak SIS-{NIS}
-- Menggunakan token kriptografis acak berbasis hex berentropi tinggi (STU-xxxxxxxxxxxxxxxx)
update students
set qr_token = 'STU-' || upper(encode(gen_random_bytes(10), 'hex'))
where qr_token like 'SIS-%' or qr_token = nis;

-- Pastikan indeks unik qr_token siswa tetap optimal
create unique index if not exists students_qr_token_unique_idx on students (qr_token);
