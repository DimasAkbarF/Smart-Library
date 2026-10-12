-- =============================================================
-- Migration 004: Konsolidasi Role Menjadi Admin dan Siswa
-- Mengubah seluruh user bertipe 'librarian' menjadi 'admin'
-- dan memperbarui constraint role di tabel profiles.
-- =============================================================

update profiles set role = 'admin' where role = 'librarian';

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('student', 'admin'));
