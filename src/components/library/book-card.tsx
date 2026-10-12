import Link from "next/link";
import { CopyStatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";
import type { Book } from "@/lib/types";

/** Kartu buku Academic Editorial dengan tipografi Newsreader dan bingkai 1px rule. */
export function BookCard({ book, href }: { book: Book; href: string }) {
  const initials = book.title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <Link
      href={href}
      className={cn(
        "group flex gap-4 rounded-panel border border-rule bg-white p-4 font-plex-sans transition-colors duration-150 hover:border-rule-strong hover:bg-primary-soft/10",
      )}
    >
      {book.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={book.cover_url}
          alt={`Sampul ${book.title}`}
          className="h-28 w-20 shrink-0 rounded-btn border border-rule object-cover shadow-xs"
          loading="lazy"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-28 w-20 shrink-0 items-center justify-center rounded-btn border border-rule bg-surface-sunken-ed font-serif text-lg font-medium text-ink-muted"
        >
          {initials}
        </span>
      )}
      <span className="grid min-w-0 content-start gap-1.5">
        <span className="font-serif text-base font-medium leading-snug text-ink transition-colors group-hover:text-primary">
          {book.title}
        </span>
        <span className="truncate text-xs text-ink-muted">{book.author}</span>
        <span className="flex flex-wrap items-center gap-2 pt-1">
          {book.available_copies > 0 ? (
            <CopyStatusChip status="AVAILABLE" />
          ) : (
            <CopyStatusChip status="BORROWED" />
          )}
          <span className="font-plex-mono text-xs text-ink-muted">
            {book.available_copies}/{book.total_copies}
          </span>
          {book.category_name && (
            <span className="text-xs text-ink-muted">· {book.category_name}</span>
          )}
        </span>
      </span>
    </Link>
  );
}
