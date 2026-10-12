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
    <section aria-labelledby="needs-attention-heading" className="rounded-panel border border-rule bg-white p-5 sm:p-6 font-plex-sans">
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <div>
          <h2 id="needs-attention-heading" className="font-serif text-base font-semibold text-ink">
            Perlu Perhatian
          </h2>
        </div>
        <span className="rounded-chip border border-rule bg-surface-sunken-ed px-2 py-0.5 text-xs text-ink-muted">
          {new Intl.NumberFormat("id-ID").format(activeItems.length)} tindakan diperlukan
        </span>
      </div>

      {activeItems.length === 0 ? (
        <div className="flex items-center gap-3 py-6 px-2 text-sm text-ink-muted">
          <CheckCircle2 className="size-4.5 text-success shrink-0" />
          <p>Semua operasional berjalan optimal. Tidak ada peringatan yang memerlukan tindakan segera.</p>
        </div>
      ) : (
        <div className="mt-3 divide-y divide-rule">
          {activeItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group -mx-2 flex items-center justify-between gap-4 rounded-btn px-2.5 py-3 transition-colors duration-150",
                item.severity === "urgent" && "hover:bg-danger-bg/40",
                item.severity === "warning" && "hover:bg-warning-bg/40",
                item.severity === "info" && "hover:bg-primary-soft/40",
              )}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="mt-0.5 shrink-0">
                  {item.severity === "urgent" ? (
                    <Clock className="size-4 text-danger" />
                  ) : item.severity === "warning" ? (
                    <Users className="size-4 text-warning" />
                  ) : (
                    <AlertCircle className="size-4 text-primary" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-ink text-sm">
                      {new Intl.NumberFormat("id-ID").format(item.count)} {item.title}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted truncate">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-xs font-medium">
                <span
                  className={cn(
                    "hidden sm:inline",
                    item.severity === "urgent" && "text-danger",
                    item.severity === "warning" && "text-warning",
                    item.severity === "info" && "text-primary",
                  )}
                >
                  {item.actionLabel}
                </span>
                <ArrowUpRight className="size-3.5 text-ink-subtle group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
