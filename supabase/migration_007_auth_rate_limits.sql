-- =============================================================
-- Migration 007: Durable Authentication Rate Limiting
-- SMP Negeri 17 Tangerang Selatan
--
-- Menyimpan status percobaan login & lockout secara persisten di database
-- agar tetap sinkron dan tidak hilang saat restart instance atau multi-instance production.
-- =============================================================

create table if not exists auth_rate_limits (
  key text primary key,
  count int not null default 0,
  first_failed_at bigint not null,
  locked_until bigint not null default 0,
  backoff_level int not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists auth_rate_limits_locked_idx on auth_rate_limits (locked_until);

-- Pembersihan otomatis data rate limit kadaluarsa (> 24 jam)
create or replace function cleanup_expired_rate_limits()
returns void language sql as $$
  delete from auth_rate_limits
  where locked_until < (extract(epoch from now()) * 1000)::bigint
    and first_failed_at < ((extract(epoch from now()) - 86400) * 1000)::bigint;
$$;
