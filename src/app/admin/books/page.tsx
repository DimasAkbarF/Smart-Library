import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { adminSearchBooks } from "@/features/admin/books";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Book } from "@/lib/types";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const { books, total, pageCount } = await adminSearchBooks(q, page);
  const base = `/admin/books${q ? `?q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="space-y-6 animate-rise">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline/70 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-primary font-plex-mono tracking-wider uppercase">
            <span className="size-1.5 rounded-chip bg-primary" />
            <span>Katalog Koleksi · SMP Negeri 17 Tangerang Selatan</span>
          </div>
          <h1 className="mt-1 font-display text-display-sm sm:text-display-lg font-bold tracking-tight text-ink">
            Katalog Buku
          </h1>
          <p className="mt-1 text-body text-ink-muted">
            Kelola data bibliografi, nomor ISBN, penerbit, dan ketersediaan stok fisik perpustakaan.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
          <Link href="/admin/copies" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full sm:w-auto min-h-tap-min font-semibold justify-center">
              Daftar Eksemplar
            </Button>
          </Link>
          <Link href="/admin/books/new" className="w-full sm:w-auto">
            <Button size="md" className="gap-2 w-full sm:w-auto min-h-tap-min font-semibold justify-center">
              <Plus className="size-4" />
              <span>Tambah Buku</span>
            </Button>
          </Link>
        </div>
      </header>

      <Suspense fallback={null}>
        <SearchInput placeholder="Cari judul, penulis, penerbit, atau ISBN…" />
      </Suspense>

      {books.length === 0 ? (
        <EmptyState
          title="Tidak ada buku ditemukan"
          body={q ? `Tidak ada hasil untuk pencarian "${q}".` : "Belum ada buku dalam katalog. Tambahkan judul buku pertama."}
          action={
            <Link href="/admin/books/new">
              <Button size="sm" className="gap-2">
                <Plus className="size-4" />
                <span>Tambah Buku</span>
              </Button>
            </Link>
          }
        />
      ) : (
        <DataTable<Book>
          columns={[
            {
              header: "Buku & Penulis",
              cell: (b) => {
                const initials = b.title
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase() || "BK";
                return (
                  <div className="flex items-center gap-3">
                    {b.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.cover_url}
                        alt=""
                        className="h-12 w-9 rounded-xs object-cover border border-outline shrink-0 shadow-xs"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="flex h-12 w-9 shrink-0 items-center justify-center rounded-xs bg-sky-soft text-sky-deep font-display text-label font-bold shadow-xs border border-sky/20"
                      >
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0 max-w-sm">
                      <Link
                        href={`/admin/books/${b.id}`}
                        className="block font-semibold text-ink hover:text-sky-deep truncate"
                        title={b.title}
                      >
                        {b.title}
                      </Link>
                      <span className="block text-meta text-ink-muted truncate">
                        {b.author || "Penulis tidak tercatat"} {b.publication_year ? `· ${b.publication_year}` : ""}
                      </span>
                    </div>
                  </div>
                );
              },
            },
            {
              header: "Kategori & ISBN",
              cell: (b) => (
                <div>
                  <span className="inline-block rounded-chip border border-rule bg-surface-sunken-ed px-2 py-0.5 text-xs font-medium text-ink">
                    {b.category_name ?? "Tanpa kategori"}
                  </span>
                  {b.isbn && (
                    <span className="block font-plex-mono text-xs text-ink-muted mt-0.5">
                      {b.isbn}
                    </span>
                  )}
                </div>
              ),
            },
            {
              header: "Ketersediaan",
              cell: (b) => {
                const isAvailable = b.available_copies > 0;
                return (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-chip border px-2 py-0.5 text-xs font-semibold font-plex-sans",
                      isAvailable
                        ? "bg-success-bg text-success border-success/20"
                        : b.total_copies === 0
                        ? "bg-surface-sunken-ed text-ink-muted border-rule"
                        : "bg-danger-bg text-danger border-danger/25"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-chip",
                        isAvailable ? "bg-success" : b.total_copies === 0 ? "bg-ink-muted" : "bg-danger"
                      )}
                    />
                    <span className="font-plex-mono">{b.available_copies}</span> /{" "}
                    <span className="font-plex-mono">{b.total_copies}</span> Tersedia
                  </span>
                );
              },
            },
            {
              header: "Aksi",
              cell: (b) => (
                <Link
                  href={`/admin/books/${b.id}`}
                  className="inline-flex min-h-[36px] items-center justify-center rounded-md border border-outline px-3 py-1.5 text-label font-semibold text-ink hover:border-sky hover:bg-sky-soft hover:text-sky-deep transition-colors"
                >
                  Kelola Detail
                </Link>
              ),
            },
          ]}
          rows={books}
          page={page}
          pageCount={pageCount}
          baseUrl={base}
          totalLabel={`${total.toLocaleString("id-ID")} judul · halaman ${page} dari ${pageCount}`}
        />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
