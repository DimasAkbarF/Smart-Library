"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCopyStatus } from "@/features/admin/books";
import { pesanRamah, kodeDariError } from "@/lib/errors";
import { notifyCirculationChange } from "@/components/circulation/circulation-watcher";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { CopyStatus } from "@/lib/types";

const TARGETS: { value: CopyStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Tersedia" },
  { value: "LOST", label: "Hilang" },
  { value: "DAMAGED", label: "Rusak" },
  { value: "INACTIVE", label: "Nonaktif" },
];

export function CopyStatusButtons({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function ubah(next: CopyStatus) {
    if (next === status) return;
    setBusy(true);
    setMsg(null);
    try {
      await setCopyStatus(id, next);
      notifyCirculationChange({ type: "STATUS_CHANGE", copyId: id });
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
        onChange={async (e) => {
          const val = e.target.value as CopyStatus;
          if (val) {
            const targetObj = TARGETS.find((t) => t.value === val);
            const label = targetObj?.label ?? val;
            const confirmed = await confirm({
              title: "Konfirmasi Perubahan Status",
              message: `Apakah Anda yakin ingin mengubah status eksemplar ini menjadi "${label}"? Status ketersediaan katalog akan langsung diperbarui.`,
              confirmText: `Ya, Ubah ke ${label}`,
              cancelText: "Batal",
              tone: val === "DAMAGED" || val === "LOST" ? "danger" : val === "AVAILABLE" ? "success" : "warning",
            });
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

