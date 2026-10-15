"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OfflineBannerProps {
  isOffline?: boolean;
  message?: string;
  className?: string;
}

/** Banner offline tipis dengan deteksi koneksi otomatis (design.md §11, PRD §8.9) */
export function OfflineBanner({
  isOffline: controlledOffline,
  message = "Koneksi terputus. Bekerja dalam mode luring, data disinkronkan saat kembali terhubung.",
  className,
}: OfflineBannerProps) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Cek status koneksi peramban
    const updateStatus = () => {
      setOffline(!navigator.onLine);
    };

    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  const shouldShow = controlledOffline !== undefined ? controlledOffline : offline;

  if (!shouldShow) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className={cn(
        "no-print print:hidden flex items-center justify-center gap-2 border-b border-warning/30 bg-warning-bg px-4 py-2 text-xs font-medium text-warning font-plex-sans transition-colors",
        className,
      )}
    >
      <WifiOff className="size-4 shrink-0 text-warning" aria-hidden />
      <span>{message}</span>
    </aside>
  );
}
