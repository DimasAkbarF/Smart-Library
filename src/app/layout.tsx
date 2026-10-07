import type { Metadata } from "next";
import { Hubot_Sans, Atkinson_Hyperlegible, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Hubot_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Atkinson_Hyperlegible({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Library — SMPN 17 Tangerang Selatan",
  description:
    "Sistem perpustakaan sekolah berbasis QR: katalog, peminjaman, pengembalian, dan pelaporan.",
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
