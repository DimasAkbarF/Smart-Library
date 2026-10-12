"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Printer, Download, Plus, ArrowRight, BookOpen } from "lucide-react";
import { createBookWithCopies } from "@/features/admin/books";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { QrImg } from "@/components/library/qr-img";
import type { Category } from "@/lib/types";

export function BookCreateForm({ categories }: { categories: Category[] }) {
  const [state, action] = useActionState(createBookWithCopies, {});
  const [printing, setPrinting] = useState(false);

  const handlePrintAll = async () => {
    if (!state.book || !state.copies?.length) return;
    try {
      setPrinting(true);
      const QRCode = (await import("qrcode")).default;
      const copiesData = await Promise.all(
        state.copies.map(async (c) => ({
          ...c,
          qrUrl: await QRCode.toDataURL(c.qr_token, { width: 300, margin: 1 }),
        }))
      );
      const printWin = window.open("", "_blank");
      if (!printWin) return;
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Label QR - ${state.book.title}</title>
            <style>
              @page { size: auto; margin: 8mm; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 10px; color: #0f172a; }
              .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
              .label-card { border: 1.5px solid #0f172a; border-radius: 8px; padding: 10px; text-align: center; break-inside: avoid; }
              .school { font-size: 9px; font-weight: 700; color: #475569; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: 0.05em; }
              .qr-box { margin: 0 auto; width: 110px; height: 110px; }
              .qr-box img { width: 100%; height: 100%; display: block; }
              .code { font-family: ui-monospace, monospace; font-size: 13px; font-weight: 800; margin: 6px 0 2px 0; }
              .title { font-size: 11px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
              .meta { font-size: 10px; color: #475569; margin: 2px 0 0 0; }
            </style>
          </head>
          <body>
            <div class="grid">
              ${copiesData
                .map(
                  (c) => `
                <div class="label-card">
                  <div class="school">SMPN 17 TANGERANG SELATAN</div>
                  <div class="qr-box"><img src="${c.qrUrl}" alt="QR" /></div>
                  <div class="code">${c.inventory_code}</div>
                  <div class="title">${state.book?.title}</div>
                  <div class="meta">${c.location ? `Rak: ${c.location}` : "Perpustakaan"}</div>
                </div>
              `
                )
                .join("")}
            </div>
            <script>
              window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 600); };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();
    } catch (e) {
      console.error("Gagal mencetak", e);
    } finally {
      setPrinting(false);
    }
  };

  const downloadCopyPng = async (token: string, code: string) => {
    try {
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(token, { width: 512, margin: 2 });
      const a = document.createElement("a");
      a.href = url;
      a.download = `QR-BUKU-${code}.png`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  // Jika buku dan eksemplar berhasil dibuat, tampilkan QR Showcase
  if (state?.ok && state?.book && state?.copies) {
    return (
      <div className="space-y-6 animate-rise">
        {/* Banner Sukses */}
        <section className="rounded-xl border border-leaf/40 bg-leaf-soft/30 p-6 shadow-xs">
          <div className="flex items-start gap-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-leaf text-white shrink-0 shadow-xs">
              <CheckCircle2 className="size-7" />
            </span>
            <div className="space-y-1">
              <span className="font-mono text-meta font-bold tracking-wider text-leaf-deep uppercase">
                Registrasi Berhasil & QR Siap Dipakai
              </span>
              <h2 className="font-display text-title font-bold text-ink">
                Buku &ldquo;{state.book.title}&rdquo; Berhasil Didaftarkan!
              </h2>
              <p className="text-body text-ink-muted leading-relaxed">
                Penulis: <strong className="text-ink">{state.book.author}</strong>. Sebanyak{" "}
                <strong className="text-ink font-semibold">{state.copies.length} eksemplar fisik</strong> telah
                dibuat dengan kode inventaris dan QR Code unik otomatis.
              </p>
            </div>
          </div>
        </section>

        {/* Grid Preview QR Eksemplar */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline pb-3">
            <div>
              <h3 className="font-display text-body font-bold text-ink">
                Label QR Eksemplar Fisik ({state.copies.length})
              </h3>
              <p className="text-meta text-ink-muted">
                Tempelkan stiker kode QR ini pada punggung atau sampul buku fisik.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handlePrintAll}
                disabled={printing}
                className="gap-2 shadow-xs"
              >
                <Printer className="size-4" />
                <span>Cetak Semua Label QR</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {state.copies.map((copy) => (
              <div
                key={copy.id}
                className="rounded-card border-2 border-outline bg-background p-4 text-center shadow-xs flex flex-col justify-between"
              >
                <div>
                  <p className="font-mono text-micro font-bold tracking-wider text-sky-deep uppercase">
                    SMPN 17 TANGSEL
                  </p>
                  <p className="font-semibold text-label text-ink truncate mt-0.5" title={state.book?.title}>
                    {state.book?.title}
                  </p>

                  <div className="my-2.5 mx-auto flex w-fit items-center justify-center rounded border border-outline bg-white p-2">
                    <QrImg token={copy.qr_token} size={110} />
                  </div>

                  <p className="font-mono text-label font-bold text-ink">
                    {copy.inventory_code}
                  </p>
                  {copy.location && (
                    <span className="inline-block mt-1 rounded bg-surface-sunken px-2 py-0.5 font-mono text-micro text-ink-muted">
                      Rak: {copy.location}
                    </span>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-outline/70">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadCopyPng(copy.qr_token, copy.inventory_code)}
                    className="w-full gap-1.5 text-label py-1"
                  >
                    <Download className="size-3.5" />
                    <span>Unduh PNG</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Navigasi Lanjutan */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-outline">
          <Link href={`/admin/books/${state.book.id}`}>
            <Button variant="secondary" className="gap-2">
              <BookOpen className="size-4" />
              <span>Buka Detail Buku Ini</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>

          <Link href="/admin/books">
            <Button variant="secondary">
              <span>Kembali ke Katalog Buku</span>
            </Button>
          </Link>

          <Button
            type="button"
            variant="ghost"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <Plus className="size-4" />
            <span>Tambah Judul Buku Lain</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="grid max-w-2xl gap-4">
      <Field label="Judul Buku">
        <Input name="title" required placeholder="Judul buku" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Penulis">
          <Input name="author" placeholder="Nama penulis" />
        </Field>
        <Field label="Penerbit">
          <Input name="publisher" placeholder="Penerbit" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tahun terbit">
          <Input name="publication_year" inputMode="numeric" placeholder="2024" />
        </Field>
        <Field label="ISBN">
          <Input name="isbn" placeholder="ISBN" />
        </Field>
      </div>
      <Field label="Kategori">
        <Select name="category_id" defaultValue="">
          <option value="">Tanpa kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="URL sampul (opsional)">
        <Input name="cover_url" type="url" placeholder="https://…" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jumlah eksemplar">
          <Input name="copy_count" inputMode="numeric" defaultValue="1" required />
          <span className="text-meta text-ink-subtle">
            Setiap eksemplar akan dibuatkan QR Code unik otomatis (BOOK-xxxxxx).
          </span>
        </Field>
        <Field label="Lokasi rak">
          <Input name="location" placeholder="cth. RAK-A1" />
        </Field>
      </div>

      {state?.message && (
        <p role="alert" className="text-body font-semibold text-danger">
          {state.message}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <SubmitButton>Simpan Buku & Buat QR Code</SubmitButton>
        <Link
          href="/admin/books"
          className="inline-flex min-h-12 items-center rounded-md border border-outline px-5 font-display font-semibold hover:bg-surface"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
