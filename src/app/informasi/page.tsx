import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Clock,
  BookOpen,
  QrCode,
  Building2,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Phone,
  Mail,
  GraduationCap,
} from "lucide-react";
import { CatalogSearch } from "@/components/library/catalog-search";
import { searchBooks } from "@/features/catalog/queries";

export const metadata: Metadata = {
  title: "Profil, Layanan & FAQ Perpustakaan SMPN 17 Tangerang Selatan",
  description:
    "Informasi resmi Smart Library SMP Negeri 17 Tangerang Selatan (NPSN 20613593). Profil perpustakaan, jam layanan operasional, panduan sirkulasi QR Code, koleksi buku Kurikulum Merdeka, dan tanya jawab (FAQ).",
  keywords: [
    "perpustakaan smpn 17 tangsel",
    "perpustakaan smp 17 tangsel",
    "perpus smp 17 tangsel",
    "faq perpustakaan smpn 17 tangsel",
    "profil perpustakaan smpn 17 tangsel",
    "smart library smpn 17 tangsel",
    "smp negeri 17 tangerang selatan",
    "jam buka perpustakaan smp 17 tangsel",
    "alamat perpustakaan smpn 17 tangsel",
    "peminjaman buku smp 17 tangsel",
    "npsn 20613593",
    "kurikulum merdeka smpn 17",
    "pamulang permai tangsel",
  ],
  alternates: {
    canonical: "/informasi",
  },
};

const faqItems = [
  {
    q: "Apa itu Smart Library SMP Negeri 17 Tangerang Selatan?",
    a: "Smart Library adalah sistem perpustakaan digital dan fisik resmi milik SMP Negeri 17 Tangerang Selatan (NPSN 20613593). Platform ini memfasilitasi pencarian katalog koleksi buku Kurikulum Merdeka secara online, peminjaman instan menggunakan QR Code, serta kartu perpustakaan digital siswa untuk mewujudkan ekosistem literasi sekolah yang modern.",
  },
  {
    q: "Di mana alamat dan jam buka pelayanan Perpustakaan SMPN 17 Tangsel?",
    a: "Perpustakaan berlokasi di kampus SMP Negeri 17 Tangerang Selatan, Jl. Komp. Pamulang Permai I Rt. 3 Rw. 10, Pamulang Barat, Kec. Pamulang, Kota Tangerang Selatan, Prov. Banten 15417. Jam layanan perpustakaan buka setiap hari Senin hingga Jumat pukul 07.00 – 15.00 WIB. Layanan tutup pada hari Sabtu, Minggu, dan hari libur nasional.",
  },
  {
    q: "Bagaimana alur dan tata cara meminjam buku di perpustakaan?",
    a: "Siswa mencari judul buku melalui katalog online Smart Library, mengambil eksemplar fisik di rak buku sekolah, lalu membawanya ke meja sirkulasi. Petugas perpustakaan akan memindai label QR Code pada buku bersama kartu anggota digital siswa. Proses peminjaman tercatat otomatis secara real-time.",
  },
  {
    q: "Berapa batas waktu dan kuota peminjaman buku?",
    a: "Setiap siswa berhak meminjam maksimal 2 eksemplar buku sekaligus dengan jangka waktu pinjam 7 hari kalender. Peminjaman dapat diperpanjang selama tidak ada siswa lain yang memesan atau mengantre pada buku tersebut.",
  },
  {
    q: "Buku apa saja yang tersedia di Smart Library SMPN 17 Tangsel?",
    a: "Koleksi perpustakaan mencakup buku teks pelajaran Kurikulum Merdeka jenjang SMP (Kelas 7, 8, dan 9), karya sastra fiksi (novel, antologi cerpen), ensiklopedia sains dan teknologi, referensi sejarah dan budaya nusantara, buku keagamaan, serta buku pengayaan literasi sekolah.",
  },
  {
    q: "Bagaimana cara siswa mendapatkan Kartu Anggota Digital Perpustakaan?",
    a: "Setiap siswa aktif SMPN 17 Tangsel terdaftar secara otomatis di sistem perpustakaan dan mendapatkan tautan kartu digital nir-login berbasis token kriptografi acak (/card/[token]). Kartu digital ini dapat disimpan di ponsel pintar atau dicetak untuk dibawa saat peminjaman buku di sekolah.",
  },
];

export default async function InformasiPage() {
  const { total } = await searchBooks({});
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": "https://perpustakaansmp17tangsel.web.id/informasi#webpage",
        "url": "https://perpustakaansmp17tangsel.web.id/informasi",
        "name": "Profil, Layanan & FAQ Perpustakaan SMPN 17 Tangerang Selatan",
        "isPartOf": {
          "@id": "https://perpustakaansmp17tangsel.web.id/#website",
        },
        "about": {
          "@id": "https://perpustakaansmp17tangsel.web.id/#library",
        },
        "description":
          "Profil resmi, tata cara peminjaman, jam buka, dan tanya jawab seputar Smart Library SMP Negeri 17 Tangerang Selatan.",
      },
      {
        "@type": "FAQPage",
        "@id": "https://perpustakaansmp17tangsel.web.id/informasi#faq",
        "mainEntity": faqItems.map((item) => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd).replace(/</g, "\\u003c") }}
      />

      {/* Header & Hero Definisi Entitas */}
      <section className="border-b border-rule pb-8">
        <div className="flex items-center gap-2 text-label font-semibold text-primary font-mono tracking-wider uppercase mb-2">
          <Building2 className="size-4 shrink-0" />
          <span>Informasi Publik & Layanan Literasi Resmi</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
          Profil, Layanan & FAQ Perpustakaan SMPN 17 Tangerang Selatan
        </h1>
        <p className="mt-4 text-sm sm:text-base text-ink-muted leading-relaxed max-w-3xl">
          Smart Library SMP Negeri 17 Tangerang Selatan adalah perpustakaan sekolah digital dan fisik resmi di bawah naungan <strong>SMP Negeri 17 Kota Tangerang Selatan (NPSN 20613593)</strong>. Kami melayani kebutuhan literasi siswa, guru, dan tenaga kependidikan dengan sistem katalog daring terpadu dan sirkulasi peminjaman cepat berbasis QR Code.
        </p>
      </section>

      {/* 4 Kolom Fakta Kunci (AI Entity & Knowledge Graph Extraction) */}
      <section aria-labelledby="fakta-kunci-heading">
        <h2 id="fakta-kunci-heading" className="sr-only">
          Fakta Kunci Perpustakaan
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-card border border-rule bg-white p-5 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-primary">
              <GraduationCap className="size-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Institusi Induk</span>
            </div>
            <p className="text-sm font-semibold text-ink">SMPN 17 Tangsel</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              NPSN: <strong>20613593</strong> · Akreditasi A. Naungan Dinas Pendidikan Kota Tangerang Selatan.
            </p>
          </div>

          <div className="rounded-card border border-rule bg-white p-5 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-primary">
              <MapPin className="size-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Alamat & Lokasi</span>
            </div>
            <p className="text-sm font-semibold text-ink">Kampus SMPN 17</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              Jl. Komp. Pamulang Permai I Rt. 3 Rw. 10, Pamulang Barat, Kec. Pamulang, Kota Tangerang Selatan, Prov. Banten 15417.
            </p>
          </div>

          <div className="rounded-card border border-rule bg-white p-5 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="size-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Jam Operasional</span>
            </div>
            <p className="text-sm font-semibold text-ink">Senin – Jumat</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              07.00 – 15.00 WIB.<br />
              <span className="text-ink-subtle">Sabtu, Minggu & Libur Nasional: Tutup.</span>
            </p>
          </div>

          <div className="rounded-card border border-rule bg-white p-5 space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-primary">
              <QrCode className="size-4 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">Sirkulasi & Kuota</span>
            </div>
            <p className="text-sm font-semibold text-ink">Maksimal 2 Buku</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              Batas waktu 7 hari kalender per pinjaman. Peminjaman instan dengan scan QR Code.
            </p>
          </div>
        </div>
      </section>

      {/* Artikel Bagian 1: Mengenal Smart Library */}
      <article className="rounded-panel border border-rule bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-label font-semibold text-primary font-mono tracking-wider uppercase mb-1">
            <BookOpen className="size-4 shrink-0" />
            <span>Visi & Ekosistem Belajar</span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Mengenal Smart Library SMPN 17 Tangerang Selatan
          </h2>
        </div>

        <div className="prose prose-sm sm:prose text-ink-muted leading-relaxed space-y-4">
          <p>
            Smart Library didirikan sebagai wujud komitmen <strong>SMP Negeri 17 Tangerang Selatan</strong> dalam menyediakan ruang literasi yang inklusif, teratur, dan adaptif terhadap perkembangan teknologi pendidikan. Berbeda dengan sistem perpustakaan konvensional yang mengandalkan pencatatan manual, Smart Library memadukan inventaris fisik di sekolah dengan katalog online real-time.
          </p>
          <p>
            Dengan adanya sistem digital ini, seluruh siswa dan guru dapat dengan mudah memeriksa ketersediaan buku, lokasi rak, hingga status eksemplar buku sebelum berkunjung ke perpustakaan. Hal ini menumbuhkan kemandirian membaca serta mempercepat sirkulasi buku sekolah.
          </p>
        </div>

        {/* 3 Pilar Layanan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-rule">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
              <CheckCircle2 className="size-4 text-success shrink-0" />
              <span>Katalog Terbuka & Transparan</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Dapat diakses kapan saja dari rumah maupun ruang kelas tanpa perlu melakukan proses login yang rumit.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
              <CheckCircle2 className="size-4 text-success shrink-0" />
              <span>Buku Kurikulum Merdeka</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Menyediakan buku teks resmi dan panduan guru yang sesuai dengan standar Kemendikbudristek RI.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
              <CheckCircle2 className="size-4 text-success shrink-0" />
              <span>Sirkulasi Nir-Sentuh QR</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Peminjaman dan pengembalian diverifikasi dalam hitungan detik melalui pemindai barcode / label QR resmi.
            </p>
          </div>
        </div>
      </article>

      {/* Artikel Bagian 2: Alur Sirkulasi Buku (Step by Step) */}
      <section className="rounded-panel border border-rule bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-label font-semibold text-primary font-mono tracking-wider uppercase mb-1">
            <QrCode className="size-4 shrink-0" />
            <span>Panduan Prosedur</span>
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Alur Peminjaman & Pengembalian Buku
          </h2>
          <p className="mt-2 text-sm text-ink-muted leading-relaxed">
            Ikuti 4 langkah praktis berikut saat meminjam buku di ruang perpustakaan SMPN 17 Tangsel:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-card border border-rule bg-surface p-4 space-y-2">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-white font-mono text-xs font-bold">
              1
            </span>
            <p className="text-sm font-semibold text-ink">Eksplorasi Katalog</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              Buka katalog online Smart Library untuk memastikan judul dan eksemplar buku berstatus &quot;Tersedia&quot;.
            </p>
          </div>

          <div className="rounded-card border border-rule bg-surface p-4 space-y-2">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-white font-mono text-xs font-bold">
              2
            </span>
            <p className="text-sm font-semibold text-ink">Ambil di Rak Buku</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              Temukan buku fisik di ruang perpustakaan sekolah sesuai kategori dan kode inventaris yang tertera.
            </p>
          </div>

          <div className="rounded-card border border-rule bg-surface p-4 space-y-2">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-white font-mono text-xs font-bold">
              3
            </span>
            <p className="text-sm font-semibold text-ink">Pindai QR Petugas</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              Bawa buku ke meja sirkulasi. Petugas memindai label QR pada buku dan kartu anggota digital siswa Anda.
            </p>
          </div>

          <div className="rounded-card border border-rule bg-surface p-4 space-y-2">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-white font-mono text-xs font-bold">
              4
            </span>
            <p className="text-sm font-semibold text-ink">Kembalikan Tepat Waktu</p>
            <p className="text-xs text-ink-muted leading-relaxed">
              Kembalikan buku dalam 7 hari kalender dalam kondisi rapi dan bersih agar ketersediaan koleksi terjaga.
            </p>
          </div>
        </div>
      </section>

      {/* Bagian FAQ (Tanya Jawab Terstruktur) */}
      <section className="rounded-panel border border-rule bg-white p-6 sm:p-8 space-y-6 shadow-xs" aria-labelledby="faq-section-heading">
        <div className="border-b border-rule pb-4">
          <div className="flex items-center gap-2 text-label font-semibold text-primary font-mono tracking-wider uppercase mb-1">
            <HelpCircle className="size-4 shrink-0" />
            <span>Tanya Jawab Terstruktur</span>
          </div>
          <h2 id="faq-section-heading" className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
          <p className="mt-2 text-sm text-ink-muted leading-relaxed">
            Jawaban resmi seputar operasional, keanggotaan, dan layanan Smart Library SMPN 17 Tangerang Selatan:
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <details
              key={idx}
              className="group rounded-card border border-rule bg-surface p-4 sm:p-5 [&_summary::-webkit-details-marker]:hidden transition-all duration-150"
              open={idx === 0}
            >
              <summary className="flex cursor-pointer items-center justify-between font-medium text-ink text-sm sm:text-base">
                <span className="pr-4 font-semibold">{item.q}</span>
                <span className="text-ink-muted group-hover:text-primary transition group-open:rotate-180 shrink-0 text-sm">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-ink-muted leading-relaxed pt-3 border-t border-rule/60">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Kontak & Lokasi Institusi */}
      <section className="rounded-card border border-rule bg-surface p-6 sm:p-8 space-y-4">
        <h3 className="font-serif text-xl font-bold text-ink">
          Kontak & Informasi Layanan Perpustakaan
        </h3>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Jika Anda memiliki pertanyaan tentang koleksi buku, donasi buku bacaan, atau koordinasi kegiatan literasi sekolah, silakan hubungi tim perpustakaan:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-ink-muted">
          <div className="flex items-center gap-2.5">
            <Mail className="size-4 text-primary shrink-0" />
            <span>Surel: <strong className="text-ink">perpustakaan@smpn17tangsel.sch.id</strong></span>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="size-4 text-primary shrink-0" />
            <span>Telepon Sekolah: <strong className="text-ink">(021) 7401615</strong></span>
          </div>
        </div>
      </section>

      {/* Panel Katalog: pencarian langsung ke koleksi, bukan tombol CTA */}
      <section
        aria-labelledby="katalog-heading"
        className="rounded-panel border border-rule bg-white p-6 sm:p-8"
      >
        <div className="flex items-center gap-2 text-label font-semibold text-primary font-mono tracking-wider uppercase">
          <span className="size-2 rounded-chip bg-primary shrink-0" />
          <span>Perpustakaan Digital · Katalog Koleksi</span>
        </div>
        <h2
          id="katalog-heading"
          className="mt-2 font-serif text-xl sm:text-2xl font-bold tracking-tight text-ink"
        >
          Cari Buku di Katalog Perpustakaan SMP Negeri 17 Tangerang Selatan
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Telusuri koleksi buku pelajaran Kurikulum Merdeka, karya sastra, dan ensiklopedia
          sekolah. Hasil lengkap dapat disaring per kategori dan status ketersediaan.
        </p>

        <div className="mt-5 border-t border-rule pt-5">
          <CatalogSearch total={total} />
        </div>

        <Link
          href="/books"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <span>Lihat seluruh koleksi</span>
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
