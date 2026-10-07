"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open ]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={title}
      className="w-[min(560px,calc(100vw-2rem))] rounded-modal bg-background p-0 shadow-modal backdrop:bg-ink/50 animate-rise"
    >
      <div className="flex items-center justify-between border-b border-outline px-6 py-4">
        <h2 className="text-title font-bold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog"
          className="flex size-10 items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
