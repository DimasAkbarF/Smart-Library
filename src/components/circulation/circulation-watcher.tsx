"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CHANNEL_NAME = "circulation-sync";
const BC_NAME = "smart-library-circulation";
const STORAGE_KEY = "sl_circulation_sync";
const LOCAL_EVENT = "sl_circulation_local_sync";

export function notifyCirculationChange(payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const data = { ts: Date.now(), ...payload };

  // 0. Sinyal instan ke window/tab aktif saat ini (0ms)
  try {
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
    const supabase = createClient();
    const ch = supabase.channel(CHANNEL_NAME);
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.send({
          type: "broadcast",
          event: "change",
          payload: data,
        }).finally(() => {
          setTimeout(() => {
            supabase.removeChannel(ch);
          }, 1000);
        });
      }
    });
  } catch {
    /* ignore */
  }
}

export function CirculationWatcher() {
  const router = useRouter();
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    const triggerRefresh = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < 400) return;
      lastRefreshRef.current = now;
      router.refresh();
    };

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

    // 3. Tab visibility listener (sinkron saat kembali membuka tab perpustakaan)
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // 4. Supabase Realtime WebSocket listener (Broadcast + PostgreSQL CDC)
    let supabaseChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    let supabaseClient: ReturnType<typeof createClient> | null = null;
    try {
      supabaseClient = createClient();
      supabaseChannel = supabaseClient.channel(CHANNEL_NAME);
      supabaseChannel
        .on("broadcast", { event: "change" }, () => triggerRefresh())
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "loans" },
          () => triggerRefresh(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "book_copies" },
          () => triggerRefresh(),
        )
        .subscribe();
    } catch {
      /* ignore */
    }

    return () => {
      window.removeEventListener(LOCAL_EVENT, onLocalSync);
      if (bc) bc.close();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      if (supabaseChannel && supabaseClient) {
        try {
          supabaseClient.removeChannel(supabaseChannel);
        } catch {
          /* ignore */
        }
      }
    };
  }, [router]);

  return null;
}
