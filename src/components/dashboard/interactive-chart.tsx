"use client";

import { useState, useMemo } from "react";
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

  const nf = useMemo(() => new Intl.NumberFormat("id-ID"), []);
  const nfDec = useMemo(
    () => new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    []
  );

  // Generate or slice appropriate data based on honest available data
  const data = useMemo(() => {
    if (period === "7d") {
      return initialData.slice(-7);
    }
    return initialData;
  }, [initialData, period]);

  const maxValRaw = useMemo(() => {
    return Math.max(...data.flatMap((d) => [d.pinjam, d.kembali]), 0);
  }, [data]);

  // Skala otomatis: nilai bulat 0–5 tanpa lompat (step = 1 jika max <= 5), atau kelipatan bulat menyesuaikan data
  const { maxVal, ticks } = useMemo(() => {
    if (maxValRaw <= 5) {
      return {
        maxVal: 5,
        ticks: [0, 1, 2, 3, 4, 5],
      };
    }
    const step = Math.ceil(maxValRaw / 5);
    return {
      maxVal: step * 5,
      ticks: [0, 1, 2, 3, 4, 5].map((i) => i * step),
    };
  }, [maxValRaw]);

  const totalPinjam = useMemo(() => data.reduce((acc, curr) => acc + curr.pinjam, 0), [data]);
  const totalKembali = useMemo(() => data.reduce((acc, curr) => acc + curr.kembali, 0), [data]);
  const totalActivity = totalPinjam + totalKembali;

  const avgDaily = useMemo(() => {
    const avg = totalActivity / Math.max(1, data.length);
    return nfDec.format(avg);
  }, [totalActivity, data.length, nfDec]);

  const chartHeight = 200;
  const paddingBottom = 28;
  const paddingTop = 16;
  const usableHeight = chartHeight - paddingBottom - paddingTop;

  return (
    <div className="rounded-panel border border-rule bg-white p-5 sm:p-6 font-plex-sans shadow-xs">
      {/* Header with Title and Range Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-4">
        <div>
          <h2 className="font-serif text-base font-semibold text-ink">Aktivitas Sirkulasi</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Tren sirkulasi buku aktual · Rata-rata <strong className="text-ink font-semibold">{avgDaily}</strong> transaksi/hari
          </p>
        </div>

        {/* Filter Tabs & Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-ink-muted">
              <span className="size-2 rounded-chip bg-primary" />
              Pinjam ({nf.format(totalPinjam)})
            </span>
            <span className="flex items-center gap-1.5 font-medium text-ink-muted">
              <span className="size-2 rounded-chip bg-success" />
              Kembali ({nf.format(totalKembali)})
            </span>
          </div>

          <div className="flex rounded-btn border border-rule bg-surface-sunken-ed p-0.5" role="group" aria-label="Periode grafik">
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
                    ? "bg-white text-primary shadow-xs font-bold border border-rule/50"
                    : "text-ink-muted hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart Area or Concise Empty State */}
      {totalActivity === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center font-plex-sans">
          <p className="text-sm text-ink-muted">
            Belum ada transaksi dalam {period === "14d" ? "14 hari terakhir" : "7 hari terakhir"}.
          </p>
        </div>
      ) : (
        <div className="relative mt-4 pt-2">
        <svg
          viewBox={`0 0 1000 ${chartHeight}`}
          className="w-full h-52 overflow-visible select-none"
        >
          {/* Horizontal Grid lines */}
          {ticks.map((val) => {
            const y = paddingTop + usableHeight * (1 - val / maxVal);
            return (
              <g key={val}>
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

                {/* Bar Pinjam (Primary) */}
                <rect
                  x={xGroup - barWidth - 1}
                  y={yPinjam}
                  width={barWidth}
                  height={Math.max(2, pinjamHeight)}
                  rx="2"
                  className={cn(
                    "transition-all duration-200",
                    isHovered ? "fill-primary-hover" : "fill-primary"
                  )}
                />

                {/* Bar Kembali (Success) */}
                <rect
                  x={xGroup + 2}
                  y={yKembali}
                  width={barWidth}
                  height={Math.max(2, kembaliHeight)}
                  rx="2"
                  className={cn(
                    "transition-all duration-200",
                    isHovered ? "fill-[#145334]" : "fill-success"
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
            className="pointer-events-none absolute -top-3 z-30 transform -translate-x-1/2 rounded-btn border border-rule-strong bg-white px-3 py-2 shadow-dropdown font-plex-sans"
            style={{
              left: `${((hoveredIdx + 0.5) / data.length) * 90 + 5}%`,
            }}
          >
            <p className="font-medium text-ink text-xs border-b border-rule pb-1 font-plex-mono">
              {data[hoveredIdx].date}
            </p>
            <div className="mt-1 space-y-1 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="size-2 rounded-chip bg-primary" />
                  Pinjam:
                </span>
                <span className="font-semibold font-plex-mono text-ink">
                  {data[hoveredIdx].pinjam}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-success">
                  <span className="size-2 rounded-chip bg-success" />
                  Kembali:
                </span>
                <span className="font-semibold font-plex-mono text-ink">
                  {data[hoveredIdx].kembali}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
  );
}
