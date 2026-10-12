import { myProfile } from "@/features/loans/actions";
import { logout } from "@/features/auth/actions";
import { StudentCard } from "@/components/library/student-card";
import { StudentCardActions } from "./card-actions";
import { Button } from "@/components/ui/button";
import { LogOut, Info, ShieldCheck } from "lucide-react";

export default async function StudentProfile() {
  const profile = await myProfile();
  const student = profile?.student;
  if (!student) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-display-sm font-bold text-ink">Profil Siswa</h1>
        <p className="text-ink-muted">Data siswa tidak ditemukan dalam sistem. Hubungi petugas perpustakaan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-rise max-w-3xl">
      {/* Header */}
      <header className="border-b border-rule pb-5">
        <div className="flex items-center gap-2 text-label font-semibold text-primary font-mono tracking-wider uppercase">
          <span className="size-2 rounded-chip bg-success" />
          <span>Portal Siswa · SMP Negeri 17 Tangerang Selatan</span>
        </div>
        <h1 className="mt-1 font-display text-display-sm sm:text-display-lg font-bold tracking-tight text-ink">
          Kartu Anggota Digital
        </h1>
        <p className="mt-1 text-body text-ink-muted">
          Kartu identitas resmi keanggotaan perpustakaan untuk transaksi peminjaman buku dan presensi.
        </p>
      </header>

      {/* Official Academic Membership Card Container */}
      <section aria-label="Kartu Perpustakaan Digital" className="space-y-4">
        <div className="flex justify-center sm:justify-start">
          <StudentCard student={student} />
        </div>

        {/* Action Buttons: Unduh & Cetak Kartu */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <StudentCardActions student={student} />
          <div className="flex items-center gap-1.5 text-meta text-ink-muted">
            <ShieldCheck className="size-4 text-success" />
            <span>QR Token Terverifikasi: <strong className="font-mono text-ink">{student.qr_token}</strong></span>
          </div>
        </div>
      </section>

      {/* Guide & Rules */}
      <section className="rounded-card border border-rule bg-card p-5 shadow-card space-y-3">
        <div className="flex items-center gap-2 text-ink">
          <Info className="size-5 text-primary" />
          <h2 className="font-display text-body font-bold">Panduan Penggunaan Kartu</h2>
        </div>
        <ul className="space-y-2 text-meta sm:text-body text-ink-muted pl-1">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 rounded-chip bg-primary shrink-0" />
            <span>Tunjukkan layar kartu digital ini kepada petugas di meja sirkulasi untuk meminjam buku.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 rounded-chip bg-primary shrink-0" />
            <span>QR Code ini bersifat pribadi dan terhubung langsung dengan catatan riwayat peminjaman siswa.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 rounded-chip bg-primary shrink-0" />
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
