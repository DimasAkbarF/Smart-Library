import type { Metadata, Viewport } from "next";
import {
  Plus_Jakarta_Sans,
  JetBrains_Mono,
  Newsreader,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://perpustakaansmp17tangsel.web.id"),
  title: {
    default: "Smart Library — SMPN 17 Tangerang Selatan",
    template: "%s — Smart Library",
  },
  description:
    "Sistem perpustakaan sekolah berbasis QR: katalog, peminjaman, pengembalian, dan pelaporan.",
  applicationName: "Smart Library",
  keywords: [
    "perpustakaan smpn 17 tangsel",
    "perpustakaan smp negeri 17 tangerang selatan",
    "smart library smpn 17",
    "smart library smp negeri 17 tangerang selatan",
    "perpustakaan smpn 17 kota tangerang selatan",
    "smp negeri 17 tangerang selatan",
    "smpn 17 tangsel",
    "katalog buku smpn 17 tangsel",
    "perpustakaan digital smpn 17",
    "perpustakaan sekolah tangerang selatan",
    "kartu perpustakaan digital siswa",
    "sirkulasi buku qr code",
  ],
  authors: [{ name: "SMP Negeri 17 Tangerang Selatan" }],
  creator: "SMP Negeri 17 Tangerang Selatan",
  publisher: "SMP Negeri 17 Tangerang Selatan",
  category: "education",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "moQUHIkJGba0sgC0I_eMpolduulMFTkFLafDnO5YSOI",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://perpustakaansmp17tangsel.web.id",
    siteName: "Smart Library",
    title: "Smart Library — SMPN 17 Tangerang Selatan",
    description:
      "Sistem perpustakaan sekolah berbasis QR: katalog, peminjaman, pengembalian, dan pelaporan.",
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
      "Sistem perpustakaan sekolah berbasis QR: katalog, peminjaman, pengembalian, dan pelaporan.",
    images: ["/logo-smpn17.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Mengaktifkan env(safe-area-inset-*) yang dipakai bottom-nav. Tanpa ini
  // padding safe area bernilai nol dan baris logout tepi bawah tertutup
  // home indicator di iPhone.
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${plusJakarta.variable} ${mono.variable} ${newsreader.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full bg-background text-ink font-sans">{children}</body>
    </html>
  );
}
