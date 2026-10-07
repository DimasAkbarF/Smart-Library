"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, Lock, UserRound } from "lucide-react";
import { login } from "@/features/auth/actions";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  const [showPassword, setShowPassword] = useState(false);
  const invalid = Boolean(state.message);

  return (
    <form action={action} className="grid gap-5 [@media(max-height:720px)]:gap-4">
      <div className="grid gap-2">
        <label htmlFor="identifier" className="text-body font-semibold text-ink">
          NIS / Username
        </label>
        <div className="relative">
          <UserRound
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <Input
            id="identifier"
            name="identifier"
            autoComplete="username"
            autoFocus
            required
            disabled={pending}
            aria-invalid={invalid}
            placeholder="cth. 20260001"
            className={cn(
              "min-h-14 bg-surface pl-11 focus:bg-background",
              invalid && "border-coral bg-coral-soft",
            )}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-body font-semibold text-ink">
          Password
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-subtle"
            aria-hidden
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={pending}
            aria-invalid={invalid}
            className={cn(
              "min-h-14 bg-surface pr-14 pl-11 focus:bg-background",
              invalid && "border-coral bg-coral-soft",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={pending}
            aria-pressed={showPassword}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute top-1/2 right-1 flex h-14 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden />
            ) : (
              <Eye className="size-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {state.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md bg-coral-soft px-4 py-3 text-body font-semibold text-coral-deep"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          {state.message}
        </p>
      )}

      <SubmitButton
        size="lg"
        className="w-full rounded-lg text-title"
      >
        Masuk ke Smart Library
      </SubmitButton>
    </form>
  );
}