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
  const initials =
    (student.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "S";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-outline bg-surface text-ink shadow-card",
        "w-full max-w-[520px] min-h-[220px] sm:min-h-0 sm:aspect-[1.58/1] flex flex-col justify-between p-3.5 sm:p-5 select-none",
        "print:max-w-none print:min-h-0 print:aspect-[1.58/1] print:rounded-xl print:border-slate-800 print:border-[1.5px] print:shadow-none print:p-3 print:bg-white",
        className
      )}
    >
      {/* Watermark Logo Sekolah di Latar Belakang */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] print:opacity-[0.04]">
        <Image
          src="/logo-smpn17.png"
          alt=""
          width={256}
          height={256}
          unoptimized
          className="size-56 sm:size-64 print:size-48 object-contain grayscale"
        />
      </div>

      {/* Header / Kop Resmi Kartu */}
      <div className="relative z-10 border-b-2 border-ink pb-1.5 sm:pb-2.5 print:pb-1 print:border-b-2">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo Sekolah Resmi */}
          <div className="relative size-9 sm:size-14 print:size-9 shrink-0 drop-shadow-xs">
            <Image
              src="/logo-smpn17.png"
              alt="Logo SMPN 17 Tangerang Selatan"
              width={56}
              height={56}
              unoptimized
              className="size-full object-contain"
            />
          </div>

          {/* Teks Lembaga */}
          <div className="flex-1 text-center pr-1 sm:pr-2">
            <p className="font-sans text-[7.5px] sm:text-[10px] print:text-[7.5px] font-bold tracking-wider text-ink-muted uppercase leading-tight">
              Pemerintah Kota Tangerang Selatan
            </p>
            <p className="font-sans text-[7px] sm:text-[9px] print:text-[7px] font-semibold text-ink-muted uppercase leading-tight">
              Dinas Pendidikan dan Kebudayaan
            </p>
            <h1 className="font-display text-[10.5px] sm:text-[14px] print:text-[10.5px] font-extrabold tracking-tight text-sky-deep uppercase leading-tight mt-0.5">
              SMP NEGERI 17 TANGERANG SELATAN
            </h1>
            <p className="text-[6px] sm:text-[8px] print:text-[6px] text-ink-muted leading-tight">
              Jl. Lengkong Gudang Timur, Kec. Serpong, Kota Tangerang Selatan
            </p>
          </div>
        </div>

        {/* Pita Judul Kartu */}
        <div className="mt-1 sm:mt-2 print:mt-1 flex items-center justify-between rounded-sm bg-sky-deep px-2 sm:px-3 print:px-2 py-0.5 sm:py-1 print:py-0.5 text-white">
          <span className="font-mono text-[7.5px] sm:text-[10px] print:text-[7.5px] font-bold tracking-widest uppercase">
            KARTU ANGGOTA PERPUSTAKAAN
          </span>
          <span className="font-mono text-[7px] sm:text-[9px] print:text-[7px] font-semibold text-white/90 uppercase opacity-90">
            SMART LIBRARY
          </span>
        </div>
      </div>

      {/* Isi Data Identitas & QR Code */}
      <div className="relative z-10 flex items-center justify-between gap-2.5 sm:gap-4 print:gap-2.5 py-1.5 sm:py-2 print:py-1.5">
        {/* Kolom Biodata Siswa */}
        <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5 print:space-y-1 text-left">
          {/* Header Identitas: Avatar Inisial & Nama Siswa */}
          <div className="flex items-center gap-2 sm:gap-2.5 print:gap-2">
            {/* Avatar Inisial Modern & Profesional */}
            <div className="flex size-8 sm:size-10 print:size-8 items-center justify-center rounded-full bg-sky-deep text-white font-display font-black text-xs sm:text-sm print:text-xs shrink-0 shadow-xs border border-white/50 print:border-slate-700">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] sm:text-[8px] print:text-[7px] font-semibold text-ink-muted uppercase tracking-wider">
                  Nama Lengkap
                </span>
                <span className="rounded-chip bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 font-plex-sans text-[6.5px] sm:text-[7.5px] print:text-[6.5px] font-bold uppercase leading-none">
                  {student.status === "graduated" ? "Alumni" : "Siswa Aktif"}
                </span>
              </div>
              <span
                className="font-display text-[11.5px] sm:text-[14px] print:text-[11.5px] font-extrabold text-ink leading-tight line-clamp-1 block"
                title={student.name}
              >
                {student.name}
              </span>
            </div>
          </div>

          {/* Rincian NIS dan Kelas */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-outline/70">
            <div className="min-w-0">
              <span className="text-[7px] sm:text-[8px] print:text-[7px] font-semibold text-ink-muted uppercase tracking-wider block">
                Nomor Induk (NIS)
              </span>
              <span className="font-mono text-[10px] sm:text-[12px] print:text-[10px] font-black text-sky-deep block tracking-wide truncate">
                {student.nis}
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-[7px] sm:text-[8px] print:text-[7px] font-semibold text-ink-muted uppercase tracking-wider block">
                Rombel / Kelas
              </span>
              <span className="font-sans text-[9.5px] sm:text-[11.5px] print:text-[9.5px] font-bold text-ink block truncate">
                {student.class_name ? `Kelas ${student.class_name}` : "—"}
              </span>
            </div>
          </div>

          {/* Masa Berlaku */}
          <div>
            <span className="text-[6.5px] sm:text-[7.5px] print:text-[6.5px] text-ink-muted block truncate">
              Masa Berlaku: <strong className="text-ink font-semibold">Selama Siswa Aktif</strong>
            </span>
          </div>
        </div>

        {/* Kolom QR Code Resmi Sirkulasi */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-outline bg-white p-1 sm:p-1.5 print:p-1 shadow-2xs shrink-0">
          <QrImg token={token} size={64} className="size-14 sm:size-18 print:size-14" />
          <span className="mt-0.5 font-mono text-[7px] sm:text-[8px] print:text-[7px] font-bold tracking-wider text-ink max-w-[70px] sm:max-w-[85px] print:max-w-[70px] truncate block text-center">
            {token}
          </span>
          <span className="text-[6px] sm:text-[6.5px] print:text-[6px] text-ink-muted text-center leading-none">
            Scan Sirkulasi
          </span>
        </div>
      </div>

      {/* Footer Kartu & Ketentuan Resmi */}
      <div className="relative z-10 flex items-center justify-between border-t border-outline pt-1 sm:pt-1.5 print:pt-1 text-[6.5px] sm:text-[8px] print:text-[6.5px] text-ink-muted">
        <span className="truncate mr-2">* Tunjukkan kartu ini saat sirkulasi buku.</span>
        <span className="font-mono font-bold text-ink shrink-0">SMPN 17 TANGSEL</span>
      </div>
    </div>
  );
}
