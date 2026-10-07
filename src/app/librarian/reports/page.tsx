import Link from "next/link";
import { LoanStatusChip } from "@/components/ui/status-chip";
import { reportSummary } from "@/features/admin/reports";

export default async function LibrarianReports() {
  const r = await reportSummary();
  const max = Math.max(1, ...r.perDay.map((d) => Math.max(d.pinjam, d.kembali)));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Laporan 14 Hari</h1>
          <p className="mt-1 text-ink-muted">Aktivitas peminjaman dan pengembalian.</p>
        </div>
        <Link href="/api/export?type=loans" className="font-semibold text-sky-deep hover:underline">
          Ekspor CSV
        </Link>
      </div>

      <section aria-label="Grafik harian" className="grid gap-2 rounded-card border border-outline p-5">
        {r.perDay.map((d) => (
          <div key={d.date} className="grid grid-cols-[72px_1fr] items-center gap-3">
            <span className="text-sm text-ink-muted">{d.date}</span>
            <div className="grid gap-1">
              <div className="flex items-center gap-2">
                <div className="h-3 min-w-1 rounded-sm bg-sky" style={{ width: `${Math.max(d.pinjam > 0 ? 4 : 0, (d.pinjam / max) * 100)}%` }} />
                <span className="font-mono text-xs text-ink-subtle">{d.pinjam} pinjam</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 min-w-1 rounded-sm bg-leaf" style={{ width: `${Math.max(d.kembali > 0 ? 4 : 0, (d.kembali / max) * 100)}%` }} />
                <span className="font-mono text-xs text-ink-subtle">{d.kembali} kembali</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-label="Buku terpopuler" className="rounded-card border border-outline p-5">
          <h2 className="font-display text-lg font-bold">Buku terpopuler</h2>
          {r.topBooks.length === 0 ? (
            <p className="mt-2 text-ink-muted">Belum ada data.</p>
          ) : (
            <ol className="mt-3 grid gap-2">
              {r.topBooks.map((b, i) => (
                <li key={b.title} className="flex items-baseline justify-between gap-3">
                  <span><span className="font-mono text-ink-subtle">{i + 1}.</span> {b.title}</span>
                  <span className="font-mono font-bold">{b.count}×</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-label="Status pinjaman" className="rounded-card border border-outline p-5">
          <h2 className="font-display text-lg font-bold">Status pinjaman</h2>
          {r.byStatus.length === 0 ? (
            <p className="mt-2 text-ink-muted">Belum ada data.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {r.byStatus.map((s) => (
                <li key={s.status} className="flex items-center justify-between gap-3">
                  <LoanStatusChip status={s.status} />
                  <span className="font-mono font-bold">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
