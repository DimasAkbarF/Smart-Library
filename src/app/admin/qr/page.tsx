import { Suspense } from "react";
import Link from "next/link";
import { listCopies } from "@/features/admin/books";
import { SearchInput } from "@/components/ui/search-input";
import { StatusFilterNav } from "@/components/ui/status-filter-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { PrintButton } from "./print-button";
import { QrPreviewGrid } from "./qr-preview-grid";

const FILTERS = [
  { value: "", label: "Semua Label" },
  { value: "AVAILABLE", label: "Tersedia" },
  { value: "BORROWED", label: "Sedang Dipinjam" },
  { value: "DAMAGED", label: "Rusak" },
  { value: "LOST", label: "Hilang" },
  { value: "INACTIVE", label: "Nonaktif" },
];

export default async function QrPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const { rows, total, pageCount } = await listCopies({
    q,
    status: status || undefined,
    page,
    pageSize: 36,
  });

  const chipHref = (s: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (s) p.set("status", s);
    const str = p.toString();
    return `/admin/qr${str ? `?${str}` : ""}`;
  };

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    p.set("page", String(n));
    return `/admin/qr?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <span className="text-label font-semibold text-primary font-mono tracking-wider uppercase">
            Inventaris & Sirkulasi · Label QR Koleksi
          </span>
          <h1 className="mt-1 font-display text-display-sm sm:text-display-lg font-bold tracking-tight text-ink">
            Label QR Code Buku
          </h1>
          <p className="mt-1 text-body text-ink-muted">
            {total.toLocaleString("id-ID")} label eksemplar terdaftar · Halaman {page} dari {pageCount}
          </p>
        </div>
        <PrintButton className="w-full sm:w-auto min-h-tap-min font-semibold justify-center" />
      </div>

      {/* Filter and Search Bar */}
      <div className="no-print space-y-3">
        <StatusFilterNav
          items={FILTERS.map((f) => ({ ...f, href: chipHref(f.value) }))}
          activeValue={status}
        />
        <Suspense fallback={null}>
          <SearchInput placeholder="Cari kode inventaris, token QR, atau judul buku…" />
        </Suspense>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada label QR"
          body="Tidak ada eksemplar buku yang cocok dengan kata kunci atau filter status terpilih."
        />
      ) : (
        <>
          <QrPreviewGrid
            copies={rows.map((r) => ({
              ...r,
              qr_token: r.qr_token || r.inventory_code,
              book_title: r.book_title || "Buku Perpustakaan",
            }))}
          />

          {/* Pagination Navigation */}
          <nav className="no-print flex items-center justify-center gap-2 pt-4" aria-label="Paginasi">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="rounded-md border border-outline bg-surface px-3 py-1.5 text-label font-semibold text-ink hover:bg-surface-sunken-ed"
              >
                ← Sebelumnya
              </Link>
            )}
            <span className="rounded-md bg-surface px-3 py-1.5 font-mono text-label font-semibold text-ink border border-outline">
              {page} / {pageCount}
            </span>
            {page < pageCount && (
              <Link
                href={pageHref(page + 1)}
                className="rounded-md border border-outline bg-surface px-3 py-1.5 text-label font-semibold text-ink hover:bg-surface-sunken-ed"
              >
                Berikutnya →
              </Link>
            )}
          </nav>
        </>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
