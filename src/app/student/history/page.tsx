import Link from "next/link";
import { myLoans } from "@/features/loans/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatTanggal } from "@/lib/format";

export default async function StudentHistory() {
  const { history } = await myLoans();

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-display text-display-sm font-bold">Riwayat Peminjaman</h1>
        <p className="text-ink-muted">
          {history.length > 0
            ? `${history.length} buku sudah kamu kembalikan.`
            : "Jejak bacaanmu akan tercatat di sini."}
        </p>
      </header>

      {history.length === 0 ? (
        <EmptyState
          title="Belum ada riwayat"
          body="Kamu belum pernah mengembalikan buku. Riwayat bacaanmu akan muncul di sini."
          action={
            <Link href="/student/books">
              <Button size="lg">Jelajahi katalog</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Mobile: kartu. min-w-[560px] di bawah selalu scroll pada 375px,
              dan halaman ini yang paling sering dibuka siswa dari HP (PRD §15). */}
          <ul className="grid gap-3 sm:hidden">
            {history.map((loan) => (
              <li key={loan.id} className="rounded-card border border-outline bg-surface p-4 shadow-card">
                <p className="truncate font-semibold">{loan.book_title}</p>
                <p className="mt-0.5 font-mono text-meta text-ink-muted">{loan.inventory_code}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-label">
                  <div>
                    <dt className="text-meta text-ink-muted">Dikembalikan</dt>
                    <dd className="font-semibold">{formatTanggal(loan.returned_at)}</dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-meta text-ink-muted">Denda</dt>
                    <dd className="font-semibold">
                      {loan.fine_amount > 0 ? (
                        <span className="text-coral-deep">{formatRupiah(loan.fine_amount)}</span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-card border border-outline bg-surface shadow-card sm:block">
          <table className="w-full min-w-[560px] snap-x snap-mandatory text-left text-body">
            <thead>
              <tr className="border-b border-outline text-ink-muted">
                <th scope="col" className="px-4 py-3 font-semibold">Judul</th>
                <th scope="col" className="px-4 py-3 font-semibold">Dipinjam</th>
                <th scope="col" className="px-4 py-3 font-semibold">Dikembalikan</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Denda</th>
              </tr>
            </thead>
            <tbody>
              {history.map((loan) => (
                <tr key={loan.id} className="snap-start border-b border-outline last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{loan.book_title}</p>
                    <p className="font-mono text-meta text-ink-muted">{loan.inventory_code}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatTanggal(loan.borrowed_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatTanggal(loan.returned_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {loan.fine_amount > 0 ? (
                      <span className="font-semibold text-coral-deep">{formatRupiah(loan.fine_amount)}</span>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
