import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { adminDashboard } from "@/features/admin/reports";
import { Button } from "@/components/ui/button";
import { StatPanel, type MetricCell } from "@/components/ui/stat-row";
import { InteractiveChart } from "@/components/dashboard/interactive-chart";
import { NeedsAttention, type AttentionItem } from "@/components/dashboard/needs-attention";
import { HumanActivityFeed } from "@/components/dashboard/human-activity-feed";

export default async function AdminPage() {
  const d = await adminDashboard();

  const nf = new Intl.NumberFormat("id-ID");
  const pf = new Intl.NumberFormat("id-ID", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const borrowRatio = d.copies > 0 ? d.borrowed / d.copies : 0;
  const borrowPercentStr = pf.format(borrowRatio);

  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const metrics: MetricCell[] = [
    {
      label: "Dipinjam hari ini",
      value: nf.format(d.borrowedToday),
      description: "Peminjaman baru sirkulasi",
      href: "/admin/transactions",
    },
    {
      label: "Dikembalikan hari ini",
      value: nf.format(d.returnedToday),
      description: "Eksemplar diterima kembali",
      href: "/admin/transactions?status=RETURNED",
    },
    {
      label: "Sedang dipinjam",
      value: nf.format(d.borrowed),
      description: `${borrowPercentStr} dari total koleksi`,
      href: "/admin/transactions?status=ACTIVE",
    },
    {
      label: "Terlambat",
      value: nf.format(d.overdue),
      description: d.overdue > 0 ? "Perlu ditindaklanjuti hari ini" : "Nihil keterlambatan",
      href: "/admin/transactions?status=OVERDUE",
      isDanger: d.overdue > 0,
    },
  ];

  const attentionItems: AttentionItem[] = [
    {
      id: "overdue",
      title: "buku melewati batas pengembalian",
      count: d.overdue,
      description: "Peminjaman melewati jatuh tempo dan memerlukan peringatan ke siswa.",
      href: "/admin/transactions?status=OVERDUE",
      severity: "urgent",
      actionLabel: "Tinjau transaksi",
    },
    {
      id: "students-unassigned",
      title: "siswa aktif belum memiliki rombel kelas",
      count: d.studentsWithoutClass,
      description: "Data siswa perlu dilengkapi dengan penetapan kelas.",
      href: "/admin/students",
      severity: "warning",
      actionLabel: "Perbarui kelas",
    },
    {
      id: "damaged-copies",
      title: "eksemplar dalam status rusak / hilang",
      count: d.damagedCopies,
      description: "Eksemplar memerlukan verifikasi fisik atau pembaruan status inventaris.",
      href: "/admin/copies?status=DAMAGED",
      severity: "info",
      actionLabel: "Cek eksemplar",
    },
  ];

  return (
    <div className="space-y-4 fade-in-key sm:space-y-8">
      {/* ============================================================
          SECTION 1 & 5: DASHBOARD HERO WITH CLEAR HIERARCHY
          Page Context -> Title & Greeting -> Primary Actions
          ============================================================ */}
      <header className="flex flex-col gap-4 border-b border-rule pb-5 md:flex-row md:items-start md:justify-between md:gap-6 sm:pb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-medium text-primary font-plex-mono flex-wrap">
            <span className="size-1.5 shrink-0 rounded-chip bg-success" aria-hidden />
            <span className="break-words">SMP Negeri 17 Tangerang Selatan · {todayFormatted}</span>
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Dashboard Perpustakaan
          </h1>
          <p className="mt-2 text-[13.5px] leading-[1.55] text-ink-muted sm:text-body sm:leading-relaxed">
            Selamat datang kembali, <span className="font-semibold text-ink">Admin Perpustakaan</span>. Pantau koleksi, peminjaman, dan operasional sirkulasi hari ini.
          </p>
        </div>

        {/* Aksi utama */}
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5 md:w-auto md:flex-wrap">
          <Link href="/admin/borrow" className="min-w-0 flex-1 md:flex-initial">
            <Button
              size="sm"
              className="h-11 min-h-11 w-full min-w-0 gap-2 whitespace-nowrap px-3.5 text-[13.5px] font-semibold md:h-12 md:min-h-12 md:px-5 md:text-body justify-center"
            >
              <Plus className="size-4 shrink-0 md:size-5" />
              <span>Pinjamkan Buku</span>
            </Button>
          </Link>
          <Link href="/admin/return" className="min-w-0 flex-1 md:flex-initial">
            <Button
              variant="secondary"
              size="sm"
              className="h-11 min-h-11 w-full min-w-0 gap-2 whitespace-nowrap px-3.5 text-[13.5px] font-semibold md:h-12 md:min-h-12 md:px-5 md:text-body justify-center"
            >
              <Upload className="size-4 shrink-0 md:size-5" />
              <span>Terima Pengembalian</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* ============================================================
          SECTION 2: METRIK SIRKULASI (PRD §8.2, design.md §5)
          Satu panel 4 sel terpisah garis vertikal, klikable ke daftar terfilter
          ============================================================ */}
      <section aria-labelledby="kpi-section-heading" className="space-y-3">
        <h2 id="kpi-section-heading" className="sr-only">
          Statistik Utama Perpustakaan
        </h2>
        <StatPanel metrics={metrics} />

        {/* Informasi Sekunder: Teks biasa tanpa kartu dan tanpa ikon */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-1 font-plex-sans text-xs text-ink-muted">
          <Link
            href="/admin/books"
            className="hover:text-primary transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded-xs"
          >
            <span>Total koleksi: </span>
            <span className="font-semibold text-ink">{nf.format(d.titles)} judul</span>
            <span className="text-ink-subtle select-none"> · </span>
            <span className="font-semibold text-ink">{nf.format(d.copies)} eksemplar</span>
          </Link>
          <span className="hidden sm:inline text-rule-strong select-none" aria-hidden>·</span>
          <Link
            href="/admin/students"
            className="hover:text-primary transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded-xs"
          >
            <span>Siswa terdaftar: </span>
            <span className="font-semibold text-ink">{nf.format(d.students)}</span>
          </Link>
        </div>
      </section>

      {/* ============================================================
          SECTION 7: INTERACTIVE DATA VISUALIZATION
          7d, 30d, 90d Circulation Trend with Tooltip
          ============================================================ */}
      <section>
        <InteractiveChart initialData={d.chartData} />
      </section>

      {/* ============================================================
          SECTIONS 9 & 10: "NEEDS ATTENTION" & HUMAN ACTIVITY FEED
          Two-column grid layout for actionable tasks & live events
          ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Needs Attention */}
        <NeedsAttention items={attentionItems} />

        {/* Human Activity Feed */}
        <HumanActivityFeed activities={d.activity} />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
