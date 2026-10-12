"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, ArrowUpRight, CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import { StatusChip } from "@/components/ui/status-chip";

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
        className="flex size-9 cursor-pointer items-center justify-center rounded-btn border border-rule bg-white text-ink-muted transition-colors hover:bg-surface-sunken-ed hover:text-ink focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Bell className="size-4" aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-panel border border-rule-strong bg-white p-0 shadow-dropdown sm:w-96 font-plex-sans">
          <div className="flex items-center justify-between border-b border-rule px-4 py-3">
            <span className="font-serif text-base font-medium text-ink">
              Status Operasional
            </span>
            <StatusChip tone="success" label="Sistem Aktif" />
          </div>

          <div className="space-y-3 p-4 text-xs">
            <div className="space-y-1.5 rounded-btn border border-rule bg-surface-sunken-ed/40 p-3">
              <div className="flex items-center gap-2 font-medium text-ink">
                <Clock className="size-3.5 text-primary" />
                <span>Jam Layanan Perpustakaan</span>
              </div>
              <p className="leading-relaxed text-ink-muted">
                Meja sirkulasi melayani peminjaman dan pengembalian Senin – Jumat pukul 07.00 – 15.00 WIB.
              </p>
            </div>

            <div className="space-y-1.5 rounded-btn border border-rule bg-surface-sunken-ed/40 p-3">
              <div className="flex items-center gap-2 font-medium text-ink">
                <ShieldCheck className="size-3.5 text-success" />
                <span>Pencatatan Audit Sistem</span>
              </div>
              <p className="leading-relaxed text-ink-muted">
                Seluruh aktivitas transaksi dan perubahan data tersimpan aman pada log audit perpustakaan.
              </p>
              <Link
                href="/admin/audit-logs"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 pt-1 font-semibold text-primary hover:underline"
              >
                <span>Buka Log Audit</span>
                <ArrowUpRight className="size-3" />
              </Link>
            </div>

            <div className="flex items-center gap-2 pt-1 text-[11px] text-ink-subtle">
              <CheckCircle2 className="size-3.5 shrink-0 text-success" />
              <span>Tidak ada notifikasi sistem yang tertunda saat ini.</span>
            </div>
          </div>

          <div className="border-t border-rule bg-surface-sunken-ed/60 px-4 py-2 text-center text-[11px] text-ink-subtle font-serif italic">
            SMP Negeri 17 Tangerang Selatan
          </div>
        </div>
      )}
    </div>
  );
}
