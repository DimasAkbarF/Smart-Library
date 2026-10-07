"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  RotateCcw,
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { importBooks, type ImportBookRow } from "@/features/admin/imports";
import { importStudents, type ImportStudentRow, type ImportReport } from "@/features/admin/students";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "buku" | "siswa";

const BOOK_HEADERS = [
  "title",
  "author",
  "publisher",
  "year",
  "isbn",
  "category",
  "quantity",
  "location",
] as const;

const STUDENT_HEADERS = ["nis", "name", "class"] as const;

const BOOK_FIELD_LABELS: Record<string, string> = {
  title: "Judul Buku (Wajib)",
  author: "Penulis",
  publisher: "Penerbit",
  year: "Tahun Terbit",
  isbn: "ISBN",
  category: "Kategori",
  quantity: "Jumlah Stok",
  location: "Lokasi Rak",
};

const STUDENT_FIELD_LABELS: Record<string, string> = {
  nis: "Nomor Induk Siswa / NIS (Wajib)",
  name: "Nama Lengkap (Wajib)",
  class: "Rombel Kelas (cth. VII-A)",
};

interface Parsed<T> {
  rows: T[];
  errors: { row: number; reason: string }[];
}

function sheetToRows(file: File): Promise<string[][]> {
  return file.arrayBuffer().then((buf) => {
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" });
  });
}

function parseBooks(matrix: string[][]): Parsed<ImportBookRow> {
  const [header, ...lines] = matrix;
  const idx = (h: string) => header.findIndex((c) => String(c).trim().toLowerCase() === h);
  const rows: ImportBookRow[] = [];
  const errors: Parsed<ImportBookRow>["errors"] = [];
  const seen = new Set<string>();
  lines.forEach((line, i) => {
    const rowNo = i + 2;
    if (line.every((c) => !String(c).trim())) return;
    const get = (h: string) => String(line[idx(h)] ?? "").trim();
    const title = get("title");
    if (!title) {
      errors.push({ row: rowNo, reason: "Judul wajib diisi." });
      return;
    }
    const key = `${title.toLowerCase()}|${get("author").toLowerCase()}`;
    if (seen.has(key)) {
      errors.push({ row: rowNo, reason: "Duplikat judul dan penulis dalam file." });
      return;
    }
    seen.add(key);
    rows.push({
      title,
      author: get("author"),
      publisher: get("publisher"),
      year: get("year"),
      isbn: get("isbn"),
      category: get("category"),
      quantity: get("quantity") || "1",
      location: get("location"),
    });
  });
  return { rows, errors };
}

function parseStudents(matrix: string[][]): Parsed<ImportStudentRow> {
  const [header, ...lines] = matrix;
  const idx = (h: string) => header.findIndex((c) => String(c).trim().toLowerCase() === h);
  const rows: ImportStudentRow[] = [];
  const errors: Parsed<ImportStudentRow>["errors"] = [];
  const seen = new Set<string>();
  lines.forEach((line, i) => {
    const rowNo = i + 2;
    if (line.every((c) => !String(c).trim())) return;
    const get = (h: string) => String(line[idx(h)] ?? "").trim();
    const nis = get("nis").toUpperCase().replace(/\s+/g, "");
    const name = get("name");
    if (!nis || !name) {
      errors.push({ row: rowNo, reason: "NIS dan nama wajib diisi." });
      return;
    }
    if (seen.has(nis)) {
      errors.push({ row: rowNo, reason: "Duplikat NIS dalam file." });
      return;
    }
    seen.add(nis);
    rows.push({ nis, name, class: get("class") });
  });
  return { rows, errors };
}

export function ImportClient() {
  const [tab, setTab] = useState<Tab>("buku");
  const [file, setFile] = useState<File | null>(null);
  const [bookData, setBookData] = useState<Parsed<ImportBookRow> | null>(null);
  const [studentData, setStudentData] = useState<Parsed<ImportStudentRow> | null>(null);
  const [busy, setBusy] = useState(false);
  const [tooBig, setTooBig] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [report, setReport] = useState<(ImportReport & { addedCopies?: number; newTitles?: number }) | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const data = tab === "buku" ? bookData : studentData;
  const headers = tab === "buku" ? BOOK_HEADERS : STUDENT_HEADERS;
  const fieldLabels = tab === "buku" ? BOOK_FIELD_LABELS : STUDENT_FIELD_LABELS;

  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

  // Determine current workflow step: 1 (Upload), 2 (Periksa), 3 (Konfirmasi/Importing), 4 (Hasil Selesai)
  const currentStep = report ? 4 : busy ? 3 : data ? 2 : 1;

  async function handleFileSelect(selectedFile: File | undefined) {
    if (!selectedFile) return;
    if (selectedFile.size > MAX_BYTES) {
      setFile(selectedFile);
      setBookData(null);
      setStudentData(null);
      setReport(null);
      setTooBig(true);
      return;
    }
    setTooBig(false);
    setFile(selectedFile);
    setReport(null);
    setShowErrorDetails(false);

    try {
      const matrix = await sheetToRows(selectedFile);
      if (tab === "buku") setBookData(parseBooks(matrix));
      else setStudentData(parseStudents(matrix));
    } catch (err) {
      console.error("Gagal membaca file spreadsheet:", err);
    }
  }

  function resetFile() {
    setFile(null);
    setBookData(null);
    setStudentData(null);
    setReport(null);
    setTooBig(false);
    setShowErrorDetails(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function switchTab(t: Tab) {
    setTab(t);
    resetFile();
  }

  async function onConfirm() {
    setBusy(true);
    try {
      if (tab === "buku" && bookData) {
        setReport(await importBooks(bookData.rows));
      } else if (tab === "siswa" && studentData) {
        setReport(await importStudents(studentData.rows));
      }
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const isBook = tab === "buku";
    const sampleData = isBook
      ? [
          {
            title: "Laskar Pelangi",
            author: "Andrea Hirata",
            publisher: "Bentang Pustaka",
            year: 2005,
            isbn: "978-979-3062-79-2",
            category: "Fiksi",
            quantity: 3,
            location: "Rak A-1",
          },
          {
            title: "Matematika Kelas VII",
            author: "Tim Kemdikbud",
            publisher: "Kemdikbudristek",
            year: 2023,
            isbn: "978-602-244-880-8",
            category: "Pelajaran",
            quantity: 5,
            location: "Rak B-2",
          },
        ]
      : [
          {
            nis: "20260002",
            name: "Siti Aisyah",
            class: "VII-B",
          },
          {
            nis: "20260003",
            name: "Budi Santoso",
            class: "VIII-A",
          },
        ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBook ? "Data Buku" : "Data Siswa");
    XLSX.writeFile(wb, isBook ? "template_impor_buku.xlsx" : "template_impor_siswa.xlsx");
  }

  const validCount = data?.rows.length ?? 0;
  const errCount = data?.errors.length ?? 0;
  const totalRowsInFile = validCount + errCount;

  return (
    <div className="space-y-6">
      {/* ============================================================
          PAGE HEADER WITH INSTANT TEMPLATE DOWNLOAD ACTION
          ============================================================ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline pb-5">
        <div>
          <span className="text-label font-semibold text-sky-deep font-mono tracking-wider uppercase">
            Administrasi Data · SMP Negeri 17 Tangerang Selatan
          </span>
          <h1 className="mt-1 font-display text-display-sm sm:text-display-lg font-bold tracking-tight text-ink">
            Impor Data Perpustakaan
          </h1>
          <p className="mt-1 text-body text-ink-muted">
            Tambahkan atau perbarui data koleksi buku dan anggota perpustakaan melalui file spreadsheet Excel atau CSV.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={downloadTemplate}
          className="gap-2 shrink-0 shadow-xs"
        >
          <Download className="size-4" />
          <span>Unduh Template {tab === "buku" ? "Buku" : "Siswa"} (.xlsx)</span>
        </Button>
      </header>

      {/* ============================================================
          WORKFLOW STEP INDICATOR
          1. Upload -> 2. Periksa -> 3. Import -> 4. Hasil
          ============================================================ */}
      <nav aria-label="Alur langkah impor data" className="border-b border-outline/70 pb-4">
        <ol className="flex items-center justify-between sm:justify-start sm:gap-6">
          {[
            { num: 1, label: "Upload File" },
            { num: 2, label: "Periksa Data" },
            { num: 3, label: "Konfirmasi Impor" },
            { num: 4, label: "Hasil Selesai" },
          ].map((s, idx) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <li key={s.num} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-label font-bold font-mono transition-colors",
                    isDone
                      ? "bg-leaf text-white"
                      : isCurrent
                      ? "bg-sky text-white ring-4 ring-sky-soft"
                      : "border border-outline bg-surface text-ink-subtle"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isDone ? <Check className="size-4" /> : s.num}
                </span>
                <span
                  className={cn(
                    "text-label font-semibold hidden sm:inline",
                    isCurrent ? "text-ink font-bold" : isDone ? "text-ink-muted" : "text-ink-subtle"
                  )}
                >
                  {s.label}
                </span>
                {idx < 3 && <div className="hidden sm:block w-8 sm:w-12 h-px bg-outline ml-2" />}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* ============================================================
          DATA TYPE SEGMENTED TOGGLE (Buku vs Siswa)
          ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-outline bg-surface-sunken p-1" role="tablist" aria-label="Kategori data yang diimpor">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "buku"}
            onClick={() => switchTab("buku")}
            disabled={busy}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-label font-semibold transition-colors cursor-pointer",
              tab === "buku"
                ? "bg-background text-ink shadow-xs font-bold"
                : "text-ink-muted hover:text-ink"
            )}
          >
            <BookOpen className="size-4 text-sky-deep" />
            <span>Koleksi Buku</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "siswa"}
            onClick={() => switchTab("siswa")}
            disabled={busy}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-2 text-label font-semibold transition-colors cursor-pointer",
              tab === "siswa"
                ? "bg-background text-ink shadow-xs font-bold"
                : "text-ink-muted hover:text-ink"
            )}
          >
            <Users className="size-4 text-sky-deep" />
            <span>Anggota Siswa</span>
          </button>
        </div>

        <span className="text-meta text-ink-muted">
          Format kolom wajib: <span className="font-mono text-ink font-semibold">{headers.slice(0, 3).join(", ")}...</span>
        </span>
      </div>

      {/* Hidden file input for keyboard & button trigger */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        className="sr-only"
        aria-label="Pilih file spreadsheet Excel atau CSV"
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
      />

      {/* ============================================================
          FILE SIZE ERROR ALERT
          ============================================================ */}
      {tooBig && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-coral/30 bg-coral-soft p-4 text-meta font-semibold text-coral-deep">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-bold text-body">Ukuran File Terlalu Besar</p>
            <p className="mt-0.5 text-coral-deep/90">
              File &ldquo;{file?.name}&rdquo; melebihi batas maksimal 5 MB. Silakan bagi file menjadi beberapa bagian yang lebih kecil.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================
          STEP 1: UPLOAD AREA (Restrained Dropzone)
          Shown when no valid data is parsed yet and no report exists
          ============================================================ */}
      {!data && !report && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileSelect(e.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Area seret atau pilih file spreadsheet"
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-sky bg-sky-soft/40"
              : "border-outline-strong/70 bg-surface/50 hover:border-sky/70 hover:bg-surface"
          )}
        >
          <span className="flex size-14 items-center justify-center rounded-xl bg-sky-soft text-sky-deep shadow-2xs">
            <Upload className="size-7" aria-hidden />
          </span>
          <h2 className="mt-4 font-display text-body sm:text-title font-bold text-ink">
            Seret file ke sini atau pilih dari perangkat
          </h2>
          <p className="mt-1 text-meta text-ink-muted">
            Mendukung file spreadsheet <strong className="text-ink">.xlsx</strong> atau format teks <strong className="text-ink">.csv</strong> (Maksimal 5 MB)
          </p>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="mt-4 gap-2"
          >
            <FileSpreadsheet className="size-4 text-sky-deep" />
            <span>Pilih File dari Komputer</span>
          </Button>
        </div>
      )}

      {/* ============================================================
          STEP 2 & 3: AFTER UPLOAD (File Summary + Validation + Preview + Action)
          ============================================================ */}
      {file && data && !report && (
        <div className="space-y-6">
          {/* File Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-outline bg-background p-4 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex size-11 items-center justify-center rounded-lg bg-sky-soft text-sky-deep shrink-0">
                <FileSpreadsheet className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-body font-bold text-ink">{file.name}</p>
                <p className="text-meta text-ink-muted">
                  {totalRowsInFile.toLocaleString("id-ID")} baris data terdeteksi · {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={resetFile}
              disabled={busy}
              className="gap-2 shrink-0 self-start sm:self-auto"
            >
              <RotateCcw className="size-3.5" />
              <span>Ganti File</span>
            </Button>
          </div>

          {/* Validation Alert */}
          {errCount === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-leaf/30 bg-leaf-soft/50 p-4 text-label font-semibold text-leaf-deep">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>Seluruh {validCount} baris data berhasil divalidasi dan siap diimpor ke sistem.</span>
            </div>
          ) : (
            <div className="rounded-lg border border-sun-deep/30 bg-sun-soft/50 p-4 text-label">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 font-bold text-sun-deep text-body">
                  <AlertTriangle className="size-5 shrink-0" />
                  <span>
                    {validCount} baris valid · {errCount} baris bermasalah (akan dilewati)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                  className="flex items-center gap-1 font-semibold text-sun-deep hover:underline cursor-pointer self-start sm:self-auto"
                >
                  <span>{showErrorDetails ? "Sembunyikan Masalah" : "Lihat Masalah"}</span>
                  {showErrorDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </button>
              </div>

              {showErrorDetails && (
                <ul className="mt-3 max-h-48 overflow-y-auto divide-y divide-sun-deep/20 border-t border-sun-deep/20 pt-2 text-ink">
                  {data.errors.slice(0, 30).map((err, i) => (
                    <li key={i} className="py-1 text-label flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-coral-deep">Baris {err.row}</span>
                      <span className="text-ink-muted text-right">{err.reason}</span>
                    </li>
                  ))}
                  {data.errors.length > 30 && (
                    <li className="pt-2 text-ink-subtle italic">...dan {data.errors.length - 30} baris lainnya.</li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Column Mapping Summary */}
          <div className="rounded-xl border border-outline bg-background p-4 sm:p-5 shadow-xs">
            <h3 className="font-display text-meta font-bold uppercase tracking-wider text-ink-subtle font-mono">
              Pemetaan Kolom Sistem
            </h3>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-label">
              {headers.map((h) => (
                <div key={h} className="flex items-center gap-1.5 rounded-md border border-outline/70 bg-surface px-2.5 py-1.5">
                  <Check className="size-3.5 text-leaf-deep shrink-0" />
                  <span className="truncate font-mono font-semibold text-ink" title={fieldLabels[h] || h}>
                    {h}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Preview Table (5-10 rows) */}
          <div className="rounded-xl border border-outline bg-background overflow-hidden shadow-xs">
            <div className="flex items-center justify-between border-b border-outline px-4 py-3 bg-surface-sunken">
              <h3 className="font-display text-meta font-bold uppercase tracking-wider text-ink-subtle font-mono">
                Pratinjau Data ({Math.min(10, data.rows.length)} dari {validCount} Baris Valid)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-body">
                <thead>
                  <tr className="border-b border-outline text-ink-muted">
                    {headers.map((h) => (
                      <th key={h} className="px-4 py-2.5 font-mono text-meta uppercase text-ink-subtle">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/70">
                  {data.rows.slice(0, 10).map((r, i) => (
                    <tr key={i} className="hover:bg-surface/60 transition-colors">
                      {headers.map((h) => (
                        <td key={h} className="px-4 py-2.5 text-label text-ink truncate max-w-48">
                          {String(((r as unknown) as Record<string, unknown>)[h] || "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Primary Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              type="button"
              size="lg"
              disabled={busy || validCount === 0}
              onClick={onConfirm}
              className="w-full sm:w-auto gap-2 shadow-xs"
            >
              {busy ? (
                <span>Memproses Impor Data…</span>
              ) : (
                <span>Impor {validCount.toLocaleString("id-ID")} Data {tab === "buku" ? "Buku" : "Siswa"}</span>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={resetFile}
              disabled={busy}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================
          STEP 4: IMPORT RESULT
          Shown when server action returns report
          ============================================================ */}
      {report && (
        <section role="status" className="rounded-xl border border-outline bg-background p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-leaf-soft text-leaf-deep shrink-0">
              <CheckCircle2 className="size-7" />
            </span>
            <div>
              <h2 className="font-display text-title font-bold text-ink">
                Impor Data Selesai
              </h2>
              <p className="mt-1 text-body text-ink-muted">
                {report.inserted.toLocaleString("id-ID")} data {tab === "buku" ? "buku" : "siswa"} berhasil ditambahkan ke database perpustakaan.
                {report.addedCopies != null && ` (${report.newTitles} judul baru, ${report.addedCopies} eksemplar fisik didaftarkan).`}
              </p>
            </div>
          </div>

          {report.failed.length > 0 && (
            <div className="rounded-lg border border-coral/30 bg-coral-soft/50 p-4 text-label text-coral-deep">
              <p className="font-bold text-body">
                {report.failed.length} Baris Memerlukan Perhatian (Gagal Disimpan):
              </p>
              <ul className="mt-2 max-h-40 overflow-y-auto divide-y divide-coral/20">
                {report.failed.slice(0, 20).map((f, i) => (
                  <li key={i} className="py-1">
                    Baris {f.row || "?"} ({f.nis || "tanpa kode"}): {f.reason}
                  </li>
                ))}
                {report.failed.length > 20 && <li className="pt-1 italic">...dan {report.failed.length - 20} data lainnya.</li>}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="button" onClick={resetFile} className="gap-2">
              <RotateCcw className="size-4" />
              <span>Impor Data Lain</span>
            </Button>
            <Link href={tab === "buku" ? "/admin/books" : "/admin/students"}>
              <Button variant="secondary">
                <span>Buka {tab === "buku" ? "Katalog Buku" : "Data Siswa"}</span>
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
