import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-sunken/80", className)}
      {...props}
    />
  );
}

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-card border border-outline bg-background p-5 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-card border border-outline bg-background p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-card border border-outline bg-background overflow-hidden">
      <div className="border-b border-outline bg-surface-sunken p-3">
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="divide-y divide-outline p-2 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 px-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="rounded-card border border-outline bg-background p-5 space-y-4">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
