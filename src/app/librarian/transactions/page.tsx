import Link from "next/link";
import { Suspense } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { listLoans } from "@/features/loans/actions";
import { TransactionsClient } from "./transactions-client";
import { cn } from "@/lib/utils";

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
    return `/librarian/transactions${s2 ? `?${s2}` : ""}`;
  };
  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (status) baseParams.set("status", status);
  const base = `/librarian/transactions${baseParams.toString() ? `?${baseParams.toString()}` : ""}`;
  const exportHref = `/api/export?type=loans${status ? `&status=${status}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline pb-5">
        <div>
          <span className="text-xs font-semibold text-sky-deep font-mono tracking-wider uppercase">
            Sirkulasi Buku · Transaksi
          </span>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Daftar Transaksi Peminjaman
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {total.toLocaleString("id-ID")} total riwayat peminjaman tercatat di perpustakaan.
          </p>
        </div>
        <Link
          href={exportHref}
          className="inline-flex items-center justify-center rounded-md border border-outline bg-background px-4 py-2 text-xs font-semibold text-ink hover:bg-surface hover:text-sky-deep transition-all shadow-xs"
        >
          Ekspor Seluruh CSV
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status">
          {FILTERS.map((f) => (
            <Link
              key={f.label}
              href={chipHref(f.value)}
              aria-current={(status || "") === f.value ? "true" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                (status || "") === f.value
                  ? "border-sky bg-sky-soft text-sky-deep shadow-xs font-bold"
                  : "border-outline text-ink-muted hover:bg-surface hover:text-ink"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <Suspense>
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
