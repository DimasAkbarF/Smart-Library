"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SchoolLogo } from "@/components/ui/school-logo";
import { SchoolFooter } from "@/components/login/school-footer";
import { LogIn, BookOpen, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCatalog = pathname === "/books" || pathname.startsWith("/books/");
  const isInfo = pathname === "/informasi" || pathname.startsWith("/informasi");

  return (
    <div className="flex min-h-dvh flex-col bg-paper font-plex-sans text-ink">
      {/* Public Top Navbar */}
      <header className="no-print print:hidden sticky top-0 z-20 border-b border-rule bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/books" className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-primary">
            <SchoolLogo size="sm" />
            <div>
              <span className="block font-serif text-[16px] font-semibold tracking-tight text-ink leading-tight group-hover:text-primary transition-colors">
                Smart Library
              </span>
              <span className="hidden sm:block text-[11.5px] text-ink-muted leading-none">
                SMP Negeri 17 Tangerang Selatan
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <Link
              href="/books"
              prefetch={true}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-btn transition-colors",
                isCatalog
                  ? "bg-primary-soft text-primary font-bold"
                  : "text-ink-muted hover:text-ink hover:bg-surface-sunken-ed",
              )}
            >
              <BookOpen className="size-4 shrink-0" aria-hidden />
              <span className="sr-only sm:not-sr-only">Katalog</span>
            </Link>

            <Link
              href="/informasi"
              prefetch={true}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-btn transition-colors",
                isInfo
                  ? "bg-primary-soft text-primary font-bold"
                  : "text-ink-muted hover:text-ink hover:bg-surface-sunken-ed",
              )}
            >
              <Info className="size-4 shrink-0" aria-hidden />
              <span className="sr-only sm:not-sr-only">Profil & FAQ</span>
            </Link>

            <Link
              href="/login"
              prefetch={true}
              className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink px-3 py-1.5 rounded-btn border border-rule hover:bg-surface-sunken-ed transition-colors ml-1"
            >
              <LogIn className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">Portal Petugas</span>
              <span className="sm:hidden">Masuk</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 sm:px-6 print:p-0">
        <div className="mx-auto w-full max-w-6xl print:max-w-none">{children}</div>
      </main>

      {/* Public Footer */}
      <div className="no-print print:hidden border-t border-rule bg-white py-6 px-4">
        <div className="mx-auto max-w-6xl">
          <SchoolFooter />
          {/* Tautan internal site-wide: memberi jalur crawl dari SETIAP halaman
              (termasuk 207 halaman buku) ke katalog & halaman informasi. */}
          <nav
            aria-label="Tautan footer"
            className="mx-auto mt-4 flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs"
          >
            <Link href="/books" className="text-ink-muted hover:text-primary hover:underline">
              Katalog Buku
            </Link>
            <span aria-hidden className="text-rule-strong">•</span>
            <Link href="/informasi" className="text-ink-muted hover:text-primary hover:underline">
              Profil &amp; FAQ Perpustakaan
            </Link>
            <span aria-hidden className="text-rule-strong">•</span>
            <a href="/sitemap.xml" className="text-ink-muted hover:text-primary hover:underline">
              Peta Situs
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}
