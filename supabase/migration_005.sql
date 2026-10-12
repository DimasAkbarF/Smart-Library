-- =============================================================
-- Migration 005: Indeks Kinerja Sirkulasi, Siswa, dan Audit
-- Meningkatkan kecepatan query dasbor, laporan, dan direktori siswa
-- =============================================================

-- 1. Indeks tanggal peminjaman (untuk agregasi tren 14/30 hari dan laporan)
create index if not exists loans_borrowed_at_idx on loans (borrowed_at);

-- 2. Indeks komposit filter kelas + sorting nama siswa
create index if not exists students_class_name_idx on students (class_id, name);

-- 3. Indeks sorting riwayat aktivitas admin (audit log)
create index if not exists audit_logs_created_at_idx on audit_logs (created_at desc);

-- 4. Indeks filter status eksemplar
create index if not exists book_copies_status_cond_idx on book_copies (status, condition);
