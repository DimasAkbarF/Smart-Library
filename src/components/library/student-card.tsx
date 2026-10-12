"use client";

import Image from "next/image";
import { QrImg } from "./qr-img";
import { cn } from "@/lib/utils";

export interface StudentCardProps {
  student: {
    id?: string;
    nis: string;
    name: string;
    class_name?: string | null;
    qr_token?: string;
    status?: string;
  };
  className?: string;
}

export function StudentCard({ student, className }: StudentCardProps) {
  const token = student.qr_token || `SIS-${student.nis}`;
  const initials = student.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-outline bg-surface text-ink shadow-card",
        "w-full max-w-[520px] aspect-[1.58/1] flex flex-col justify-between p-4 sm:p-5 select-none",
        className
      )}
    >
      {/* Watermark Logo Sekolah di Latar Belakang */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <Image
          src="/logo-smpn17.png"
          alt=""
          width={256}
          height={256}
          className="size-64 object-contain grayscale"
        />
      </div>

      {/* Header / Kop Resmi Kartu */}
      <div className="relative z-10 border-b-2 border-ink pb-2.5">
        <div className="flex items-center gap-3">
          {/* Logo Sekolah Resmi */}
          <div className="relative size-12 sm:size-14 shrink-0 drop-shadow-xs">
            <Image
              src="/logo-smpn17.png"
              alt="Logo SMPN 17 Tangerang Selatan"
              width={56}
              height={56}
              className="size-full object-contain"
            />
          </div>

          {/* Teks Lembaga */}
          <div className="flex-1 text-center pr-2">
            <p className="font-sans text-[9px] sm:text-[10px] font-bold tracking-wider text-ink-muted uppercase leading-tight">
              Pemerintah Kota Tangerang Selatan
            </p>
            <p className="font-sans text-[8px] sm:text-[9px] font-semibold text-ink-muted uppercase leading-tight">
              Dinas Pendidikan dan Kebudayaan
            </p>
            <h1 className="font-display text-[12px] sm:text-[14px] font-extrabold tracking-tight text-sky-deep uppercase leading-tight mt-0.5">
              SMP NEGERI 17 TANGERANG SELATAN
            </h1>
            <p className="text-[7px] sm:text-[8px] text-ink-muted leading-tight">
              Jl. Lengkong Gudang Timur, Kec. Serpong, Kota Tangerang Selatan
            </p>
          </div>
        </div>

        {/* Pita Judul Kartu */}
        <div className="mt-2 flex items-center justify-between rounded-sm bg-sky-deep px-3 py-1 text-white">
          <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">
            KARTU ANGGOTA PERPUSTAKAAN
          </span>
          <span className="font-mono text-[8px] sm:text-[9px] font-semibold text-white/90 uppercase opacity-90">
            SMART LIBRARY
          </span>
        </div>
      </div>

      {/* Isi Data Identitas & QR Code */}
      <div className="relative z-10 grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 items-center py-2">
        {/* Pas Foto / Avatar Pelajar */}
        <div className="flex flex-col items-center">
          <div className="flex size-16 sm:size-20 items-center justify-center rounded-lg border-2 border-outline bg-sky-deep text-white shadow-inner">
            <span className="font-display text-xl sm:text-2xl font-black tracking-wider">
              {initials}
            </span>
          </div>
          <span className="mt-1.5 rounded-chip bg-surface-sunken-ed border border-rule px-2 py-0.5 font-plex-sans text-[8px] sm:text-[9px] font-semibold text-ink uppercase">
            {student.status === "graduated" ? "Alumni" : "Siswa Aktif"}
          </span>
        </div>

        {/* Biodata Siswa */}
        <div className="space-y-1 text-left min-w-0">
          <div>
            <span className="text-[8px] sm:text-[9px] font-medium text-ink-muted uppercase tracking-wider block">
              Nama Lengkap
            </span>
            <span className="font-display text-[12px] sm:text-[14px] font-extrabold text-ink leading-tight truncate block" title={student.name}>
              {student.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-0.5 border-t border-outline">
            <div>
              <span className="text-[8px] sm:text-[9px] font-medium text-ink-muted uppercase tracking-wider block">
                Nomor Induk (NIS)
              </span>
              <span className="font-mono text-[11px] sm:text-[12px] font-black text-sky-deep block">
                {student.nis}
              </span>
            </div>
            <div>
              <span className="text-[8px] sm:text-[9px] font-medium text-ink-muted uppercase tracking-wider block">
                Rombel Kelas
              </span>
              <span className="font-sans text-[10px] sm:text-[11px] font-bold text-ink block">
                {student.class_name ? `Kelas ${student.class_name}` : "—"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[7.5px] sm:text-[8px] font-medium text-ink-muted block">
              Masa Berlaku: <strong className="text-ink">Selama Menjadi Siswa Aktif</strong>
            </span>
          </div>
        </div>

        {/* QR Code Resmi yang Valid */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-outline bg-white p-1.5 sm:p-2 shadow-2xs">
          <QrImg token={token} size={82} />
          <span className="mt-1 font-mono text-[8px] sm:text-[9px] font-bold tracking-wider text-ink">
            {token}
          </span>
          <span className="text-[7px] text-ink-muted text-center leading-none">
            Scan Sirkulasi
          </span>
        </div>
      </div>

      {/* Footer Kartu & Ketentuan Resmi */}
      <div className="relative z-10 flex items-center justify-between border-t border-outline pt-1.5 text-[7px] sm:text-[8px] text-ink-muted">
        <span>* Tunjukkan kartu ini kepada petugas saat meminjam atau mengembalikan buku.</span>
        <span className="font-mono font-semibold text-ink">SMPN 17 TANGSEL</span>
      </div>
    </div>
  );
}
