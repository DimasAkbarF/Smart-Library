import { BorrowWorkspace } from "./borrow-workspace";
import { getPolicy } from "@/features/loans/actions";

export default async function BorrowPage() {
  const policy = await getPolicy();
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-display-sm font-bold">Pinjam Buku</h1>
        <p className="mt-1 text-ink-muted">
          Maksimal {policy.max_active_loans} buku aktif per siswa · durasi {policy.loan_duration_days} hari.
        </p>
      </div>
      <BorrowWorkspace maxLoansFallback={policy.max_active_loans} />
    </div>
  );
}

export const dynamic = "force-dynamic";
