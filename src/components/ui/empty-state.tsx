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
        "flex flex-col items-center justify-center rounded-panel border border-dashed border-rule-strong bg-paper px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-btn border border-rule bg-white text-ink-muted">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-3 font-serif text-lg font-medium text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted leading-relaxed font-plex-sans">{body}</p>
      {action && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
