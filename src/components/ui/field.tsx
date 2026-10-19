import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-btn border border-rule-strong bg-white px-3.5 text-base sm:text-sm text-ink font-plex-sans placeholder:text-ink-subtle transition-colors duration-150 focus:border-primary disabled:cursor-not-allowed disabled:bg-surface-sunken-ed disabled:text-ink-subtle disabled:border-rule";

export function Field({
  label,
  error,
  hint,
  children,
  className,
  id,
}: {
  label: string;
  error?: string | string[];
  hint?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const err = Array.isArray(error) ? error[0] : error;
  const errorId = id ? `${id}-error` : undefined;
  const hintId = id ? `${id}-hint` : undefined;

  return (
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <label
        htmlFor={id}
        className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-muted-ed font-plex-sans"
      >
        {label}
      </label>
      <div>{children}</div>
      {hint && !err && (
        <p id={hintId} className="text-xs text-ink-muted leading-relaxed font-plex-sans">
          {hint}
        </p>
      )}
      {err && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-danger font-plex-sans"
        >
          <AlertCircle className="size-3.5 shrink-0 text-danger" aria-hidden />
          <span>{err}</span>
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputCls, "h-11 sm:h-10 min-h-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, "min-h-24 py-2.5", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputCls, "h-11 sm:h-10 min-h-10", className)} {...props}>
      {children}
    </select>
  );
}
