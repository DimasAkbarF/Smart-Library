import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatTanggal } from "@/lib/format";
import type { Receipt } from "@/features/loans/actions";

export function TransactionReceipt({
  kind,
  receipt,
  nextHref,
  nextLabel,
}: {
  kind: "borrow" | "return";
  receipt: Receipt;
  nextHref: string;
  nextLabel: string;
}) {
  return (
    <div className="grid gap-5">
      <div className="flex items-start gap-4 rounded-card border border-leaf-deep/30 bg-leaf-soft/40 p-5">
        <CheckCircle2 className="size-9 shrink-0 text-leaf-deep" aria-hidden />
        <div>
          <h2 className="text-title font-bold">
            {kind === "borrow" ? "Peminjaman berhasil." : "Pengembalian berhasil."}
          </h2>
          <p className="mt-1 text-ink-muted">
            {kind === "borrow" ? (
              <>
                <strong className="text-ink">{receipt.book_title}</strong> tercatat atas nama{" "}
                <strong className="text-ink">{receipt.student_name}</strong>. Jatuh tempo:{" "}
                <strong className="text-ink">{formatTanggal(receipt.due_at)}</strong>.
              </>
            ) : (
              <>Buku sudah kembali ke koleksi tersedia.</>
            )}
          </p>
        </div>
      </div>

      <dl className="grid gap-x-8 gap-y-3 rounded-card border border-outline p-5 sm:grid-cols-2">
        <div><dt className="text-body text-ink-subtle">Buku</dt><dd className="font-semibold">{receipt.book_title}</dd></div>
        <div><dt className="text-body text-ink-subtle">Kode eksemplar</dt><dd className="font-mono font-semibold">{receipt.inventory_code}</dd></div>
        <div><dt className="text-body text-ink-subtle">Siswa</dt><dd className="font-semibold">{receipt.student_name}</dd></div>
        <div><dt className="text-body text-ink-subtle">NIS</dt><dd className="font-mono font-semibold">{receipt.student_nis}</dd></div>
        {kind === "borrow" && (
          <div><dt className="text-body text-ink-subtle">Jatuh tempo</dt><dd className="font-semibold">{formatTanggal(receipt.due_at)}</dd></div>
        )}
        {kind === "return" && (receipt.late_days ?? 0) > 0 && (
          <>
            <div><dt className="text-body text-ink-subtle">Keterlambatan</dt><dd className="font-semibold text-coral-deep">{receipt.late_days} hari</dd></div>
            <div><dt className="text-body text-ink-subtle">Denda</dt><dd className="font-semibold">{formatRupiah(receipt.fine ?? 0)}</dd></div>
          </>
        )}
      </dl>

      <div>
        <Link href={nextHref}>
          <Button size="lg">{nextLabel}</Button>
        </Link>
      </div>
    </div>
  );
}
