import type { Metadata } from "next";
import { SchoolBrandLockup, SchoolBrandPanel } from "@/components/login/school-brand-panel";
import { LoginCard } from "@/components/login/login-card";
import { SchoolFooter } from "@/components/login/school-footer";

export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke Smart Library SMP Negeri 17 Tangerang Selatan untuk peminjaman, pengembalian, dan katalog koleksi perpustakaan.",
};

/**
 * Halaman Login (design.md §6 & PRD §8.1):
 * - Desktop: Dua kolom terintegrasi dalam satu container bergaris (5/12 kiri panel brand primary #1B2F5B, 7/12 kanan form surface putih).
 * - Mobile (<1024px): Satu kolom terpusat, logo resmi + nama unit di atas, form card di tengah, jam layanan & kontak di kaki halaman.
 */
export default function LoginPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    "name": "SMP Negeri 17 Tangerang Selatan",
    "url": "https://perpustakaansmp17tangsel.web.id",
    "description": "Sistem perpustakaan sekolah berbasis QR untuk SMP Negeri 17 Tangerang Selatan.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Tangerang Selatan",
      "addressCountry": "ID",
    },
  };

  return (
    <main className="flex min-h-svh flex-col justify-center bg-paper px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto my-auto w-full max-w-[420px] lg:max-w-[960px] min-[1440px]:max-w-[1020px]">
        {/* Mobile / Tablet Header Branding (< 1024px) */}
        <div className="mb-6 flex justify-center lg:hidden">
          <SchoolBrandLockup />
        </div>

        {/* Panel Container Terintegrasi (design.md §6): Tanpa double border */}
        <div className="overflow-hidden rounded-panel border border-rule bg-surface shadow-xs lg:grid lg:grid-cols-[5fr_7fr]">
          {/* Panel Kiri 5/12: Informasi Institusi & Layanan (Desktop) */}
          <SchoolBrandPanel />

          {/* Panel Kanan 7/12: Form Masuk (Surface putih bersih terpusat) */}
          <section className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12">
            <LoginCard />
          </section>
        </div>

        {/* Kaki Halaman / Footer Faktual */}
        <SchoolFooter />
      </div>
    </main>
  );
}