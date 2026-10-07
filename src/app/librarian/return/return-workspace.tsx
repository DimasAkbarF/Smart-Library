"use client";

import { useState } from "react";
import { QrScanner } from "@/components/library/qr-scanner";
import { TransactionReceipt } from "@/components/library/receipt";
import { Button } from "@/components/ui/button";
import {
  resolveQr,
  returnAction,
  type ActiveLoanInfo,
  type Receipt,
} from "@/features/loans/actions";
import { formatRupiah, formatTanggal, hariTelat } from "@/lib/format";
import { kodeDariError, pesanRamah } from "@/lib/errors";
import type { BookCopy } from "@/lib/types";

export function ReturnWorkspace({ finePerDay }: { finePerDay: number }) {
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
    if (!copy) return;
    setProcessing(true);
    setErr("");
    const res = await returnAction(copy.id);
    setProcessing(false);
    if (res.ok) setReceipt(res.receipt);
    else setErr(pesanRamah(res.code));
  };

  if (receipt) {
    return (
      <div className="grid gap-3">
        <TransactionReceipt kind="return" receipt={receipt} nextHref="/librarian/return" nextLabel="Transaksi berikutnya" />
        <div>
          <Button variant="secondary" onClick={resetAll}>
            Scan lagi tanpa pindah halaman
          </Button>
        </div>
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
            <p className="font-display text-lg font-bold">{copy.book_title}</p>
            <p className="font-mono text-sm text-ink-muted">{copy.inventory_code}</p>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-ink-subtle">Peminjam</dt><dd className="font-semibold">{loan.student_name} ({loan.student_nis})</dd></div>
            <div><dt className="text-ink-subtle">Jatuh tempo</dt><dd className="font-semibold">{formatTanggal(loan.due_at)}</dd></div>
            <div><dt className="text-ink-subtle">Keterlambatan</dt><dd className="font-semibold">{late > 0 ? `${late} hari` : "Tepat waktu"}</dd></div>
            <div><dt className="text-ink-subtle">Denda</dt><dd className="font-semibold">{formatRupiah(late * finePerDay)}</dd></div>
          </dl>
          {err && (
            <div className="grid gap-2 rounded-md bg-coral-soft px-4 py-3 text-sm text-coral-deep">
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
