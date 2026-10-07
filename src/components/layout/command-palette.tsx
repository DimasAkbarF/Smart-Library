"use client";

import { useEffect, useState, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Book, User, ArrowLeftRight, X, Loader2, CornerDownLeft } from "lucide-react";
import { searchGlobal, type GlobalSearchResult } from "@/features/search/actions";
import { StatusChip } from "@/components/ui/status-chip";
import { formatTanggal } from "@/lib/format";

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setQuery("");
    setResults(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) handleClose();
      }
      if (e.key === "Escape" && open) {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await searchGlobal(trimmed);
          setResults(res);
        } catch {
          setResults({ books: [], students: [], transactions: [] });
        }
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const hasValidQuery = query.trim().length >= 2;
  const activeResults = hasValidQuery ? results : null;
  const totalResults =
    (activeResults?.books.length ?? 0) +
    (activeResults?.students.length ?? 0) +
    (activeResults?.transactions.length ?? 0);

  const navigateTo = (href: string) => {
    handleClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 transition-opacity duration-200 animate-in fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl transform rounded-card border border-outline bg-background shadow-modal transition-all duration-200 animate-in fade-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-outline px-4 py-3">
          <Search className="size-5 shrink-0 text-ink-subtle" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari buku, siswa, transaksi... (Ctrl + K)"
            className="flex-1 bg-transparent px-3 text-body text-ink placeholder:text-ink-subtle focus:outline-none"
          />
          {isPending && <Loader2 className="size-5 animate-spin text-sky shrink-0" />}
          {query && !isPending && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults(null);
              }}
              className="rounded p-1 text-ink-subtle hover:text-ink"
            >
              <X className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="ml-2 rounded-md border border-outline px-2 py-0.5 text-meta font-mono text-ink-subtle hover:bg-surface"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!hasValidQuery ? (
            <div className="px-4 py-10 text-center text-body text-ink-muted">
              <p className="font-semibold text-ink">Pencarian Cepat Perpustakaan</p>
              <p className="mt-1 text-ink-subtle">
                Ketik nama buku, penulis, NIS/nama siswa, atau nomor transaksi.
              </p>
            </div>
          ) : isPending && !activeResults ? (
            <div className="flex items-center justify-center gap-2 py-12 text-body text-ink-muted">
              <Loader2 className="size-4 animate-spin text-sky" />
              <span>Mencari data...</span>
            </div>
          ) : totalResults === 0 ? (
            <div className="px-4 py-12 text-center text-body text-ink-muted">
              <p className="font-semibold text-ink">Tidak menemukan data untuk pencarian ini.</p>
              <p className="mt-1 text-ink-subtle">Periksa ejaan kata kunci atau coba kata kunci lain.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* BUKU */}
              {activeResults && activeResults.books.length > 0 && (
                <div>
                  <div className="px-3 pb-1.5 text-meta font-bold tracking-wider text-ink-subtle uppercase">
                    Buku ({activeResults.books.length})
                  </div>
                  <div className="grid gap-1">
                    {activeResults.books.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => navigateTo(`/admin/books/${b.id}`)}
                        className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-sky-soft/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded bg-sky-soft text-sky-deep group-hover:bg-sky group-hover:text-white transition-colors">
                            <Book className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink group-hover:text-sky-deep">
                              {b.title}
                            </p>
                            <p className="truncate text-meta text-ink-muted">
                              {b.author} {b.category_name ? `· ${b.category_name}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-meta font-semibold text-ink-muted">
                            {b.available_copies} / {b.total_copies} tersedia
                          </span>
                          <CornerDownLeft className="size-3.5 opacity-0 group-hover:opacity-100 text-sky-deep transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SISWA */}
              {activeResults && activeResults.students.length > 0 && (
                <div>
                  <div className="px-3 pb-1.5 text-meta font-bold tracking-wider text-ink-subtle uppercase">
                    Siswa ({activeResults.students.length})
                  </div>
                  <div className="grid gap-1">
                    {activeResults.students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => navigateTo(`/admin/students?q=${encodeURIComponent(s.nis)}`)}
                        className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-leaf-soft/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded bg-leaf-soft text-leaf-deep group-hover:bg-leaf group-hover:text-white transition-colors">
                            <User className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink group-hover:text-leaf-deep">
                              {s.name}
                            </p>
                            <p className="truncate text-meta text-ink-muted">
                              NIS: <span className="font-mono">{s.nis}</span>{" "}
                              {s.class_name ? `· Kelas ${s.class_name}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusChip
                            label={s.status === "active" ? "Aktif" : s.status}
                            tone={s.status === "active" ? "leaf" : "muted"}
                          />
                          <CornerDownLeft className="size-3.5 opacity-0 group-hover:opacity-100 text-leaf-deep transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TRANSAKSI */}
              {activeResults && activeResults.transactions.length > 0 && (
                <div>
                  <div className="px-3 pb-1.5 text-meta font-bold tracking-wider text-ink-subtle uppercase">
                    Transaksi ({activeResults.transactions.length})
                  </div>
                  <div className="grid gap-1">
                    {activeResults.transactions.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => navigateTo(`/librarian/transactions?q=${encodeURIComponent(t.inventory_code)}`)}
                        className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-sun-soft/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded bg-sun-soft text-sun-deep group-hover:bg-sun group-hover:text-ink transition-colors">
                            <ArrowLeftRight className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink group-hover:text-sun-deep">
                              {t.book_title}
                            </p>
                            <p className="truncate text-meta text-ink-muted">
                              {t.student_name} ({t.student_nis}) · Kode:{" "}
                              <span className="font-mono font-semibold">{t.inventory_code}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-meta text-ink-subtle">
                          <span>Tempo: {formatTanggal(t.due_at)}</span>
                          <StatusChip
                            label={t.status}
                            tone={
                              t.status === "ACTIVE"
                                ? "sky"
                                : t.status === "OVERDUE"
                                ? "coral"
                                : "leaf"
                            }
                          />
                          <CornerDownLeft className="size-3.5 opacity-0 group-hover:opacity-100 text-sun-deep transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="flex items-center justify-between border-t border-outline bg-surface-sunken/40 px-4 py-2 text-meta text-ink-subtle">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono font-semibold text-ink">↑↓</kbd> Navigasi</span>
            <span><kbd className="font-mono font-semibold text-ink">Enter</kbd> Pilih</span>
            <span><kbd className="font-mono font-semibold text-ink">ESC</kbd> Tutup</span>
          </div>
          <span className="font-display">Smart Library Search</span>
        </div>
      </div>
    </div>
  );
}
