import Link from "next/link";
import { Suspense } from "react";
import { BookCard } from "@/components/library/book-card";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { listCategories, searchBooks } from "@/features/catalog/queries";
import { cn } from "@/lib/utils";

export default async function LibrarianBooksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const category = sp.category ?? "";
  const page = Number(sp.page ?? 1) || 1;
  const [result, categories] = await Promise.all([
    searchBooks({ q, categoryId: category || undefined, page }),
    listCategories(),
  ]);

  const catHref = (id: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (id) params.set("category", id);
    const s = params.toString();
    return `/librarian/books${s ? `?${s}` : ""}`;
  };

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Katalog Buku</h1>
        <p className="mt-1 text-ink-muted">{result.total} judul. Pilih buku untuk melihat eksemplar.</p>
      </div>

      <Suspense>
        <SearchInput placeholder="Cari judul, penulis, atau ISBN…" />
      </Suspense>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kategori">
        <Link
          href={catHref("")}
          aria-current={!category ? "true" : undefined}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold",
            !category ? "border-sky bg-sky-soft text-sky-deep" : "border-outline text-ink-muted hover:bg-surface",
          )}
        >
          Semua
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={catHref(c.id)}
            aria-current={category === c.id ? "true" : undefined}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold",
              category === c.id
                ? "border-sky bg-sky-soft text-sky-deep"
                : "border-outline text-ink-muted hover:bg-surface",
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {result.books.length === 0 ? (
        <EmptyState
          title="Tidak ada buku ditemukan"
          body={
            q || category
              ? "Tidak ada koleksi buku yang cocok dengan kata kunci pencarian atau kategori yang dipilih."
              : "Belum ada buku terdaftar dalam katalog perpustakaan."
          }
          action={
            (q || category) ? (
              <Link href="/librarian/books">
                <Button variant="secondary" size="sm">
                  Reset Pencarian & Kategori
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.books.map((b) => (
            <BookCard key={b.id} book={b} href={`/librarian/books/${b.id}`} />
          ))}
        </div>
      )}

      {result.pageCount > 1 && (
        <nav className="flex items-center justify-between" aria-label="Paginasi">
          <span className="font-mono text-sm text-ink-muted">{result.page} / {result.pageCount}</span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Link
                href={`/librarian/books?q=${encodeURIComponent(q)}&category=${category}&page=${result.page - 1}`}
                className="rounded-md border border-outline px-3 py-2 text-sm font-semibold hover:bg-surface"
              >
                ← Sebelumnya
              </Link>
            )}
            {result.page < result.pageCount && (
              <Link
                href={`/librarian/books?q=${encodeURIComponent(q)}&category=${category}&page=${result.page + 1}`}
                className="rounded-md border border-outline px-3 py-2 text-sm font-semibold hover:bg-surface"
              >
                Berikutnya →
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
