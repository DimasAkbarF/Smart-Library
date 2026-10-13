"use client";

import { useActionState, useState } from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { changePassword } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {});
  const [showPassword, setShowPassword] = useState(false);
  const invalid = Boolean(state.message);

  return (
    <form action={action} className="grid gap-4.5">
      <div className="rounded-[4px] border border-[#E8CF97] bg-[#FBF1DC] p-3 text-meta text-[#8A5300] flex items-start gap-2.5">
        <ShieldAlert className="size-4.5 shrink-0 mt-0.5 text-[#8A5300]" />
        <span>
          Demi keamanan akun, Anda diwajibkan mengganti kata sandi bawaan/sementara. Minimal 8 karakter, hindari kata sandi umum atau yang sama dengan NIS/username.
        </span>
      </div>

      {/* Field: Kata Sandi Baru */}
      <div className="grid gap-1.5">
        <label
          htmlFor="new_password"
          className="font-plex-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-[#4A5160]"
        >
          KATA SANDI BARU
        </label>
        <div className="relative">
          <input
            id="new_password"
            name="new_password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            disabled={pending}
            aria-invalid={invalid}
            placeholder="Minimal 8 karakter unik"
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
            className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-[2px] px-2.5 py-1.5 font-plex-sans text-[12px] font-medium text-[#4A5160] hover:text-[#161B26]"
          >
            {showPassword ? "Tutup" : "Lihat"}
          </button>
        </div>
      </div>

      {/* Field: Konfirmasi Kata Sandi Baru */}
      <div className="grid gap-1.5">
        <label
          htmlFor="confirm_password"
          className="font-plex-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-[#4A5160]"
        >
          KONFIRMASI KATA SANDI BARU
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          disabled={pending}
          aria-invalid={invalid}
          placeholder="Ulangi kata sandi baru"
          className={cn(
            "h-11 sm:h-10 w-full rounded-btn border border-rule-strong bg-white px-3 font-plex-sans text-[14px] text-ink placeholder:text-ink-subtle transition-colors",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            "disabled:bg-surface-sunken-ed disabled:text-ink-subtle disabled:cursor-not-allowed",
            invalid && "border-danger bg-danger-bg text-danger focus:border-danger focus:ring-danger/20"
          )}
        />
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
        disabled={pending}
        className={cn(
          "mt-2 flex h-11 sm:h-10 w-full items-center justify-center rounded-[4px] bg-[#1B2F5B] px-4 font-plex-sans text-[14px] font-medium text-white transition-colors",
          "hover:bg-[#13234A] active:bg-[#13234A]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B2F5B]",
          "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        )}
      >
        {pending ? "Menyimpan Kata Sandi..." : "Simpan Kata Sandi Baru"}
      </button>
    </form>
  );
}
