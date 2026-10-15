"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { AlertTriangle, AlertCircle, HelpCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmTone = "danger" | "warning" | "primary" | "success";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: "",
    confirmText: "Lanjutkan",
    cancelText: "Batal",
    tone: "primary",
  });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions({
      confirmText: "Lanjutkan",
      cancelText: "Batal",
      tone: "primary",
      ...opts,
    });
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleCancel]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161B26]/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancel();
          }}
        >
          <div className="relative w-full max-w-md overflow-hidden rounded-panel bg-white p-6 shadow-dropdown border border-rule-strong animate-in zoom-in-95 duration-150">
            {/* Close X Button */}
            <button
              type="button"
              onClick={handleCancel}
              aria-label="Tutup dialog konfirmasi"
              className="absolute right-4 top-4 flex size-7 cursor-pointer items-center justify-center rounded-btn text-ink-muted hover:bg-surface-sunken-ed hover:text-ink transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row sm:gap-4">
              {/* SweetAlert-style circular icon */}
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-full mb-3 sm:mb-0",
                  options.tone === "danger" && "bg-danger-bg text-danger border border-danger/20",
                  options.tone === "warning" && "bg-warning-bg text-warning border border-warning/20",
                  options.tone === "success" && "bg-success-bg text-success border border-success/20",
                  (!options.tone || options.tone === "primary") &&
                    "bg-primary-soft text-primary border border-primary/20",
                )}
              >
                {options.tone === "danger" && <AlertTriangle className="size-6" />}
                {options.tone === "warning" && <AlertCircle className="size-6" />}
                {options.tone === "success" && <CheckCircle2 className="size-6" />}
                {(!options.tone || options.tone === "primary") && <HelpCircle className="size-6" />}
              </div>

              <div className="flex-1 space-y-1.5">
                <h3 id="confirm-dialog-title" className="font-serif text-lg font-bold text-ink">
                  {options.title}
                </h3>
                <p className="font-plex-sans text-xs sm:text-sm text-ink-muted leading-relaxed">
                  {options.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleCancel}
                className="w-full sm:w-auto min-w-[80px]"
              >
                {options.cancelText}
              </Button>
              <Button
                type="button"
                variant={options.tone === "danger" ? "danger" : "primary"}
                size="md"
                onClick={handleConfirm}
                className="w-full sm:w-auto min-w-[110px]"
              >
                {options.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx.confirm;
}
