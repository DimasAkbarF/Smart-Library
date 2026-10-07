import type { Metadata, Viewport } from "next";
import { Hubot_Sans, Atkinson_Hyperlegible, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Hubot_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const body = Atkinson_Hyperlegible({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
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
  // TODO ganti dengan domain sebenarnya sebelum deploy. metadataBase yang
  // salah membuat URL openGraph salah untuk seluruh halaman.
  metadataBase: new URL("https://smartlibrary.smpn17.sch.id"),
  title: {
    default: "Smart Library — SMPN 17 Tangerang Selatan",
    template: "%s — Smart Library",
  },
  description:
    "Sistem perpustakaan sekolah berbasis QR: katalog, peminjaman, pengembalian, dan pelaporan.",
  applicationName: "Smart Library",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Smart Library",
    title: "Smart Library — SMPN 17 Tangerang Selatan",
    description:
      "Sistem perpustakaan sekolah berbasis QR: katalog, peminjaman, pengembalian, dan pelaporan.",
  },
  twitter: { card: "summary" },
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
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-ink">{children}</body>
    </html>
  );
}
