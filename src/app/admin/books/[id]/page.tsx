import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Layers, ShieldAlert } from "lucide-react";
import { getBookDetail, listCategories } from "@/features/catalog/queries";
import { listCopies } from "@/features/admin/books";
import { CopyStatusChip } from "@/components/ui/status-chip";
import { QrQuickViewButton } from "@/components/library/qr-modal";
import { BookEditForm, AddCopiesForm, DeleteBookButton } from "./forms";

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [book, categories, copies] = await Promise.all([
    getBookDetail(id),
    listCategories(),
    listCopies({ bookId: id, pageSize: 500 }),
  ]);
  if (!book) notFound();

  const initials = book.title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "BK";

  const borrowedCount = Math.max(0, book.total_copies - book.available_copies);

  return (
    <div className="space-y-6 animate-rise">
      {/* Top Navigation & Breadcrumb */}
      <div>
        <Link
          href="/admin/books"
          className="inline-flex items-center gap-1.5 text-body font-semibold text-ink-muted hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft className="size-4" />
          <span>Kembali ke Katalog Buku</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline/70 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-primary font-plex-mono tracking-wider uppercase">
              <span className="size-1.5 rounded-chip bg-primary" />
              <span>Detail Koleksi · SMP Negeri 17 Tangerang Selatan</span>
            </div>
            <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-ink">
              {book.title}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {book.author} · {book.category_name ?? "Tanpa kategori"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-chip bg-surface-sunken-ed border border-rule px-2.5 py-1 text-xs font-medium text-ink font-plex-sans">
              <Layers className="size-3.5 text-primary" />
              <span>
                <strong className="font-plex-mono">{book.available_copies}</strong> dari{" "}
                <strong className="font-plex-mono">{book.total_copies}</strong> eksemplar tersedia
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Visual Showcase & Danger Zone */}
        <div className="space-y-6">
          {/* Visual Showcase Card */}
          <div className="rounded-card border border-outline bg-surface p-5 space-y-5">
            <div className="flex justify-center">
              {book.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.cover_url}
                  alt={`Sampul ${book.title}`}
                  className="h-64 w-44 rounded-sm object-cover border border-outline"
                />
              ) : (
                <div
                  aria-hidden
                  className="flex h-64 w-44 flex-col items-center justify-center gap-2 rounded-sm bg-primary-soft text-primary border border-primary/20"
                >
                  <BookOpen className="size-10 text-primary" />
                  <span className="font-display text-display-sm font-bold">{initials}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-outline/70 pt-4 text-body">
              <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
                <div className="rounded-md bg-background border border-outline/80 p-2">
                  <span className="block font-mono text-title font-bold text-ink">{book.total_copies}</span>
                  <span className="block text-meta text-ink-muted">Total</span>
                </div>
                <div className="rounded-md bg-success-bg border border-success-line/20 p-2">
                  <span className="block font-mono text-title font-bold text-success">{book.available_copies}</span>
                  <span className="block text-label text-success">Tersedia</span>
                </div>
                <div className="rounded-md bg-warning-bg border border-warning-line/30 p-2">
                  <span className="block font-mono text-title font-bold text-warning">{borrowedCount}</span>
                  <span className="block text-label text-warning">Dipinjam</span>
                </div>
              </div>

              <dl className="space-y-2 pt-2 text-label">
                {book.publisher && (
                  <div className="flex justify-between gap-2 border-b border-outline/40 pb-1.5">
                    <dt className="text-ink-muted">Penerbit</dt>
                    <dd className="font-medium text-ink text-right">{book.publisher}</dd>
                  </div>
                )}
                {book.publication_year && (
                  <div className="flex justify-between gap-2 border-b border-outline/40 pb-1.5">
                    <dt className="text-ink-muted">Tahun Terbit</dt>
                    <dd className="font-medium text-ink">{book.publication_year}</dd>
                  </div>
                )}
                {book.isbn && (
                  <div className="flex justify-between gap-2 border-b border-outline/40 pb-1.5">
                    <dt className="text-ink-muted">ISBN</dt>
                    <dd className="font-mono font-medium text-ink">{book.isbn}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-muted">Kategori</dt>
                  <dd className="font-medium text-ink">{book.category_name ?? "Tanpa kategori"}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-panel border border-danger/30 bg-danger-bg/25 p-5 space-y-3 font-plex-sans">
            <div className="flex items-center gap-2 text-danger">
              <ShieldAlert className="size-5 shrink-0" />
              <h2 className="font-serif font-medium text-base text-ink">Zona Berbahaya</h2>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Menghapus judul buku ini akan menghapus seluruh data bibliografi serta seluruh eksemplar fisik yang terkait dari sistem.
            </p>
            <DeleteBookButton bookId={book.id} />
          </div>
        </div>

        {/* Right Column: Forms & Copies List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ubah Data Buku */}
          <section className="rounded-card border border-outline bg-surface p-6 space-y-4">
            <div>
              <h2 className="font-display text-title font-bold text-ink">Informasi Bibliografi</h2>
              <p className="text-meta text-ink-muted">Perbarui data judul, pengarang, penerbit, nomor ISBN, atau tautan sampul.</p>
            </div>
            <BookEditForm book={book} categories={categories} />
          </section>

          {/* Tambah Eksemplar */}
          <section className="rounded-card border border-outline bg-surface p-6 space-y-4">
            <div>
              <h2 className="font-display text-title font-bold text-ink">Tambah Eksemplar Fisik</h2>
              <p className="text-meta text-ink-muted">
                Tambahkan cetakan baru ke inventaris. Token QR dan kode inventaris unik akan di-generate otomatis.
              </p>
            </div>
            <AddCopiesForm bookId={book.id} />
          </section>

          {/* Daftar Eksemplar */}
          <section className="rounded-card border border-outline bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-title font-bold text-ink">
                  Daftar Eksemplar ({copies.total})
                </h2>
                <p className="text-meta text-ink-muted">Status fisik dan penempatan rak masing-masing buku.</p>
              </div>
              <Link
                href={`/admin/copies?q=${encodeURIComponent(book.title)}`}
                className="text-label font-semibold text-primary hover:underline"
              >
                Lihat di Manajer Eksemplar →
              </Link>
            </div>

            {copies.rows.length === 0 ? (
              <p className="py-6 text-center text-body text-ink-muted">Belum ada eksemplar fisik untuk buku ini.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-outline">
                <table className="w-full min-w-[500px] snap-x snap-mandatory text-left text-body">
                  <thead className="bg-surface-sunken text-meta font-semibold uppercase tracking-wider text-ink-muted border-b border-outline">
                    <tr>
                      <th className="px-3 py-2.5 sm:px-4">Kode Inventaris</th>
                      <th className="px-3 py-2.5 sm:px-4">Status</th>
                      <th className="px-3 py-2.5 sm:px-4">Lokasi Rak</th>
                      <th className="px-3 py-2.5 sm:px-4 text-right">Label QR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline">
                    {copies.rows.map((c) => (
                      <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-3 py-3 sm:px-4 font-mono font-semibold text-label text-ink">
                          {c.inventory_code || "—"}
                        </td>
                        <td className="px-3 py-3 sm:px-4">
                          <CopyStatusChip status={c.status} />
                        </td>
                        <td className="px-3 py-3 sm:px-4 text-meta text-ink-muted">
                          {c.location ? (
                            <span className="inline-flex rounded-chip border border-rule bg-surface-sunken-ed px-2 py-0.5 font-plex-mono text-xs text-ink">
                              {c.location}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-3 sm:px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono text-meta text-ink-muted">{c.qr_token}</span>
                            <QrQuickViewButton
                              title={book.title}
                              subtitle={`Penulis: ${book.author}`}
                              code={c.inventory_code}
                              token={c.qr_token}
                              meta={c.location ? `Rak: ${c.location}` : undefined}
                              type="book"
                              label="QR"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
