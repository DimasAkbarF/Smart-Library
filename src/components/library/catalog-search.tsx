"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { suggestBooks, type BookSuggestion } from "@/features/catalog/queries";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { StatusChip } from "@/components/ui/status-chip";
import { cn } from "@/lib/utils";

const MIN_QUERY = 2;
const DEBOUNCE_MS = 300;

/**
 * Pencarian katalog: form GET ke /books (jalan tanpa JS, bisa di-crawl) +
 * typeahead dari server action `suggestBooks`. design.md §0.1 "terasa seperti institusi".
 */
export function CatalogSearch({ total }: { total: number }) {
  const router = useRouter();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const inputId = `catalog-search-${uid}`;
  const listId = "catalog-search-results";
  const [value, setValue] = useState("");
  const [items, setItems] = useState<BookSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = value.trim();
    if (term.length < MIN_QUERY) return;
    const timer = setTimeout(async () => {
      try {
        const res = await suggestBooks(term);
        setItems(res);
        setOpen(res.length > 0);
        setActive(-1);
      } catch {
        setItems([]);
        setOpen(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    if (next.trim().length < MIN_QUERY) {
      setItems([]);
      setOpen(false);
      setActive(-1);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && items.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp" && items.length > 0) {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Enter" && active >= 0 && items[active]) {
      e.preventDefault();
      router.push(`/books/${items[active].id}`);
    }
  }

  const activeId = active >= 0 && items[active] ? `${listId}-opt-${active}` : undefined;

  return (
    <div ref={rootRef}>
      <form method="get" action="/books" role="search">
        <Field
          label="Cari buku di katalog"
          id={inputId}
          hint={`Cari berdasarkan judul, penulis, atau ISBN. ${total.toLocaleString("id-ID")} judul dalam koleksi.`}
        >
          <div className="relative flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-subtle"
                aria-hidden
              />
              <Input
                id={inputId}
                name="q"
                type="search"
                autoComplete="off"
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder="Cari judul, penulis, atau ISBN…"
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                className="pl-11"
              />
            </div>

            <Button type="submit" size="md" className="h-11 shrink-0 sm:h-10">
              Cari
            </Button>

            {open && items.length > 0 && (
              <ul
                id={listId}
                role="listbox"
                aria-label="Saran buku"
                className="absolute top-full z-30 mt-1 w-full overflow-hidden rounded-card border border-rule bg-surface shadow-dropdown"
              >
                {items.map((b, i) => (
                  <li key={b.id} role="presentation" className="border-b border-rule last:border-b-0">
                    <Link
                      id={`${listId}-opt-${i}`}
                      role="option"
                      aria-selected={i === active}
                      href={`/books/${b.id}`}
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        "flex items-start justify-between gap-3 px-4 py-3 transition-colors duration-150",
                        i === active ? "bg-primary-soft" : "bg-surface hover:bg-surface-sunken-ed",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink font-plex-sans">
                          {b.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-muted font-plex-sans">
                          {b.author}
                          {b.category_name ? ` · ${b.category_name}` : ""}
                          {b.isbn ? (
                            <span className="font-mono text-[11px] text-ink-subtle"> · {b.isbn}</span>
                          ) : null}
                        </span>
                      </span>
                      {b.available_copies > 0 ? (
                        <StatusChip tone="success" label="Tersedia" />
                      ) : (
                        <StatusChip tone="info" label="Dipinjam" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Field>
      </form>

      <p className="sr-only" role="status" aria-live="polite">
        {open ? `${items.length} judul ditemukan` : ""}
      </p>
    </div>
  );
}
