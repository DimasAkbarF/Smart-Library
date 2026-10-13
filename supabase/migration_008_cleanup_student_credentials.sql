-- =============================================================
-- Migration 008: Cleanup Student Auth Credentials (OPSIONAL)
-- SMP Negeri 17 Tangerang Selatan
--
-- Menghapus kredensial login siswa dari tabel auth/profil
-- TANPA menghapus data anggota di tabel students (NIS, Nama, Kelas, QR Token)
-- serta seluruh riwayat sirkulasi peminjaman (loans) yang tetap aman dan utuh.
--
-- PERINGATAN: Jangan jalankan skrip ini sebelum melakukan konfirmasi / backup!
-- =============================================================

-- 1. Lepaskan relasi user_id dari tabel students (data siswa & riwayat peminjaman tetap utuh!)
update students
set user_id = null
where user_id is not null;

-- 2. Hapus profil akun login siswa dari tabel profiles
delete from profiles
where role = 'student';

-- 3. Hapus foreign key user_id jika tidak lagi digunakan oleh siswa
-- (tetap opsional agar schema lama tidak terganggu)
comment on column students.user_id is 'Kolom warisan: login siswa telah dihapus, seluruh sirkulasi dioperasikan oleh petugas.';
