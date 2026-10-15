"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CHANNEL_NAME = "circulation-sync";
const BC_NAME = "smart-library-circulation";
const STORAGE_KEY = "sl_circulation_sync";

export function notifyCirculationChange(payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const data = { ts: Date.now(), ...payload };

  // 1. BroadcastChannel (same browser tab-to-tab)
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel(BC_NAME);
      bc.postMessage(data);
      bc.close();
    }
  } catch {
    /* ignore */
  }

  // 2. Storage event (cross-window fallback on same origin)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }

  // 3. Supabase Realtime broadcast (cross-device & external sessions)
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
          supabase.removeChannel(ch);
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

    // 1. Same-browser cross-tab listener
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

    // 3. Auto-update when tab gains focus or visibility
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        triggerRefresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    // 4. Supabase Realtime WebSocket listener
    let supabaseChannel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    let supabaseClient: ReturnType<typeof createClient> | null = null;
    try {
      supabaseClient = createClient();
      supabaseChannel = supabaseClient.channel(CHANNEL_NAME);
      supabaseChannel
        .on("broadcast", { event: "change" }, () => triggerRefresh())
        .subscribe();
    } catch {
      /* ignore */
    }

    // 5. Periodic heartbeat fallback (every 6 seconds while tab is visible)
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        triggerRefresh();
      }
    }, 6000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      clearInterval(timer);
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
