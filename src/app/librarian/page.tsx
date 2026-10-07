import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { librarianDashboard } from "@/features/admin/reports";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { formatTanggal, hariTelat } from "@/lib/format";

export default async function LibrarianHome() {
  const d = await librarianDashboard();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <header className="border-b border-outline/70 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-deep font-mono tracking-wider uppercase">
          <span className="size-2 rounded-full bg-leaf" />
          <span>Meja Sirkulasi · SMP Negeri 17 Tangerang Selatan</span>
        </div>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          Layanan Sirkulasi
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Siap melayani peminjaman hari ini? Gunakan pemindai QR untuk alur cepat sirkulasi siswa.
        </p>
      </header>

      {/* Primary Circulation Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/librarian/borrow" className="block">
          <div className="flex items-center justify-between rounded-lg border-2 border-sky/30 bg-surface p-4 sm:p-5 text-ink shadow-xs transition-colors hover:border-sky hover:bg-sky-soft/20">
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 items-center justify-center rounded-md bg-sky text-white shrink-0">
                <ArrowUpFromLine className="size-5" />
              </span>
              <div>
                <p className="font-display text-base sm:text-lg font-bold text-ink">Pinjam Buku</p>
                <p className="text-xs text-ink-muted mt-0.5">Pindai kartu siswa lalu pindai buku koleksi</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-sky-deep shrink-0" />
          </div>
        </Link>

        <Link href="/librarian/return" className="block">
          <div className="flex items-center justify-between rounded-lg border-2 border-leaf/30 bg-surface p-4 sm:p-5 text-ink shadow-xs transition-colors hover:border-leaf hover:bg-leaf-soft/20">
            <div className="flex items-center gap-3.5">
              <span className="flex size-11 items-center justify-center rounded-md bg-leaf text-white shrink-0">
                <ArrowDownToLine className="size-5" />
              </span>
              <div>
                <p className="font-display text-base sm:text-lg font-bold text-ink">Kembalikan Buku</p>
                <p className="text-xs text-ink-muted mt-0.5">Pindai kode inventaris buku yang dikembalikan</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-leaf-deep shrink-0" />
          </div>
        </Link>
      </div>

      {/* Daily KPIs */}
      <section aria-labelledby="circulation-stats">
        <h2 id="circulation-stats" className="sr-only">
          Statistik Sirkulasi Hari Ini
        </h2>
        <KpiGrid>
          <KpiCard
            label="Pinjam Hari Ini"
            value={d.borrowedToday}
            secondary="Buku keluar dalam layanan hari ini"
            icon="borrow"
            tone="sky"
          />
          <KpiCard
            label="Kembali Hari Ini"
            value={d.returnedToday}
            secondary="Buku fisik berhasil diterima kembali"
            icon="check"
            tone="leaf"
          />
          <KpiCard
            label="Sedang Dipinjam"
            value={d.active}
            secondary="Total pinjaman aktif di luar perpustakaan"
            icon="circulation"
            tone="sun"
          />
          <KpiCard
            label="Keterlambatan"
            value={d.overdue}
            secondary={d.overdue > 0 ? "Perlu konfirmasi ke siswa terkait" : "Seluruh pinjaman tepat waktu"}
            icon="clock"
            tone={d.overdue > 0 ? "coral" : "leaf"}
            badge={d.overdue > 0 ? "Perlu Tindakan" : undefined}
          />
        </KpiGrid>
      </section>

      {/* Perlu Perhatian / Overdue list */}
      <section aria-label="Peringatan keterlambatan" className="rounded-card border border-outline bg-background p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-outline/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-coral-soft text-coral-deep">
              <Clock className="size-4" />
            </span>
            <h2 className="font-display text-base font-bold text-ink">
              Keterlambatan Peminjaman ({d.overdue})
            </h2>
          </div>
          {d.overdue > 0 && (
            <Link
              href="/librarian/transactions?status=OVERDUE"
              className="text-xs font-semibold text-coral-deep hover:underline"
            >
              Lihat semua ({d.overdue}) →
            </Link>
          )}
        </div>

        {d.overdueRows.length === 0 ? (
          <div className="flex items-center gap-3 py-6 text-sm text-ink-muted">
            <CheckCircle2 className="size-5 text-leaf-deep shrink-0" />
            <p>Tidak ada pinjaman yang terlambat saat ini. Seluruh koleksi beredar terpantau tertib.</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-outline/60">
            {d.overdueRows.map((r) => (
              <li
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 hover:bg-coral-soft/20 px-2 rounded-lg -mx-2 transition-colors"
              >
                <div>
                  <p className="font-semibold text-sm text-ink">
                    {r.student_name}{" "}
                    <span className="font-mono text-xs text-ink-subtle">
                      ({r.student_nis}) {r.class_name ? `· ${r.class_name}` : ""}
                    </span>
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {r.book_title}{" "}
                    <span className="font-mono font-semibold text-sky-deep">[{r.inventory_code}]</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="text-ink-subtle">Jatuh tempo: {formatTanggal(r.due_at)}</p>
                    <p className="font-bold text-coral-deep">Telat {hariTelat(r.due_at)} hari</p>
                  </div>
                  <Link href={`/librarian/transactions?q=${encodeURIComponent(r.inventory_code)}`}>
                    <Button variant="secondary" size="sm" className="h-8 text-xs">
                      Detail
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
