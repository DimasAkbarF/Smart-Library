import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rak buku minimal — dekoratif, bukan ilustrasi. */
const RAK = [
  { h: "h-14", w: "w-3", c: "bg-white/30" },
  { h: "h-20", w: "w-4", c: "bg-white/50" },
  { h: "h-10", w: "w-3", c: "bg-sun/70" },
  { h: "h-24", w: "w-5", c: "bg-white/40" },
  { h: "h-16", w: "w-3", c: "bg-white/25" },
];

/** Branding ringkas di atas card (mobile & tablet). */
export function SchoolBrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-sky-deep text-white">
        <BookOpen className="size-6" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-display text-xl leading-tight font-bold">Smart Library</p>
        <p className="truncate text-sm text-ink-muted">SMP Negeri 17 Tangerang Selatan</p>
      </div>
    </div>
  );
}

/** Panel brand biru — hanya pada mode desktop (≥1024px). */
export function SchoolBrandPanel() {
  return (
    <section className="hidden bg-sky-deep px-12 py-12 text-white [@media(max-height:720px)]:py-8 lg:flex lg:flex-col lg:justify-center min-[1440px]:px-14">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10">
          <BookOpen className="size-6" aria-hidden />
        </span>
        <div>
          <p className="font-display text-xl leading-tight font-bold">Smart Library</p>
          <p className="text-sm text-white/70">SMP Negeri 17 Tangerang Selatan</p>
        </div>
      </div>

      {/* Ilustrasi disembunyikan pada layar pendek agar form tetap utuh */}
      <div
        aria-hidden
        className="mt-8 flex items-end gap-2 border-b border-white/25 pb-2 [@media(max-height:720px)]:hidden"
      >
        {RAK.map((b) => (
          <span key={b.h + b.w} className={`${b.h} ${b.w} rounded-t-sm ${b.c}`} />
        ))}
      </div>

      <div className="mt-8 [@media(max-height:720px)]:mt-6">
        <p className="font-display text-xl font-bold [@media(max-height:720px)]:text-lg">
          Belajar. Membaca. Berkembang.
        </p>
        <p className="mt-2 max-w-sm text-sm text-white/80 leading-relaxed">
          Peminjaman sirkulasi buku, pencarian katalog koleksi, dan kartu anggota digital siswa.
        </p>
      </div>
    </section>
  );
}