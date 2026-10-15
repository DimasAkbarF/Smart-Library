"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, Printer, Check, QrCode as QrIcon, IdCard } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrImg } from "./qr-img";
import { StudentCard } from "./student-card";

interface QrModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  code: string;
  token: string;
  meta?: string;
  type?: "student" | "book";
}

export function QrModal({
  open,
  onClose,
  title,
  subtitle,
  code,
  token,
  meta,
  type = "book",
}: QrModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadPng = async () => {
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
      a.download = `QR-${type === "student" ? `SISWA-${code}` : `BUKU-${code}`}.png`;
      a.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (e) {
      console.error("Gagal membuat QR PNG", e);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const QRCode = (await import("qrcode")).default;
      const qrDataUrl = await QRCode.toDataURL(token, { width: 360, margin: 1 });
      const logoUrl = `${window.location.origin}/logo-smpn17.png`;
      const printWin = window.open("", "_blank");
      if (!printWin) return;

      if (type === "student") {
        const initials = title
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
              <title>Kartu Pelajar - ${title} (${code})</title>
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
                .watermark img {
                  width: 42mm;
                  height: 42mm;
                  object-fit: contain;
                }
                .header {
                  display: flex;
                  align-items: center;
                  gap: 2mm;
                  border-bottom: 1px solid #0f172a;
                  padding-bottom: 1.2mm;
                  position: relative;
                  z-index: 2;
                }
                .logo {
                  width: 9.5mm;
                  height: 9.5mm;
                  object-fit: contain;
                  flex-shrink: 0;
                }
                .header-text {
                  flex: 1;
                  text-align: center;
                  line-height: 1.1;
                }
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
                .info-label { font-size: 4.5pt; color: #64748b; text-transform: uppercase; font-weight: 600; }
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
                  font-size: 7.5pt;
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
                .info-nis { font-family: monospace; font-size: 6.8pt; font-weight: 900; color: #1e3a8a; }
                .info-val { font-size: 6.2pt; font-weight: 800; color: #0f172a; }
                .validity-note { font-size: 4.2pt; color: #64748b; margin-top: 0.8mm; }

                .qr-box {
                  text-align: center;
                  background: #ffffff;
                  border: 0.8px solid #cbd5e1;
                  border-radius: 1.2mm;
                  padding: 0.8mm;
                  flex-shrink: 0;
                }
                .qr-img {
                  width: 14.5mm;
                  height: 14.5mm;
                  display: block;
                  margin: 0 auto;
                }
                .qr-code-txt {
                  font-family: monospace;
                  font-size: 4.5pt;
                  font-weight: 800;
                  margin-top: 0.4mm;
                  color: #0f172a;
                }

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
                    <div class="identity-box">
                      <div class="student-header">
                        <div class="avatar-circle">${initials}</div>
                        <div class="name-container">
                          <div class="info-label">Nama Lengkap <span class="status-badge">Siswa Aktif</span></div>
                          <div class="info-name">${title}</div>
                        </div>
                      </div>
                      <div class="meta-grid">
                        <div>
                          <div class="info-label">Nomor Induk (NIS)</div>
                          <div class="info-nis">${code}</div>
                        </div>
                        <div>
                          <div class="info-label">Rombel / Kelas</div>
                          <div class="info-val">${meta ? meta : "—"}</div>
                        </div>
                      </div>
                      <div class="validity-note">Masa Berlaku: <strong style="color: #0f172a;">Selama Siswa Aktif</strong></div>
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
      } else {
        // Label Buku Standar
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Label QR Buku - ${code}</title>
              <style>
                @page { size: auto; margin: 8mm; }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  background: #ffffff;
                  color: #0f172a;
                }
                .label-card {
                  width: 280px;
                  border: 2px solid #0f172a;
                  border-radius: 12px;
                  padding: 16px;
                  text-align: center;
                  box-sizing: border-box;
                }
                .logo-header {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  margin-bottom: 8px;
                }
                .logo-img { width: 28px; height: 28px; object-fit: contain; }
                .school-title { font-size: 11px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin: 0; }
                .qr-box { margin: 6px auto; width: 130px; height: 130px; }
                .qr-box img { width: 100%; height: 100%; display: block; }
                .code { font-family: monospace; font-size: 15px; font-weight: 800; margin: 4px 0 2px 0; }
                .main-title { font-size: 12px; font-weight: 700; line-height: 1.3; margin: 0 0 2px 0; }
                .meta { font-size: 11px; color: #475569; margin: 0; }
              </style>
            </head>
            <body>
              <div class="label-card">
                <div class="logo-header">
                  <img class="logo-img" src="${logoUrl}" alt="Logo" />
                  <p class="school-title">SMPN 17 TANGERANG SELATAN</p>
                </div>
                <div class="qr-box">
                  <img src="${qrDataUrl}" alt="QR Code" />
                </div>
                <div class="code">${code}</div>
                <div class="main-title">${title}</div>
                ${subtitle ? `<div class="meta">${subtitle}</div>` : ""}
                ${meta ? `<div class="meta" style="font-weight:600; margin-top:2px;">${meta}</div>` : ""}
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
      }
      printWin.document.close();
    } catch (e) {
      console.error("Gagal mencetak QR", e);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={type === "student" ? "Kartu Identitas Anggota Siswa" : "Label QR Koleksi Buku"}
      className={type === "student" ? "w-[min(620px,calc(100vw-2rem))]" : undefined}
    >
      <div className="space-y-5">
        {/* Card Preview */}
        {type === "student" ? (
          <div className="flex justify-center">
            <StudentCard
              student={{
                nis: code,
                name: title,
                class_name: meta?.replace("Kelas ", "").trim() || null,
                qr_token: token,
              }}
            />
          </div>
        ) : (
          <div className="rounded-panel border border-rule bg-surface-sunken-ed p-5 text-center shadow-xs space-y-3 font-plex-sans">
            <div className="flex items-center justify-center gap-2">
              <Image src="/logo-smpn17.png" alt="Logo" width={24} height={24} className="object-contain" />
              <p className="font-mono text-meta font-bold tracking-wider text-primary uppercase">
                SMP NEGERI 17 TANGERANG SELATAN
              </p>
            </div>

            <div className="mx-auto flex w-fit items-center justify-center rounded-panel border border-rule bg-white p-3 shadow-2xs">
              <QrImg token={token} size={150} />
            </div>

            <div>
              <span className="font-mono text-title font-extrabold tracking-wider text-ink block">
                {code}
              </span>
              <span className="font-display text-body font-bold text-ink block mt-0.5">
                {title}
              </span>
              {subtitle && (
                <span className="text-meta text-ink-muted block">{subtitle}</span>
              )}
              {meta && (
                <span className="inline-block mt-1 rounded-chip border border-rule bg-surface-sunken-ed px-2.5 py-0.5 font-plex-mono text-xs font-medium text-ink">
                  {meta}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Notice Info */}
        <p className="text-meta text-ink-muted text-center leading-relaxed">
          Kode QR <span className="font-mono font-semibold text-ink">{token}</span> terdaftar resmi dan siap dipindai kamera sirkulasi peminjaman & pengembalian buku.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            type="button"
            onClick={handleDownloadPng}
            disabled={downloading}
            className="flex-1 gap-2 shadow-xs"
          >
            {downloaded ? <Check className="size-4" /> : <Download className="size-4" />}
            <span>{downloaded ? "Tersimpan!" : "Unduh QR (PNG)"}</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="size-4" />
            <span>{type === "student" ? "Cetak Kartu Pelajar" : "Cetak Label Stiker"}</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export function QrQuickViewButton({
  title,
  subtitle,
  code,
  token,
  meta,
  type = "book",
  label,
}: {
  title: string;
  subtitle?: string;
  code: string;
  token: string;
  meta?: string;
  type?: "student" | "book";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const defaultLabel = type === "student" ? "Kartu Siswa" : "QR";

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-label py-1 px-2.5 h-auto shrink-0 shadow-2xs font-semibold"
        title={type === "student" ? "Lihat Kartu Anggota Siswa" : "Lihat / Unduh Label QR"}
      >
        {type === "student" ? (
          <IdCard className="size-3.5 text-primary" />
        ) : (
          <QrIcon className="size-3.5 text-primary" />
        )}
        <span>{label ?? defaultLabel}</span>
      </Button>

      <QrModal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        subtitle={subtitle}
        code={code}
        token={token}
        meta={meta}
        type={type}
      />
    </>
  );
}
