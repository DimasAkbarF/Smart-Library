import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Error state terpadu dengan pesan deskriptif dan tombol coba lagi (design.md §11, PRD §8.9) */
export function ErrorState({
  title = "Terjadi kendala saat memuat data",
  message = "Data tidak dapat ditampilkan saat ini. Periksa koneksi internet Anda atau coba muat ulang.",
  onRetry,
  retryLabel = "Coba lagi",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-panel border border-rule bg-white px-6 py-10 text-center font-plex-sans",
        className,
      )}
    >
      <span className="mb-3 flex size-10 items-center justify-center rounded-btn border border-danger/25 bg-danger-bg text-danger">
        <AlertCircle className="size-5" aria-hidden />
      </span>
      <h3 className="font-serif text-lg font-medium text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted leading-relaxed">{message}</p>
      {(onRetry || action) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry} className="gap-1.5">
              <RotateCcw className="size-3.5" aria-hidden />
              <span>{retryLabel}</span>
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
