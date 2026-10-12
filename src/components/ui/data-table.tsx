import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DataTableInteractiveRow,
  DataTableInteractiveCard,
} from "@/components/ui/data-table-drawer";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  rows: T[];
  page: number;
  pageCount: number;
  baseUrl: string;
  totalLabel: string;
  renderDrawer?: (row: T) => React.ReactNode;
  drawerTitle?: (row: T) => string;
  onRowClick?: (row: T) => void;
}

/**
 * Komponen DataTable terintegrasi (Server/Shared Component).
 * Mendukung header sticky, daftar bertumpuk di mobile (< 640px),
 * dan drawer interaktif saat renderDrawer disediakan.
 * Dapat dipanggil langsung dari Server Components tanpa melanggar serialisasi RSC fungsi.
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  page,
  pageCount,
  baseUrl,
  totalLabel,
  renderDrawer,
  drawerTitle,
}: DataTableProps<T>) {
  const href = (p: number) => {
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}page=${p}`;
  };

  return (
    <div className="space-y-3">
      {/* Mobile Stacked List (< 640px) per FR-07 & PRD §7.3 */}
      <div className="space-y-3 sm:hidden">
        {rows.length === 0 ? (
          <div className="rounded-panel border border-rule bg-white p-6 text-center text-sm text-ink-muted">
            Tidak ada data untuk ditampilkan.
          </div>
        ) : (
          rows.map((row) => {
            const cardContent = (
              <>
                {/* Kolom pertama sebagai judul/identitas utama */}
                {columns[0] && (
                  <div className="border-b border-rule pb-2.5">
                    <span className="mb-1 block text-xs font-medium uppercase tracking-[0.04em] text-ink-subtle">
                      {columns[0].header}
                    </span>
                    <div>{columns[0].cell(row)}</div>
                  </div>
                )}
                {/* Kolom selanjutnya sebagai metadata bertumpuk */}
                {columns.length > 1 && (
                  <div className="space-y-2 pt-2.5">
                    {columns.slice(1).map((c) => (
                      <div
                        key={c.header}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <span className="shrink-0 pt-0.5 text-xs font-medium uppercase tracking-[0.04em] text-ink-subtle">
                          {c.header}
                        </span>
                        <div className="text-right">{c.cell(row)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );

            if (renderDrawer) {
              const drawerContent = renderDrawer(row);
              const title = drawerTitle ? drawerTitle(row) : "Detail Data";
              return (
                <DataTableInteractiveCard
                  key={row.id}
                  drawerContent={drawerContent}
                  drawerTitle={title}
                  className="rounded-panel border border-rule bg-white p-3.5 transition-colors"
                >
                  {cardContent}
                </DataTableInteractiveCard>
              );
            }

            return (
              <div
                key={row.id}
                className="rounded-panel border border-rule bg-white p-3.5 transition-colors"
              >
                {cardContent}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table Container (>= 640px) with Sticky Header */}
      <div className="hidden overflow-hidden rounded-panel border border-rule bg-white sm:block">
        <div className="max-h-[calc(100vh-280px)] overflow-x-auto">
          <table className="w-full text-left font-plex-sans text-sm">
            <thead className="sticky top-0 z-10 border-b border-rule bg-surface-sunken-ed">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.header}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-[0.04em] text-ink-muted",
                      c.className
                    )}
                  >
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-sm text-ink-muted"
                  >
                    Tidak ada data untuk ditampilkan.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const cells = columns.map((c) => (
                    <td
                      key={c.header}
                      className={cn(
                        "px-4 py-2.5 align-middle text-sm text-ink",
                        c.className
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ));

                  if (renderDrawer) {
                    const drawerContent = renderDrawer(row);
                    const title = drawerTitle ? drawerTitle(row) : "Detail Data";
                    return (
                      <DataTableInteractiveRow
                        key={row.id}
                        drawerContent={drawerContent}
                        drawerTitle={title}
                        className="h-11 transition-colors"
                      >
                        {cells}
                      </DataTableInteractiveRow>
                    );
                  }

                  return (
                    <tr
                      key={row.id}
                      className="h-11 transition-colors hover:bg-surface-sunken-ed"
                    >
                      {cells}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination & Counter Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-xs font-plex-sans text-ink-muted">{totalLabel}</p>
        <nav className="flex items-center gap-1.5" aria-label="Paginasi">
          <PageLink
            href={href(page - 1)}
            disabled={page <= 1}
            icon={ChevronLeft}
            label="Sebelumnya"
          />
          <span
            className="rounded-btn border border-rule bg-surface-sunken-ed px-3 py-1 font-plex-mono text-xs font-medium text-ink"
            aria-current="page"
          >
            {page} / {pageCount}
          </span>
          <PageLink
            href={href(page + 1)}
            disabled={page >= pageCount}
            icon={ChevronRight}
            label="Berikutnya"
          />
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
      <span
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-1 rounded-btn border border-rule/60 bg-surface-sunken-ed/40 px-2.5 py-1 text-xs text-ink-subtle"
      >
        <Icon className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">{label}</span>
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-1 rounded-btn border border-rule bg-white px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:border-rule-strong hover:bg-surface-sunken-ed"
    >
      <Icon className="size-3.5" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
