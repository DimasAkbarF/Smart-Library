import Link from "next/link";
import { AlertCircle, Clock, Users, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AttentionItem {
  id: string;
  title: string;
  count: number;
  description: string;
  href: string;
  severity: "urgent" | "warning" | "info";
  actionLabel: string;
}

export function NeedsAttention({
  items,
}: {
  items: AttentionItem[];
}) {
  const activeItems = items.filter((i) => i.count > 0);

  return (
    <section aria-labelledby="needs-attention-heading" className="rounded-card border border-outline bg-background p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-outline/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-coral-soft text-coral-deep">
            <AlertCircle className="size-4" />
          </span>
          <h2 id="needs-attention-heading" className="font-display text-body font-bold text-ink">
            Perlu Perhatian
          </h2>
        </div>
        <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-meta font-semibold text-ink-muted">
          {activeItems.length} tindakan diperlukan
        </span>
      </div>

      {activeItems.length === 0 ? (
        <div className="flex items-center gap-3 py-6 px-2 text-body text-ink-muted">
          <CheckCircle2 className="size-5 text-leaf-deep shrink-0" />
          <p>Semua operasional berjalan optimal. Tidak ada peringatan yang memerlukan tindakan segera.</p>
        </div>
      ) : (
        <div className="mt-3 divide-y divide-outline/60">
          {activeItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group flex items-center justify-between gap-4 py-3.5 px-3 rounded-lg -mx-3 transition-colors duration-150",
                item.severity === "urgent" && "hover:bg-coral-soft/40",
                item.severity === "warning" && "hover:bg-sun-soft/40",
                item.severity === "info" && "hover:bg-sky-soft/40"
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="mt-0.5 shrink-0">
                  {item.severity === "urgent" ? (
                    <Clock className="size-4.5 text-coral-deep" />
                  ) : item.severity === "warning" ? (
                    <Users className="size-4.5 text-sun-deep" />
                  ) : (
                    <AlertCircle className="size-4.5 text-sky-deep" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-ink group-hover:text-ink transition-colors text-body">
                      {item.count} {item.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-meta text-ink-muted truncate">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-label font-semibold">
                <span
                  className={cn(
                    "hidden sm:inline",
                    item.severity === "urgent" && "text-coral-deep",
                    item.severity === "warning" && "text-sun-deep",
                    item.severity === "info" && "text-sky-deep"
                  )}
                >
                  {item.actionLabel}
                </span>
                <ArrowUpRight className="size-4 text-ink-subtle group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
