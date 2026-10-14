"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCopyStatus } from "@/features/admin/books";
import { pesanRamah, kodeDariError } from "@/lib/errors";
import type { CopyStatus } from "@/lib/types";

const TARGETS: { value: CopyStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Tersedia" },
  { value: "LOST", label: "Hilang" },
  { value: "DAMAGED", label: "Rusak" },
  { value: "INACTIVE", label: "Nonaktif" },
];

export function CopyStatusButtons({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function ubah(next: CopyStatus) {
    if (next === status) return;
    setBusy(true);
    setMsg(null);
    try {
      await setCopyStatus(id, next);
      router.refresh();
    } catch (e) {
      setMsg(pesanRamah(kodeDariError(e), e instanceof Error ? e.message : undefined));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`copy-status-${id}`} className="sr-only">
        Ubah status eksemplar
      </label>
      <select
        id={`copy-status-${id}`}
        disabled={busy}
        value=""
        onChange={(e) => {
          const val = e.target.value as CopyStatus;
          if (val) {
            const targetObj = TARGETS.find((t) => t.value === val);
            const confirmed = window.confirm(
              `Ubah status eksemplar ini menjadi "${targetObj?.label ?? val}"?`
            );
            if (confirmed) {
              ubah(val);
            }
          }
        }}
        className="h-9 sm:h-8 min-h-[36px] sm:min-h-0 rounded-btn border border-rule bg-white px-2 text-sm sm:text-xs font-medium text-ink hover:border-rule-strong focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
      >
        <option value="" disabled>
          Ubah status…
        </option>
        {TARGETS.filter((t) => t.value !== status).map((t) => (
          <option key={t.value} value={t.value}>
            Set: {t.label}
          </option>
        ))}
      </select>
      {msg && (
        <p role="alert" className="text-xs font-semibold text-danger">
          {msg}
        </p>
      )}
    </div>
  );
}

