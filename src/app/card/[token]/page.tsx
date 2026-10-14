import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStudentCardByToken } from "@/features/loans/actions";
import { StudentCard } from "@/components/library/student-card";
import { StudentCardActions } from "@/components/library/student-card-actions";
import { SchoolLogo } from "@/components/ui/school-logo";
import { SchoolFooter } from "@/components/login/school-footer";
import { ShieldCheck, Info } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kartu Anggota Perpustakaan Digital",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PublicStudentCardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const student = await getStudentCardByToken(token);

  if (!student) {
    notFound();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper font-plex-sans text-ink">
      {/* Top Navbar */}
      <header className="border-b border-rule bg-white py-4 px-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/books" className="flex items-center gap-2.5">
            <SchoolLogo size="sm" />
            <div>
              <span className="block font-serif text-[15px] font-semibold text-ink leading-tight">
                Kartu Anggota Perpustakaan
              </span>
              <span className="block text-[11px] text-ink-muted leading-none">
                SMP Negeri 17 Tangerang Selatan
              </span>
            </div>
          </Link>
          <Link
            href="/books"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Lihat Katalog Buku →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="border-b border-rule pb-4">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-primary uppercase tracking-wider">
              <span className="size-2 rounded-chip bg-success" />
              <span>Kartu Digital Resmi Terverifikasi</span>
            </div>
            <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Kartu Anggota Perpustakaan
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Tunjukkan QR Code ini kepada petugas perpustakaan di meja sirkulasi untuk meminjam buku.
            </p>
          </header>

          {/* Student Card */}
          <section aria-label="Kartu Perpustakaan Digital" className="space-y-4">
            <div className="flex justify-center sm:justify-start">
              <StudentCard student={student} />
            </div>

            {/* Action Buttons: Unduh & Cetak Kartu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <StudentCardActions student={student} />
              <div className="flex items-center gap-1.5 text-xs text-ink-muted min-w-0">
                <ShieldCheck className="size-4 text-success shrink-0" />
                <span className="min-w-0 break-all sm:break-normal">
                  QR Token Terverifikasi: <strong className="font-mono text-ink">{student.qr_token}</strong>
                </span>
              </div>
            </div>
          </section>

          {/* Guidelines */}
          <section className="rounded-card border border-rule bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-ink">
              <Info className="size-4 text-primary" />
              <h2 className="font-serif text-base font-semibold">Petunjuk Penggunaan Kartu</h2>
            </div>
            <ul className="space-y-2 text-xs text-ink-muted pl-1">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 rounded-chip bg-primary shrink-0" />
                <span>Tunjukkan kartu digital ini dari ponsel Anda atau bawa hasil cetak fisik ke petugas sirkulasi.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 rounded-chip bg-primary shrink-0" />
                <span>QR token ini terenkripsi unik dan terhubung ke catatan sirkulasi perpustakaan sekolah.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 rounded-chip bg-primary shrink-0" />
                <span>Jaga kerahasiaan tautan kartu digital Anda dan jangan bagikan kepada pihak yang tidak berwenang.</span>
              </li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <div className="border-t border-rule bg-white py-6 px-4">
        <div className="mx-auto max-w-3xl">
          <SchoolFooter />
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
