import { AlertTriangle, ArrowUpRight, Check, MinusCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "leaf" | "sky" | "sun" | "coral" | "berry" | "muted";

const tones: Record<Tone, string> = {
  leaf: "bg-leaf-soft text-leaf-deep",
  sky: "bg-sky-soft text-sky-deep",
  sun: "bg-sun-soft text-sun-deep",
  coral: "bg-coral-soft text-coral-deep",
  berry: "bg-berry-soft text-berry",
  muted: "bg-surface-sunken text-ink-muted",
};

/** Status chip: selalu ikon + label + warna (PRD §14.3, §16). */
export function StatusChip({ tone, icon, label, className }: { tone: Tone; icon?: React.ReactNode; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-body font-semibold [&_svg]:size-4",
        tones[tone],
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}

export function CopyStatusChip({ status }: { status: string }) {
  switch (status) {
    case "AVAILABLE":
      return <StatusChip tone="leaf" icon={<Check />} label="Tersedia" />;
    case "BORROWED":
      return <StatusChip tone="sky" icon={<ArrowUpRight />} label="Dipinjam" />;
    case "LOST":
      return <StatusChip tone="coral" icon={<XCircle />} label="Hilang" />;
    case "DAMAGED":
      return <StatusChip tone="sun" icon={<AlertTriangle />} label="Rusak" />;
    default:
      return <StatusChip tone="muted" icon={<MinusCircle />} label="Nonaktif" />;
  }
}

export function LoanStatusChip({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <StatusChip tone="sky" icon={<ArrowUpRight />} label="Aktif" />;
    case "OVERDUE":
      return <StatusChip tone="coral" icon={<AlertTriangle />} label="Terlambat" />;
    case "RETURNED":
      return <StatusChip tone="leaf" icon={<Check />} label="Kembali" />;
    default:
      return <StatusChip tone="muted" icon={<MinusCircle />} label="Batal" />;
  }
}
