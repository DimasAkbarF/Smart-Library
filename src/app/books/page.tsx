import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { searchBooks, listCategories } from "@/features/catalog/queries";
import { BookCard } from "@/components/library/book-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MapPin, Clock, BookOpen, QrCode, Building2, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Katalog Koleksi Buku Perpustakaan",
  description:
    "Smart Library SMP Negeri 17 Tangerang Selatan (Perpus SMP 17 Tangsel). Katalog buku resmi Kurikulum Merdeka, sirkulasi peminjaman QR Code, dan informasi literasi siswa.",
  keywords: [
    "perpustakaan smpn 17 tangsel",
    "perpustakaan smp 17 tangsel",
    "perpus smp 17 tangsel",
    "smart library smpn 17 tangsel",
    "smp negeri 17 tangerang selatan",
    "smpn 17 tangerang selatan",
    "katalog buku smpn 17 tangsel",
    "katalog perpustakaan smp 17 tangsel",
    "npsn 20603332",
    "jam buka perpustakaan smp 17 tangsel",
    "alamat perpustakaan smpn 17 tangsel",
    "peminjaman buku smp 17 tangsel",
    "lengkong gudang timur serpong",
  ],
  alternates: {
    canonical: "/books",
  },
};

type SP = { q?: string; cat?: string; avail?: string; page?: string };

function href(sp: SP, patch: Partial<SP>): string {
  const next = new URLSearchParams();
  const merged = { ...sp, ...patch };
  if (merged.q) next.set("q", merged.q);
  if (merged.cat) next.set("cat", merged.cat);
  if (merged.avail) next.set("avail", merged.avail);
  if (merged.page) next.set("page", merged.page);
  const s = next.toString();
  return s ? `/books?${s}` : "/books";
}

export default async function PublicBooksPage({
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
    <div className="grid gap-6">
      <header className="border-b border-rule pb-5">
        <div className="flex items-center gap-2 text-label font-semibold text-primary font-mono tracking-wider uppercase mb-1">
          <span className="size-2 rounded-chip bg-primary shrink-0" />
          <span>Perpustakaan Digital Resmi · SMP Negeri 17 Tangerang Selatan (NPSN 20603332)</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Katalog Koleksi Buku SMPN 17 Tangerang Selatan
        </h1>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          Smart Library SMP Negeri 17 Tangsel — Temukan dan telusuri {result.total.toLocaleString("id-ID")} koleksi buku pelajaran Kurikulum Merdeka, karya sastra, referensi belajar, dan ensiklopedia literasi sekolah resmi.
        </p>
      </header>

      <Suspense fallback={null}>
        <SearchInput placeholder="Cari judul, penulis, atau ISBN…" />
      </Suspense>

      <div
        className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible no-scrollbar"
        role="group"
        aria-label="Filter kategori"
      >
        <Link
          href={href(sp, { cat: undefined, page: undefined })}
          className={cn(
            "shrink-0 inline-flex min-h-[36px] items-center rounded-chip px-3 py-1.5 text-xs font-medium transition-colors",
            !sp.cat
              ? "bg-primary-soft text-primary font-semibold border border-primary/20 shadow-xs"
              : "bg-white text-ink-muted hover:text-ink border border-rule",
          )}
        >
          Semua Kategori
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={href(sp, { cat: sp.cat === c.id ? undefined : c.id, page: undefined })}
            aria-pressed={sp.cat === c.id}
            className={cn(
              "shrink-0 inline-flex min-h-[36px] items-center rounded-chip px-3 py-1.5 text-xs font-medium transition-colors",
              sp.cat === c.id
                ? "bg-primary-soft text-primary font-semibold border border-primary/20 shadow-xs"
                : "bg-white text-ink-muted hover:text-ink border border-rule",
            )}
          >
            {c.name}
          </Link>
        ))}
        <Link
          href={href(sp, { avail: sp.avail === "1" ? undefined : "1", page: undefined })}
          aria-pressed={sp.avail === "1"}
          className={cn(
            "shrink-0 inline-flex min-h-[36px] items-center rounded-chip border px-3 py-1.5 text-xs font-medium transition-colors",
            sp.avail === "1"
              ? "border-success/30 bg-success-bg text-success font-semibold shadow-xs"
              : "border-rule bg-white text-ink-muted hover:text-ink",
          )}
        >
          Hanya yang Tersedia
        </Link>
      </div>

      {result.books.length === 0 ? (
        <EmptyState
          title="Tidak ada buku yang cocok"
          body="Coba kata kunci atau filter lain untuk menemukan buku yang kamu cari."
          action={
            <Link href="/books">
              <Button variant="secondary">Atur ulang pencarian</Button>
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.books.map((b) => (
            <li key={b.id}>
              <BookCard book={b} href={`/books/${b.id}`} />
            </li>
          ))}
        </ul>
      )}

      {result.pageCount > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-4" aria-label="Paginasi">
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

      {/* Profil Faktual & Informasi Layanan Perpustakaan untuk Pengunjung & AI Search (AEO/GEO) */}
      <section
        className="mt-8 rounded-panel border border-rule bg-white p-6 sm:p-8 space-y-6 shadow-xs"
        aria-labelledby="library-info-heading"
      >
        <div>
          <div className="flex items-center gap-2 text-label font-semibold text-primary font-mono tracking-wider uppercase mb-1">
            <Building2 className="size-4 shrink-0 text-primary" />
            <span>Informasi Unit & Layanan Resmi</span>
          </div>
          <h2 id="library-info-heading" className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Profil Smart Library SMP Negeri 17 Tangerang Selatan
          </h2>
          <p className="mt-2 text-sm text-ink-muted leading-relaxed sm:text-base">
            Smart Library SMP Negeri 17 Tangerang Selatan (Perpus SMP 17 Tangsel) adalah perpustakaan sekolah digital dan fisik resmi di bawah naungan SMP Negeri 17 Kota Tangerang Selatan (NPSN 20603332). Perpustakaan ini melayani kebutuhan literasi siswa, guru, dan staf dengan sistem katalog daring Kurikulum Merdeka dan sirkulasi peminjaman cepat berbasis QR Code.
          </p>
        </div>

        {/* 4 Kolom Kartu Fakta Kunci (Entitas AI) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          <div className="rounded-card border border-rule bg-surface p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="size-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Alamat & Lokasi</span>
            </div>
            <p className="text-xs font-semibold text-ink">Kampus SMPN 17 Tangsel</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              Jl. Lengkong Gudang Timur RT 01 RW 01, Serpong, Tangerang Selatan 15321
            </p>
          </div>

          <div className="rounded-card border border-rule bg-surface p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="size-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Jam Operasional</span>
            </div>
            <p className="text-xs font-semibold text-ink">Senin – Jumat</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              07.00 – 15.00 WIB<br />
              <span className="text-ink-subtle">Sabtu, Minggu & Libur: Tutup</span>
            </p>
          </div>

          <div className="rounded-card border border-rule bg-surface p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-primary">
              <QrCode className="size-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Sistem Sirkulasi</span>
            </div>
            <p className="text-xs font-semibold text-ink">Berbasis QR Code</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              Maksimal 2 buku selama 7 hari kalender. Kartu anggota digital siswa.
            </p>
          </div>

          <div className="rounded-card border border-rule bg-surface p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="size-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Koleksi Buku</span>
            </div>
            <p className="text-xs font-semibold text-ink">Kurikulum Merdeka</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              Buku teks SMP Kelas 7–9, karya sastra, ensiklopedia, dan buku pengayaan.
            </p>
          </div>
        </div>

        {/* FAQ Section untuk Google Mode AI */}
        <div className="border-t border-rule pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-4 text-primary shrink-0" />
            <h3 className="text-base font-semibold text-ink font-serif">
              Tanya Jawab Seputar Perpustakaan SMPN 17 Tangsel (FAQ)
            </h3>
          </div>

          <div className="space-y-3">
            <details className="group rounded-card border border-rule bg-surface p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-medium text-ink text-sm">
                <span>Apa itu Smart Library SMP Negeri 17 Tangerang Selatan?</span>
                <span className="transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed pt-2 border-t border-rule/60">
                Smart Library adalah sistem perpustakaan sekolah digital dan fisik resmi milik SMP Negeri 17 Tangerang Selatan (NPSN 20603332). Platform ini menyediakan katalog daring buku Kurikulum Merdeka, peminjaman instan dengan QR Code, serta kartu perpustakaan digital siswa.
              </p>
            </details>

            <details className="group rounded-card border border-rule bg-surface p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-medium text-ink text-sm">
                <span>Di mana alamat dan jam buka Perpustakaan SMPN 17 Tangsel?</span>
                <span className="transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed pt-2 border-t border-rule/60">
                Perpustakaan berlokasi di kampus SMP Negeri 17 Tangerang Selatan, Jl. Lengkong Gudang Timur RT 01 RW 01, Serpong, Kota Tangerang Selatan, Banten 15321. Jam buka pelayanan adalah hari Senin hingga Jumat pukul 07.00 – 15.00 WIB.
              </p>
            </details>

            <details className="group rounded-card border border-rule bg-surface p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-medium text-ink text-sm">
                <span>Bagaimana cara meminjam dan mengembalikan buku?</span>
                <span className="transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed pt-2 border-t border-rule/60">
                Siswa mencari buku di katalog ini, mengambil buku fisik di perpustakaan, lalu petugas memindai label QR pada buku dan kartu anggota digital siswa. Batas pinjam adalah 2 eksemplar selama 7 hari dan dapat diperpanjang.
              </p>
            </details>

            <details className="group rounded-card border border-rule bg-surface p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between font-medium text-ink text-sm">
                <span>Buku apa saja yang tersedia di katalog Smart Library?</span>
                <span className="transition group-open:rotate-180">▾</span>
              </summary>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed pt-2 border-t border-rule/60">
                Koleksi mencakup buku teks pelajaran Kurikulum Merdeka Kelas 7, 8, dan 9, novel sastra Indonesia dan dunia, ensiklopedia sains, buku referensi sejarah, buku keagamaan, serta bacaan fiksi dan non-fiksi edukatif.
              </p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
