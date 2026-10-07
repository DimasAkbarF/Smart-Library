import { reportSummary } from "@/features/admin/reports";
import { Download } from "lucide-react";

export default async function ReportsPage() {
  const r = await reportSummary();
  const maxDay = Math.max(1, ...r.perDay.map((d) => d.pinjam + d.kembali));
  const maxTop = Math.max(1, ...r.topBooks.map((b) => b.count));

  return (
    <div className="grid gap-6 animate-rise">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline/70 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-deep font-mono tracking-wider uppercase">
            <span className="size-2 rounded-full bg-sky" />
            <span>Laporan Operasional · SMP Negeri 17 Tangerang Selatan</span>
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Laporan Sirkulasi
          </h1>
          <p className="mt-1 text-sm text-ink-muted">Aktivitas peminjaman dan pengembalian 14 hari terakhir.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { type: "loans", label: "Unduh Transaksi (CSV)" },
            { type: "books", label: "Unduh Buku (CSV)" },
            { type: "students", label: "Unduh Siswa (CSV)" },
          ].map((e) => (
            <a
              key={e.type}
              href={`/api/export?type=${e.type}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-outline bg-background px-3 text-xs font-semibold text-ink hover:bg-surface transition-colors"
            >
              <Download className="size-3.5 text-ink-muted" />
              {e.label}
            </a>
          ))}
        </div>
      </div>

      <section className="rounded-card border border-outline bg-background p-5 shadow-xs">
        <h2 className="mb-3 font-bold text-ink">Peminjaman & Pengembalian per Hari</h2>
        <ul className="grid gap-2">
          {r.perDay.map((d) => (
            <li key={d.date} className="grid grid-cols-[88px_1fr_auto] items-center gap-2 text-sm">
              <span className="font-mono text-xs text-ink-muted">{d.date}</span>
              <span
                className="flex h-5 w-full items-center overflow-hidden rounded-sm bg-surface-sunken p-0.5 border border-outline/40"
                role="group"
                aria-label={`Aktivitas ${d.date}: ${d.pinjam} pinjam, ${d.kembali} kembali`}
              >
                {d.pinjam > 0 && (
                  <span
                    role="meter"
                    aria-label={`Pinjam: ${d.pinjam}`}
                    aria-valuenow={d.pinjam}
                    aria-valuemin={0}
                    aria-valuemax={maxDay}
                    className="h-full rounded-sm bg-sky transition-all duration-300"
                    style={{ width: `${(d.pinjam / maxDay) * 100}%` }}
                  />
                )}
                {d.kembali > 0 && (
                  <span
                    role="meter"
                    aria-label={`Kembali: ${d.kembali}`}
                    aria-valuenow={d.kembali}
                    aria-valuemin={0}
                    aria-valuemax={maxDay}
                    className="h-full rounded-sm bg-leaf transition-all duration-300"
                    style={{ width: `${(d.kembali / maxDay) * 100}%` }}
                  />
                )}
                {d.pinjam === 0 && d.kembali === 0 && (
                  <span className="text-[10px] font-mono text-ink-subtle px-1.5 select-none">
                    Tidak ada aktivitas
                  </span>
                )}
              </span>
              <span className="font-mono text-xs text-ink-muted">
                {d.pinjam} pinjam · {d.kembali} kembali
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-center gap-4 text-xs text-ink-muted border-t border-outline/40 pt-2.5">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-sky" /> Pinjam
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-leaf" /> Kembali
          </span>
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-card border border-outline bg-background p-5 shadow-xs">
          <h2 className="mb-3 font-bold">Buku terpopuler</h2>
          {r.topBooks.length === 0 ? (
            <p className="text-ink-muted">Belum ada transaksi pada periode ini.</p>
          ) : (
            <ul className="grid gap-2">
              {r.topBooks.map((b) => (
                <li key={b.title} className="grid gap-1 text-sm">
                  <span className="flex justify-between gap-2">
                    <span className="truncate font-semibold">{b.title}</span>
                    <span className="font-mono text-ink-muted">{b.count}×</span>
                  </span>
                  <span
                    role="meter"
                    aria-label={`${b.title}: dipinjam ${b.count} kali`}
                    aria-valuenow={b.count}
                    aria-valuemin={0}
                    aria-valuemax={maxTop}
                    className="h-2 rounded-full bg-surface-sunken block"
                  >
                    <span className="block h-full rounded-full bg-berry transition-all duration-300" style={{ width: `${(b.count / maxTop) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card border border-outline bg-background p-5 shadow-xs">
          <h2 className="mb-3 font-bold">Transaksi per status</h2>
          {r.byStatus.length === 0 ? (
            <p className="text-ink-muted">Belum ada transaksi pada periode ini.</p>
          ) : (
            <ul className="grid gap-2 text-sm">
              {r.byStatus.map((s) => (
                <li key={s.status} className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold">{s.status}</span>
                  <span className="font-mono text-ink-muted">{s.count}</span>
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
