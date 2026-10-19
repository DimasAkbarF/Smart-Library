"use client";

import { useState } from "react";
import { Download, Printer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudentCardActions({
  student,
}: {
  student: {
    nis: string;
    name: string;
    class_name?: string | null;
    qr_token?: string;
  };
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const token = student.qr_token || `SIS-${student.nis}`;

  const handleDownloadQr = async () => {
    try {
      setDownloading(true);
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(token, {
        width: 600,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR-SISWA-${student.nis}.png`;
      a.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintCard = async () => {
    try {
      const QRCode = (await import("qrcode")).default;
      const qrDataUrl = await QRCode.toDataURL(token, { width: 360, margin: 1 });
      const logoUrl = `${window.location.origin}/logo-smpn17.png`;
      const printWin = window.open("", "_blank");
      if (!printWin) return;

      const initials = student.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

      function escapeHtml(str: string): string {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      const safeName = escapeHtml(student.name);
      const safeNis = escapeHtml(student.nis);
      const safeClass = student.class_name ? `Kelas ${escapeHtml(student.class_name)}` : "—";
      const safeToken = escapeHtml(token);

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Kartu Pelajar - ${safeName} (${safeNis})</title>
            <style>
              @page {
                size: auto;
                margin: 8mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                max-height: 100% !important;
                overflow: hidden !important;
                background: #ffffff !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                color: #0f172a;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
              }
              .print-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                page-break-inside: avoid;
                break-inside: avoid;
                page-break-after: avoid;
                break-after: avoid;
              }
              .guide-note {
                font-size: 7pt;
                color: #64748b;
                margin-bottom: 2mm;
                text-align: center;
                letter-spacing: 0.02em;
              }
              .card {
                width: 85.6mm;
                height: 53.98mm;
                max-width: 85.6mm;
                max-height: 53.98mm;
                border: 1.5px solid #0f172a;
                border-radius: 3.5mm;
                background: #ffffff;
                position: relative;
                overflow: hidden;
                box-sizing: border-box;
                padding: 2.4mm 3.2mm;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                page-break-inside: avoid;
                break-inside: avoid;
                page-break-after: avoid;
                break-after: avoid;
              }
              .watermark {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.06;
                pointer-events: none;
              }
              .watermark img { width: 42mm; height: 42mm; object-fit: contain; }
              .header {
                display: flex;
                align-items: center;
                gap: 2mm;
                border-bottom: 1px solid #0f172a;
                padding-bottom: 1.2mm;
                position: relative;
                z-index: 2;
              }
              .logo { width: 9.5mm; height: 9.5mm; object-fit: contain; flex-shrink: 0; }
              .header-text { flex: 1; text-align: center; line-height: 1.1; }
              .inst-1 { font-size: 5.5pt; font-weight: 700; color: #475569; text-transform: uppercase; }
              .inst-2 { font-size: 5pt; font-weight: 600; color: #64748b; text-transform: uppercase; }
              .school-name { font-size: 7.5pt; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.02em; }
              .address { font-size: 4.6pt; color: #64748b; }
              .ribbon {
                background: #1e3a8a;
                color: #ffffff;
                font-size: 5.5pt;
                font-weight: 800;
                text-align: center;
                padding: 0.7mm 0;
                margin-top: 0.8mm;
                border-radius: 0.6mm;
                letter-spacing: 0.08em;
                text-transform: uppercase;
              }
              .body-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 2.5mm;
                position: relative;
                z-index: 2;
                margin: 1mm 0;
              }
              .identity-box {
                flex: 1;
                min-width: 0;
              }
              .student-header {
                display: flex;
                align-items: center;
                gap: 2mm;
                margin-bottom: 1.2mm;
              }
              .avatar-circle {
                width: 7.5mm;
                height: 7.5mm;
                border-radius: 50%;
                background: #1e3a8a;
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 7.5pt;
                font-weight: 900;
                flex-shrink: 0;
              }
              .name-container {
                min-width: 0;
                flex: 1;
              }
              .info-label { font-size: 5pt; color: #64748b; text-transform: uppercase; font-weight: 600; }
              .status-badge {
                display: inline-block;
                background: #e0f2fe;
                color: #0369a1;
                font-size: 4pt;
                font-weight: 700;
                padding: 0.2mm 1.2mm;
                border-radius: 0.6mm;
                text-transform: uppercase;
                margin-left: 1mm;
              }
              .info-name {
                font-size: 8pt;
                font-weight: 900;
                color: #0f172a;
                line-height: 1.1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .meta-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5mm;
                padding-top: 0.8mm;
                border-top: 0.6px solid #e2e8f0;
              }
              .info-nis { font-family: monospace; font-size: 7.2pt; font-weight: 900; color: #1e3a8a; }
              .info-val { font-size: 6.6pt; font-weight: 800; color: #0f172a; }
              .validity-note { font-size: 4.8pt; color: #64748b; margin-top: 0.8mm; }
              .qr-box {
                text-align: center;
                background: #ffffff;
                border: 0.8px solid #cbd5e1;
                border-radius: 1.2mm;
                padding: 0.8mm;
                flex-shrink: 0;
              }
              .qr-img { width: 14.5mm; height: 14.5mm; display: block; margin: 0 auto; }
              .qr-code-txt { font-family: monospace; font-size: 5pt; font-weight: 800; margin-top: 0.4mm; color: #0f172a; }
              .footer {
                border-top: 0.8px solid #cbd5e1;
                padding-top: 0.8mm;
                font-size: 4.6pt;
                color: #64748b;
                display: flex;
                justify-content: space-between;
                position: relative;
                z-index: 2;
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="guide-note">✂ Potong mengikuti garis batas kartu (Ukuran Standar ID-1: 85.6 × 54.0 mm)</div>
              <div class="card">
                <div class="watermark">
                  <img src="${logoUrl}" alt="" />
                </div>
                <div class="header">
                  <img class="logo" src="${logoUrl}" alt="Logo SMPN 17" />
                  <div class="header-text">
                    <div class="inst-1">Pemerintah Kota Tangerang Selatan</div>
                    <div class="inst-2">Dinas Pendidikan dan Kebudayaan</div>
                    <div class="school-name">SMP NEGERI 17 TANGERANG SELATAN</div>
                    <div class="address">Jl. Komp. Pamulang Permai I Rt. 3 Rw. 10, Pamulang Barat, Kec. Pamulang, Kota Tangerang Selatan</div>
                  </div>
                </div>
                <div class="ribbon">Kartu Anggota Perpustakaan</div>
                <div class="body-content">
                  <div class="identity-box">
                    <div class="student-header">
                      <div class="avatar-circle">${initials}</div>
                      <div class="name-container">
                        <div class="info-label">Nama Lengkap</div>
                        <div class="info-name">${safeName}</div>
                      </div>
                    </div>
                    <div class="meta-grid">
                      <div>
                        <div class="info-label">Nomor Induk (NIS)</div>
                        <div class="info-nis">${safeNis}</div>
                      </div>
                      <div>
                        <div class="info-label">Rombel / Kelas</div>
                        <div class="info-val">${safeClass}</div>
                      </div>
                    </div>
                    <div class="validity-note">Masa Berlaku: <strong style="color: #0f172a;">Berlaku Selama Terdaftar</strong></div>
                  </div>
                  <div class="qr-box">
                    <img class="qr-img" src="${qrDataUrl}" alt="QR" />
                    <div class="qr-code-txt">${safeToken}</div>
                  </div>
                </div>
                <div class="footer">
                  <span>* Tunjukkan kartu ini saat sirkulasi buku</span>
                  <span style="font-weight: 700;">SMPN 17 TANGSEL</span>
                </div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 600);
              };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleDownloadQr}
        disabled={downloading}
        className="gap-2 min-h-[40px] sm:min-h-0 justify-center w-full sm:w-auto font-semibold"
      >
        {downloaded ? <Check className="size-4 text-success" /> : <Download className="size-4" />}
        <span>{downloaded ? "QR Tersimpan!" : "Unduh QR Pelajar (PNG)"}</span>
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handlePrintCard}
        className="gap-2 min-h-[40px] sm:min-h-0 justify-center w-full sm:w-auto font-semibold"
      >
        <Printer className="size-4" />
        <span>Cetak Kartu Fisik</span>
      </Button>
    </div>
  );
}
