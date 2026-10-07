import { cn } from "@/lib/utils";

const inputCls =
  "w-full rounded-md border border-outline bg-background px-4 text-base text-ink placeholder:text-ink-subtle focus:border-sky disabled:bg-surface-sunken disabled:text-ink-subtle";

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  error?: string | string[];
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const err = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label className="text-xs font-semibold text-ink uppercase tracking-wider font-mono">
        {label}
      </label>
      <div>{children}</div>
      {hint && !err && <p className="text-xs text-ink-muted leading-relaxed">{hint}</p>}
      {err && (
        <p role="alert" className="text-xs font-semibold text-coral-deep">
          {err}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputCls, "min-h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, "min-h-24 py-3", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputCls, "min-h-12", className)} {...props}>
      {children}
    </select>
  );
}
