"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CHANNEL_NAME = "circulation-sync";
const BC_NAME = "smart-library-circulation";
const STORAGE_KEY = "sl_circulation_sync";
const LOCAL_EVENT = "sl_circulation_local_sync";

let sharedSupabaseChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;

function getSharedChannel() {
  if (typeof window === "undefined") return null;
  if (!sharedSupabaseChannel) {
    try {
      const supabase = createClient();
      sharedSupabaseChannel = supabase.channel(CHANNEL_NAME, {
        config: { broadcast: { self: false } },
      });
      sharedSupabaseChannel.subscribe();
    } catch {
      /* ignore */
    }
  }
  return sharedSupabaseChannel;
}

export function notifyCirculationChange(payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const ts = Date.now();
  const data = { ts, ...payload };

  // 0. Sinyal instan ke window/tab aktif saat ini (0ms)
  try {
    sessionStorage.setItem("sl_last_circulation", ts.toString());
    window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: data }));
  } catch {
    /* ignore */
  }

  // 1. BroadcastChannel (antar tab di browser yang sama)
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(BC_NAME);
      bc.postMessage(data);
      bc.close();
    }
  } catch {
    /* ignore */
  }

  // 2. Storage event (fallback antar window origin yang sama)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }

  // 3. Supabase Realtime broadcast (antar perangkat & sesi eksternal)
  try {
    const ch = getSharedChannel();
    if (ch) {
      ch.send({
        type: "broadcast",
        event: "change",
        payload: data,
      });
    }
  } catch {
    /* ignore */
  }
}

export function CirculationWatcher() {
  const router = useRouter();
  const lastRefreshRef = useRef(0);
  const lastServerVersionRef = useRef(-1);

  // Trigger refresh dengan debounce (maks 1x per 350ms)
  const triggerRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < 350) return;
    lastRefreshRef.current = now;
    router.refresh();
  }, [router]);

  useEffect(() => {
    // 0. Listener tab/window aktif saat ini
    const onLocalSync = () => triggerRefresh();
    window.addEventListener(LOCAL_EVENT, onLocalSync);

    // 1. Same-browser cross-tab listener via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel(BC_NAME);
        bc.onmessage = () => triggerRefresh();
      } catch {
        /* ignore */
      }
    }

    // 2. Cross-window storage listener
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        triggerRefresh();
      }
    };
    window.addEventListener("storage", onStorage);

    // 3. Pemeriksa Versi Database Sirkulasi (Sinkronisasi Antar Perangkat & Tab)
    const checkServerVersion = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/circulation-sync", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const data = (await res.json()) as { version: number };
          if (lastServerVersionRef.current === -1) {
            // Catat baseline awal saat halaman pertama kali dibuka
            lastServerVersionRef.current = data.version;
          } else if (data.version > lastServerVersionRef.current) {
            // Ada transaksi baru di database (dari perangkat/tab lain)!
            lastServerVersionRef.current = data.version;
            router.refresh();
          }
        }
      } catch {
        /* ignore network errors */
      }
    };

    // Jalankan pengecekan baseline segera
    void checkServerVersion();

    // 4. Window focus & tab visibility listener (periksa versi seketika saat membuka/fokus tab)
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void checkServerVersion();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);

    // 5. Supabase Realtime WebSocket listener (Broadcast instan)
    const sharedCh = getSharedChannel();
    if (sharedCh) {
      sharedCh.on("broadcast", { event: "change" }, () => {
        void checkServerVersion();
        triggerRefresh();
      });
    }

    // 6. Background Heartbeat Fallback (setiap 3.5 detik saat tab aktif & terlihat)
    const interval = setInterval(checkServerVersion, 3500);

    return () => {
      window.removeEventListener(LOCAL_EVENT, onLocalSync);
      if (bc) bc.close();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
      clearInterval(interval);
    };
  }, [triggerRefresh, router]);

  return null;
}
