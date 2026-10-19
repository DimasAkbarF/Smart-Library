import Link from "next/link";
import { Suspense } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { StatusFilterNav } from "@/components/ui/status-filter-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { listLoans } from "@/features/loans/actions";
import { TransactionsClient } from "./transactions-client";

const FILTERS = [
  { label: "Semua Transaksi", value: "" },
  { label: "Aktif Dipinjam", value: "ACTIVE" },
  { label: "Terlambat", value: "OVERDUE" },
  { label: "Sudah Kembali", value: "RETURNED" },
];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const page = Number(sp.page ?? 1) || 1;
  const { rows, total, page: p, pageCount } = await listLoans({ q, status: status || undefined, page });

  const chipHref = (s: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (s) params.set("status", s);
    const s2 = params.toString();
    return `/admin/transactions${s2 ? `?${s2}` : ""}`;
  };
  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (status) baseParams.set("status", status);
  const base = `/admin/transactions${baseParams.toString() ? `?${baseParams.toString()}` : ""}`;
  const exportHref = `/api/export?type=loans${status ? `&status=${status}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline pb-5">
        <div>
          <span className="text-label font-semibold text-primary font-mono tracking-wider uppercase">
            Sirkulasi Buku · Transaksi
          </span>
          <h1 className="mt-1 font-display text-display-sm sm:text-display-lg font-bold tracking-tight text-ink">
            Daftar Transaksi Peminjaman
          </h1>
          <p className="mt-1 text-body text-ink-muted">
            {total.toLocaleString("id-ID")} total riwayat peminjaman tercatat di perpustakaan.
          </p>
        </div>
        <Link
          href={exportHref}
          className="inline-flex min-h-tap-min items-center justify-center rounded-md border border-outline bg-surface px-4 py-2 text-label font-semibold text-ink hover:bg-surface-sunken-ed hover:text-primary transition-colors w-full sm:w-auto"
        >
          Ekspor Seluruh CSV
        </Link>
      </div>

      <div className="space-y-3">
        <StatusFilterNav
          items={FILTERS.map((f) => ({ ...f, href: chipHref(f.value) }))}
          activeValue={status}
        />

        <Suspense fallback={null}>
          <SearchInput placeholder="Cari nama siswa, NIS, judul buku, atau kode inventaris…" />
        </Suspense>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada transaksi"
          body="Belum ada transaksi peminjaman yang cocok dengan filter pencarian saat ini."
        />
      ) : (
        <TransactionsClient
          loans={rows}
          page={p}
          pageCount={pageCount}
          baseUrl={base}
          total={total}
        />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
