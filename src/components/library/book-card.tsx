import Link from "next/link";
import { CopyStatusChip } from "@/components/ui/status-chip";
import type { Book } from "@/lib/types";

/** Kartu buku: cover, judul, penulis, status, kategori — tanpa metadata berlebih. */
export function BookCard({ book, href }: { book: Book; href: string }) {
  const initials = book.title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-card border border-outline bg-background p-4 shadow-card transition-colors hover:border-sky"
    >
      {book.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.cover_url}
          alt={`Sampul ${book.title}`}
          className="h-28 w-20 shrink-0 rounded-sm object-cover"
          loading="lazy"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-28 w-20 shrink-0 items-center justify-center rounded-sm bg-sky-soft font-display text-display-sm font-bold text-sky-deep"
        >
          {initials}
        </span>
      )}
      <span className="grid min-w-0 content-start gap-1.5">
        <span className="font-display text-title leading-snug font-bold group-hover:text-sky-deep">
          {book.title}
        </span>
        <span className="truncate text-ink-muted">{book.author}</span>
        <span className="flex flex-wrap items-center gap-2">
          {book.available_copies > 0 ? (
            <CopyStatusChip status="AVAILABLE" />
          ) : (
            <CopyStatusChip status="BORROWED" />
          )}
          <span className="font-mono text-body text-ink-subtle">
            {book.available_copies}/{book.total_copies}
          </span>
          {book.category_name && (
            <span className="text-body text-ink-subtle">{book.category_name}</span>
          )}
        </span>
      </span>
    </Link>
  );
}
