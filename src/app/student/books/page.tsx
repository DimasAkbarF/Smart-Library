import Link from "next/link";
import { Suspense } from "react";
import { searchBooks, listCategories } from "@/features/catalog/queries";
import { BookCard } from "@/components/library/book-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SP = { q?: string; cat?: string; avail?: string; page?: string };

function href(sp: SP, patch: Partial<SP>): string {
  const next = new URLSearchParams();
  const merged = { ...sp, ...patch };
  if (merged.q) next.set("q", merged.q);
  if (merged.cat) next.set("cat", merged.cat);
  if (merged.avail) next.set("avail", merged.avail);
  if (merged.page) next.set("page", merged.page);
  const s = next.toString();
  return s ? `/student/books?${s}` : "/student/books";
}

export default async function StudentBooks({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [result, categories] = await Promise.all([
    searchBooks({
      q: sp.q,
      categoryId: sp.cat || undefined,
      availableOnly: sp.avail === "1",
      page,
    }),
    listCategories(),
  ]);

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-display text-display-sm font-bold">Katalog Buku</h1>
        <p className="text-ink-muted">
          {result.total > 0
            ? `${result.total} buku ditemukan.`
            : "Cari buku favoritmu di sini."}
        </p>
      </header>

      <Suspense fallback={null}>
        <SearchInput placeholder="Cari judul, penulis, atau ISBN…" />
      </Suspense>

      <div className="flex flex-wrap items-center gap-2" aria-label="Filter kategori">
        <Link
          href={href(sp, { cat: undefined, page: undefined })}
          className={cn(
            "rounded-chip px-3 py-1 text-xs font-medium transition-colors",
            !sp.cat ? "bg-primary-soft text-primary font-semibold border border-primary/20" : "bg-white text-ink-muted hover:text-ink border border-rule",
          )}
        >
          Semua
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={href(sp, { cat: sp.cat === c.id ? undefined : c.id, page: undefined })}
            aria-pressed={sp.cat === c.id}
            className={cn(
              "rounded-chip px-3 py-1 text-xs font-medium transition-colors",
              sp.cat === c.id ? "bg-primary-soft text-primary font-semibold border border-primary/20" : "bg-white text-ink-muted hover:text-ink border border-rule",
            )}
          >
            {c.name}
          </Link>
        ))}
        <Link
          href={href(sp, { avail: sp.avail === "1" ? undefined : "1", page: undefined })}
          aria-pressed={sp.avail === "1"}
          className={cn(
            "rounded-chip border px-3 py-1 text-xs font-medium transition-colors",
            sp.avail === "1"
              ? "border-success/30 bg-success-bg text-success font-semibold"
              : "border-rule bg-white text-ink-muted hover:text-ink",
          )}
        >
          Hanya tersedia
        </Link>
      </div>

      {result.books.length === 0 ? (
        <EmptyState
          title="Tidak ada buku yang cocok"
          body="Coba kata kunci atau filter lain untuk menemukan buku yang kamu cari."
          action={
            <Link href="/student/books">
              <Button variant="secondary">Atur ulang filter</Button>
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {result.books.map((b) => (
            <li key={b.id}>
              <BookCard book={b} href={`/student/books/${b.id}`} />
            </li>
          ))}
        </ul>
      )}

      {result.pageCount > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Paginasi">
          {page > 1 && (
            <Link href={href(sp, { page: String(page - 1) })}>
              <Button variant="secondary" size="sm">Sebelumnya</Button>
            </Link>
          )}
          <span className="text-body text-ink-muted">
            Halaman {result.page} dari {result.pageCount}
          </span>
          {page < result.pageCount && (
            <Link href={href(sp, { page: String(page + 1) })}>
              <Button variant="secondary" size="sm">Berikutnya</Button>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
