"use client";

import { useActionState, useState } from "react";
import { AlertCircle } from "lucide-react";
import { login } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

/**
 * Formulir login tunggal resmi Smart Library SMPN 17 Tangerang Selatan.
 * Khusus untuk petugas perpustakaan dan staf administrator.
 */
export type LoginFormProps = Record<string, never>;

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  const [showPassword, setShowPassword] = useState(false);

  const invalid = Boolean(state.message);

  return (
    <form action={action} className="grid gap-4.5">
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
          placeholder="nama pengguna atau email"
          className={cn(
            "h-11 sm:h-10 w-full rounded-btn border border-rule-strong bg-white px-3 font-plex-sans text-[16px] sm:text-[14px] text-ink placeholder:text-ink-subtle transition-colors",
            "focus:border-primary",
            "disabled:bg-surface-sunken-ed disabled:text-ink-subtle disabled:cursor-not-allowed",
            invalid && "border-danger bg-danger-bg text-danger focus:border-danger"
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
              "h-11 sm:h-10 w-full rounded-btn border border-rule-strong bg-white pl-3 pr-16 font-plex-sans text-[16px] sm:text-[14px] text-ink placeholder:text-ink-subtle transition-colors",
              "focus:border-primary",
              "disabled:bg-surface-sunken-ed disabled:text-ink-subtle disabled:cursor-not-allowed",
              invalid && "border-danger bg-danger-bg text-danger focus:border-danger"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={pending}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute top-1/2 right-1.5 -translate-y-1/2 flex min-h-[36px] items-center rounded-[2px] px-2.5 py-1.5 font-plex-sans text-[12px] font-semibold text-[#4A5160] hover:text-[#161B26] focus-visible:outline-2 focus-visible:outline-[#1B2F5B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showPassword ? "Tutup" : "Lihat"}
          </button>
        </div>
      </div>

      {/* Error Alert Generik */}
      {state.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[4px] border border-[#E8B9B9] bg-[#FBEAEA] px-3.5 py-2.5 font-plex-sans text-[13px] font-medium text-[#A12B2B] leading-relaxed"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.message}</span>
        </p>
      )}

      {/* Tombol Submit */}
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "mt-1 flex h-11 sm:h-10 w-full items-center justify-center rounded-[4px] bg-[#1B2F5B] px-4 font-plex-sans text-[14px] font-medium text-white transition-colors",
          "hover:bg-[#13234A] active:bg-[#13234A]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B2F5B]",
          "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        )}
      >
        {pending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}