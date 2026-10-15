import Link from "next/link";
import { SchoolLogo } from "@/components/ui/school-logo";
import { SchoolFooter } from "@/components/login/school-footer";
import { LogIn, BookOpen } from "lucide-react";

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper font-plex-sans text-ink">
      {/* Public Top Navbar */}
      <header className="no-print print:hidden sticky top-0 z-20 border-b border-rule bg-white shadow-xs">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/books" className="flex items-center gap-3">
            <SchoolLogo size="sm" />
            <div>
              <span className="block font-serif text-[16px] font-semibold tracking-tight text-ink leading-tight">
                Katalog Perpustakaan
              </span>
              <span className="block text-[11.5px] text-ink-muted leading-none">
                SMP Negeri 17 Tangerang Selatan
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/books"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-primary px-3 py-1.5 rounded-btn bg-primary-soft"
            >
              <BookOpen className="size-4" />
              <span>Katalog</span>
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink px-3 py-1.5 rounded-btn border border-rule hover:bg-surface-sunken-ed transition-colors"
            >
              <LogIn className="size-3.5" />
              <span>Portal Petugas</span>
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
        </div>
      </div>
    </div>
  );
}
