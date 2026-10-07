import { cn } from "@/lib/utils";

export interface Stat {
  label: string;
  value: React.ReactNode;
  /** Titik warna kecil — dekoratif, tidak pernah jadi satu-satunya sinyal. */
  dot?: string;
}

/**
 * Baris angka untuk dasbor. Satu blok penuh dengan pembatas 1px
 * (gap-px + bg-outline), bukan tumpukan kartu — agar hierarki tetap
 * tenang dan tidak terlihat seperti template dashboard generik.
 */
export function StatRow({ stats, cols }: { stats: Stat[]; cols: string }) {
  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-card border border-outline bg-outline", cols)}>
      {stats.map((s) => (
        <div key={s.label} className="bg-background px-5 py-4">
          <dd className="font-display text-3xl leading-none font-bold tabular-nums">{s.value}</dd>
          <dt className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-muted">
            {s.dot && <span aria-hidden className={cn("size-2 rounded-full", s.dot)} />}
            {s.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}