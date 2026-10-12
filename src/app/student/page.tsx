import Link from "next/link";
import { myLoans, myProfile } from "@/features/loans/actions";
import { LoanStatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { formatTanggal, hariTelat } from "@/lib/format";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Search, QrCode, ArrowRight } from "lucide-react";

function sisaHari(dueIso: string): number {
  const due = new Date(dueIso);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export default async function StudentDashboard() {
  const [profile, { active, history }] = await Promise.all([myProfile(), myLoans()]);
  const nama = profile?.student.name.split(" ")[0] ?? "Siswa";
  const jam = new Date().getHours();
  const sapa = jam < 11 ? "Selamat pagi" : jam < 15 ? "Selamat siang" : jam < 19 ? "Selamat sore" : "Selamat malam";
  const terlambat = active.filter((l) => hariTelat(l.due_at) > 0);
  const segera = active.filter((l) => {
    const s = sisaHari(l.due_at);
    return s >= 0 && s <= 3;
  });

  return (
    <div className="space-y-6 fade-in-key sm:space-y-8">
      {/* Header */}
      <header className="border-b border-outline/70 pb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-primary font-plex-mono">
          <span className="size-1.5 shrink-0 rounded-chip bg-success" aria-hidden />
          <span className="truncate">Perpustakaan Siswa · SMPN 17 Tangsel</span>
        </div>
        <h1 className="mt-1.5 font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {sapa}, {nama}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Pantau status buku pinjamanmu dan temukan referensi belajar berikutnya.
        </p>
      </header>

      {/* KPI Cards */}
      <section aria-labelledby="student-stats">
        <h2 id="student-stats" className="sr-only">Ringkasan Pinjaman Saya</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3">
          <KpiCard
            label="Sedang Dipinjam"
            value={active.length}
            secondary={active.length > 0 ? "Buku aktif kamu bawa pulang" : "Kamu belum meminjam buku"}
            icon="book"
            tone="info"
            badge="Pinjaman"
          />
          <KpiCard
            label={terlambat.length > 0 ? "Terlambat" : "Mendekati Tempo"}
            value={terlambat.length > 0 ? terlambat.length : segera.length}
            secondary={
              terlambat.length > 0
                ? "Buku harus segera dikembalikan ke perpustakaan"
                : segera.length > 0
                ? "Jatuh tempo dalam 3 hari ke depan"
                : "Tidak ada batas mendesak"
            }
            icon="clock"
            tone={terlambat.length > 0 ? "danger" : segera.length > 0 ? "warning" : "neutral"}
            badge={terlambat.length > 0 ? "Terlambat" : segera.length > 0 ? "Perhatian" : "Aman"}
          />
          <KpiCard
            label="Riwayat Selesai"
            value={history.length}
            secondary="Total buku yang telah kamu kembalikan"
            icon="check"
            tone="success"
            badge="Selesai"
          />
        </div>
      </section>

      {/* Student QR Card Banner */}
      {profile?.student && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-card border border-sky/30 bg-sky-soft/40 p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-sky text-white shrink-0 shadow-xs">
              <QrCode className="size-6" />
            </span>
            <div>
              <p className="font-display font-bold text-ink text-body sm:text-body">
                Kartu Anggota Perpustakaan Digital
              </p>
              <p className="text-meta text-ink-muted">
                NIS: <span className="font-mono font-semibold">{profile.student.nis}</span> · Tunjukkan QR saat meminjam buku ke petugas
              </p>
            </div>
          </div>
          <Link href="/student/profile" className="shrink-0">
            <Button variant="secondary" size="sm" className="gap-1.5 text-label bg-white">
              <span>Buka Kartu QR</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Quick Search */}
      <section className="rounded-card border border-outline bg-background p-5 shadow-xs">
        <h2 className="font-display text-body font-bold text-ink">Cari Koleksi Buku</h2>
        <form action="/student/books" method="GET" className="mt-2.5 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
            <Input
              name="q"
              placeholder="Cari judul novel, buku pelajaran, atau pengarang…"
              aria-label="Cari buku"
              className="pl-10 text-label sm:text-body"
            />
          </div>
          <Button type="submit" size="md" className="shrink-0">
            Cari
          </Button>
        </form>
      </section>

      {/* Active Loans */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-outline pb-2">
          <h2 className="font-display text-body font-bold text-ink">Buku yang Sedang Dipinjam</h2>
          {active.length > 0 && (
            <Link href="/student/loans" className="text-label font-semibold text-sky-deep hover:underline">
              Lihat semua ({active.length}) →
            </Link>
          )}
        </div>

        {active.length === 0 ? (
          <EmptyState
            title="Tidak Ada Buku Dipinjam"
            body="Saat ini kamu tidak memiliki buku yang sedang dipinjam. Jelajahi katalog buku untuk meminjam koleksi perpustakaan."
            action={
              <Link href="/student/books">
                <Button size="md">Jelajahi Katalog Buku</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {active.slice(0, 4).map((loan) => {
              const telat = hariTelat(loan.due_at);
              const sisa = sisaHari(loan.due_at);
              return (
                <div
                  key={loan.id}
                  className="flex flex-col justify-between rounded-card border border-outline bg-background p-4 shadow-xs hover:border-outline-strong transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display font-bold text-ink text-body sm:text-body line-clamp-1">
                        {loan.book_title}
                      </p>
                      <LoanStatusChip status={telat > 0 ? "OVERDUE" : loan.status} />
                    </div>
                    <p className="mt-1 font-mono text-label text-sky-deep font-semibold">
                      {loan.inventory_code}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline/60 flex items-center justify-between text-label">
                    <span className="text-ink-subtle">Jatuh tempo:</span>
                    <span className="font-semibold text-ink">
                      {formatTanggal(loan.due_at)}
                      {telat > 0 ? (
                        <span className="ml-1.5 text-danger font-semibold">(Telat {telat} hari)</span>
                      ) : sisa <= 3 ? (
                        <span className="ml-1.5 text-warning font-semibold">(Sisa {sisa} hari)</span>
                      ) : null}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
