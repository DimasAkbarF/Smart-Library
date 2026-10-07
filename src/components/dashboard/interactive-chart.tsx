"use client";

import { useState, useMemo } from "react";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DailyPoint {
  date: string;
  pinjam: number;
  kembali: number;
}

export function InteractiveChart({
  initialData,
}: {
  initialData: DailyPoint[];
}) {
  const [period, setPeriod] = useState<"14d" | "7d">("14d");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Generate or slice appropriate data based on honest available data
  const data = useMemo(() => {
    if (period === "7d") {
      return initialData.slice(-7);
    }
    return initialData;
  }, [initialData, period]);

  const maxVal = useMemo(() => {
    const highest = Math.max(...data.flatMap((d) => [d.pinjam, d.kembali]), 5);
    return Math.ceil(highest / 5) * 5; // rounded to nearest 5
  }, [data]);

  const totalPinjam = useMemo(() => data.reduce((acc, curr) => acc + curr.pinjam, 0), [data]);
  const totalKembali = useMemo(() => data.reduce((acc, curr) => acc + curr.kembali, 0), [data]);
  const avgDaily = useMemo(
    () => ((totalPinjam + totalKembali) / Math.max(1, data.length)).toFixed(1),
    [totalPinjam, totalKembali, data.length]
  );

  const chartHeight = 200;
  const paddingBottom = 28;
  const paddingTop = 16;
  const usableHeight = chartHeight - paddingBottom - paddingTop;

  return (
    <div className="rounded-lg border border-outline bg-background p-5 sm:p-6 shadow-xs">
      {/* Header with Title and Range Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-sky-soft text-sky-deep">
              <ArrowLeftRight className="size-4" />
            </span>
            <h2 className="font-display text-body font-bold text-ink">Aktivitas Sirkulasi</h2>
          </div>
          <p className="mt-1 text-meta text-ink-muted">
            Tren sirkulasi buku aktual · Rata-rata <strong className="text-ink font-semibold">{avgDaily}</strong> transaksi/hari
          </p>
        </div>

        {/* Filter Tabs & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-label">
            <span className="flex items-center gap-1.5 font-medium text-ink-muted">
              <span className="size-2.5 rounded-full bg-sky" />
              Pinjam ({totalPinjam})
            </span>
            <span className="flex items-center gap-1.5 font-medium text-ink-muted">
              <span className="size-2.5 rounded-full bg-leaf" />
              Kembali ({totalKembali})
            </span>
          </div>

          <div className="flex rounded-md border border-outline bg-surface p-0.5" role="group" aria-label="Periode grafik">
            {(
              [
                { id: "14d", label: "14 Hari" },
                { id: "7d", label: "7 Hari" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setPeriod(tab.id);
                  setHoveredIdx(null);
                }}
                className={cn(
                  "rounded-xs px-2.5 py-1 text-label font-semibold transition-colors cursor-pointer",
                  period === tab.id
                    ? "bg-background text-sky-deep shadow-xs font-bold"
                    : "text-ink-muted hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative mt-4 pt-2">
        <svg
          viewBox={`0 0 1000 ${chartHeight}`}
          className="w-full h-52 overflow-visible select-none"
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingTop + usableHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={idx}>
                <line
                  x1="40"
                  y1={y}
                  x2="980"
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x="30"
                  y={y + 4}
                  textAnchor="end"
                  className="text-meta fill-ink-subtle font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Data Bars */}
          {data.map((item, idx) => {
            const totalItems = data.length;
            const xGroup = 70 + (idx * (900 - 70)) / (totalItems - 1 || 1);
            const barWidth = Math.max(10, Math.min(24, 300 / totalItems));

            const pinjamHeight = (item.pinjam / (maxVal || 1)) * usableHeight;
            const kembaliHeight = (item.kembali / (maxVal || 1)) * usableHeight;

            const yPinjam = paddingTop + usableHeight - pinjamHeight;
            const yKembali = paddingTop + usableHeight - kembaliHeight;

            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={item.date}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Invisible hover capture rect */}
                <rect
                  x={xGroup - barWidth - 8}
                  y={paddingTop}
                  width={barWidth * 2 + 16}
                  height={usableHeight}
                  fill={isHovered ? "rgba(59, 130, 246, 0.05)" : "transparent"}
                  rx="6"
                />

                {/* Vertical indicator line when hovered */}
                {isHovered && (
                  <line
                    x1={xGroup}
                    y1={paddingTop}
                    x2={xGroup}
                    y2={paddingTop + usableHeight}
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Bar Pinjam (Sky) */}
                <rect
                  x={xGroup - barWidth - 1}
                  y={yPinjam}
                  width={barWidth}
                  height={Math.max(2, pinjamHeight)}
                  rx="3"
                  className={cn(
                    "transition-all duration-200",
                    isHovered ? "fill-sky-deep" : "fill-sky"
                  )}
                />

                {/* Bar Kembali (Leaf) */}
                <rect
                  x={xGroup + 2}
                  y={yKembali}
                  width={barWidth}
                  height={Math.max(2, kembaliHeight)}
                  rx="3"
                  className={cn(
                    "transition-all duration-200",
                    isHovered ? "fill-leaf-deep" : "fill-leaf"
                  )}
                />

                {/* X-axis date label */}
                <text
                  x={xGroup}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  className={cn(
                    "text-meta font-medium transition-colors",
                    isHovered ? "fill-ink font-bold" : "fill-ink-muted"
                  )}
                >
                  {item.date}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Detail on Hover */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="pointer-events-none absolute -top-3 z-30 transform -translate-x-1/2 rounded-lg border border-outline bg-background px-3 py-2 shadow-modal fade-in-key"
            style={{
              left: `${((hoveredIdx + 0.5) / data.length) * 90 + 5}%`,
            }}
          >
            <p className="font-bold text-ink text-label border-b border-outline pb-1 font-mono">
              {data[hoveredIdx].date}
            </p>
            <div className="mt-1 space-y-1 text-label">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-sky-deep">
                  <span className="size-2 rounded-full bg-sky" />
                  Pinjam:
                </span>
                <span className="font-bold font-mono text-ink">
                  {data[hoveredIdx].pinjam}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-leaf-deep">
                  <span className="size-2 rounded-full bg-leaf" />
                  Kembali:
                </span>
                <span className="font-bold font-mono text-ink">
                  {data[hoveredIdx].kembali}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
