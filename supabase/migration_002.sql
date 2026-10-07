-- Kolom email di profiles agar login bisa memakai username ATAU email:
-- username di-resolve ke email di server, lalu signInWithPassword seperti biasa.
alter table profiles add column if not exists email text;
create unique index if not exists profiles_email_idx on profiles (email);
