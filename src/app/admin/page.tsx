import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { adminDashboard } from "@/features/admin/reports";
import { Button } from "@/components/ui/button";
import { KpiCard, KpiGrid } from "@/components/dashboard/kpi-card";
import { InteractiveChart } from "@/components/dashboard/interactive-chart";
import { NeedsAttention, type AttentionItem } from "@/components/dashboard/needs-attention";
import { HumanActivityFeed } from "@/components/dashboard/human-activity-feed";

export default async function AdminPage() {
  const d = await adminDashboard();

  const borrowPercent = d.copies > 0 ? ((d.borrowed / d.copies) * 100).toFixed(1) : "0";

  const attentionItems: AttentionItem[] = [
    {
      id: "overdue",
      title: "buku melewati batas pengembalian",
      count: d.overdue,
      description: "Peminjaman melewati jatuh tempo dan memerlukan peringatan ke siswa.",
      href: "/librarian/transactions?status=OVERDUE",
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
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ============================================================
          SECTION 1 & 5: DASHBOARD HERO WITH CLEAR HIERARCHY
          Page Context -> Title & Greeting -> Primary Actions
          ============================================================ */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline/70 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-deep font-mono tracking-wider uppercase">
            <span className="size-2 rounded-full bg-leaf" />
            <span>Smart Library · SMP Negeri 17 Tangerang Selatan</span>
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Dasbor
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Selamat datang kembali, <span className="font-semibold text-ink">Admin Data</span>. Pantau koleksi, transaksi, dan aktivitas perpustakaan hari ini.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/admin/books/new">
            <Button size="md" className="gap-2 shadow-xs">
              <Plus className="size-4" />
              <span>Tambah Buku</span>
            </Button>
          </Link>
          <Link href="/admin/import">
            <Button variant="secondary" size="md" className="gap-2">
              <Upload className="size-4" />
              <span>Impor Data</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* ============================================================
          SECTION 6: SMART KPI (Meaningful Secondary Data + Animation)
          ============================================================ */}
      <section aria-labelledby="kpi-section-heading">
        <h2 id="kpi-section-heading" className="sr-only">
          Statistik Utama Perpustakaan
        </h2>
        <KpiGrid>
          <KpiCard
            label="Total Eksemplar"
            value={d.copies}
            secondary={`Koleksi fisik dari ${d.titles.toLocaleString("id-ID")} judul buku`}
            icon="layers"
            tone="sky"
          />
          <KpiCard
            label="Sedang Dipinjam"
            value={d.borrowed}
            secondary={`${borrowPercent}% dari total koleksi aktif beredar`}
            icon="circulation"
            tone="sun"
          />
          <KpiCard
            label="Terlambat"
            value={d.overdue}
            secondary={d.overdue > 0 ? "Perlu ditindaklanjuti hari ini" : "Nihil keterlambatan"}
            icon="clock"
            tone={d.overdue > 0 ? "coral" : "leaf"}
            badge={d.overdue > 0 ? "Perlu Tindakan" : undefined}
          />
          <KpiCard
            label="Siswa Aktif"
            value={d.students}
            secondary="Terdaftar dalam sistem akademik sekolah"
            icon="users"
            tone="leaf"
          />
        </KpiGrid>
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
