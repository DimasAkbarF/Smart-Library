"use client";

import { useState } from "react";
import { QrImg } from "@/components/library/qr-img";
import { DownloadQrButton } from "@/components/library/download-qr-button";
import { CopyStatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Printer, Eye } from "lucide-react";
import type { BookCopy } from "@/lib/types";

export function QrPreviewGrid({
  copies,
}: {
  copies: (BookCopy & { qr_token: string; book_title: string })[];
}) {
  const [selectedCopy, setSelectedCopy] = useState<(BookCopy & { qr_token: string; book_title: string }) | null>(null);

  const handlePrintSingle = () => {
    if (!selectedCopy) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label QR - ${selectedCopy.inventory_code}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #fff;
            }
            .label-card {
              width: 280px;
              border: 2px solid #0f172a;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
            }
            .title {
              font-size: 14px;
              font-weight: 800;
              letter-spacing: 0.05em;
              margin: 0 0 2px 0;
            }
            .school {
              font-size: 11px;
              color: #475569;
              margin: 0 0 12px 0;
            }
            .code {
              font-family: monospace;
              font-size: 16px;
              font-weight: 700;
              margin: 12px 0 4px 0;
            }
            .book-title {
              font-size: 13px;
              color: #1e293b;
              font-weight: 600;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <h1 class="title">SMART LIBRARY</h1>
            <p class="school">SMP Negeri 17 Tangerang Selatan</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(selectedCopy.qr_token)}" width="140" height="140" alt="QR" />
            <p class="code">${selectedCopy.inventory_code}</p>
            <p class="book-title">${selectedCopy.book_title}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      <div className="print-sheet grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {copies.map((c) => (
          <div
            key={c.id}
            onClick={() => setSelectedCopy(c)}
            className="group relative flex flex-col items-center rounded-card border border-outline bg-background p-4 text-center shadow-xs transition-all duration-200 hover:border-sky hover:shadow-card cursor-pointer"
          >
            {/* Quick hover action pill */}
            <div className="no-print absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex size-7 items-center justify-center rounded-full bg-sky text-white shadow-xs">
                <Eye className="size-3.5" />
              </span>
            </div>

            {/* QR Code with soft canvas surface */}
            <div className="rounded-lg bg-surface-sunken/60 p-2.5 transition-transform group-hover:scale-102">
              <QrImg token={c.qr_token} size={120} />
            </div>

            {/* Inventory Code */}
            <p className="mt-3 font-mono text-sm font-bold text-ink">
              {c.inventory_code || "—"}
            </p>

            {/* Book Title */}
            <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-ink-muted group-hover:text-sky-deep transition-colors">
              {c.book_title}
            </p>

            {/* School label */}
            <p className="mt-1 text-[11px] text-ink-subtle">
              SMP Negeri 17 Tangerang Selatan
            </p>

            {/* Hover details badge */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <CopyStatusChip status={c.status} />
            </div>

            {/* Action buttons on card footer */}
            <div className="no-print mt-3 flex items-center gap-1.5 pt-2 border-t border-outline/60 w-full justify-center">
              <span className="text-[11px] font-semibold text-sky-deep group-hover:underline">
                Klik untuk pratinjau
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Signature Preview Modal */}
      {selectedCopy && (
        <Dialog
          open={!!selectedCopy}
          onClose={() => setSelectedCopy(null)}
          title="Pratinjau Label QR Buku"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Official Label Card Frame */}
            <div className="w-full max-w-[280px] rounded-card border-2 border-ink bg-white p-6 shadow-card text-ink">
              <div className="border-b border-ink/20 pb-2 mb-3">
                <p className="font-display text-sm font-bold tracking-wider">SMART LIBRARY</p>
                <p className="text-[10px] text-ink-muted">SMP Negeri 17 Tangerang Selatan</p>
              </div>

              <div className="flex justify-center my-3">
                <QrImg token={selectedCopy.qr_token} size={150} />
              </div>

              <div className="border-t border-ink/20 pt-2 mt-3">
                <p className="font-mono text-base font-bold text-ink tracking-wide">
                  {selectedCopy.inventory_code}
                </p>
                <p className="font-semibold text-xs text-ink truncate mt-0.5">
                  {selectedCopy.book_title}
                </p>
                <p className="text-[10px] text-ink-subtle mt-1">
                  Koleksi Resmi Perpustakaan
                </p>
              </div>
            </div>

            {/* Metadata information */}
            <div className="w-full rounded-lg bg-surface p-3 text-xs text-left space-y-1.5 text-ink-muted">
              <div className="flex justify-between">
                <span>Status Eksemplar:</span>
                <CopyStatusChip status={selectedCopy.status} />
              </div>
              <div className="flex justify-between">
                <span>Lokasi Rak:</span>
                <span className="font-semibold text-ink">{selectedCopy.location || "Rak Utama"}</span>
              </div>
              <div className="flex justify-between">
                <span>Kondisi Fisik:</span>
                <span className="font-semibold text-ink">{selectedCopy.condition || "Baik"}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 w-full pt-2">
              <Button
                type="button"
                onClick={handlePrintSingle}
                className="flex-1 gap-2"
                size="md"
              >
                <Printer className="size-4" />
                <span>Cetak Label</span>
              </Button>
              <div className="flex-1">
                <DownloadQrButton
                  token={selectedCopy.qr_token}
                  label={`QR-${selectedCopy.inventory_code || "label"}`}
                />
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
