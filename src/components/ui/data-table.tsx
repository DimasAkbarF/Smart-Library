import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  page,
  pageCount,
  baseUrl,
  totalLabel,
}: {
  columns: Column<T>[];
  rows: T[];
  page: number;
  pageCount: number;
  baseUrl: string;
  totalLabel: string;
}) {
  const href = (p: number) => {
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}page=${p}`;
  };

  return (
    <div className="space-y-3">
      {/* Table Container with Sticky Header */}
      <div className="overflow-x-auto overscroll-x-contain rounded-card border border-outline bg-background shadow-xs">
        <table className="w-full min-w-[640px] snap-x snap-mandatory text-left text-body">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-outline bg-surface-sunken">
              {columns.map((c) => (
                <th
                  key={c.header}
                  className={cn(
                    "px-3 py-3 text-meta font-bold text-ink-subtle uppercase tracking-wider font-mono sm:px-4",
                    c.className
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/70">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-body text-ink-subtle"
                >
                  Tidak ada data untuk ditampilkan.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="snap-start hover:bg-surface/80 transition-colors duration-100"
                >
                  {columns.map((c) => (
                    <td key={c.header} className={cn("px-3 py-3 align-middle sm:px-4 sm:py-3.5", c.className)}>
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-meta text-ink-subtle sm:hidden">
        Geser ke samping untuk melihat kolom lainnya.
      </p>

      {/* Pagination & Counter Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-meta text-ink-subtle font-medium">{totalLabel}</p>
        <nav className="flex items-center gap-1.5" aria-label="Paginasi">
          <PageLink href={href(page - 1)} disabled={page <= 1} icon={ChevronLeft} label="Sebelumnya" />
          <span className="px-3 py-1 rounded-md bg-surface border border-outline font-mono text-label font-semibold text-ink" aria-current="page">
            {page} / {pageCount}
          </span>
          <PageLink href={href(page + 1)} disabled={page >= pageCount} icon={ChevronRight} label="Berikutnya" />
        </nav>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  icon: Icon,
}: {
  href: string;
  disabled: boolean;
  label: string;
  icon: typeof ChevronLeft;
}) {
  if (disabled) {
    return (
      <span aria-disabled className="flex items-center gap-1 rounded-md px-3 py-1.5 text-label text-ink-faint border border-outline/40 cursor-not-allowed">
        <Icon className="size-3.5" />
        <span className="hidden sm:inline">{label}</span>
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-1 rounded-md border border-outline bg-background px-3 py-1.5 text-label font-semibold text-ink hover:bg-surface hover:text-sky-deep transition-colors"
    >
      <Icon className="size-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
