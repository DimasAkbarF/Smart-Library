-- Perbaikan: hitung keterlambatan dari interval, bukan cast langsung.
-- (date_trunc('day', a) - date_trunc('day', b)) menghasilkan INTERVAL,
-- sehingga ::int gagal: "cannot cast type interval to integer".
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

  v_late_days := greatest(0, extract(day from (date_trunc('day', v_now) - date_trunc('day', v_loan.due_at)))::int);
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