"use client";

import { useState } from "react";
import Link from "next/link";
import { Drawer } from "@/components/ui/drawer";
import { LoanStatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { formatTanggal, hariTelat } from "@/lib/format";
import { User, Book, Calendar, AlertCircle, FileSpreadsheet, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Loan } from "@/lib/types";

export function TransactionsClient({
  loans,
  page,
  pageCount,
  baseUrl,
  total,
}: {
  loans: Loan[];
  page: number;
  pageCount: number;
  baseUrl: string;
  total: number;
}) {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const href = (p: number) => {
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}page=${p}`;
  };

  const allSelected = loans.length > 0 && selectedIds.length === loans.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(loans.map((l) => l.id));
    }
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  return (
    <div className="space-y-3">
      {/* Contextual Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-16 z-20 flex items-center justify-between gap-3 rounded-md border border-outline bg-background px-4 py-2.5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-bold text-sky-deep">
              {selectedIds.length} transaksi dipilih
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
              <span>Batal</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                window.open(`/api/export?type=loans&ids=${selectedIds.join(",")}`, "_blank");
                clearSelection();
              }}
              className="gap-1.5 text-xs h-8 bg-white"
            >
              <FileSpreadsheet className="size-3.5" />
              <span>Ekspor Terpilih</span>
            </Button>
          </div>
        </div>
      )}

      {/* Interactive Table with Checkboxes & Drawer trigger */}
      <div className="overflow-x-auto rounded-card border border-outline bg-background shadow-xs">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-outline bg-surface-sunken">
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Pilih semua baris"
                  className="size-4 rounded border-outline text-sky focus:ring-sky cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-xs font-bold text-ink-subtle uppercase tracking-wider font-mono">
                Siswa
              </th>
              <th className="px-4 py-3 text-xs font-bold text-ink-subtle uppercase tracking-wider font-mono">
                Buku
              </th>
              <th className="px-4 py-3 text-xs font-bold text-ink-subtle uppercase tracking-wider font-mono">
                Dipinjam
              </th>
              <th className="px-4 py-3 text-xs font-bold text-ink-subtle uppercase tracking-wider font-mono">
                Jatuh Tempo
              </th>
              <th className="px-4 py-3 text-xs font-bold text-ink-subtle uppercase tracking-wider font-mono">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/70">
            {loans.map((r) => {
              const isSelected = selectedIds.includes(r.id);
              const telat = hariTelat(r.due_at);

              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedLoan(r)}
                  className={`transition-colors duration-100 cursor-pointer ${
                    isSelected ? "bg-sky-soft/40" : "hover:bg-surface/80"
                  }`}
                >
                  <td
                    className="w-10 px-4 py-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(r.id)}
                      aria-label="Pilih baris"
                      className="size-4 rounded border-outline text-sky focus:ring-sky cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <div>
                      <span className="block font-semibold text-ink">{r.student_name}</span>
                      <span className="font-mono text-xs text-ink-subtle">
                        {r.student_nis} {r.class_name ? `· ${r.class_name}` : ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <div>
                      <span className="block font-semibold text-ink line-clamp-1">{r.book_title}</span>
                      <span className="font-mono text-xs text-ink-subtle">{r.inventory_code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <span className="text-xs text-ink-muted">{formatTanggal(r.borrowed_at)}</span>
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <div className="text-xs">
                      <span className="text-ink-muted">{formatTanggal(r.due_at)}</span>
                      {telat > 0 && r.status === "OVERDUE" && (
                        <span className="block font-bold text-coral-deep">Telat {telat} hari</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <LoanStatusChip status={r.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-xs text-ink-subtle font-medium">
          {total.toLocaleString("id-ID")} transaksi · halaman {page} dari {pageCount}
        </p>
        <nav className="flex items-center gap-1.5" aria-label="Paginasi">
          {page <= 1 ? (
            <span
              aria-disabled
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-ink-faint border border-outline/40 cursor-not-allowed"
            >
              <ChevronLeft className="size-3.5" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </span>
          ) : (
            <Link
              href={href(page - 1)}
              className="flex items-center gap-1 rounded-md border border-outline bg-background px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface hover:text-sky-deep transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </Link>
          )}

          <span
            className="px-3 py-1 rounded-md bg-surface border border-outline font-mono text-xs font-semibold text-ink"
            aria-current="page"
          >
            {page} / {pageCount}
          </span>

          {page >= pageCount ? (
            <span
              aria-disabled
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-ink-faint border border-outline/40 cursor-not-allowed"
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="size-3.5" />
            </span>
          ) : (
            <Link
              href={href(page + 1)}
              className="flex items-center gap-1 rounded-md border border-outline bg-background px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface hover:text-sky-deep transition-colors"
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="size-3.5" />
            </Link>
          )}
        </nav>
      </div>

      {/* ============================================================
          SECTION 12: DETAIL DRAWER FOR TRANSACTION
          ============================================================ */}
      <Drawer
        open={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        title="Detail Peminjaman"
        description="Informasi transaksi sirkulasi dan status peminjam"
        footer={
          selectedLoan && (
            <div className="flex items-center gap-3">
              <Link
                href={`/admin/students?q=${encodeURIComponent(selectedLoan.student_nis)}`}
                className="flex-1"
              >
                <Button variant="secondary" size="md" className="w-full gap-2 text-xs">
                  <User className="size-3.5" />
                  <span>Lihat Siswa</span>
                </Button>
              </Link>
              <Link
                href={`/librarian/books?q=${encodeURIComponent(selectedLoan.inventory_code)}`}
                className="flex-1"
              >
                <Button variant="secondary" size="md" className="w-full gap-2 text-xs">
                  <Book className="size-3.5" />
                  <span>Lihat Buku</span>
                </Button>
              </Link>
            </div>
          )
        }
      >
        {selectedLoan && (
          <div className="space-y-6">
            {/* Status Header Block */}
            <div className="rounded-lg bg-surface p-4 border border-outline flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-ink-subtle uppercase">Status Transaksi</span>
                <div className="mt-1">
                  <LoanStatusChip status={selectedLoan.status} />
                </div>
              </div>
              {selectedLoan.status === "OVERDUE" && (
                <div className="text-right text-xs">
                  <span className="text-coral-deep font-bold flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    Telat {hariTelat(selectedLoan.due_at)} hari
                  </span>
                </div>
              )}
            </div>

            {/* Siswa Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-subtle font-mono border-b border-outline pb-1">
                <User className="size-3.5 text-sky" />
                <span>Peminjam</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-ink-subtle">Nama Siswa:</span>
                  <p className="font-bold text-ink text-sm">{selectedLoan.student_name}</p>
                </div>
                <div>
                  <span className="text-ink-subtle">NIS:</span>
                  <p className="font-mono font-semibold text-ink text-sm">{selectedLoan.student_nis}</p>
                </div>
                <div>
                  <span className="text-ink-subtle">Kelas / Rombel:</span>
                  <p className="font-semibold text-ink">{selectedLoan.class_name || "—"}</p>
                </div>
                <div>
                  <span className="text-ink-subtle">Sekolah:</span>
                  <p className="font-medium text-ink-muted">SMPN 17 Tangerang Selatan</p>
                </div>
              </div>
            </div>

            {/* Buku Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-subtle font-mono border-b border-outline pb-1">
                <Book className="size-3.5 text-leaf" />
                <span>Koleksi Buku</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-ink-subtle">Judul Buku:</span>
                  <p className="font-bold text-ink text-sm">{selectedLoan.book_title}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-ink-subtle">Kode Inventaris:</span>
                    <p className="font-mono font-bold text-sky-deep">{selectedLoan.inventory_code}</p>
                  </div>
                  <div>
                    <span className="text-ink-subtle">Denda Keterlambatan:</span>
                    <p className="font-mono font-semibold text-ink">
                      {selectedLoan.fine_amount ? `Rp ${selectedLoan.fine_amount.toLocaleString("id-ID")}` : "Rp 0"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Linimasa Waktu */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-subtle font-mono border-b border-outline pb-1">
                <Calendar className="size-3.5 text-sun-deep" />
                <span>Linimasa Sirkulasi</span>
              </div>
              <div className="rounded-lg border border-outline bg-surface-sunken/40 p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Tanggal Pinjam:</span>
                  <span className="font-semibold text-ink">{formatTanggal(selectedLoan.borrowed_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Jatuh Tempo:</span>
                  <span className="font-semibold text-ink">{formatTanggal(selectedLoan.due_at)}</span>
                </div>
                {selectedLoan.returned_at && (
                  <div className="flex justify-between border-t border-outline pt-2">
                    <span className="text-ink-muted">Dikembalikan Pada:</span>
                    <span className="font-semibold text-leaf-deep">{formatTanggal(selectedLoan.returned_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
