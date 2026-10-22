"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircle, Check, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { changePassword, type ChangePasswordState } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import { PASSWORD_POLICY } from "@/lib/password";

const STRENGTH_BAR: Record<number, { label: string; color: string }> = {
  0: { label: "Lemah", color: "bg-danger" },
  1: { label: "Lemah", color: "bg-danger" },
  2: { label: "Sedang", color: "bg-warning" },
  3: { label: "Kuat", color: "bg-primary" },
  4: { label: "Sangat kuat", color: "bg-success" },
};

const inputBase =
  "h-11 sm:h-10 w-full rounded-btn border bg-white px-3 font-plex-sans text-[16px] sm:text-[14px] text-ink placeholder:text-ink-subtle transition-colors focus:border-primary disabled:bg-surface-sunken-ed disabled:text-ink-subtle disabled:cursor-not-allowed";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(
    changePassword,
    {},
  );
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [newPassword, setNewPassword] = useState("");

  // Indikator kekuatan dihitung client-side; server tetap sumber kebenaran.
  const strength = useMemo(() => {
    const value = newPassword;
    if (!value) return { score: 0, classes: 0, length: value.length };
    let classes = 0;
    if (/[A-Z]/.test(value)) classes++;
    if (/[a-z]/.test(value)) classes++;
    if (/[0-9]/.test(value)) classes++;
    if (/[!@#$%^&*()\-_=+[\]{}<>?,.;:'"\\|/~`]/.test(value)) classes++;
    let score = 0;
    if (value.length >= 8) score++;
    if (classes >= 3) score++;
    if (classes === 4) score++;
    if (value.length >= 16) score++;
    return { score: Math.min(4, score), classes, length: value.length };
  }, [newPassword]);

  const bar = STRENGTH_BAR[strength.score];
  const fieldError = (field: ChangePasswordState["field"]) =>
    state.field === field ? state.message : undefined;

  const toggleBtn = (key: keyof typeof show, label: string) => (
    <button
      type="button"
      onClick={() => setShow((v) => ({ ...v, [key]: !v[key] }))}
      disabled={pending}
      aria-label={`${show[key] ? "Sembunyikan" : "Tampilkan"} ${label}`}
      className="absolute top-1/2 right-1.5 -translate-y-1/2 flex min-h-[36px] items-center rounded-[2px] px-2.5 py-1.5 font-plex-sans text-[12px] font-semibold text-[#4A5160] hover:text-[#161B26]"
    >
      {show[key] ? "Tutup" : "Lihat"}
    </button>
  );

  return (
    <form action={action} className="grid gap-4.5">
      <div className="rounded-[4px] border border-[#E8CF97] bg-[#FBF1DC] p-3 text-meta text-[#8A5300] flex items-start gap-2.5">
        <ShieldAlert className="size-4.5 shrink-0 mt-0.5 text-[#8A5300]" />
        <span>
          Demi keamanan akun, Anda diwajibkan mengganti kata sandi bawaan/semporary. Minimal{" "}
          {PASSWORD_POLICY.minLength} karakter dengan minimal {PASSWORD_POLICY.minClasses} jenis
          karakter (huruf besar, huruf kecil, angka, simbol), dan tidak boleh sama dengan
          username/NIS/email.
        </span>
      </div>

      {/* Field: Kata Sandi Saat Ini */}
      <div className="grid gap-1.5">
        <label
          htmlFor="current_password"
          className="font-plex-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-[#4A5160]"
        >
          KATA SANDI SAAT INI
        </label>
        <div className="relative">
          <input
            id="current_password"
            name="current_password"
            type={show.current ? "text" : "password"}
            required
            autoComplete="current-password"
            disabled={pending}
            aria-invalid={Boolean(fieldError("current_password"))}
            aria-describedby="current_password-help"
            className={cn(inputBase, "pl-3 pr-16", fieldError("current_password") && "border-danger bg-danger-bg")}
          />
          {toggleBtn("current", "kata sandi saat ini")}
        </div>
        <p id="current_password-help" className="text-[12px] text-ink-muted">
          {fieldError("current_password") ?? "Digunakan untuk memastikan Anda pemilik akun ini."}
        </p>
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
            type={show.next ? "text" : "password"}
            required
            autoComplete="new-password"
            disabled={pending}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={Boolean(fieldError("new_password"))}
            aria-describedby="new_password-help"
            className={cn(inputBase, "pl-3 pr-16", fieldError("new_password") && "border-danger bg-danger-bg")}
          />
          {toggleBtn("next", "kata sandi baru")}
        </div>

        {/* Indikator kekuatan */}
        {newPassword.length > 0 && (
          <div className="flex items-center gap-2" aria-live="polite">
            <div className="flex h-1.5 flex-1 gap-1" role="img" aria-label={`Kekuatan kata sandi: ${bar.label}`}>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-btn transition-colors",
                    i < strength.score ? bar.color : "bg-rule",
                  )}
                />
              ))}
            </div>
            <span className="font-plex-mono text-[11px] text-ink-muted">
              {bar.label} · {strength.length} karakter
            </span>
          </div>
        )}

        <p id="new_password-help" className="text-[12px] text-ink-muted">
          {fieldError("new_password") ?? `Minimal ${PASSWORD_POLICY.minLength} karakter, minimal ${PASSWORD_POLICY.minClasses} jenis karakter.`}
        </p>
      </div>

      {/* Field: Konfirmasi Kata Sandi Baru */}
      <div className="grid gap-1.5">
        <label
          htmlFor="confirm_password"
          className="font-plex-sans text-[12px] font-semibold uppercase tracking-[0.06em] text-[#4A5160]"
        >
          KONFIRMASI KATA SANDI BARU
        </label>
        <div className="relative">
          <input
            id="confirm_password"
            name="confirm_password"
            type={show.confirm ? "text" : "password"}
            required
            autoComplete="new-password"
            disabled={pending}
            aria-invalid={Boolean(fieldError("confirm_password"))}
            aria-describedby="confirm_password-help"
            className={cn(inputBase, "pl-3 pr-16", fieldError("confirm_password") && "border-danger bg-danger-bg")}
          />
          {toggleBtn("confirm", "konfirmasi kata sandi")}
        </div>
        <p id="confirm_password-help" className="text-[12px] text-ink-muted">
          {fieldError("confirm_password") ?? "Ulangi kata sandi baru, harus sama persis."}
        </p>
      </div>

      {/* Daftar syarat */}
      <ul className="grid gap-1 rounded-[4px] border border-rule bg-surface-sunken-ed p-3 text-[12px]">
        {[
          { ok: strength.length >= PASSWORD_POLICY.minLength, label: `Minimal ${PASSWORD_POLICY.minLength} karakter` },
          { ok: strength.classes >= PASSWORD_POLICY.minClasses, label: `Minimal ${PASSWORD_POLICY.minClasses} jenis karakter (A-Z, a-z, 0-9, simbol)` },
          { ok: newPassword.length > 0 && !["password", "admin123", "perpustakaan"].includes(newPassword.toLowerCase()), label: "Bukan kata sandi umum" },
        ].map((rule) => (
          <li key={rule.label} className="flex items-center gap-1.5">
            {rule.ok ? (
              <Check className="size-3.5 shrink-0 text-success" aria-hidden />
            ) : (
              <X className="size-3.5 shrink-0 text-ink-subtle" aria-hidden />
            )}
            <span className={rule.ok ? "text-ink" : "text-ink-muted"}>{rule.label}</span>
          </li>
        ))}
      </ul>

      {/* Error Alert (field-level errors ditampilkan di bawah field) */}
      {state.message && !state.field && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-[4px] border border-[#E8B9B9] bg-[#FBEAEA] px-3.5 py-2.5 font-plex-sans text-[13px] font-medium text-[#A12B2B] leading-relaxed"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{state.message}</span>
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={cn(
          "mt-2 flex h-11 sm:h-10 w-full items-center justify-center gap-2 rounded-[4px] bg-[#1B2F5B] px-4 font-plex-sans text-[14px] font-medium text-white transition-colors",
          "hover:bg-[#13234A] active:bg-[#13234A]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B2F5B]",
          "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        )}
      >
        <ShieldCheck className="size-4" aria-hidden />
        {pending ? "Menyimpan Kata Sandi..." : "Simpan Kata Sandi Baru"}
      </button>
    </form>
  );
}
