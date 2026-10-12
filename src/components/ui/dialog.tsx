"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // Klik area backdrop di luar dialog untuk menutup
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-label={title}
      className={cn(
        "fixed inset-0 m-auto z-50 w-[min(560px,calc(100vw-2rem))] h-fit max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-panel bg-white p-0 shadow-dropdown border border-rule-strong backdrop:bg-[#161B26]/45",
        className,
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-white px-5 py-4">
        <h2 className="font-serif text-lg font-medium text-ink">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog"
          className="flex size-8 cursor-pointer items-center justify-center rounded-btn text-ink-muted transition-colors hover:bg-surface-sunken-ed hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X className="size-4.5" aria-hidden />
        </button>
      </div>
      <div className="p-5 text-sm text-ink sm:p-6">{children}</div>
    </dialog>
  );
}
