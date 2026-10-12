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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(val: unknown): boolean {
  if (typeof val !== "string") return false;
  const trimmed = val.trim();
  return UUID_REGEX.test(trimmed) || (trimmed.includes("-") && trimmed.length === 36);
}

function cleanName(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed || isUuid(trimmed)) return null;
  return trimmed;
}

function parseHumanActivity(log: AuditLog): {
  actor: string;
  actionWord: string;
  target: string;
  icon: typeof BookOpen;
  tone: "sky" | "leaf" | "sun" | "berry";
} {
  const meta = log.metadata || {};
  const rawActor = log.actor_name || "Sistem";
  const actor = isUuid(rawActor) ? "Admin Perpustakaan" : rawActor;

  // Autentikasi / Login
  if (log.action === "auth.login" || log.action === "user.login") {
    const loc = cleanName(meta.location);
    const ip = cleanName(meta.ip);
    let place = "portal web";
    if (loc && ip && ip !== "127.0.0.1" && ip !== "::1") {
      place = `${loc} (IP ${ip})`;
    } else if (loc) {
      place = loc;
    } else if (ip) {
      place = `IP ${ip}`;
    }
    const displayName = cleanName(meta.name) || cleanName(meta.identifier) || actor;
    return {
      actor: displayName,
      actionWord: "masuk ke sistem dari",
      target: place,
      icon: User,
      tone: "sky",
    };
  }

  // Sirkulasi: Pinjam
  if (log.action.includes("borrow") || log.action === "loan.create") {
    const studentName = cleanName(meta.student_name) || actor;
    const title = cleanName(meta.book_title) || cleanName(meta.title) || cleanName(meta.inventory_code);
    return {
      actor: studentName,
      actionWord: "meminjam",
      target: title ? `buku "${title}"` : "sebuah buku",
      icon: ArrowLeftRight,
      tone: "sky",
    };
  }

  // Sirkulasi: Kembali
  if (log.action.includes("return") || log.action === "loan.return") {
    const studentName = cleanName(meta.student_name) || actor;
    const title = cleanName(meta.book_title) || cleanName(meta.title) || cleanName(meta.inventory_code);
    return {
      actor: studentName,
      actionWord: "mengembalikan",
      target: title ? `buku "${title}"` : "sebuah buku",
      icon: CheckCircle2,
      tone: "leaf",
    };
  }

  // Rombel / Kelas
  if (log.action.startsWith("class.")) {
    const isDelete = log.action.endsWith("delete");
    const rawClass = cleanName(meta.name) || cleanName(meta.clean) || cleanName(meta.class_name);
    let target = "sebuah rombel";
    if (rawClass) {
      target = rawClass.toLowerCase().startsWith("kelas ")
        ? rawClass
        : `Kelas ${rawClass}`;
    }
    return {
      actor,
      actionWord: isDelete ? "menghapus" : "menambahkan",
      target,
      icon: History,
      tone: isDelete ? "sun" : "leaf",
    };
  }

  // Buku
  if (log.action.startsWith("book.")) {
    const isDelete = log.action.endsWith("delete");
    const isCreate = log.action.endsWith("create");
    const title = cleanName(meta.title) || cleanName(meta.book_title);
    return {
      actor,
      actionWord: isDelete ? "menghapus" : isCreate ? "menambahkan" : "memperbarui",
      target: title ? `buku "${title}"` : "sebuah buku",
      icon: BookOpen,
      tone: isDelete ? "sun" : "sky",
    };
  }

  // Siswa
  if (log.action.startsWith("student.")) {
    const isDelete = log.action.endsWith("delete");
    const isCreate = log.action.endsWith("create");
    const studentName = cleanName(meta.name) || cleanName(meta.student_name);
    const nis = cleanName(meta.nis);
    let target = "seorang siswa";
    if (studentName) {
      target = `siswa ${studentName}`;
    } else if (nis) {
      target = `siswa NIS ${nis}`;
    }
    return {
      actor,
      actionWord: isDelete ? "menghapus" : isCreate ? "mendaftarkan" : "memperbarui",
      target,
      icon: User,
      tone: isDelete ? "sun" : "berry",
    };
  }

  // Kategori
  if (log.action.startsWith("category.")) {
    const isDelete = log.action.endsWith("delete");
    const catName = cleanName(meta.name) || cleanName(meta.clean);
    return {
      actor,
      actionWord: isDelete ? "menghapus" : "menambahkan",
      target: catName ? `kategori "${catName}"` : "sebuah kategori",
      icon: BookOpen,
      tone: isDelete ? "sun" : "leaf",
    };
  }

  // Eksemplar
  if (log.action.startsWith("copy.")) {
    const isDelete = log.action.endsWith("delete");
    const isCreate = log.action.includes("create");
    const copyCount = typeof meta.count === "number" ? meta.count : null;
    const copyCode = cleanName(meta.inventory_code) || cleanName(meta.barcode);
    let target = "eksemplar buku";
    if (copyCount) {
      target = `${copyCount} eksemplar buku`;
    } else if (copyCode) {
      target = `eksemplar ${copyCode}`;
    }
    return {
      actor,
      actionWord: isDelete ? "menghapus" : isCreate ? "mendaftarkan" : "memperbarui",
      target,
      icon: BookOpen,
      tone: isDelete ? "sun" : "sky",
    };
  }

  // Pengguna
  if (log.action.startsWith("user.")) {
    const isDelete = log.action.endsWith("delete");
    const username = cleanName(meta.username) || cleanName(meta.name) || cleanName(meta.email);
    return {
      actor,
      actionWord: isDelete ? "menghapus" : "memperbarui",
      target: username ? `akun @${username}` : "akun pengguna",
      icon: User,
      tone: isDelete ? "sun" : "berry",
    };
  }

  // Impor
  if (log.action.startsWith("import.")) {
    return {
      actor,
      actionWord: "menyelesaikan proses impor",
      target: log.entity_type === "book" ? "data buku" : "data siswa",
      icon: History,
      tone: "sun",
    };
  }

  // Fallback umum aman
  const isDelete = log.action.includes("delete") || log.action.includes("remove");
  const isCreate = log.action.includes("create") || log.action.includes("add");
  const isUpdate = log.action.includes("update") || log.action.includes("edit") || log.action.includes("status");

  let entityLabel = "data";
  if (log.entity_type === "class") entityLabel = "sebuah rombel";
  else if (log.entity_type === "book") entityLabel = "sebuah buku";
  else if (log.entity_type === "copy") entityLabel = "sebuah eksemplar";
  else if (log.entity_type === "student") entityLabel = "data siswa";
  else if (log.entity_type === "category") entityLabel = "sebuah kategori";
  else if (log.entity_type === "user") entityLabel = "akun pengguna";

  return {
    actor,
    actionWord: isDelete ? "menghapus" : isCreate ? "menambahkan" : isUpdate ? "memperbarui" : "memproses",
    target: entityLabel,
    icon: History,
    tone: isDelete ? "sun" : isCreate ? "leaf" : "sky",
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
    <section aria-labelledby="activity-feed-heading" className="rounded-panel border border-rule bg-white p-5 sm:p-6 font-plex-sans">
      <div className="flex items-center justify-between border-b border-rule pb-3">
        <div>
          <h2 id="activity-feed-heading" className="font-serif text-base font-semibold text-ink">
            Aktivitas Terbaru
          </h2>
        </div>
        <Link
          href={allLogsHref}
          className="text-xs font-medium text-primary hover:underline transition-colors"
        >
          Semua log audit →
        </Link>
      </div>

      {activities.length === 0 ? (
        <p className="py-6 text-sm text-ink-muted">Belum ada aktivitas sirkulasi tercatat.</p>
      ) : (
        <div className="mt-4 relative pl-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-rule">
          <ul className="space-y-4">
            {activities.map((a) => {
              const { actor, actionWord, target, tone } = parseHumanActivity(a);
              const relativeTime = formatRelativeTime(a.created_at);
              const fullTime = formatTanggalWaktu(a.created_at);

              return (
                <li key={a.id} className="relative group">
                  {/* Timeline point */}
                  <span
                    className="absolute -left-4 top-1 size-2 rounded-chip ring-2 ring-rule bg-primary"
                    style={{
                      backgroundColor:
                        tone === "sky"
                          ? "var(--color-primary)"
                          : tone === "leaf"
                          ? "var(--color-success)"
                          : tone === "sun"
                          ? "var(--color-warning)"
                          : "var(--color-primary)",
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
