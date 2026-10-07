import { myProfile } from "@/features/loans/actions";
import { logout } from "@/features/auth/actions";
import { QrImg } from "@/components/library/qr-img";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { BookOpen, LogOut, Info, CheckCircle2 } from "lucide-react";

export default async function StudentProfile() {
  const profile = await myProfile();
  const student = profile?.student;
  if (!student) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold text-ink">Profil Siswa</h1>
        <p className="text-ink-muted">Data siswa tidak ditemukan dalam sistem. Hubungi petugas perpustakaan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-rise max-w-3xl">
      {/* Header */}
      <header className="border-b border-outline/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-deep font-mono tracking-wider uppercase">
          <span className="size-2 rounded-full bg-leaf" />
          <span>Portal Siswa · SMP Negeri 17 Tangerang Selatan</span>
        </div>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          Kartu Anggota Digital
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Kartu identitas resmi keanggotaan perpustakaan untuk transaksi peminjaman buku dan presensi.
        </p>
      </header>

      {/* Official Academic Membership Card */}
      <section
        aria-label="Kartu Perpustakaan Digital"
        className="rounded-card border-2 border-outline bg-surface p-6 sm:p-7 shadow-card space-y-6 relative overflow-hidden"
      >
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline/70 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-sky text-white shadow-xs">
              <BookOpen className="size-6" />
            </div>
            <div>
              <p className="font-mono text-xs font-bold tracking-wider text-sky-deep uppercase">
                SMP NEGERI 17 TANGERANG SELATAN
              </p>
              <p className="font-display text-sm font-bold text-ink">
                KARTU ANGGOTA PERPUSTAKAAN DIGITAL
              </p>
            </div>
          </div>
          <div>
            {student.status === "active" ? (
              <StatusChip tone="leaf" label="Anggota Aktif" />
            ) : (
              <StatusChip tone="muted" label={student.status === "graduated" ? "Alumni" : "Nonaktif"} />
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center">
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center rounded-lg border border-outline bg-background p-4 shadow-xs">
            <QrImg token={student.qr_token} size={150} />
            <span className="mt-2 font-mono text-xs font-semibold text-ink-muted tracking-widest">
              {student.qr_token}
            </span>
            <span className="mt-0.5 text-[11px] text-ink-subtle">
              Tunjukkan ke scanner petugas
            </span>
          </div>

          {/* Student Identity Information */}
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-medium text-ink-muted uppercase tracking-wider">Nama Lengkap</span>
              <span className="font-display text-2xl font-bold text-ink tracking-tight block">
                {student.name}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-y border-outline/60 py-3">
              <div>
                <span className="block text-xs text-ink-muted">NIS (Nomor Induk Siswa)</span>
                <span className="font-mono text-base font-bold text-sky-deep tracking-wider">
                  {student.nis}
                </span>
              </div>
              <div>
                <span className="block text-xs text-ink-muted">Rombel Kelas</span>
                <span className="font-semibold text-base text-ink">
                  {student.class_name ?? "Belum ditentukan"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken border border-outline px-3 py-1 text-xs font-semibold text-ink">
                <span className="size-1.5 rounded-full bg-sky" />
                Pinjaman Aktif: <strong className="font-mono text-sky-deep">{profile.activeCount}</strong> buku
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                <CheckCircle2 className="size-3.5 text-leaf-deep" />
                Status akun terverifikasi
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="border-t border-outline/60 pt-3 text-[11px] text-ink-subtle flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <span>Diterbitkan resmi oleh Sistem Perpustakaan Terpadu SMPN 17 Tangerang Selatan</span>
          <span className="font-mono">ID: {student.id.slice(0, 8)}</span>
        </div>
      </section>

      {/* Guide & Rules */}
      <section className="rounded-card border border-outline bg-background p-5 shadow-card space-y-3">
        <div className="flex items-center gap-2 text-ink">
          <Info className="size-5 text-sky" />
          <h2 className="font-display text-base font-bold">Panduan Penggunaan Kartu</h2>
        </div>
        <ul className="space-y-2 text-xs sm:text-sm text-ink-muted pl-1">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 rounded-full bg-sky shrink-0" />
            <span>Tunjukkan layar kartu digital ini kepada petugas di meja sirkulasi untuk meminjam buku.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 rounded-full bg-sky shrink-0" />
            <span>QR Code ini bersifat pribadi dan terhubung langsung dengan catatan riwayat peminjaman siswa.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 rounded-full bg-sky shrink-0" />
            <span>Pastikan mengembalikan buku pinjaman tepat waktu sebelum melewati tanggal jatuh tempo.</span>
          </li>
        </ul>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <form action={logout}>
          <Button variant="danger" size="md" type="submit" className="gap-2">
            <LogOut className="size-4" aria-hidden /> Keluar dari Akun
          </Button>
        </form>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
