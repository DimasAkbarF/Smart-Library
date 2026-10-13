"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { adminLogin } from "@/features/auth/actions";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { cn } from "@/lib/utils";

/**
 * Form login khusus admin dan petugas sirkulasi.
 * Dilengkapi proteksi Cloudflare Turnstile, anti-brute force, dan verifikasi 2FA TOTP.
 */
export interface AdminLoginFormProps {
  siteKey?: string;
}

export function AdminLoginForm({ siteKey }: AdminLoginFormProps = {}) {
  const [state, action, pending] = useActionState(adminLogin, {});
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const invalid = Boolean(state.message);
  const isSubmitDisabled = pending || !turnstileToken;

  return (
    <form action={action} className="grid gap-4.5">
      <input type="hidden" name="turnstile_token" value={turnstileToken ?? ""} />

      {/* Field 1: Nama Pengguna / Email */}
      <div className="grid gap-1.5">
        <label
          htmlFor="identifier"
          className="font-plex-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-[#4A5160]"
        >
          NAMA PENGGUNA ATAU EMAIL
        </label>
        <input
          id="identifier"
          name="identifier"
          autoComplete="username"
          autoFocus
          required
          disabled={pending}
          aria-invalid={invalid}
          placeholder="admin atau admin@sekolah.sch.id"
          className={cn(
            "h-11 sm:h-10 w-full rounded-btn border border-rule-strong bg-white px-3 font-plex-sans text-[14px] text-ink placeholder:text-ink-subtle transition-colors",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:bg-surface-sunken-ed disabled:text-ink-subtle disabled:cursor-not-allowed",
            invalid && "border-danger bg-danger-bg text-danger focus:border-danger focus:ring-danger/20"
          )}
        />
      </div>

      {/* Field 2: Kata Sandi */}
      <div className="grid gap-1.5">
        <label
          htmlFor="password"
          className="font-plex-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-muted"
        >
          KATA SANDI
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={pending}
            aria-invalid={invalid}
            placeholder="Masukkan kata sandi"
            className={cn(
              "h-11 sm:h-10 w-full rounded-btn border border-rule-strong bg-white pl-3 pr-16 font-plex-sans text-[14px] text-ink placeholder:text-ink-subtle transition-colors",
              "focus:border-primary focus:ring-2 focus:ring-primary/20",
              "disabled:bg-surface-sunken-ed disabled:text-ink-subtle disabled:cursor-not-allowed",
              invalid && "border-danger bg-danger-bg text-danger focus:border-danger focus:ring-danger/20"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={pending}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-[2px] px-2.5 py-1.5 font-plex-sans text-[12px] font-medium text-[#4A5160] hover:text-[#161B26] focus-visible:outline-2 focus-visible:outline-[#1B2F5B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showPassword ? "Tutup" : "Lihat"}
          </button>
        </div>
      </div>

      {/* Field 3: Kode 2FA TOTP (Ditampilkan jika akun mewajibkan atau admin mengisinya) */}
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="totp_code"
            className="font-plex-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-[#4A5160] flex items-center gap-1.5"
          >
            <ShieldCheck className="size-3.5 text-primary" />
            <span>KODE AUTENTIKASI 2FA (TOTP)</span>
          </label>
          <span className="font-plex-sans text-[11px] text-ink-muted">
            {state.requireTotp ? "(Wajib)" : "(Opsional jika aktif)"}
          </span>
        </div>
        <input
          id="totp_code"
          name="totp_code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
          disabled={pending}
          placeholder="6 digit angka dari aplikasi Authenticator"
          className={cn(
            "h-11 sm:h-10 w-full rounded-btn border border-rule-strong bg-white px-3 font-mono text-[14px] text-ink placeholder:text-ink-subtle transition-colors",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:bg-surface-sunken-ed disabled:text-ink-subtle disabled:cursor-not-allowed",
            state.requireTotp && "border-primary bg-primary-soft/10 ring-2 ring-primary/20"
          )}
        />
      </div>

      {/* Cloudflare Turnstile Managed Widget */}
      <div className="pt-0.5">
        <TurnstileWidget siteKey={siteKey} onTokenChange={setTurnstileToken} />
      </div>

      {/* Error Alert */}
      {state.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[4px] border border-[#E8B9B9] bg-[#FBEAEA] px-3.5 py-2.5 font-plex-sans text-[13px] font-medium text-[#A12B2B] leading-relaxed"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.message}</span>
        </p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className={cn(
          "mt-1 flex h-11 sm:h-10 w-full items-center justify-center rounded-[4px] bg-[#1B2F5B] px-4 font-plex-sans text-[14px] font-medium text-white transition-colors",
          "hover:bg-[#13234A] active:bg-[#13234A]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B2F5B]",
          "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        )}
      >
        {pending ? "Memproses..." : !turnstileToken ? "Menunggu Verifikasi Keamanan..." : "Masuk ke Panel Admin"}
      </button>

      {/* Student Link */}
      <div className="pt-1 text-center">
        <Link
          href="/login"
          className="font-plex-sans text-[12px] font-medium text-primary hover:underline hover:text-ink transition-colors"
        >
          ← Kembali ke Portal Masuk Siswa (NIS)
        </Link>
      </div>
    </form>
  );
}
