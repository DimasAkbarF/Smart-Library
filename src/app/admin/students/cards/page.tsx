import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listStudents, listClasses } from "@/features/admin/students";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { PrintButton } from "@/app/admin/qr/print-button";
import { StudentCard } from "@/components/library/student-card";
import { cn } from "@/lib/utils";

export default async function StudentCardsPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; classId?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const classId = sp.classId ?? "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const pageSize = 30; // 30 kartu per halaman, pas untuk cetak kertas A4 kolektif

  const [data, classes] = await Promise.all([
    listStudents({ q, classId: classId || undefined, page, pageSize }),
    listClasses(),
  ]);

  const classHref = (id: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (id) p.set("classId", id);
    const s = p.toString();
    return `/admin/students/cards${s ? `?${s}` : ""}`;
  };

  const pageHref = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (classId) p.set("classId", classId);
    p.set("page", String(n));
    return `/admin/students/cards?${p.toString()}`;
  };

  const selectedClass = classes.find((c) => c.id === classId);

  return (
    <div className="space-y-6 animate-rise">
      {/* Top Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href={classId ? `/admin/students?classId=${classId}` : "/admin/students"}
              className="inline-flex items-center gap-1.5 text-meta font-semibold text-ink-muted hover:text-ink transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Kembali ke Data Siswa</span>
            </Link>
          </div>
          <span className="text-label font-semibold text-primary font-mono tracking-wider uppercase">
            Direktori Anggota · Cetak Kartu Massal
          </span>
          <h1 className="mt-1 font-display text-display-sm sm:text-display-lg font-bold tracking-tight text-ink">
            Cetak Kartu Siswa {selectedClass ? `— Kelas ${selectedClass.name}` : "Kolektif"}
          </h1>
          <p className="mt-1 text-body text-ink-muted">
            {data.total.toLocaleString("id-ID")} kartu siswa terdaftar · Halaman {page} dari {data.pageCount} ({data.rows.length} kartu siap cetak)
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <PrintButton className="w-full sm:w-auto min-h-tap-min font-semibold justify-center bg-primary text-white hover:bg-primary-hover" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="no-print space-y-3">
        {classes.length > 0 && (
          <div
            className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible no-scrollbar"
            role="group"
            aria-label="Filter kelas cetak"
          >
            <Link
              href={classHref("")}
              aria-current={!classId ? "true" : undefined}
              className={cn(
                "shrink-0 inline-flex min-h-[36px] items-center rounded-chip border px-3 py-1.5 text-label font-semibold transition-colors",
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
                    "shrink-0 inline-flex min-h-[36px] items-center rounded-chip border px-3 py-1.5 text-label font-semibold transition-colors",
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
        <Suspense fallback={null}>
          <SearchInput placeholder="Cari nama atau NIS siswa yang ingin dicetak…" />
        </Suspense>
      </div>

      {/* Cards Grid */}
      {data.rows.length === 0 ? (
        <EmptyState
          title="Tidak ada kartu siswa"
          body="Tidak ada siswa yang cocok dengan filter kelas atau kata kunci pencarian terpilih."
          action={
            <Link href="/admin/students/cards">
              <span className="inline-flex min-h-tap-min items-center justify-center rounded-btn border border-rule px-4 text-label font-semibold hover:bg-surface">
                Reset Filter
              </span>
            </Link>
          }
        />
      ) : (
        <>
          <div className="print-student-cards grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.rows.map((s) => (
              <div key={s.id} className="print-student-card flex justify-center">
                <StudentCard student={s} className="w-full" />
              </div>
            ))}
          </div>

          {/* Pagination Navigation */}
          {data.pageCount > 1 && (
            <nav className="no-print flex items-center justify-center gap-2 pt-4" aria-label="Paginasi">
              {page > 1 && (
                <Link
                  href={pageHref(page - 1)}
                  className="rounded-md border border-outline bg-background px-3 py-1.5 text-label font-semibold text-ink hover:bg-surface"
                >
                  ← Sebelumnya
                </Link>
              )}
              <span className="rounded-md bg-surface px-3 py-1.5 font-mono text-label font-semibold text-ink border border-outline">
                {page} / {data.pageCount}
              </span>
              {page < data.pageCount && (
                <Link
                  href={pageHref(page + 1)}
                  className="rounded-md border border-outline bg-background px-3 py-1.5 text-label font-semibold text-ink hover:bg-surface"
                >
                  Berikutnya →
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
