import { Suspense } from "react";
import { listCopies } from "@/features/admin/books";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { CopyStatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { CopyStatusButtons } from "./copy-status-buttons";
import type { BookCopy } from "@/lib/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "", label: "Semua" },
  { value: "AVAILABLE", label: "Tersedia" },
  { value: "BORROWED", label: "Dipinjam" },
  { value: "LOST", label: "Hilang" },
  { value: "DAMAGED", label: "Rusak" },
  { value: "INACTIVE", label: "Nonaktif" },
];

export default async function CopiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const { rows, total, pageCount } = await listCopies({ q, status: status || undefined, page });

  const chipHref = (s: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (s) p.set("status", s);
    const s2 = p.toString();
    return `/admin/copies${s2 ? `?${s2}` : ""}`;
  };
  const baseParams = new URLSearchParams();
  if (q) baseParams.set("q", q);
  if (status) baseParams.set("status", status);
  const base = `/admin/copies${baseParams.toString() ? `?${baseParams.toString()}` : ""}`;

  return (
    <div className="space-y-6 animate-rise">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline/70 pb-5">
        <div>
          <div className="flex items-center gap-2 text-label font-semibold text-sky-deep font-mono tracking-wider uppercase">
            <span className="size-2 rounded-full bg-sky" />
            <span>Inventaris Fisik · SMP Negeri 17 Tangerang Selatan</span>
          </div>
          <h1 className="mt-1 font-display text-display-sm sm:text-display-lg font-bold tracking-tight text-ink">
            Manajemen Eksemplar
          </h1>
          <p className="mt-1 text-body text-ink-muted">
            Pantau status fisik, penempatan rak, dan status operasional ({total.toLocaleString("id-ID")} unit tercatat).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/qr"
            className="inline-flex min-h-tap-min items-center justify-center rounded-md border border-outline bg-background px-4 text-label font-semibold text-ink hover:bg-surface transition-colors"
          >
            Cetak Label QR
          </Link>
          <Link
            href="/admin/books"
            className="inline-flex min-h-tap-min items-center justify-center rounded-md bg-sky px-4 text-label font-display font-semibold text-white hover:bg-sky-deep transition-colors"
          >
            Katalog Buku
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter status">
        {FILTERS.map((f) => {
          const isActive = (status || "") === f.value;
          return (
            <Link
              key={f.value}
              href={chipHref(f.value)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-label font-semibold transition-colors",
                isActive
                  ? "border-sky bg-sky-soft text-sky-deep shadow-xs font-bold"
                  : "border-outline text-ink-muted hover:border-outline-strong hover:bg-surface",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Suspense>
        <SearchInput placeholder="Cari kode inventaris atau token QR…" />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada data eksemplar"
          body={
            status || q
              ? "Tidak ada eksemplar buku yang cocok dengan filter status atau kata kunci pencarian."
              : "Belum ada eksemplar fisik terdaftar. Buka detail judul buku di katalog untuk mendaftarkan nomor eksemplar baru."
          }
          action={
            status || q ? (
              <Link href="/admin/copies">
                <Button variant="secondary" size="sm">
                  Reset Filter & Pencarian
                </Button>
              </Link>
            ) : (
              <Link href="/admin/books">
                <Button size="sm">Buka Katalog Buku</Button>
              </Link>
            )
          }
        />
      ) : (
        <DataTable<BookCopy>
          columns={[
            {
              header: "Kode Inventaris",
              cell: (c) => (
                <span className="font-mono text-label font-semibold bg-surface-sunken px-2 py-0.5 rounded-sm border border-outline/70 text-ink">
                  {c.inventory_code || "—"}
                </span>
              ),
            },
            {
              header: "Judul Buku",
              cell: (c) => <span className="font-semibold text-ink">{c.book_title}</span>,
            },
            {
              header: "Status",
              cell: (c) => <CopyStatusChip status={c.status} />,
            },
            {
              header: "Lokasi Rak",
              cell: (c) => (
                <span className="text-meta font-mono text-ink-muted">
                  {c.location ?? "—"}
                </span>
              ),
            },
            {
              header: "Tindakan Cepat",
              cell: (c) => <CopyStatusButtons id={c.id} status={c.status} />,
            },
          ]}
          rows={rows}
          page={page}
          pageCount={pageCount}
          baseUrl={base}
          totalLabel={`${total.toLocaleString("id-ID")} eksemplar · halaman ${page} dari ${pageCount}`}
        />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
