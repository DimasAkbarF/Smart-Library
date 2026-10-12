import { AlertTriangle, ArrowUpRight, Check, MinusCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "muted";

const tones: Record<StatusTone, string> = {
  success: "bg-success-bg text-success border-success/20",
  info: "bg-info-bg text-info border-info/20",
  warning: "bg-warning-bg text-warning border-warning/25",
  danger: "bg-danger-bg text-danger border-danger/25",
  muted: "bg-surface-sunken-ed text-ink-muted border-rule",
};

/** Status chip: tinggi 22px, radius 2px, font 12px/600 (design.md §5, PRD §8.9, FR-11) */
export function StatusChip({
  tone,
  icon,
  label,
  className,
}: {
  tone: StatusTone;
  icon?: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-chip border px-2 text-[12px] font-semibold leading-[20px] font-plex-sans [&_svg]:size-3 [&_svg]:shrink-0",
        tones[tone] ?? tones.muted,
        className,
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}

export function CopyStatusChip({ status }: { status: string }) {
  switch (status) {
    case "AVAILABLE":
      return <StatusChip tone="success" icon={<Check />} label="Tersedia" />;
    case "BORROWED":
      return <StatusChip tone="info" icon={<ArrowUpRight />} label="Dipinjam" />;
    case "LOST":
      return <StatusChip tone="danger" icon={<XCircle />} label="Hilang" />;
    case "DAMAGED":
      return <StatusChip tone="danger" icon={<AlertTriangle />} label="Rusak" />;
    default:
      return <StatusChip tone="muted" icon={<MinusCircle />} label="Nonaktif" />;
  }
}

export function LoanStatusChip({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <StatusChip tone="info" icon={<ArrowUpRight />} label="Aktif" />;
    case "OVERDUE":
      // FR-11: Wajib memakai ikon untuk status Terlambat
      return <StatusChip tone="danger" icon={<AlertTriangle />} label="Terlambat" />;
    case "RETURNED":
      return <StatusChip tone="success" icon={<Check />} label="Kembali" />;
    default:
      return <StatusChip tone="muted" icon={<MinusCircle />} label="Batal" />;
  }
}
