"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop tanpa blur, warna ink/45 */}
      <div
        className="fixed inset-0 bg-[#161B26]/45 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div
          ref={panelRef}
          className={cn(
            "flex h-full w-full sm:w-[480px] max-w-full flex-col border-l border-rule-strong bg-white shadow-dropdown transition-transform duration-200 ease-out",
            className,
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-rule px-5 py-4">
            <div className="min-w-0 pr-4">
              <h2 className="font-serif text-lg font-medium text-ink truncate">{title}</h2>
              {description && (
                <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup panel detail"
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-btn text-ink-muted hover:bg-surface-sunken-ed hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X className="size-4.5" aria-hidden />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 text-sm text-ink">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-rule bg-surface-sunken-ed/60 px-5 py-3.5">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
