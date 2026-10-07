import Link from "next/link";
import { myLoans } from "@/features/loans/actions";
import { LoanStatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatTanggal, hariTelat } from "@/lib/format";

export default async function StudentLoans() {
  const { active } = await myLoans();

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-display text-display-sm font-bold">Buku Saya</h1>
        <p className="text-ink-muted">
          {active.length > 0
            ? `Kamu sedang meminjam ${active.length} buku.`
            : "Semua buku sudah kembali. Kerja bagus."}
        </p>
      </header>

      {active.length === 0 ? (
        <EmptyState
          title="Tidak ada pinjaman aktif"
          body="Belum ada buku yang sedang kamu pinjam. Jelajahi katalog untuk menemukan buku berikutnya."
          action={
            <Link href="/student/books">
              <Button size="lg">Jelajahi katalog</Button>
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {active.map((loan) => {
            const telat = hariTelat(loan.due_at);
            return (
              <li key={loan.id} className="grid gap-2 rounded-card border border-outline bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-title font-bold">{loan.book_title}</p>
                    <p className="font-mono text-body text-ink-muted">{loan.inventory_code}</p>
                  </div>
                  <LoanStatusChip status={telat > 0 ? "OVERDUE" : loan.status} />
                </div>
                <dl className="grid gap-1 text-body sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="text-ink-muted">Dipinjam</dt>
                    <dd className="font-semibold">{formatTanggal(loan.borrowed_at)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-ink-muted">Jatuh tempo</dt>
                    <dd className="font-semibold">{formatTanggal(loan.due_at)}</dd>
                  </div>
                </dl>
                {telat > 0 ? (
                  <p className="rounded-md bg-coral-soft px-3 py-2 text-body font-semibold text-coral-deep">
                    Telat {telat} hari. Segera kembalikan bukumu ke perpustakaan.
                  </p>
                ) : (
                  <p className="text-body text-ink-muted">
                    Kembalikan sebelum {formatTanggal(loan.due_at)} agar tidak terkena denda.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
