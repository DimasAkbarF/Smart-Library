import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, ShieldCheck, Tag } from "lucide-react";
import { getBookDetail } from "@/features/catalog/queries";
import { getPolicy } from "@/features/loans/actions";
import { CopyStatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";

export default async function StudentBookDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [book, policy] = await Promise.all([getBookDetail(id), getPolicy()]);
  if (!book) notFound();

  const initials = book.title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "BK";

  const isAvailable = book.available_copies > 0;

  return (
    <div className="space-y-6 animate-rise max-w-4xl">
      {/* Top Nav */}
      <div>
        <Link href="/student/books" className="inline-flex w-fit mb-3">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-4" aria-hidden /> Kembali ke katalog
          </Button>
        </Link>
        <div className="flex items-center gap-2 text-xs font-medium text-primary font-plex-mono tracking-wider uppercase">
          <span className="size-1.5 rounded-chip bg-primary" />
          <span>Koleksi Buku Perpustakaan · SMP Negeri 17 Tangerang Selatan</span>
        </div>
      </div>

      {/* Availability Banner Callout */}
      {isAvailable ? (
        <div className="rounded-panel border border-success/30 bg-success-bg p-4 sm:p-5 flex items-start gap-3.5 font-plex-sans">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-btn bg-success text-white mt-0.5">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-base font-medium text-success">
              Buku Tersedia untuk Dipinjam ({book.available_copies} dari {book.total_copies} eksemplar)
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Kunjungi meja sirkulasi perpustakaan saat jam layanan. Buka menu{" "}
              <Link href="/student/profile" className="font-semibold text-primary underline hover:text-ink">
                Kartu Anggota Digital
              </Link>{" "}
              lalu tunjukkan QR Code kamu kepada petugas untuk meminjam buku ini.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-panel border border-warning/30 bg-warning-bg p-4 sm:p-5 flex items-start gap-3.5 font-plex-sans">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-btn bg-warning text-white mt-0.5">
            <Clock className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-base font-medium text-warning">
              Seluruh Eksemplar Sedang Dipinjam
            </h2>
            <p className="text-meta sm:text-body text-ink-muted leading-relaxed">
              Saat ini seluruh eksemplar ({book.total_copies} buku) sedang berada di tangan siswa lain. Silakan cek berkala atau tanyakan perkiraan pengembalian kepada petugas perpustakaan.
            </p>
          </div>
        </div>
      )}

      {/* Main Book Detail Card */}
      <article className="grid gap-6 rounded-card border border-outline bg-surface p-6 shadow-card sm:grid-cols-[180px_1fr]">
        <div className="flex justify-center sm:justify-start">
          {book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover_url}
              alt={`Sampul ${book.title}`}
              className="h-64 w-44 rounded-sm object-cover shadow-sm border border-outline"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-64 w-44 flex-col items-center justify-center gap-2 rounded-sm bg-sky-soft text-sky-deep font-display font-bold shadow-sm border border-sky/20"
            >
              <BookOpen className="size-10 text-sky" />
              <span className="text-display-lg">{initials}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {book.category_name && (
                <span className="inline-flex items-center gap-1 rounded-chip border border-rule bg-surface-sunken-ed px-2.5 py-0.5 text-xs font-medium text-ink">
                  <Tag className="size-3 text-primary" />
                  {book.category_name}
                </span>
              )}
              {isAvailable ? <CopyStatusChip status="AVAILABLE" /> : <CopyStatusChip status="BORROWED" />}
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-ink">
              {book.title}
            </h1>
            <p className="text-sm font-medium text-ink-muted mt-1">oleh {book.author}</p>
          </div>

          <div className="border-t border-outline/70 pt-4">
            <h2 className="text-meta font-semibold text-ink-muted uppercase tracking-wider mb-2">
              Spesifikasi Koleksi
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-label sm:text-body">
              {book.publisher && (
                <div className="rounded-md border border-outline/70 bg-background p-2.5">
                  <dt className="text-meta text-ink-muted">Penerbit</dt>
                  <dd className="font-semibold text-ink mt-0.5">{book.publisher}</dd>
                </div>
              )}
              {book.publication_year && (
                <div className="rounded-md border border-outline/70 bg-background p-2.5">
                  <dt className="text-meta text-ink-muted">Tahun Terbit</dt>
                  <dd className="font-semibold text-ink mt-0.5">{book.publication_year}</dd>
                </div>
              )}
              {book.isbn && (
                <div className="rounded-md border border-outline/70 bg-background p-2.5">
                  <dt className="text-meta text-ink-muted">Nomor ISBN</dt>
                  <dd className="font-mono font-semibold text-ink mt-0.5">{book.isbn}</dd>
                </div>
              )}
              <div className="rounded-md border border-outline/70 bg-background p-2.5">
                <dt className="text-meta text-ink-muted">Ketersediaan Fisik</dt>
                <dd className="font-semibold text-ink mt-0.5 font-mono">
                  {book.available_copies} / {book.total_copies} eksemplar
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </article>

      {/* Lending Policy Card */}
      <section className="rounded-card border border-outline bg-background p-6 shadow-card space-y-4">
        <div>
          <h2 className="font-display text-title font-bold text-ink">Ketentuan & Kebijakan Sirkulasi</h2>
          <p className="text-meta text-ink-muted">Aturan resmi peminjaman buku bagi siswa SMP Negeri 17 Tangerang Selatan.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-outline bg-surface p-4 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sky-soft text-sky-deep">
              <Calendar className="size-5" />
            </div>
            <div>
              <span className="block text-meta text-ink-muted">Durasi Pinjam</span>
              <span className="font-display text-body font-bold text-ink">
                {policy.loan_duration_days} Hari Kalender
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-outline bg-surface p-4 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-leaf-soft text-leaf-deep">
              <BookOpen className="size-5" />
            </div>
            <div>
              <span className="block text-meta text-ink-muted">Batas Maksimal</span>
              <span className="font-display text-body font-bold text-ink">
                {policy.max_active_loans} Buku Sekaligus
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-outline bg-surface p-4 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sun-soft text-sun-deep">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <span className="block text-meta text-ink-muted">Denda Keterlambatan</span>
              <span className="font-display text-body font-bold text-ink">
                Rp {policy.fine_per_day.toLocaleString("id-ID")} / hari
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
