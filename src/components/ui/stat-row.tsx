import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Stat {
  label: string;
  value: React.ReactNode;
  /** Titik warna kecil — dekoratif, tidak pernah jadi satu-satunya sinyal. */
  dot?: string;
}

export interface MetricCell {
  label: string;
  value: React.ReactNode;
  description: string;
  href: string;
  isDanger?: boolean;
}

/**
 * Panel metrik dasbor admin (PRD §8.2, design.md §5).
 * Satu panel terintegrasi dengan pembatas 1px (bg-rule gap-px),
 * 4 sel dapat diklik menuju daftar terfilter, angka tabular 28px,
 * tanpa ikon berwarna.
 */
export function StatPanel({ metrics }: { metrics: MetricCell[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-rule bg-rule lg:grid-cols-4 font-plex-sans">
      {metrics.map((m) => (
        <Link
          key={m.label}
          href={m.href}
          prefetch={true}
          className="group flex flex-col justify-between bg-white p-4 sm:p-5 transition-colors duration-150 hover:bg-surface-sunken-ed focus-visible:outline-2 focus-visible:outline-primary focus-visible:z-10"
        >
          <div>
            <span className="block text-xs font-semibold uppercase tracking-[0.06em] text-ink-muted group-hover:text-primary transition-colors">
              {m.label}
            </span>
            <span
              className={cn(
                "mt-2 block font-plex-sans text-2xl sm:text-[28px] font-semibold leading-none tabular-nums text-ink",
                m.isDanger && "text-danger"
              )}
            >
              {m.value}
            </span>
          </div>
          <span className="mt-2 block text-xs text-ink-muted line-clamp-1">
            {m.description}
          </span>
        </Link>
      ))}
    </div>
  );
}

/**
 * Baris angka untuk dasbor (PRD §8.2, design.md §5).
 * Satu panel penuh dengan pembatas vertikal 1px (bg-rule gap-px),
 * angka tabular 28px IBM Plex Sans, label uppercase 12px.
 */
export function StatRow({ stats, cols }: { stats: Stat[]; cols: string }) {
  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-panel border border-rule bg-rule font-plex-sans", cols)}>
      {stats.map((s) => (
        <div key={s.label} className="bg-white px-5 py-4">
          <dd className="font-plex-sans text-[26px] sm:text-[28px] leading-none font-semibold tabular-nums text-ink">{s.value}</dd>
          <dt className="mt-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.04em] text-ink-muted">
            {s.dot && <span aria-hidden className={cn("size-2 rounded-chip shrink-0", s.dot)} />}
            <span>{s.label}</span>
          </dt>
        </div>
      ))}
    </dl>
  );
}