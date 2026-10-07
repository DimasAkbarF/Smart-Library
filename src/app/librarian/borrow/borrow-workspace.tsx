"use client";

import { useState } from "react";
import { QrScanner } from "@/components/library/qr-scanner";
import { TransactionReceipt } from "@/components/library/receipt";
import { Button } from "@/components/ui/button";
import { CopyStatusChip } from "@/components/ui/status-chip";
import {
  borrowAction,
  getStudentContext,
  resolveQr,
  type Receipt,
  type StudentContext,
} from "@/features/loans/actions";
import { formatTanggal } from "@/lib/format";
import { kodeDariError, pesanRamah } from "@/lib/errors";
import type { BookCopy } from "@/lib/types";

export function BorrowWorkspace({ maxLoansFallback }: { maxLoansFallback: number }) {
  const [ctx, setCtx] = useState<StudentContext | null>(null);
  const [copy, setCopy] = useState<BookCopy | null>(null);
  const [step1Msg, setStep1Msg] = useState("");
  const [step2Msg, setStep2Msg] = useState("");
  const [err, setErr] = useState("");
  const [busy1, setBusy1] = useState(false);
  const [busy2, setBusy2] = useState(false);
  const [busy3, setBusy3] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const resetAll = () => {
    setCtx(null);
    setCopy(null);
    setStep1Msg("");
    setStep2Msg("");
    setErr("");
    setReceipt(null);
  };

  const onStudent = async (token: string) => {
    setBusy1(true);
    setStep1Msg("");
    setErr("");
    try {
      const r = await resolveQr(token);
      if (r.type === "BOOK") {
        setStep1Msg("Ini QR buku — pindai di langkah 2.");
        return;
      }
      const full = await getStudentContext(r.student.id);
      setCtx(full);
    } catch (e) {
      setStep1Msg(pesanRamah(kodeDariError(e)));
    } finally {
      setBusy1(false);
    }
  };

  const onBook = async (token: string) => {
    setBusy2(true);
    setStep2Msg("");
    setErr("");
    try {
      const r = await resolveQr(token);
      if (r.type === "STUDENT") {
        setStep2Msg("Ini QR siswa — langkah ini khusus QR buku.");
        return;
      }
      setCopy(r.copy);
      if (r.loan) setStep2Msg(`Buku ini sedang dipinjam oleh ${r.loan.student_name}.`);
      else if (r.copy.status !== "AVAILABLE") setStep2Msg("Buku ini sedang tidak tersedia.");
    } catch (e) {
      setStep2Msg(pesanRamah(kodeDariError(e)));
    } finally {
      setBusy2(false);
    }
  };

  const maxLoans = ctx?.maxLoans ?? maxLoansFallback;
  const studentBlocked = ctx && ctx.student.status !== "active";
  const limitHit = ctx && ctx.activeCount >= maxLoans;
  const copyBlocked = copy && copy.status !== "AVAILABLE";
  const invalidReason = studentBlocked
    ? "Siswa tidak aktif — peminjaman tidak dapat dilanjutkan."
    : limitHit
      ? `Batas tercapai (${ctx.activeCount}/${maxLoans}) — kembalikan dulu buku yang masih dipinjam.`
      : copyBlocked
        ? "Buku tidak tersedia — pilih eksemplar lain yang berstatus Tersedia."
        : "";
  const canConfirm = !!ctx && !!copy && !invalidReason && !busy3;

  const confirm = async () => {
    if (!ctx || !copy) return;
    setBusy3(true);
    setErr("");
    const res = await borrowAction(ctx.student.id, copy.id);
    setBusy3(false);
    if (res.ok) setReceipt(res.receipt);
    else setErr(pesanRamah(res.code));
  };

  if (receipt) {
    return (
      <div className="grid gap-3">
        <TransactionReceipt kind="borrow" receipt={receipt} nextHref="/librarian/borrow" nextLabel="Transaksi berikutnya" />
        <div>
          <Button variant="secondary" onClick={resetAll}>
            Scan lagi tanpa pindah halaman
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
      <div className="space-y-6">
        {/* Identified Student Banner (if already scanned) */}
        {ctx ? (
          <div className="rounded-lg border border-leaf/40 bg-leaf-soft/30 p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-leaf-deep font-mono">
                  Siswa Teridentifikasi
                </span>
                <p className="font-display text-lg font-bold text-ink mt-0.5">{ctx.student.name}</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  NIS: <span className="font-mono font-semibold">{ctx.student.nis}</span> ·{" "}
                  {ctx.student.class_name ? `Kelas ${ctx.student.class_name}` : "Tanpa kelas"} ·{" "}
                  <span className={ctx.student.status === "active" ? "text-leaf-deep font-semibold" : "text-coral-deep font-semibold"}>
                    {ctx.student.status === "active" ? "Aktif" : "Nonaktif"}
                  </span>
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCtx(null);
                  setStep1Msg("");
                }}
                className="text-xs h-8"
              >
                Ganti Siswa
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-leaf/20 text-xs text-ink-muted">
              <span>Pinjaman aktif saat ini:</span>
              <strong className="font-mono text-ink">
                {ctx.activeCount} dari {maxLoans} buku
              </strong>
            </div>

            {ctx.loans.length > 0 && (
              <div className="pt-2 border-t border-leaf/20">
                <span className="text-[11px] text-ink-subtle block mb-1">Buku yang masih dibawa:</span>
                <ul className="space-y-1 text-xs text-ink-muted">
                  {ctx.loans.map((l) => (
                    <li key={l.loan_id} className="flex justify-between">
                      <span className="truncate max-w-xs">· {l.book_title}</span>
                      <span className="font-mono text-[11px] text-ink-subtle">
                        Tempo: {formatTanggal(l.due_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        {/* Identified Book Banner (if already scanned) */}
        {copy ? (
          <div className="rounded-lg border border-sky/40 bg-sky-soft/30 p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-deep font-mono">
                  Buku Teridentifikasi
                </span>
                <p className="font-display text-lg font-bold text-ink mt-0.5">{copy.book_title}</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  Kode: <span className="font-mono font-semibold text-sky-deep">{copy.inventory_code}</span>
                  {copy.location ? ` · Rak ${copy.location}` : ""}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCopy(null);
                  setStep2Msg("");
                }}
                className="text-xs h-8"
              >
                Ganti Buku
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-sky/20">
              <CopyStatusChip status={copy.status} />
              {copy.status !== "AVAILABLE" && (
                <span className="text-xs text-coral-deep font-semibold">
                  (Eksemplar ini tidak dapat dipinjam)
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* Single Unified Scanner Console */}
        {(!ctx || !copy) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-ink">
                {!ctx ? "Langkah 1: Pindai Kartu Siswa" : "Langkah 2: Pindai Buku yang Dipinjam"}
              </h2>
              <span className="text-xs font-mono font-semibold text-sky-deep bg-sky-soft px-2.5 py-0.5 rounded-full">
                {!ctx ? "Fase 1/2" : "Fase 2/2"}
              </span>
            </div>

            <QrScanner
              key={!ctx ? "scanner-student" : "scanner-book"}
              title={!ctx ? "Pindai Kartu Siswa" : "Pindai Buku"}
              hint={
                !ctx
                  ? "Arahkan kamera ke QR kartu anggota atau masukkan NIS siswa secara manual"
                  : "Arahkan kamera ke label QR pada buku atau masukkan kode inventaris manual"
              }
              onDetected={!ctx ? onStudent : onBook}
            />

            {busy1 && <p role="status" className="text-xs text-ink-muted">Memeriksa data siswa…</p>}
            {busy2 && <p role="status" className="text-xs text-ink-muted">Memeriksa data buku…</p>}
            {step1Msg && (
              <p role="alert" className="rounded-md bg-sun-soft p-3 text-xs font-semibold text-sun-deep">
                {step1Msg}
              </p>
            )}
            {step2Msg && (
              <p role="alert" className="rounded-md bg-sun-soft p-3 text-xs font-semibold text-sun-deep">
                {step2Msg}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Circulation Summary Sidebar */}
      <aside aria-label="Ringkasan Transaksi" className="rounded-lg border border-outline bg-surface p-5 space-y-4 lg:sticky lg:top-20">
        <h2 className="font-display text-base font-bold text-ink border-b border-outline/70 pb-3">
          Ringkasan Sirkulasi
        </h2>

        <dl className="space-y-3 text-xs">
          <div>
            <dt className="text-ink-subtle">Peminjam (Siswa)</dt>
            <dd className="font-semibold text-ink text-sm mt-0.5">
              {ctx ? `${ctx.student.name} (${ctx.student.nis})` : <span className="text-ink-subtle font-normal">Belum dipindai</span>}
            </dd>
          </div>
          <div>
            <dt className="text-ink-subtle">Buku & Kode</dt>
            <dd className="font-semibold text-ink text-sm mt-0.5">
              {copy ? `${copy.book_title} [${copy.inventory_code}]` : <span className="text-ink-subtle font-normal">Belum dipindai</span>}
            </dd>
          </div>
        </dl>

        {invalidReason && (
          <p role="alert" className="rounded-md bg-coral-soft p-3 text-xs font-semibold text-coral-deep leading-relaxed">
            {invalidReason}
          </p>
        )}

        {err && (
          <div className="rounded-md bg-coral-soft p-3 text-xs font-semibold text-coral-deep space-y-2">
            <p role="alert">{err}</p>
            <Button variant="secondary" size="sm" onClick={() => setErr("")} className="text-xs">
              Ulangi
            </Button>
          </div>
        )}

        <div className="pt-2">
          <Button
            size="md"
            className="w-full"
            disabled={!canConfirm}
            onClick={confirm}
          >
            {busy3 ? "Memproses Sirkulasi…" : "Konfirmasi Peminjaman"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
