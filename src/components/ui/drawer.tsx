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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 transition-opacity duration-200 fade-in-key"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          ref={panelRef}
          className={cn(
            "w-screen max-w-md transform border-l border-outline bg-background shadow-modal transition-transform duration-200 ease-out slide-in-right-key",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline px-4 py-4 sm:px-6">
            <div>
              <h2 className="font-display text-title font-bold text-ink">{title}</h2>
              {description && <p className="mt-0.5 text-meta text-ink-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup panel detail"
              className="flex min-h-tap-min min-w-tap-min items-center justify-center rounded-md text-ink-muted hover:bg-surface hover:text-ink transition-colors"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 text-body sm:px-6 sm:py-5">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-outline bg-surface-sunken/50 px-4 py-4 sm:px-6">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
