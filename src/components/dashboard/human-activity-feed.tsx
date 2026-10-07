import Link from "next/link";
import { formatTanggalWaktu } from "@/lib/format";
import { BookOpen, User, ArrowLeftRight, CheckCircle2, History } from "lucide-react";
import type { AuditLog } from "@/lib/types";

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function parseHumanActivity(log: AuditLog): {
  actor: string;
  actionWord: string;
  target: string;
  icon: typeof BookOpen;
  tone: "sky" | "leaf" | "sun" | "berry";
} {
  const meta = log.metadata || {};
  const actor = log.actor_name || "Sistem";

  if (log.action.includes("borrow") || log.action === "loan.create") {
    return {
      actor: (meta.student_name as string) || actor,
      actionWord: "meminjam",
      target: (meta.book_title as string) || (meta.inventory_code as string) || "buku",
      icon: ArrowLeftRight,
      tone: "sky",
    };
  }

  if (log.action.includes("return") || log.action === "loan.return") {
    return {
      actor: (meta.student_name as string) || actor,
      actionWord: "mengembalikan",
      target: (meta.book_title as string) || (meta.inventory_code as string) || "buku",
      icon: CheckCircle2,
      tone: "leaf",
    };
  }

  if (log.action.startsWith("book.")) {
    return {
      actor,
      actionWord: log.action.endsWith("create") ? "menambahkan judul buku baru" : "memperbarui katalog buku",
      target: (meta.title as string) || "Koleksi",
      icon: BookOpen,
      tone: "sky",
    };
  }

  if (log.action.startsWith("student.")) {
    return {
      actor,
      actionWord: log.action.endsWith("create") ? "mendaftarkan siswa baru" : "memperbarui data siswa",
      target: (meta.name as string) || (meta.nis as string) || "Siswa",
      icon: User,
      tone: "berry",
    };
  }

  if (log.action.startsWith("import.")) {
    return {
      actor,
      actionWord: "menyelesaikan proses import massal",
      target: log.entity_type,
      icon: History,
      tone: "sun",
    };
  }

  return {
    actor,
    actionWord: "memproses",
    target: `${log.entity_type} (${log.action})`,
    icon: History,
    tone: "berry",
  };
}

export function HumanActivityFeed({
  activities,
  allLogsHref = "/admin/audit-logs",
}: {
  activities: AuditLog[];
  allLogsHref?: string;
}) {
  return (
    <section aria-labelledby="activity-feed-heading" className="rounded-card border border-outline bg-background p-5 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-outline/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-berry-soft text-berry">
            <History className="size-4" />
          </span>
          <h2 id="activity-feed-heading" className="font-display text-body font-bold text-ink">
            Aktivitas Terkini
          </h2>
        </div>
        <Link
          href={allLogsHref}
          className="text-label font-semibold text-sky-deep hover:underline transition-colors"
        >
          Semua log audit →
        </Link>
      </div>

      {activities.length === 0 ? (
        <p className="py-6 text-body text-ink-muted">Belum ada aktivitas sirkulasi tercatat.</p>
      ) : (
        <div className="mt-4 relative pl-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-outline">
          <ul className="space-y-4">
            {activities.map((a) => {
              const { actor, actionWord, target, tone } = parseHumanActivity(a);
              const relativeTime = formatRelativeTime(a.created_at);
              const fullTime = formatTanggalWaktu(a.created_at);

              return (
                <li key={a.id} className="relative group">
                  {/* Timeline point */}
                  <span
                    className="absolute -left-4 top-1 size-2.5 rounded-full border-2 border-background ring-2 ring-outline"
                    style={{
                      backgroundColor:
                        tone === "sky"
                          ? "var(--color-sky)"
                          : tone === "leaf"
                          ? "var(--color-leaf)"
                          : tone === "sun"
                          ? "var(--color-sun-deep)"
                          : "var(--color-berry)",
                    }}
                    aria-hidden
                  />

                  <div className="flex items-start justify-between gap-3 text-body">
                    <div className="min-w-0 pr-2">
                      <p className="leading-snug text-ink">
                        <span className="font-bold text-ink">{actor}</span>{" "}
                        <span className="text-ink-muted">{actionWord}</span>{" "}
                        <span className="font-semibold text-ink">{target}</span>
                      </p>
                    </div>

                    {/* Timestamp with full hover tooltip */}
                    <div className="shrink-0 text-right">
                      <time
                        dateTime={a.created_at}
                        title={fullTime}
                        className="text-meta font-mono text-ink-subtle hover:text-ink cursor-help border-b border-dotted border-ink-subtle/40"
                      >
                        {relativeTime}
                      </time>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
