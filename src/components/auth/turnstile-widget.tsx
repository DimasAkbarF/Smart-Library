"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { AlertTriangle } from "lucide-react";

export interface TurnstileWidgetProps {
  siteKey?: string;
  onTokenChange: (token: string | null) => void;
  className?: string;
}

export function TurnstileWidget({ siteKey: propSiteKey, onTokenChange, className }: TurnstileWidgetProps) {
  // Hanya baca dari variabel lingkungan NEXT_PUBLIC_TURNSTILE_SITE_KEY tanpa fallback kunci tes
  const siteKey = (propSiteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)?.trim();

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
            Variabel <code className="font-mono font-bold">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> belum diisi pada lingkungan aplikasi. Tombol masuk dinonaktifkan demi perlindungan sistem.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={className ?? "flex justify-center my-1"}>
      <Turnstile
        siteKey={siteKey}
        options={{
          theme: "light",
          size: "normal",
          action: "login",
        }}
        onSuccess={(token) => {
          onTokenChange(token);
        }}
        onError={() => {
          onTokenChange(null);
        }}
        onExpire={() => {
          onTokenChange(null);
        }}
      />
      <input type="hidden" name="cf-turnstile-response" id="cf-turnstile-response" />
    </div>
  );
}
