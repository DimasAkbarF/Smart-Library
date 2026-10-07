import type { Metadata } from "next";
import { SchoolBrandLockup, SchoolBrandPanel } from "@/components/login/school-brand-panel";
import { LoginCard } from "@/components/login/login-card";
import { SchoolFooter } from "@/components/login/school-footer";

// /login satu-satunya halaman yang boleh terindex, jadi metadata-nya yang
// paling spesifik. Area auth lain tidak diberi metadata — halaman terindex
// yang isinya salah lebih buruk daripada tidak ada metadata sama sekali.
export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke Smart Library SMPN 17 Tangerang Selatan untuk meminjaman, mengembalikan, atau menjelajahi katalog buku.",
};

/**
 * Contained responsive layout (PRD 14A–14H):
 *   <640   mobile   — 1 kolom, branding di atas card
 *   640-1023 tablet — 1 kolom terpusat, card max 460px
 *   1024-1439      — contained split, wrapper max 1180px, 44/56
 *   ≥1440          — contained split, wrapper max 1280px, 46/54
 * Viewport = background; container = permukaan aplikasi.
 */
export default function LoginPage() {
  return (
    <main className="min-h-svh bg-surface-sunken px-5 py-6 sm:px-8 sm:py-8 lg:py-8 min-[1440px]:py-12 [@media(max-height:720px)]:py-2">
      <div className="mx-auto w-full max-w-[1180px] min-[1440px]:max-w-[1280px]">
        <div className="grid gap-6 lg:grid-cols-[44fr_56fr] lg:gap-0 lg:overflow-hidden lg:rounded-modal lg:border lg:border-outline lg:bg-background lg:shadow-card min-[1440px]:grid-cols-[46fr_54fr]">
          <SchoolBrandPanel />
          <section className="flex flex-col justify-center lg:px-12 lg:py-12 [@media(max-height:720px)]:lg:py-4 min-[1440px]:px-14">
            <div className="lg:hidden">
              <SchoolBrandLockup />
            </div>
            <div className="mx-auto mt-6 w-full max-w-[460px] animate-rise lg:mt-0">
              <LoginCard />
            </div>
          </section>
        </div>
        <SchoolFooter />
      </div>
    </main>
  );
}