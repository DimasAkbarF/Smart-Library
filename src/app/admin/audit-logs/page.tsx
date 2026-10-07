import { Suspense } from "react";
import { ShieldCheck, User } from "lucide-react";
import { listAudit } from "@/features/admin/reports";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTanggalWaktu } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";

function getActionDetails(action: string): {
  label: string;
  tone: "leaf" | "sky" | "sun" | "coral" | "berry" | "muted";
} {
  const lower = action.toLowerCase();
  if (lower === "loan.create") return { label: "Peminjaman Buku", tone: "sky" };
  if (lower === "loan.return") return { label: "Pengembalian Buku", tone: "sky" };
  if (lower === "book.create") return { label: "Tambah Judul Buku", tone: "leaf" };
  if (lower === "book.update") return { label: "Ubah Data Buku", tone: "sun" };
  if (lower === "book.delete") return { label: "Hapus Buku", tone: "coral" };
  if (lower === "copy.create") return { label: "Tambah Eksemplar", tone: "leaf" };
  if (lower === "student.create") return { label: "Pendaftaran Siswa", tone: "leaf" };
  if (lower === "student.update") return { label: "Pembaruan Siswa", tone: "sun" };
  if (lower === "user.create") return { label: "Buat Pengguna", tone: "berry" };
  if (lower.includes("login") || lower.includes("auth")) return { label: "Autentikasi", tone: "berry" };
  if (lower.includes("create") || lower.includes("add")) return { label: "Pembuatan Data", tone: "leaf" };
  if (lower.includes("delete") || lower.includes("remove") || lower.includes("inactive"))
    return { label: "Penghapusan / Nonaktif", tone: "coral" };
  if (lower.includes("update") || lower.includes("edit") || lower.includes("status"))
    return { label: "Pembaruan", tone: "sun" };
  return { label: action, tone: "muted" };
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const { rows, pageCount } = await listAudit({ q, page });
  const base = `/admin/audit-logs${q ? `?q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="space-y-6 animate-rise">
      {/* Header */}
      <header className="border-b border-outline/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-deep font-mono tracking-wider uppercase">
          <ShieldCheck className="size-4" />
          <span>Keamanan & Transparansi · SMP Negeri 17 Tangerang Selatan</span>
        </div>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          Log Audit Sistem
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Rekaman jejak seluruh aktivitas perubahan data katalog, peminjaman sirkulasi, dan akun pengguna.
        </p>
      </header>

      <Suspense>
        <SearchInput placeholder="Cari aksi (cth. loan.create), entitas, atau ID entitas…" />
      </Suspense>

      {rows.length === 0 ? (
        <EmptyState
          title="Tidak ada catatan log audit"
          body={q ? `Tidak ada log yang cocok dengan pencarian "${q}".` : "Belum ada aktivitas tercatat pada sistem."}
        />
      ) : (
        <DataTable<AuditLog>
          columns={[
            {
              header: "Waktu Aktivitas",
              cell: (a) => (
                <div className="whitespace-nowrap">
                  <span className="block text-xs font-semibold text-ink">
                    {formatTanggalWaktu(a.created_at)}
                  </span>
                </div>
              ),
            },
            {
              header: "Pelaku / Pengguna",
              cell: (a) => (
                <div className="flex items-center gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken border border-outline text-ink-muted">
                    <User className="size-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-ink">
                      {a.actor_name ?? "Sistem Otomatis"}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              header: "Aksi Terlaksana",
              cell: (a) => {
                const { label, tone } = getActionDetails(a.action);
                const toneClasses = {
                  leaf: "bg-leaf-soft text-leaf-deep border-leaf/30",
                  sky: "bg-sky-soft text-sky-deep border-sky/30",
                  sun: "bg-sun-soft text-sun-deep border-sun/30",
                  coral: "bg-coral-soft text-coral-deep border-coral/30",
                  berry: "bg-berry-soft text-berry border-berry/30",
                  muted: "bg-surface-sunken text-ink-muted border-outline",
                }[tone];

                return (
                  <div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-2xs",
                        toneClasses
                      )}
                    >
                      {label}
                    </span>
                    <span className="block font-mono text-[11px] text-ink-subtle mt-0.5">
                      {a.action}
                    </span>
                  </div>
                );
              },
            },
            {
              header: "Entitas",
              cell: (a) => (
                <span className="inline-block rounded-md bg-surface-sunken px-2 py-0.5 text-xs font-medium uppercase font-mono text-ink">
                  {a.entity_type}
                </span>
              ),
            },
            {
              header: "ID Referensi",
              cell: (a) => (
                <span className="font-mono text-xs text-ink-muted" title={a.entity_id}>
                  {a.entity_id ? `${a.entity_id.slice(0, 12)}…` : "—"}
                </span>
              ),
            },
          ]}
          rows={rows}
          page={page}
          pageCount={pageCount}
          baseUrl={base}
          totalLabel={`Halaman ${page} dari ${pageCount}`}
        />
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
