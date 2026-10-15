"use client";

import { useTransition, useEffect, useOptimistic } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface FilterItem {
  value: string;
  label: string;
  href: string;
}

/**
 * Navigasi tombol filter status dengan responsivitas seketika (0ms optimistic active state)
 * dan prefetch proaktif di latar belakang untuk perpindahan secepat kilat.
 */
export function StatusFilterNav({
  items,
  activeValue,
  label = "Filter status",
}: {
  items: FilterItem[];
  activeValue: string;
  label?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticValue, setOptimisticValue] = useOptimistic(
    activeValue || "",
    (_current, next: string) => next,
  );

  // Prefetch proaktif semua URL filter saat komponen dimuat
  useEffect(() => {
    for (const item of items) {
      router.prefetch(item.href);
    }
  }, [items, router]);

  const handleSelect = (value: string, href: string) => {
    if (optimisticValue === value) return;
    startTransition(() => {
      setOptimisticValue(value);
      router.push(href);
    });
  };

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-2 pt-0.5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible no-scrollbar"
      role="group"
      aria-label={label}
    >
      {items.map((item) => {
        const isActive = optimisticValue === item.value;
        const isCurrentPending = isPending && optimisticValue === item.value && (activeValue || "") !== item.value;

        return (
          <Link
            key={item.value}
            href={item.href}
            prefetch={true}
            onClick={() => handleSelect(item.value, item.href)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "shrink-0 inline-flex min-h-[36px] items-center gap-1.5 rounded-chip border px-3 py-1.5 text-label font-semibold transition-all duration-150 select-none cursor-pointer",
              isActive
                ? "border-primary bg-primary-soft text-primary shadow-xs font-bold"
                : "border-rule bg-white text-ink-muted hover:border-rule-strong hover:bg-surface-sunken-ed hover:text-ink",
            )}
          >
            {isCurrentPending && (
              <Loader2 className="size-3 animate-spin text-primary shrink-0" aria-hidden />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
