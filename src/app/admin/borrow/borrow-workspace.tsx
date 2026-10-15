"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/library/qr-scanner";
import { Button } from "@/components/ui/button";
import { CopyStatusChip } from "@/components/ui/status-chip";
import { useToast } from "@/components/ui/toast";
import { useSweetAlert } from "@/components/ui/confirm-dialog";
import {
  borrowAction,
  getStudentContext,
  resolveQr,
  type StudentContext,
} from "@/features/loans/actions";
import { formatTanggal } from "@/lib/format";
import { kodeDariError, pesanRamah } from "@/lib/errors";
import { notifyCirculationChange } from "@/components/circulation/circulation-watcher";
import type { BookCopy } from "@/lib/types";

export function BorrowWorkspace({ maxLoansFallback }: { maxLoansFallback: number }) {
  const router = useRouter();
  const sweetAlert = useSweetAlert();
  const { success: toastSuccess } = useToast();
  const [ctx, setCtx] = useState<StudentContext | null>(null);
  const [copy, setCopy] = useState<BookCopy | null>(null);
  const [step1Msg, setStep1Msg] = useState("");
  const [step2Msg, setStep2Msg] = useState("");
  const [err, setErr] = useState("");
  const [busy1, setBusy1] = useState(false);
  const [busy2, setBusy2] = useState(false);
  const [busy3, setBusy3] = useState(false);

  const resetAll = () => {
    setCtx(null);
    setCopy(null);
    setStep1Msg("");
    setStep2Msg("");
    setErr("");
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

    const ok = await sweetAlert.confirm({
      title: "Konfirmasi Peminjaman Buku",
      message: "Pastikan data siswa dan eksemplar buku sudah sesuai sebelum melanjutkan pencatatan.",
      confirmText: "Ya, Catat Pinjaman",
      cancelText: "Batal",
      tone: "primary",
      details: [
        { label: "Peminjam", value: `${ctx.student.name} (${ctx.student.nis})` },
        { label: "Buku", value: copy.book_title },
        { label: "Kode Eksemplar", value: copy.inventory_code },
      ],
    });
    if (!ok) return;

    setBusy3(true);
    setErr("");
    const res = await borrowAction(ctx.student.id, copy.id);
    setBusy3(false);
    if (res.ok) {
      notifyCirculationChange({ type: "BORROW", copyId: copy.id });
      router.refresh();
      toastSuccess("Peminjaman buku berhasil dicatat!", "Berhasil");
      await sweetAlert.alert({
        title: "Buku Berhasil Dipinjam!",
        message: "Transaksi peminjaman telah berhasil dicatat ke dalam sistem perpustakaan.",
        tone: "success",
        confirmText: "OK, Transaksi Berikutnya",
        details: [
          { label: "Judul Buku", value: res.receipt.book_title },
          { label: "Kode Eksemplar", value: res.receipt.inventory_code },
          { label: "Peminjam", value: `${res.receipt.student_name} (${res.receipt.student_nis})` },
          { label: "Jatuh Tempo", value: formatTanggal(res.receipt.due_at) },
        ],
      });
      resetAll();
    } else {
      setErr(pesanRamah(res.code));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
      <div className="space-y-6">
        {/* Identified Student Banner (if already scanned) */}
        {ctx ? (
          <div className="rounded-btn border border-success-line bg-success-bg/40 p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-meta font-bold uppercase tracking-wider text-success font-mono">
                  Siswa Teridentifikasi
                </span>
                <p className="font-display text-title font-bold text-ink mt-0.5">{ctx.student.name}</p>
                <p className="text-meta text-ink-muted mt-0.5">
                  NIS: <span className="font-mono font-semibold">{ctx.student.nis}</span> ·{" "}
                  {ctx.student.class_name ? `Kelas ${ctx.student.class_name}` : "Tanpa kelas"} ·{" "}
                  <span className={ctx.student.status === "active" ? "text-success font-semibold" : "text-danger font-semibold"}>
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
                className="text-label h-8"
              >
                Ganti Siswa
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-success-line/30 text-meta text-ink-muted">
              <span>Pinjaman aktif saat ini:</span>
              <strong className="font-mono text-ink">
                {ctx.activeCount} dari {maxLoans} buku
              </strong>
            </div>

            {ctx.loans.length > 0 && (
              <div className="pt-2 border-t border-success-line/30">
                <span className="text-meta text-ink-subtle block mb-1">Buku yang masih dibawa:</span>
                <ul className="space-y-1 text-meta text-ink-muted">
                  {ctx.loans.map((l) => (
                    <li key={l.loan_id} className="flex justify-between">
                      <span className="truncate max-w-xs">· {l.book_title}</span>
                      <span className="font-mono text-meta text-ink-subtle">
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
          <div className="rounded-btn border border-primary/20 bg-primary-soft/40 p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-meta font-bold uppercase tracking-wider text-primary font-mono">
                  Buku Teridentifikasi
                </span>
                <p className="font-display text-title font-bold text-ink mt-0.5">{copy.book_title}</p>
                <p className="text-meta text-ink-muted mt-0.5">
                  Kode: <span className="font-mono font-semibold text-primary">{copy.inventory_code}</span>
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
                className="text-label h-8"
              >
                Ganti Buku
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-rule">
              <CopyStatusChip status={copy.status} />
              {copy.status !== "AVAILABLE" && (
                <span className="text-xs text-danger font-medium">
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
              <h2 className="font-serif text-base font-medium text-ink">
                {!ctx ? "Langkah 1: Pindai Kartu Siswa" : "Langkah 2: Pindai Buku yang Dipinjam"}
              </h2>
              <span className="text-xs font-plex-mono font-medium text-primary bg-surface-sunken-ed border border-rule px-2 py-0.5 rounded-chip">
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
              <p role="alert" className="rounded-btn bg-warning-bg border border-warning/25 p-3 text-xs font-medium text-warning">
                {step1Msg}
              </p>
            )}
            {step2Msg && (
              <p role="alert" className="rounded-btn bg-warning-bg border border-warning/25 p-3 text-xs font-medium text-warning">
                {step2Msg}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Circulation Summary Sidebar */}
      <aside aria-label="Ringkasan Transaksi" className="rounded-panel border border-rule bg-white p-5 space-y-4 lg:sticky lg:top-20 font-plex-sans">
        <h2 className="font-serif text-base font-medium text-ink border-b border-rule pb-3">
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
          <p role="alert" className="rounded-btn bg-danger-bg border border-danger/25 p-3 text-xs font-medium text-danger leading-relaxed">
            {invalidReason}
          </p>
        )}

        {err && (
          <div className="rounded-btn bg-danger-bg border border-danger/25 p-3 text-xs font-medium text-danger space-y-2">
            <p role="alert">{err}</p>
            <Button variant="secondary" size="sm" onClick={() => setErr("")}>
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
