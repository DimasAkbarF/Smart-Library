import type { Metadata } from "next";
import { SchoolBrandLockup, SchoolBrandPanel } from "@/components/login/school-brand-panel";
import { LoginCard } from "@/components/login/login-card";
import { SchoolFooter } from "@/components/login/school-footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portal Petugas & Administrator",
  description:
    "Portal masuk resmi Smart Library SMP Negeri 17 Tangerang Selatan untuk petugas perpustakaan dan staf administrasi.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/login",
  },
};

/**
 * Halaman Login (design.md §6 & PRD §8.1):
 * - Desktop: Dua kolom terintegrasi dalam satu container bergaris (5/12 kiri panel brand primary #1B2F5B, 7/12 kanan form surface putih).
 * - Mobile (<1024px): Satu kolom terpusat, logo resmi + nama unit di atas, form card di tengah, jam layanan & kontak di kaki halaman.
 */
export default function LoginPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Library",
    "@id": "https://perpustakaansmp17tangsel.web.id/#library",
    "name": "Perpustakaan SMP Negeri 17 Tangerang Selatan",
    "alternateName": ["Smart Library SMPN 17 Tangsel", "SMP Negeri 17 Tangerang Selatan"],
    "url": "https://perpustakaansmp17tangsel.web.id",
    "logo": "https://perpustakaansmp17tangsel.web.id/logo-smpn17.png",
    "image": "https://perpustakaansmp17tangsel.web.id/logo-smpn17.png",
    "description": "Sistem perpustakaan sekolah dan sirkulasi digital berbasis QR untuk SMP Negeri 17 Tangerang Selatan.",
    "telephone": "+62-21-7401615",
    "email": "perpustakaan@smpn17tangsel.sch.id",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Jl. Komp. Pamulang Permai I Rt. 3 Rw. 10, Pamulang Barat",
      "addressLocality": "Pamulang, Tangerang Selatan",
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
  };

  return (
    <main className="flex min-h-svh flex-col justify-center bg-paper px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto my-auto w-full max-w-[420px] lg:max-w-[960px] min-[1440px]:max-w-[1020px]">
        {/* Mobile / Tablet Header Branding (< 1024px) */}
        <div className="mb-6 flex justify-center lg:hidden">
          <SchoolBrandLockup />
        </div>

        {/* Panel Container Terintegrasi (design.md §6): Tanpa double border */}
        <div className="overflow-hidden rounded-panel border border-rule bg-surface lg:grid lg:grid-cols-[5fr_7fr]">
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