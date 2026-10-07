-- =============================================================
-- Smart Library System — Supabase schema (PostgreSQL)
-- SMP Negeri 17 Tangerang Selatan
--
-- Cara pakai:
--   1. Buat project di supabase.com
--   2. SQL Editor > paste seluruh file ini > Run
--   3. Isi .env.local (lihat .env.example)
--   4. npm run seed   (membuat 3 akun demo + data contoh)
--
-- Prinsip: QR hanya identifier. Sumber kebenaran = tabel di bawah.
-- Semua transaksi pinjam/kembali WAJIB lewat RPC borrow_book /
-- return_book (transaction + row lock + audit dalam 1 unit).
-- =============================================================

-- ---------- Roles & status sebagai CHECK (tanpa enum kaku) ----------

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role text not null check (role in ('student', 'librarian', 'admin')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  nis text unique not null,
  name text not null,
  class_id uuid references classes (id) on delete set null,
  qr_token text unique not null,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'graduated')),
  user_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists students_name_idx on students (name);
create index if not exists students_class_idx on students (class_id);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  isbn text,
  title text not null,
  author text not null default 'Tanpa penulis',
  publisher text,
  publication_year int,
  category_id uuid references categories (id) on delete set null,
  cover_url text,
  created_at timestamptz not null default now()
);
create index if not exists books_title_idx on books (title);
create index if not exists books_author_idx on books (author);

create sequence if not exists copy_seq start 1;

create table if not exists book_copies (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books (id) on delete cascade,
  inventory_code text unique not null,
  qr_token text unique not null,
  condition text not null default 'good'
    check (condition in ('good', 'fair', 'damaged')),
  location text,
  status text not null default 'AVAILABLE'
    check (status in ('AVAILABLE', 'BORROWED', 'LOST', 'DAMAGED', 'INACTIVE')),
  created_at timestamptz not null default now()
);
create index if not exists copies_book_idx on book_copies (book_id);
create index if not exists copies_status_idx on book_copies (status);

-- Auto inventory_code + qr_token: BOOK-000001, BOOK-000002, ...
create or replace function set_copy_codes()
returns trigger language plpgsql as $$
begin
  if new.inventory_code is null or new.inventory_code = '' then
    new.inventory_code := 'BOOK-' || lpad(nextval('copy_seq')::text, 6, '0');
  end if;
  if new.qr_token is null or new.qr_token = '' then
    new.qr_token := new.inventory_code;
  end if;
  return new;
end $$;

drop trigger if exists trg_copy_codes on book_copies;
create trigger trg_copy_codes
  before insert on book_copies
  for each row execute function set_copy_codes();

create table if not exists loans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete restrict,
  book_copy_id uuid not null references book_copies (id) on delete restrict,
  librarian_id uuid references profiles (id) on delete set null,
  borrowed_at timestamptz not null default now(),
  due_at timestamptz not null,
  returned_at timestamptz,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'RETURNED', 'OVERDUE', 'CANCELLED')),
  fine_amount numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists loans_student_idx on loans (student_id);
create index if not exists loans_copy_idx on loans (book_copy_id);
create index if not exists loans_status_idx on loans (status);
-- Guard anti double-borrow di level database: 1 copy = maks 1 loan aktif
create unique index if not exists loans_one_active_per_copy
  on loans (book_copy_id) where status in ('ACTIVE', 'OVERDUE');

-- Kebijakan peminjaman: configurable, bukan hard-coded di aplikasi
create table if not exists library_policies (
  id smallint primary key check (id = 1),
  max_active_loans int not null default 2,
  loan_duration_days int not null default 7,
  fine_per_day numeric not null default 0,
  allow_renewal boolean not null default false,
  max_renewal_count int not null default 0
);
insert into library_policies (id) values (1) on conflict (id) do nothing;

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists audit_entity_idx on audit_logs (entity_type, entity_id);
create index if not exists audit_created_idx on audit_logs (created_at desc);

-- ---------- RLS: deny-by-default ----------
-- Aplikasi hanya mengakses DB lewat server (service-role) sehingga
-- browser tidak pernah query tabel langsung. RLS tetap aktif sebagai
-- jaring pengaman bila anon key bocor ke client.
alter table profiles enable row level security;
alter table classes enable row level security;
alter table categories enable row level security;
alter table students enable row level security;
alter table books enable row level security;
alter table book_copies enable row level security;
alter table loans enable row level security;
alter table library_policies enable row level security;
alter table audit_logs enable row level security;

-- ---------- RPC: BORROW (transaction + row lock) ----------
create or replace function borrow_book(
  p_student_id uuid,
  p_copy_id uuid,
  p_librarian_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student students%rowtype;
  v_copy book_copies%rowtype;
  v_policy library_policies%rowtype;
  v_active_count int;
  v_loan loans%rowtype;
begin
  select * into v_policy from library_policies where id = 1;

  select * into v_student from students where id = p_student_id for update;
  if not found then
    raise exception 'STUDENT_NOT_FOUND';
  end if;
  if v_student.status <> 'active' then
    raise exception 'STUDENT_INACTIVE';
  end if;

  select * into v_copy from book_copies where id = p_copy_id for update;
  if not found then
    raise exception 'COPY_NOT_FOUND';
  end if;
  if v_copy.status <> 'AVAILABLE' then
    raise exception 'COPY_NOT_AVAILABLE';
  end if;

  select count(*) into v_active_count from loans
    where student_id = p_student_id and status in ('ACTIVE', 'OVERDUE');
  if v_active_count >= v_policy.max_active_loans then
    raise exception 'LOAN_LIMIT_REACHED';
  end if;

  insert into loans (student_id, book_copy_id, librarian_id, due_at)
  values (
    p_student_id,
    p_copy_id,
    p_librarian_id,
    now() + (v_policy.loan_duration_days || ' days')::interval
  )
  returning * into v_loan;

  update book_copies set status = 'BORROWED' where id = p_copy_id;

  insert into audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (p_librarian_id, 'loan.create', 'loan', v_loan.id::text,
    jsonb_build_object('student_id', p_student_id, 'copy_id', p_copy_id));

  return jsonb_build_object(
    'id', v_loan.id,
    'student_id', v_loan.student_id,
    'book_copy_id', v_loan.book_copy_id,
    'borrowed_at', v_loan.borrowed_at,
    'due_at', v_loan.due_at,
    'status', v_loan.status
  );
exception
  when raise_exception then raise;
  when unique_violation then
    raise exception 'COPY_ALREADY_BORROWED';
end $$;

-- ---------- RPC: RETURN (transaction + row lock) ----------
create or replace function return_book(
  p_copy_id uuid,
  p_librarian_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_copy book_copies%rowtype;
  v_loan loans%rowtype;
  v_policy library_policies%rowtype;
  v_now timestamptz := now();
  v_late_days int;
  v_fine numeric;
begin
  select * into v_policy from library_policies where id = 1;

  select * into v_copy from book_copies where id = p_copy_id for update;
  if not found then
    raise exception 'COPY_NOT_FOUND';
  end if;

  select * into v_loan from loans
    where book_copy_id = p_copy_id and status in ('ACTIVE', 'OVERDUE')
    for update;
  if not found then
    raise exception 'ACTIVE_LOAN_NOT_FOUND';
  end if;

  v_late_days := greatest(0, (date_trunc('day', v_now) - date_trunc('day', v_loan.due_at))::int);
  v_fine := v_late_days * v_policy.fine_per_day;

  update loans
    set returned_at = v_now, status = 'RETURNED', fine_amount = v_fine
    where id = v_loan.id;

  update book_copies set status = 'AVAILABLE' where id = p_copy_id;

  insert into audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (p_librarian_id, 'loan.return', 'loan', v_loan.id::text,
    jsonb_build_object('copy_id', p_copy_id, 'late_days', v_late_days, 'fine', v_fine));

  return jsonb_build_object(
    'loan_id', v_loan.id,
    'student_id', v_loan.student_id,
    'late_days', v_late_days,
    'fine', v_fine,
    'returned_at', v_now
  );
end $$;

-- ---------- RPC: tandai overdue (dipanggil saat buka dashboard/laporan) ----------
create or replace function mark_overdue()
returns int
language sql
security definer
set search_path = public
as $$
  with u as (
    update loans set status = 'OVERDUE'
    where status = 'ACTIVE' and due_at < now()
    returning 1
  )
  select count(*)::int from u;
$$;

-- ---------- Data awal: kategori & kelas ----------
insert into categories (name) values
  ('Fiksi'), ('Nonfiksi'), ('Pelajaran'), ('Referensi'),
  ('Komik'), ('Majalah'), ('Biografi'), ('Agama')
on conflict (name) do nothing;

insert into classes (name) values
  ('VII-A'), ('VII-B'), ('VII-C'),
  ('VIII-A'), ('VIII-B'), ('VIII-C'),
  ('IX-A'), ('IX-B'), ('IX-C')
on conflict (name) do nothing;
