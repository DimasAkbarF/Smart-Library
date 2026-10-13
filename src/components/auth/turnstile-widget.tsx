"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { AlertTriangle } from "lucide-react";
import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from "react";

// Kunci pengujian resmi Cloudflare yang selalu valid di localhost / 127.0.0.1
const CLOUDFLARE_TEST_SITE_KEY = "1x00000000000000000000AA";

export interface TurnstileWidgetRef {
  reset: () => void;
}

export interface TurnstileWidgetProps {
  siteKey?: string;
  onTokenChange: (token: string | null) => void;
  className?: string;
  resetTrigger?: number | string;
}

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey: propSiteKey, onTokenChange, className, resetTrigger }, ref) {
    const [loadError, setLoadError] = useState<string | null>(null);
    const widgetRef = useRef<TurnstileInstance>(null);

    useImperativeHandle(ref, () => ({
      reset() {
        onTokenChange(null);
        try {
          widgetRef.current?.reset();
        } catch {}
      },
    }));

    useEffect(() => {
      if (resetTrigger !== undefined && resetTrigger !== 0) {
        onTokenChange(null);
        try {
          widgetRef.current?.reset();
        } catch {}
      }
    }, [resetTrigger, onTokenChange]);

    const isDev = process.env.NODE_ENV !== "production";
    // Gunakan prop/env, dan di mode development fallback otomatis ke dummy test key agar tidak memblokir pengujian lokal
    const siteKey = (
      propSiteKey ||
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      (isDev ? CLOUDFLARE_TEST_SITE_KEY : "")
    )?.trim();

    if (!siteKey) {
      return (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[4px] border border-[#E8CF97] bg-[#FBF1DC] p-3 text-[12px] font-plex-sans text-[#8A5300] leading-relaxed my-1"
        >
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-[#8A5300]" aria-hidden />
          <div>
            <span className="font-semibold block">Verifikasi Bot Belum Dikonfigurasi</span>
            <span>
              Variabel <code className="font-mono font-bold">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> belum diisi pada lingkungan aplikasi.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={className ?? "flex flex-col items-center my-1"}>
        <Turnstile
          ref={widgetRef}
          siteKey={siteKey}
          options={{
            theme: "light",
            size: "normal",
            action: "login",
            refreshExpired: "auto",
          }}
          onSuccess={(token) => {
            setLoadError(null);
            onTokenChange(token);
          }}
          onError={(errorCode) => {
            onTokenChange(null);
            if (errorCode === "110200" || errorCode === "110100") {
              setLoadError("Domain ini belum didaftarkan pada Cloudflare Turnstile dashboard.");
            } else {
              setLoadError("Gagal memverifikasi widget bot. Periksa koneksi internet.");
            }
          }}
          onExpire={() => {
            onTokenChange(null);
            try {
              widgetRef.current?.reset();
            } catch {}
          }}
        />

        {loadError && (
          <p className="mt-1 text-[11.5px] font-plex-sans text-[#A12B2B] text-center">
            {loadError}
          </p>
        )}
      </div>
    );
  }
);
