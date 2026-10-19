-- =============================================================
-- Migration 009: Security Hardening — Revoke RPC Execute from Public
-- SMP Negeri 17 Tangerang Selatan
--
-- Masalah: fungsi security-definer (borrow_book, return_book, mark_overdue)
-- dan cleanup_expired_rate_limits dapat dipanggil langsung lewat PostgREST
-- (/rest/v1/rpc/...) oleh siapa pun yang memegang anon key. Probe non-destruktif
-- menunjukkan borrow_book/return_book mengembalikan error bisnis (STUDENT_NOT_FOUND,
-- COPY_NOT_FOUND) alih-alih 401/403, dan mark_overdue mengembalikan 200.
-- Kebocoran ini memungkinkan mutasi sirkulasi tanpa autentikasi.
--
-- Solusi: cabut EXECUTE dari PUBLIC/anon/authenticated; berikan hanya ke
-- service_role (yang dipakai server Next.js). Aplikasi tetap berfungsi karena
-- semua pemanggilan RPC memakai serviceClient().
--
-- Juga: aktifkan RLS pada auth_rate_limits (deny-by-default) agar tabel rate limit
-- tidak bisa dibaca/ditulis langsung lewat anon key.
--
-- Migrasi ini bersifat idempoten: setiap objek yang tidak ada (mis. fungsi
-- cleanup_expired_rate_limits belum dibuat) akan dilewati tanpa error.
--
-- JALANKAN DI SUPABASE DASHBOARD / SQL EDITOR (production) SETELAH REVIEW.
-- =============================================================

-- 1. Cabut EXECUTE pada fungsi RPC dari role publik (idempoten)
do $$
declare
  v_funcs text[] := array['borrow_book', 'return_book', 'mark_overdue', 'cleanup_expired_rate_limits'];
  v_fn text;
begin
  foreach v_fn in array v_funcs loop
    if exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = v_fn
    ) then
      execute format('revoke execute on function public.%I from public', v_fn);
      execute format('revoke execute on function public.%I from anon', v_fn);
      execute format('revoke execute on function public.%I from authenticated', v_fn);
      execute format('grant execute on function public.%I to service_role', v_fn);
    end if;
  end loop;
end $$;

-- 2. RLS pada auth_rate_limits (idempoten): deny-by-default
--    service_role tetap bypass RLS.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'auth_rate_limits'
  ) then
    alter table public.auth_rate_limits enable row level security;
  end if;
end $$;