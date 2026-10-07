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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline/70 pb-5">
        <div>
          <div className="flex items-center gap-2 text-label font-semibold text-sky-deep font-mono tracking-wider uppercase">
            <span className="size-2 rounded-full bg-sky" />
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
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-outline bg-background px-4 text-label font-semibold text-ink hover:bg-surface transition-colors"
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
              "rounded-full border px-4 py-1.5 text-label font-semibold transition-colors",
              !classId
                ? "border-sky bg-sky-soft text-sky-deep shadow-xs font-bold"
                : "border-outline text-ink-muted hover:border-outline-strong hover:bg-surface",
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
                  "rounded-full border px-4 py-1.5 text-label font-semibold transition-colors",
                  isActive
                    ? "border-sky bg-sky-soft text-sky-deep shadow-xs font-bold"
                    : "border-outline text-ink-muted hover:border-outline-strong hover:bg-surface",
                )}
              >
                Kelas {c.name}
              </Link>
            );
          })}
        </div>
      )}

      <Suspense>
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
