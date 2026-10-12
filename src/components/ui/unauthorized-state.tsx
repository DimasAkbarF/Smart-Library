import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UnauthorizedStateProps {
  title?: string;
  message?: string;
  homeHref?: string;
  homeLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

/** State tanpa hak akses (design.md §11, PRD §8.9) */
export function UnauthorizedState({
  title = "Akses Terbatas",
  message = "Akun Anda tidak memiliki hak akses untuk membuka halaman ini. Hubungi petugas perpustakaan jika memerlukan bantuan.",
  homeHref = "/",
  homeLabel = "Kembali ke Beranda",
  action,
  className,
}: UnauthorizedStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center justify-center rounded-panel border border-rule bg-white p-8 text-center sm:p-12 font-plex-sans",
        className,
      )}
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-btn border border-rule bg-surface-sunken-ed text-ink-muted">
        <ShieldAlert className="size-6" aria-hidden />
      </span>
      <h2 className="font-serif text-xl font-medium text-ink">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-ink-muted leading-relaxed">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {action ?? (
          <Link href={homeHref}>
            <Button variant="secondary" size="md" className="gap-2">
              <ArrowLeft className="size-4" aria-hidden />
              <span>{homeLabel}</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
