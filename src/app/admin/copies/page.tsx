import { Suspense } from "react";
import { listCopies } from "@/features/admin/books";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { StatusFilterNav } from "@/components/ui/status-filter-nav";
import { CopyStatusChip } from "@/components/ui/status-chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { CopyStatusButtons } from "./copy-status-buttons";
import { QrQuickViewButton } from "@/components/library/qr-modal";
import type { BookCopy } from "@/lib/types";
import Link from "next/link";

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
          <div className="flex items-center gap-2 text-xs font-medium text-primary font-plex-mono tracking-wider uppercase">
            <span className="size-1.5 rounded-chip bg-primary" />
            <span>Inventaris Fisik · SMP Negeri 17 Tangerang Selatan</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-ink">
            Manajemen Eksemplar
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Pantau status fisik, penempatan rak, dan status operasional ({total.toLocaleString("id-ID")} unit tercatat).
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/admin/qr"
            className="inline-flex min-h-[36px] items-center justify-center rounded-btn border border-rule bg-white px-3 text-xs font-semibold text-ink hover:bg-surface-sunken-ed hover:border-rule-strong transition-colors"
          >
            Cetak Label QR
          </Link>
          <Link
            href="/admin/books"
            className="inline-flex min-h-[36px] items-center justify-center rounded-btn bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            Katalog Buku
          </Link>
        </div>
      </header>

      <StatusFilterNav
        items={FILTERS.map((f) => ({ ...f, href: chipHref(f.value) }))}
        activeValue={status}
      />

      <Suspense fallback={null}>
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
              header: "Label QR",
              cell: (c) => (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-meta text-ink-muted">{c.qr_token}</span>
                  <QrQuickViewButton
                    title={c.book_title}
                    code={c.inventory_code}
                    token={c.qr_token}
                    meta={c.location ? `Rak: ${c.location}` : undefined}
                    type="book"
                    label="QR"
                  />
                </div>
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
