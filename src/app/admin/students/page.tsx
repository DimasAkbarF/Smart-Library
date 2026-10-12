import { Suspense } from "react";
import Link from "next/link";
import { listStudents, listClasses } from "@/features/admin/students";
import { StudentsSection } from "./student-client";
import { cn } from "@/lib/utils";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; classId?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const classId = sp.classId ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const [data, classes] = await Promise.all([
    listStudents({ q, classId: classId || undefined, page }),
    listClasses(),
  ]);

  const classHref = (id: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (id) p.set("classId", id);
    const s = p.toString();
    return `/admin/students${s ? `?${s}` : ""}`;
  };
  const bp = new URLSearchParams();
  if (q) bp.set("q", q);
  if (classId) bp.set("classId", classId);
  const base = `/admin/students${bp.toString() ? `?${bp.toString()}` : ""}`;

  return (
    <div className="space-y-6 animate-rise">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <div className="flex items-center gap-2 text-label font-semibold text-primary font-mono tracking-wider uppercase">
            <span className="size-2 rounded-chip bg-primary" />
            <span>Direktori Anggota · SMP Negeri 17 Tangerang Selatan</span>
          </div>
          <h1 className="mt-1 font-display text-display-sm sm:text-display-lg font-bold tracking-tight text-ink">
            Data Siswa
          </h1>
          <p className="mt-1 text-body text-ink-muted">
            Kelola basis data {data.total.toLocaleString("id-ID")} siswa terdaftar, penetapan rombel kelas, dan kode identitas perpustakaan.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/import"
            className="inline-flex min-h-tap-min items-center justify-center rounded-btn border border-rule-strong bg-card px-4 text-label font-semibold text-ink hover:bg-surface-sunken-ed transition-colors"
          >
            Impor CSV / Excel
          </Link>
        </div>
      </header>

      {classes.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter kelas">
          <Link
            href={classHref("")}
            aria-current={!classId ? "true" : undefined}
            className={cn(
              "rounded-chip border px-3 py-1.5 text-label font-semibold transition-colors",
              !classId
                ? "border-primary bg-primary-soft text-primary shadow-xs font-bold"
                : "border-rule text-ink-muted hover:border-rule-strong hover:bg-card",
            )}
          >
            Semua Kelas
          </Link>
          {classes.map((c) => {
            const isActive = classId === c.id;
            return (
              <Link
                key={c.id}
                href={classHref(c.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "rounded-chip border px-3 py-1.5 text-label font-semibold transition-colors",
                  isActive
                    ? "border-primary bg-primary-soft text-primary shadow-xs font-bold"
                    : "border-rule text-ink-muted hover:border-rule-strong hover:bg-card",
                )}
              >
                Kelas {c.name}
              </Link>
            );
          })}
        </div>
      )}

      <Suspense fallback={<div className="h-64 animate-pulse rounded-card border border-rule bg-card" />}>
        <StudentsSection
          students={data.rows}
          classes={classes}
          page={page}
          pageCount={data.pageCount}
          baseUrl={base}
          total={data.total}
          hasFilter={Boolean(q || classId)}
        />
      </Suspense>
    </div>
  );
}

export const dynamic = "force-dynamic";
