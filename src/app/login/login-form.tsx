"use client";

import { useActionState, useState } from "react";
import { AlertCircle } from "lucide-react";
import { login } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

/**
 * Form login dengan standar tata letak design.md §6 & PRD §8.1.
 * Menggunakan IBM Plex Sans, border rule-strong, fokus 2px solid primary,
 * tombol [Lihat] kata sandi, dan target sentuh minimal 44px di mobile (h-11 sm:h-10).
 */
export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  const [showPassword, setShowPassword] = useState(false);
  const invalid = Boolean(state.message);

  return (
    <form action={action} className="grid gap-4.5">
      {/* Field 1: NIS / NAMA PENGGUNA */}
      <div className="grid gap-1.5">
        <label
          htmlFor="identifier"
          className="font-plex-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-[#4A5160]"
        >
          NIS / NAMA PENGGUNA
        </label>
        <input
          id="identifier"
          name="identifier"
          autoComplete="username"
          autoFocus
          required
          disabled={pending}
          aria-invalid={invalid}
          placeholder="cth. 2024001"
          className={cn(
            "h-11 sm:h-10 w-full rounded-btn border border-rule-strong bg-white px-3 font-plex-sans text-[14px] text-ink placeholder:text-ink-subtle transition-colors",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:bg-surface-sunken-ed disabled:text-ink-subtle disabled:cursor-not-allowed",
            invalid && "border-danger bg-danger-bg text-danger focus:border-danger focus:ring-danger/20"
          )}
        />
      </div>

      {/* Field 2: KATA SANDI */}
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

      {/* Error Alert: design.md §6 & §10 */}
      {state.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[4px] border border-[#E8B9B9] bg-[#FBEAEA] px-3.5 py-2.5 font-plex-sans text-[13px] font-medium text-[#A12B2B] leading-relaxed"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {state.message.includes("kredensial") || state.message.includes("Password") || state.message.includes("tidak cocok")
              ? "NIS atau kata sandi tidak cocok. Periksa kembali, atau hubungi petugas perpustakaan."
              : state.message}
          </span>
        </p>
      )}

      {/* Tombol Submit: design.md §5 (tinggi 44px mobile / 40px desktop, radius 4px, latar primary #1B2F5B) */}
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "mt-2 flex h-11 sm:h-10 w-full items-center justify-center rounded-[4px] bg-[#1B2F5B] px-4 font-plex-sans text-[14px] font-medium text-white transition-colors",
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