import type { Metadata, Viewport } from "next";
import {
  Newsreader,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";
import { CirculationWatcher } from "@/components/circulation/circulation-watcher";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://perpustakaansmp17tangsel.web.id"),
  title: {
    default: "Smart Library — SMPN 17 Tangerang Selatan",
    template: "%s — Smart Library",
  },
  description:
    "Smart Library SMPN 17 Tangerang Selatan (Perpus SMP 17 Tangsel) — Sistem perpustakaan digital sekolah berbasis QR: katalog koleksi buku, peminjaman, pengembalian, dan informasi literasi siswa.",
  applicationName: "Smart Library SMPN 17 Tangsel",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "smp negeri 17 tangerang selatan",
    "smpn 17 tangerang selatan",
    "smpn 17 tangsel",
    "smp 17 tangsel",
    "smp 17 tangerang selatan",
    "npsn 20613593",
    "perpussmp17tangsel",
    "perpus smp 17 tangsel",
    "perpus smpn 17 tangsel",
    "perpustakaan smp 17 tangsel",
    "perpustakaan smpn 17 tangsel",
    "perpustakaan smp negeri 17 tangerang selatan",
    "smart library smpn 17",
    "smart library smpn 17 tangsel",
    "smart library smp negeri 17 tangerang selatan",
    "perpustakaan smpn 17 kota tangerang selatan",
    "perpussmp17",
    "perpussmpn17",
    "katalog buku smpn 17 tangsel",
    "katalog perpustakaan smp 17 tangsel",
    "perpustakaan digital smpn 17",
    "perpustakaan digital smp 17 tangsel",
    "perpustakaan sekolah tangerang selatan",
    "perpustakaan sekolah smpn 17 tangerang selatan",
    "e-perpus smpn 17 tangsel",
    "perpustakaan online smpn 17 tangsel",
    "peminjaman buku smp 17 tangsel",
    "kartu perpustakaan digital siswa",
    "sirkulasi buku qr code",
    "profil smpn 17 tangerang selatan",
    "profil smpn 17 tangsel",
    "sekolah smpn 17 tangsel",
    "sekolah kita smpn 17 tangerang selatan",
    "dapodik smpn 17 tangerang selatan",
    "kemendikbud smpn 17 tangerang selatan",
    "buku kurikulum merdeka smpn 17 tangsel",
    "pamulang permai tangsel",
  ],
  authors: [{ name: "SMP Negeri 17 Tangerang Selatan" }],
  creator: "SMP Negeri 17 Tangerang Selatan",
  publisher: "SMP Negeri 17 Tangerang Selatan",
  category: "education",
  robots: { index: true, follow: true },
  verification: {
    google: "moQUHIkJGba0sgC0I_eMpolduulMFTkFLafDnO5YSOI",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://perpustakaansmp17tangsel.web.id",
    siteName: "Smart Library SMPN 17 Tangerang Selatan",
    title: "Smart Library — SMPN 17 Tangerang Selatan",
    description:
      "Situs resmi Smart Library & Perpustakaan Digital SMP Negeri 17 Tangerang Selatan (NPSN 20613593). Katalog buku resmi, peminjaman QR code, dan literasi siswa.",
    images: [
      {
        url: "/logo-smpn17.png",
        width: 512,
        height: 512,
        alt: "Logo SMP Negeri 17 Tangerang Selatan",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Smart Library — SMPN 17 Tangerang Selatan",
    description:
      "Sistem perpustakaan digital sekolah berbasis QR: katalog buku, peminjaman, pengembalian, dan literasi siswa.",
    images: ["/logo-smpn17.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["MiddleSchool", "EducationalOrganization"],
      "@id": "https://perpustakaansmp17tangsel.web.id/#school",
      "name": "SMP Negeri 17 Tangerang Selatan",
      "alternateName": [
        "UPTD SMP Negeri 17 Kota Tangerang Selatan",
        "SMPN 17 Tangerang Selatan",
        "SMPN 17 Tangsel",
        "SMP 17 Tangsel",
        "SMP Negeri 17 Tangsel",
      ],
      "identifier": {
        "@type": "PropertyValue",
        "name": "NPSN",
        "value": "20613593",
      },
      "url": "https://perpustakaansmp17tangsel.web.id",
      "logo": "https://perpustakaansmp17tangsel.web.id/logo-smpn17.png",
      "image": "https://perpustakaansmp17tangsel.web.id/logo-smpn17.png",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Jl. Komp. Pamulang Permai I Rt. 3 Rw. 10, Pamulang Barat",
        "addressLocality": "Pamulang",
        "addressRegion": "Banten",
        "postalCode": "15417",
        "addressCountry": "ID",
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -6.3378,
        "longitude": 106.7329,
      },
      "telephone": "+62-21-7401615",
      "email": "info@smpn17tangsel.sch.id",
      "sameAs": [
        "https://sekolah.data.kemendikdasmen.go.id/profil-sekolah/B02D9BEE-C8FC-E111-BB25-F71AE7B520E6",
        "https://www.wikidata.org/wiki/Q12515093",
      ],
    },
    {
      "@type": "Library",
      "@id": "https://perpustakaansmp17tangsel.web.id/#library",
      "name": "Smart Library SMP Negeri 17 Tangerang Selatan",
      "alternateName": [
        "Perpustakaan SMPN 17 Tangsel",
        "Perpus SMP 17 Tangsel",
        "Smart Library SMPN 17 Tangsel",
        "Perpustakaan Digital SMPN 17 Tangerang Selatan",
      ],
      "url": "https://perpustakaansmp17tangsel.web.id/books",
      "parentOrganization": {
        "@id": "https://perpustakaansmp17tangsel.web.id/#school",
      },
      "description":
        "Perpustakaan digital resmi SMP Negeri 17 Tangerang Selatan (NPSN 20613593) berbasis QR Code, menyediakan katalog buku Kurikulum Merdeka, karya sastra, referensi belajar, dan sistem sirkulasi peminjaman terpadu.",
      "telephone": "+62-21-7401615",
      "email": "perpustakaan@smpn17tangsel.sch.id",
      "isAccessibleForFree": true,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Jl. Komp. Pamulang Permai I Rt. 3 Rw. 10, Pamulang Barat",
        "addressLocality": "Pamulang",
        "addressRegion": "Banten",
        "postalCode": "15417",
        "addressCountry": "ID",
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": -6.3378,
        "longitude": 106.7329,
      },
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "07:00",
          "closes": "15:00",
        },
      ],
      "knowsAbout": [
        "Kurikulum Merdeka",
        "Katalog Buku Sekolah",
        "Peminjaman Buku QR Code",
        "Literasi Siswa SMP",
        "Kartu Anggota Perpustakaan Digital",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://perpustakaansmp17tangsel.web.id/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Apa itu Smart Library SMP Negeri 17 Tangerang Selatan?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Smart Library SMP Negeri 17 Tangerang Selatan (Perpus SMP 17 Tangsel) adalah perpustakaan digital resmi sekolah (NPSN 20613593) berbasis QR Code yang menyediakan katalog buku pelajaran Kurikulum Merdeka, karya sastra fiksi, referensi belajar, sistem sirkulasi peminjaman cepat, dan kartu anggota digital siswa.",
          },
        },
        {
          "@type": "Question",
          "name": "Di mana lokasi dan jam buka Perpustakaan SMPN 17 Tangerang Selatan?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Perpustakaan berlokasi di SMP Negeri 17 Tangerang Selatan, Jl. Komp. Pamulang Permai I Rt. 3 Rw. 10, Pamulang Barat, Kec. Pamulang, Kota Tangerang Selatan, Prov. Banten 15417. Jam layanan operasional buka setiap hari Senin hingga Jumat pukul 07.00 – 15.00 WIB (Sabtu, Minggu, dan hari libur nasional tutup).",
          },
        },
        {
          "@type": "Question",
          "name": "Bagaimana cara meminjam dan mengembalikan buku di Perpustakaan SMPN 17 Tangsel?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Siswa memilih buku di katalog daring Smart Library, membawa buku ke meja sirkulasi, lalu petugas memindai kode QR eksemplar bersama kartu anggota digital siswa. Batas peminjaman adalah maksimal 2 eksemplar selama 7 hari kalender dan dapat diperpanjang.",
          },
        },
        {
          "@type": "Question",
          "name": "Koleksi buku apa saja yang tersedia di Perpustakaan SMPN 17 Tangsel?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Tersedia ratusan judul buku mencakup buku teks pelajaran Kurikulum Merdeka untuk jenjang SMP (Kelas 7, 8, dan 9), karya sastra novel, ensiklopedia sains, referensi sejarah, buku keagamaan, dan buku literasi sekolah.",
          },
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://perpustakaansmp17tangsel.web.id/#website",
      "url": "https://perpustakaansmp17tangsel.web.id",
      "name": "Smart Library SMPN 17 Tangerang Selatan",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://perpustakaansmp17tangsel.web.id/books?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      className={`${newsreader.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased font-sans`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body className="min-h-full bg-background text-ink font-sans">
        <CirculationWatcher />
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
