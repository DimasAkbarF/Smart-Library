import { BookOpen, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  body,
  action,
  icon: Icon = BookOpen,
  className,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-outline-strong/70 bg-surface/40 px-6 py-12 text-center",
        className
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-sky-soft text-sky-deep shadow-2xs">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-3 font-display text-body sm:text-title font-bold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-md text-body text-ink-muted leading-relaxed">{body}</p>
      {action && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
