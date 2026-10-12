import React from "react";
import { AnimatedCounter } from "./animated-counter";
import { cn } from "@/lib/utils";
import {
  Layers,
  ArrowLeftRight,
  Clock,
  Users,
  BookOpen,
  CheckCircle2,
  ArrowUpFromLine,
  ArrowDownToLine,
  BookmarkCheck,
  TrendingUp,
} from "lucide-react";

export type KpiIcon =
  | "layers"
  | "circulation"
  | "clock"
  | "users"
  | "book"
  | "check"
  | "borrow"
  | "return"
  | "bookmark"
  | "trending";

const ICON_MAP: Record<KpiIcon, React.ComponentType<{ className?: string }>> = {
  layers: Layers,
  circulation: ArrowLeftRight,
  clock: Clock,
  users: Users,
  book: BookOpen,
  check: CheckCircle2,
  borrow: ArrowUpFromLine,
  return: ArrowDownToLine,
  bookmark: BookmarkCheck,
  trending: TrendingUp,
};

export interface KpiItemProps {
  label: string;
  value: number;
  secondary: string;
  icon?: KpiIcon | React.ReactNode;
  badge?: string;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
  href?: string;
}

export function KpiCard({
  label,
  value,
  secondary,
  icon,
  badge,
  tone = "primary",
}: KpiItemProps) {
  const toneMap = {
    primary: {
      badge: "bg-info-bg text-info border-info/20",
      icon: "text-primary bg-primary-soft",
    },
    info: {
      badge: "bg-info-bg text-info border-info/20",
      icon: "text-primary bg-primary-soft",
    },
    success: {
      badge: "bg-success-bg text-success border-success/20",
      icon: "text-success bg-success-bg",
    },
    warning: {
      badge: "bg-warning-bg text-warning border-warning/25",
      icon: "text-warning bg-warning-bg",
    },
    danger: {
      badge: "bg-danger-bg text-danger border-danger/25",
      icon: "text-danger bg-danger-bg",
    },
    neutral: {
      badge: "bg-surface-sunken-ed text-ink-muted border-rule",
      icon: "text-ink-muted bg-surface-sunken-ed",
    },
  };

  const currentTone = toneMap[tone] ?? toneMap.primary;

  // Render icon safely
  const renderIcon = () => {
    if (!icon) return null;

    if (typeof icon === "string" && icon in ICON_MAP) {
      const IconComponent = ICON_MAP[icon as KpiIcon];
      return <IconComponent className="size-4 sm:size-[18px]" />;
    }

    if (React.isValidElement(icon)) {
      return icon;
    }

    if (typeof icon === "function" || (typeof icon === "object" && icon !== null && "$$typeof" in icon)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const IconComp = icon as any;
      return <IconComp className="size-4 sm:size-[18px]" />;
    }

    return null;
  };

  return (
    <div className="relative flex flex-col justify-between rounded-panel border border-rule bg-white p-4 font-plex-sans transition-colors hover:border-rule-strong">
      {/* Top row: LABEL & ICON */}
      <div className="flex items-start justify-between gap-1.5">
        <span className="text-[11px] font-medium tracking-[0.04em] text-ink-muted uppercase">
          {label}
        </span>
        {icon && (
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-btn border border-rule",
              currentTone.icon,
            )}
          >
            {renderIcon()}
          </span>
        )}
      </div>

      {/* Middle row: VALUE & BADGE */}
      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-plex-sans text-[26px] font-semibold tracking-tight text-ink tabular-nums leading-none sm:text-[28px]">
          <AnimatedCounter value={value} />
        </span>
        {badge && (
          <span
            className={cn(
              "inline-flex items-center rounded-chip border px-1.5 py-0.5 text-[11px] font-semibold",
              currentTone.badge,
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Bottom row: SECONDARY META */}
      <p className="mt-2 text-xs text-ink-muted leading-relaxed truncate">
        {secondary}
      </p>
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {children}
    </div>
  );
}
