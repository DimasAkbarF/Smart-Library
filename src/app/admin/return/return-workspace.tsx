"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/library/qr-scanner";
import { TransactionReceipt } from "@/components/library/receipt";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  resolveQr,
  returnAction,
  type ActiveLoanInfo,
  type Receipt,
} from "@/features/loans/actions";
import { formatRupiah, formatTanggal, hariTelat } from "@/lib/format";
import { kodeDariError, pesanRamah } from "@/lib/errors";
import { notifyCirculationChange } from "@/components/circulation/circulation-watcher";
import type { BookCopy } from "@/lib/types";

export function ReturnWorkspace({ finePerDay }: { finePerDay: number }) {
  const router = useRouter();
  const confirmDialog = useConfirm();
  const { success: toastSuccess } = useToast();

  const [copy, setCopy] = useState<BookCopy | null>(null);
  const [loan, setLoan] = useState<ActiveLoanInfo | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const resetAll = () => {
    setCopy(null);
    setLoan(null);
    setMsg("");
    setErr("");
    setReceipt(null);
    router.refresh();
  };

  const onDetected = async (token: string) => {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const r = await resolveQr(token);
      if (r.type === "STUDENT") {
        setCopy(null);
        setLoan(null);
        setMsg("Ini QR siswa — halaman ini khusus pengembalian buku. Minta siswa menunjukkan QR pada buku.");
        return;
      }
      setCopy(r.copy);
      setLoan(r.loan);
      if (!r.loan) setMsg("Tidak ada peminjaman aktif untuk buku ini.");
    } catch (e) {
      setMsg(pesanRamah(kodeDariError(e)));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!copy || !loan) return;

    const ok = await confirmDialog({
      title: "Konfirmasi Pengembalian",
      message: `Proses pengembalian buku "${copy.book_title}" (${copy.inventory_code}) atas nama ${loan.student_name}?`,
      confirmText: "Ya, Kembalikan",
      cancelText: "Batal",
      tone: "primary",
    });
    if (!ok) return;

    setProcessing(true);
    setErr("");
    const res = await returnAction(copy.id);
    setProcessing(false);
    if (res.ok) {
      setReceipt(res.receipt);
      notifyCirculationChange({ type: "RETURN", copyId: copy.id });
      router.refresh();
      toastSuccess(`Buku "${copy.book_title}" berhasil dikembalikan!`, "Pengembalian Selesai");
    } else {
      setErr(pesanRamah(res.code));
    }
  };

  if (receipt) {
    return (
      <div className="grid gap-3">
        <TransactionReceipt
          kind="return"
          receipt={receipt}
          onNext={resetAll}
          nextLabel="Transaksi berikutnya"
        />
      </div>
    );
  }

  const late = loan ? Math.max(loan.late_days, hariTelat(loan.due_at)) : 0;

  return (
    <div className="grid max-w-3xl gap-5">
      <QrScanner title="Pindai buku yang dikembalikan" hint="Arahkan kamera ke QR pada buku" onDetected={onDetected} />
      {busy && <p role="status" className="text-ink-muted">Memeriksa buku…</p>}
      {msg && <p role="alert" className="rounded-md bg-sun-soft px-4 py-3 text-sun-deep">{msg}</p>}

      {copy && loan && (
        <div className="grid gap-4 rounded-card border border-outline bg-surface p-5">
          <div>
            <p className="font-display text-title font-bold">{copy.book_title}</p>
            <p className="font-mono text-body text-ink-muted">{copy.inventory_code}</p>
          </div>
          <dl className="grid gap-2 text-body sm:grid-cols-2">
            <div><dt className="text-ink-subtle">Peminjam</dt><dd className="font-semibold">{loan.student_name} ({loan.student_nis})</dd></div>
            <div><dt className="text-ink-subtle">Jatuh tempo</dt><dd className="font-semibold">{formatTanggal(loan.due_at)}</dd></div>
            <div><dt className="text-ink-subtle">Keterlambatan</dt><dd className="font-semibold">{late > 0 ? `${late} hari` : "Tepat waktu"}</dd></div>
            <div><dt className="text-ink-subtle">Denda</dt><dd className="font-semibold">{formatRupiah(late * finePerDay)}</dd></div>
          </dl>
          {err && (
            <div className="grid gap-2 rounded-btn bg-danger-bg border border-danger/25 px-4 py-3 text-sm text-danger">
              <p role="alert">{err}</p>
              <div><Button variant="secondary" onClick={() => setErr("")}>Ulangi</Button></div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="lg" disabled={processing} onClick={confirm}>
              {processing ? "Memproses…" : "Konfirmasi Pengembalian"}
            </Button>
            <Button variant="secondary" onClick={resetAll}>Batal</Button>
          </div>
        </div>
      )}
    </div>
  );
}
