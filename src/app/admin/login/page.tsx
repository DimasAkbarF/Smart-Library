import type { Metadata } from "next";
import { SchoolBrandLockup, SchoolBrandPanel } from "@/components/login/school-brand-panel";
import { SchoolFooter } from "@/components/login/school-footer";
import { AdminLoginForm } from "./admin-login-form";

export const metadata: Metadata = {
  title: "Portal Petugas & Administrator",
  description: "Akses sirkulasi dan manajemen Smart Library SMP Negeri 17 Tangerang Selatan.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-svh flex-col justify-center bg-paper px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto my-auto w-full max-w-[420px] lg:max-w-[960px] min-[1440px]:max-w-[1020px]">
        {/* Mobile Header */}
        <div className="mb-6 flex justify-center lg:hidden">
          <SchoolBrandLockup />
        </div>

        {/* Panel Container */}
        <div className="overflow-hidden rounded-panel border border-rule bg-surface shadow-xs lg:grid lg:grid-cols-[5fr_7fr]">
          <SchoolBrandPanel />

          <section className="flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12">
            <div className="w-full max-w-[380px]">
              <h1 className="font-serif text-[28px] font-semibold tracking-tight text-[#161B26] leading-none sm:text-[32px]">
                Masuk Petugas & Admin
              </h1>

              <div className="mt-3.5" aria-hidden="true">
                <div className="h-px w-full bg-[#161B26]" />
                <div className="mt-[3px] h-px w-full bg-rule-strong" />
              </div>

              <p className="mt-4 font-plex-sans text-[13.5px] leading-relaxed text-[#4A5160]">
                Akses terproteksi untuk staf perpustakaan dan administrator sistem.
              </p>

              <div className="mt-6">
                <AdminLoginForm />
              </div>
            </div>
          </section>
        </div>

        <SchoolFooter />
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
