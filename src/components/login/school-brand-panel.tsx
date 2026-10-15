import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Branding ringkas di atas card (tampilan HP dan tablet < 1024px).
 * Sesuai PRD §8.1: logo resmi + nama unit ringkas.
 */
export function SchoolBrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3.5", className)}>
      <div className="relative size-12 shrink-0 overflow-hidden rounded-[4px] bg-white p-1 border border-rule">
        <Image
          src="/logo-smpn17.png"
          alt="Logo SMP Negeri 17 Tangerang Selatan"
          width={48}
          height={48}
          className="size-full object-contain"
          priority
        />
      </div>
      <div className="min-w-0">
        <p className="font-serif text-[18px] font-semibold tracking-tight text-[#161B26] leading-tight">
          Perpustakaan SMPN 17
        </p>
        <p className="text-[12px] font-plex-sans text-[#4A5160] leading-snug">
          SMP Negeri 17 Kota Tangerang Selatan
        </p>
      </div>
    </div>
  );
}

/**
 * Panel informasi institusi (desktop ≥ 1024px, 5/12 kolom).
 * Sesuai design.md §6 & PRD §8.1: latar primary (#1B2F5B), teks putih,
 * logo asli, 3 fakta layanan, jam layanan, alamat, dan kontak.
 * Tanpa rak buku CSS sintetis, tanpa slogan AI.
 */
export function SchoolBrandPanel() {
  return (
    <section className="hidden bg-[#1B2F5B] p-8 text-white lg:flex lg:flex-col lg:justify-between min-[1440px]:p-10">
      {/* Bagian Atas: Identitas Lembaga Resmi */}
      <div>
        <div className="flex items-center gap-3.5">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-[4px] bg-white p-1.5 shadow-sm">
            <Image
              src="/logo-smpn17.png"
              alt="Logo Resmi SMP Negeri 17 Tangerang Selatan"
              width={56}
              height={56}
              className="size-full object-contain"
              priority
            />
          </div>
          <div>
            <p className="font-plex-sans text-xs font-semibold tracking-[0.08em] text-white/70 uppercase">
              Perpustakaan Sekolah
            </p>
            <h2 className="font-serif text-[20px] font-semibold leading-tight text-white tracking-wide">
              SMP NEGERI 17
            </h2>
            <p className="font-plex-sans text-xs text-white/80">
              Kota Tangerang Selatan
            </p>
          </div>
        </div>

        {/* Seksi Layanan Fakta */}
        <div className="mt-8 border-t border-white/20 pt-6">
          <p className="font-plex-sans text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
            Layanan
          </p>
          <ul className="mt-3 space-y-2.5 font-plex-sans text-[13.5px] text-white/90">
            <li className="flex items-center gap-2.5">
              <span className="size-1.5 rounded-chip bg-accent" aria-hidden />
              <span>Pinjam & kembali via QR</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="size-1.5 rounded-chip bg-accent" aria-hidden />
              <span>Katalog koleksi perpustakaan</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="size-1.5 rounded-chip bg-accent" aria-hidden />
              <span>Kartu anggota digital siswa</span>
            </li>
          </ul>
        </div>

        {/* Seksi Jam Layanan Asli */}
        <div className="mt-8 border-t border-white/20 pt-6">
          <p className="font-plex-sans text-xs font-semibold uppercase tracking-[0.08em] text-white/80">
            Jam Layanan
          </p>
          <div className="mt-2.5 font-plex-sans text-[13px] text-white/90 space-y-1">
            <p className="font-medium text-white">Senin – Jumat: 07.00 – 15.00 WIB</p>
            <p className="text-white/85 text-xs">Sabtu, Minggu & Hari Libur: Tutup</p>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Metadata Alamat & Kontak Resmi */}
      <div className="border-t border-white/20 pt-6 font-plex-sans text-xs text-white/90 space-y-1.5">
        <p className="text-white font-medium">Jl. Komp. Pamulang Permai I Rt. 3 Rw. 10, Pamulang Barat, Kec. Pamulang, Kota Tangerang Selatan, Prov. Banten</p>
        <p className="text-white/90">Kontak: perpustakaan@smpn17tangsel.sch.id</p>
      </div>
    </section>
  );
}