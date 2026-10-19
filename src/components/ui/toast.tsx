"use client";

import React, { createContext, useContext, useState, useCallback, useId } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextValue {
  toast: (item: { type?: ToastType; title?: string; message: string }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idPrefix = useId();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ type = "info", title, message }: { type?: ToastType; title?: string; message: string }) => {
      const id = `${idPrefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newItem: ToastItem = { id, type, title, message };
      setToasts((prev) => [...prev.slice(-4), newItem]); // Maksimal 5 toast aktif

      // Otomatis hilang setelah 4 detik
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [idPrefix, removeToast],
  );

  const success = useCallback(
    (message: string, title?: string) => toast({ type: "success", title, message }),
    [toast],
  );
  const error = useCallback(
    (message: string, title?: string) => toast({ type: "error", title, message }),
    [toast],
  );
  const info = useCallback(
    (message: string, title?: string) => toast({ type: "info", title, message }),
    [toast],
  );
  const warning = useCallback(
    (message: string, title?: string) => toast({ type: "warning", title, message }),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6"
      >
        {toasts.map((t) => {
          const isError = t.type === "error";
          return (
            <div
              key={t.id}
              role={isError ? "alert" : "status"}
              className="pointer-events-auto flex items-start gap-3 rounded-btn border border-rule-strong bg-white p-4 shadow-dropdown transition-colors font-plex-sans"
            >
              <span className="shrink-0 pt-0.5">
                {t.type === "success" && (
                  <CheckCircle2 className="size-4.5 text-success" aria-hidden />
                )}
                {t.type === "error" && (
                  <AlertCircle className="size-4.5 text-danger" aria-hidden />
                )}
                {t.type === "warning" && (
                  <AlertTriangle className="size-4.5 text-warning" aria-hidden />
                )}
                {t.type === "info" && <Info className="size-4.5 text-info" aria-hidden />}
              </span>

              <div className="flex-1 text-sm leading-snug">
                {t.title && <p className="font-semibold text-ink">{t.title}</p>}
                <p className={cn("text-ink-muted", t.title && "mt-0.5")}>{t.message}</p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Tutup notifikasi"
                className="-mr-1 -mt-1 shrink-0 cursor-pointer rounded-btn p-1 text-ink-subtle transition-colors hover:bg-surface-sunken-ed hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
