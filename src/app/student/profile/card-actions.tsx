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

      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Kartu Pelajar - ${student.name} (${student.nis})</title>
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
              .inst-1 { font-size: 5pt; font-weight: 700; color: #475569; text-transform: uppercase; }
              .inst-2 { font-size: 4.5pt; font-weight: 600; color: #64748b; text-transform: uppercase; }
              .school-name { font-size: 7pt; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.02em; }
              .address { font-size: 4pt; color: #64748b; }
              .ribbon {
                background: #1e3a8a;
                color: #ffffff;
                font-size: 5pt;
                font-weight: 800;
                text-align: center;
                padding: 0.7mm 0;
                margin-top: 0.8mm;
                border-radius: 0.6mm;
                letter-spacing: 0.08em;
                text-transform: uppercase;
              }
              .body-content {
                display: grid;
                grid-template-columns: 13mm 1fr 17mm;
                gap: 2.2mm;
                align-items: center;
                position: relative;
                z-index: 2;
                margin: 0.8mm 0;
              }
              .avatar {
                width: 13mm;
                height: 16mm;
                border: 1px solid #0f172a;
                border-radius: 1.2mm;
                background: linear-gradient(135deg, #1d4ed8, #1e3a8a);
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9.5pt;
                font-weight: 900;
              }
              .info { font-size: 5.8pt; line-height: 1.25; }
              .info-label { font-size: 4.5pt; color: #64748b; text-transform: uppercase; }
              .info-value { font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 36mm; }
              .info-nis { font-family: monospace; font-size: 6.8pt; font-weight: 900; color: #1e3a8a; }
              .qr-box {
                text-align: center;
                background: #ffffff;
                border: 0.8px solid #cbd5e1;
                border-radius: 1.2mm;
                padding: 0.8mm;
              }
              .qr-img { width: 14.5mm; height: 14.5mm; display: block; margin: 0 auto; }
              .qr-code-txt { font-family: monospace; font-size: 4.5pt; font-weight: 800; margin-top: 0.4mm; color: #0f172a; }
              .footer {
                border-top: 0.8px solid #cbd5e1;
                padding-top: 0.8mm;
                font-size: 4.2pt;
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
                    <div class="address">Jl. Lengkong Gudang Timur, Serpong, Tangerang Selatan</div>
                  </div>
                </div>
                <div class="ribbon">Kartu Anggota Perpustakaan</div>
                <div class="body-content">
                  <div class="avatar">${initials}</div>
                  <div class="info">
                    <div>
                      <div class="info-label">Nama Siswa</div>
                      <div class="info-value" style="font-size: 6.5pt;">${student.name}</div>
                    </div>
                    <div style="margin-top: 0.8mm;">
                      <div class="info-label">Nomor Induk (NIS)</div>
                      <div class="info-nis">${student.nis}</div>
                    </div>
                    <div style="margin-top: 0.8mm;">
                      <div class="info-label">Kelas / Rombel</div>
                      <div class="info-value">${student.class_name ? `Kelas ${student.class_name}` : "—"}</div>
                    </div>
                  </div>
                  <div class="qr-box">
                    <img class="qr-img" src="${qrDataUrl}" alt="QR" />
                    <div class="qr-code-txt">${token}</div>
                  </div>
                </div>
                <div class="footer">
                  <span>* Berlaku selama menjadi siswa aktif</span>
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
    <div className="flex flex-wrap items-center gap-2.5">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleDownloadQr}
        disabled={downloading}
        className="gap-2"
      >
        {downloaded ? <Check className="size-4 text-leaf-deep" /> : <Download className="size-4" />}
        <span>{downloaded ? "QR Tersimpan!" : "Unduh QR Pelajar (PNG)"}</span>
      </Button>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handlePrintCard}
        className="gap-2"
      >
        <Printer className="size-4" />
        <span>Cetak Kartu Fisik</span>
      </Button>
    </div>
  );
}
