"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { AlertTriangle, AlertCircle, HelpCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmTone = "danger" | "warning" | "primary" | "success";

export interface DialogDetailItem {
  label: string;
  value: React.ReactNode;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  details?: DialogDetailItem[];
}

export interface AlertOptions {
  title: string;
  message: string;
  confirmText?: string;
  tone?: ConfirmTone;
  details?: DialogDetailItem[];
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"confirm" | "alert">("confirm");
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "",
    message: "",
    confirmText: "Lanjutkan",
    cancelText: "Batal",
    tone: "primary",
  });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const alertResolverRef = useRef<(() => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setMode("confirm");
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

  const alert = useCallback((opts: AlertOptions): Promise<void> => {
    setMode("alert");
    setOptions({
      confirmText: opts.confirmText || "OK",
      cancelText: undefined,
      tone: opts.tone || "success",
      title: opts.title,
      message: opts.message,
      details: opts.details,
    });
    setOpen(true);
    return new Promise<void>((resolve) => {
      alertResolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
    if (alertResolverRef.current) {
      alertResolverRef.current();
      alertResolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    if (alertResolverRef.current) {
      alertResolverRef.current();
      alertResolverRef.current = null;
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
    <ConfirmContext.Provider value={{ confirm, alert }}>
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
              aria-label="Tutup dialog"
              className="absolute right-4 top-4 flex size-7 cursor-pointer items-center justify-center rounded-btn text-ink-muted hover:bg-surface-sunken-ed hover:text-ink transition-colors"
            >
              <X className="size-4" />
            </button>

            <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row sm:gap-4">
              {/* SweetAlert-style circular icon */}
              <div
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-full mb-3 sm:mb-0 shadow-xs",
                  options.tone === "danger" && "bg-danger-bg text-danger border border-danger/25",
                  options.tone === "warning" && "bg-warning-bg text-warning border border-warning/25",
                  options.tone === "success" && "bg-success-bg text-success border border-success/25",
                  (!options.tone || options.tone === "primary") &&
                    "bg-primary-soft text-primary border border-primary/25",
                )}
              >
                {options.tone === "danger" && <AlertTriangle className="size-6" />}
                {options.tone === "warning" && <AlertCircle className="size-6" />}
                {options.tone === "success" && <CheckCircle2 className="size-6" />}
                {(!options.tone || options.tone === "primary") && <HelpCircle className="size-6" />}
              </div>

              <div className="flex-1 space-y-1.5 w-full">
                <h3 id="confirm-dialog-title" className="font-serif text-lg font-bold text-ink">
                  {options.title}
                </h3>
                <p className="font-plex-sans text-xs sm:text-sm text-ink-muted leading-relaxed">
                  {options.message}
                </p>

                {options.details && options.details.length > 0 && (
                  <div className="mt-3.5 w-full rounded-btn border border-rule bg-surface-sunken-ed p-3.5 text-left space-y-2 text-xs font-plex-sans">
                    {options.details.map((d, i) => (
                      <div key={i} className="flex justify-between items-baseline gap-2">
                        <span className="text-ink-subtle">{d.label}:</span>
                        <span className="font-semibold text-ink text-right">{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
              {mode === "confirm" ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleCancel}
                    className="w-full sm:w-auto min-w-[80px]"
                  >
                    {options.cancelText || "Batal"}
                  </Button>
                  <Button
                    type="button"
                    variant={options.tone === "danger" ? "danger" : "primary"}
                    size="md"
                    onClick={handleConfirm}
                    className="w-full sm:w-auto min-w-[110px]"
                    autoFocus
                  >
                    {options.confirmText || "Lanjutkan"}
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant={options.tone === "danger" ? "danger" : "primary"}
                  size="md"
                  onClick={handleConfirm}
                  className="w-full sm:w-auto min-w-[120px]"
                  autoFocus
                >
                  {options.confirmText || "OK"}
                </Button>
              )}
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

export function useAlert() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useAlert must be used within a ConfirmProvider");
  }
  return ctx.alert;
}

export function useSweetAlert() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useSweetAlert must be used within a ConfirmProvider");
  }
  return { confirm: ctx.confirm, alert: ctx.alert };
}
