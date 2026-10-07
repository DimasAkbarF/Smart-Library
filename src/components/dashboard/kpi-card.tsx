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
  tone?: "sky" | "sun" | "leaf" | "coral" | "berry" | "neutral";
  href?: string;
}

export function KpiCard({
  label,
  value,
  secondary,
  icon,
  badge,
  tone = "sky",
}: KpiItemProps) {
  const toneMap = {
    sky: {
      bar: "bg-sky",
      badge: "bg-sky-soft text-sky-deep border-sky/20",
      icon: "text-sky-deep bg-sky-soft",
    },
    leaf: {
      bar: "bg-leaf",
      badge: "bg-leaf-soft text-leaf-deep border-leaf/20",
      icon: "text-leaf-deep bg-leaf-soft",
    },
    sun: {
      bar: "bg-sun-deep",
      badge: "bg-sun-soft text-sun-deep border-sun/20",
      icon: "text-sun-deep bg-sun-soft",
    },
    coral: {
      bar: "bg-coral-deep",
      badge: "bg-coral-soft text-coral-deep border-coral/20",
      icon: "text-coral-deep bg-coral-soft",
    },
    berry: {
      bar: "bg-berry",
      badge: "bg-berry-soft text-berry border-berry/20",
      icon: "text-berry bg-berry-soft",
    },
    neutral: {
      bar: "bg-ink-muted",
      badge: "bg-surface-sunken text-ink-muted border-outline",
      icon: "text-ink-muted bg-surface-sunken",
    },
  };

  const currentTone = toneMap[tone];

  // Render icon safely
  const renderIcon = () => {
    if (!icon) return null;

    if (typeof icon === "string" && icon in ICON_MAP) {
      const IconComponent = ICON_MAP[icon as KpiIcon];
      return <IconComponent className="size-5" />;
    }

    if (React.isValidElement(icon)) {
      return icon;
    }

    if (typeof icon === "function" || (typeof icon === "object" && icon !== null && "$$typeof" in icon)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const IconComp = icon as any;
      return <IconComp className="size-5" />;
    }

    return null;
  };

  return (
    <div className="relative rounded-card border border-outline bg-background p-5 shadow-xs transition-colors duration-150 hover:border-outline-strong">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold tracking-wider text-ink-subtle uppercase font-mono">
            {label}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink tabular-nums">
              <AnimatedCounter value={value} />
            </span>
            {badge && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  currentTone.badge
                )}
              >
                {badge}
              </span>
            )}
          </div>
        </div>

        {icon && (
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              currentTone.icon
            )}
          >
            {renderIcon()}
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-outline/60 pt-2.5 min-h-[40px] flex items-center">
        <p className="line-clamp-2 text-xs leading-relaxed text-ink-muted">{secondary}</p>
      </div>
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
