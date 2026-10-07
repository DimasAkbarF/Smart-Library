const tanggal = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const tanggalWaktu = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** "10 Oktober 2026" */
export function formatTanggal(iso: string | null): string {
  if (!iso) return "—";
  return tanggal.format(new Date(iso));
}

/** "10 Okt 2026, 14.30" */
export function formatTanggalWaktu(iso: string | null): string {
  if (!iso) return "—";
  return tanggalWaktu.format(new Date(iso));
}

export function formatRupiah(n: number | null): string {
  return rupiah.format(n ?? 0);
}

/** Selisih hari kalender (bilangan bulat, min 0). */
export function hariTelat(dueIso: string, now = new Date()): number {
  const due = new Date(dueIso);
  due.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - due.getTime()) / 86_400_000));
}

/** Normalisasi kode/nis: trim + uppercase, tanpa spasi berlebih. */
export function normalisasiKode(v: string): string {
  return v.trim().toUpperCase().replace(/\s+/g, "");
}
