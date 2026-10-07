"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, ArrowUpRight, CheckCircle2, ShieldCheck, Clock } from "lucide-react";

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Pusat Status & Notifikasi"
        aria-expanded={open}
        className="flex size-10 items-center justify-center rounded-md border border-outline bg-background text-ink-muted hover:bg-surface hover:text-ink transition-colors cursor-pointer"
      >
        <Bell className="size-4" aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-outline bg-background p-0 shadow-card z-50 animate-rise">
          <div className="flex items-center justify-between border-b border-outline px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-ink">Status Operasional</span>
            </div>
            <span className="rounded-full bg-leaf-soft px-2.5 py-0.5 text-[11px] font-semibold text-leaf-deep">
              Sistem Aktif
            </span>
          </div>

          <div className="p-4 space-y-3 text-xs">
            <div className="rounded-md border border-outline/70 bg-surface p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-ink font-semibold">
                <Clock className="size-3.5 text-sky-deep" />
                <span>Jam Layanan Perpustakaan</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                Meja sirkulasi aktif melayani peminjaman dan pengembalian Senin – Jumat pukul 07.30 – 15.00 WIB.
              </p>
            </div>

            <div className="rounded-md border border-outline/70 bg-surface p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-ink font-semibold">
                <ShieldCheck className="size-3.5 text-leaf-deep" />
                <span>Pencatatan Audit Sistem</span>
              </div>
              <p className="text-ink-muted leading-relaxed">
                Seluruh aktivitas peminjaman, pengembalian, dan perubahan data tercatat otomatis pada jejak audit.
              </p>
              <Link
                href="/admin/audit-logs"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 font-semibold text-sky-deep hover:underline pt-0.5"
              >
                <span>Buka Log Audit</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-ink-subtle">
              <CheckCircle2 className="size-3.5 text-leaf-deep shrink-0" />
              <span>Tidak ada antrean notifikasi tertunda saat ini.</span>
            </div>
          </div>

          <div className="border-t border-outline bg-surface-sunken px-4 py-2 text-center text-[11px] text-ink-subtle">
            SMP Negeri 17 Tangerang Selatan
          </div>
        </div>
      )}
    </div>
  );
}
