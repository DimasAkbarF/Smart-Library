#!/usr/bin/env node
/**
 * Terapkan metadata koleksi buku (author/isbn/tahun/penerbit/sampul) dari CSV
 * ke tabel `books`.
 *
 * Usage:
 *   node scripts/apply-book-metadata.mjs --file docs/koleksi-buku.csv          (terapkan)
 *   node scripts/apply-book-metadata.mjs --file docs/koleksi-buku.csv --dry    (lihat dulu)
 *
 * Aturan:
 * - Dicocokkan berdasarkan JUDUL (case-insensitive). Judul tidak pernah diubah.
 * - Hanya kolom yang terisi di CSV yang diperbarui; kolom kosong di CSV tidak
 *   menimpa data yang sudah ada.
 * - Baris yang judulnya tidak ditemukan dilaporkan, bukan dihapus.
 * - ISBN dinormalisasi (spasi/strip dibuang).
 * - Semua perubahan dicatat di audit_logs (tanpa nilai sensitif).
 */

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const args = process.argv.slice(2);
const fileArg = args.find((a) => a.startsWith("--file="));
const fileIdx = args.indexOf("--file");
const dry = args.includes("--dry");
const file =
  fileArg?.split("=")[1] ?? (fileIdx >= 0 ? args[fileIdx + 1] : "docs/koleksi-buku.csv");

if (!existsSync(file)) {
  console.error(`File tidak ditemukan: ${file}`);
  console.error("Buat template dulu: node scripts/export-book-metadata.mjs");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Parser CSV sederhana (mendukung kutip & newline di dalam sel). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const rows = parseCsv(readFileSync(file, "utf8"));
if (rows.length < 2) {
  console.error("CSV tidak berisi data.");
  process.exit(1);
}
const header = rows[0].map((h) => h.trim().toLowerCase());
const idx = (name) => header.indexOf(name);

const { data: books, error } = await supabase
  .from("books")
  .select("id, title, author, isbn, publication_year, publisher, cover_url");
if (error) {
  console.error("Gagal membaca buku:", error.message);
  process.exit(1);
}

/**
 * Normalisasi judul untuk pencocokan: Excel bisa membuang/menambah tanda kutip
 * saat menyimpan CSV, dan beberapa judul lama di database punya tanda kutip
 * (mis. `"Ao No Exorcist"`). Pencocokan dibuat toleran agar tidak salah target.
 */
function normalizeTitle(t) {
  return (t ?? "")
    .replace(/^[\s"']+|[\s"']+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const byTitle = new Map();
for (const b of books ?? []) {
  const key = normalizeTitle(b.title);
  if (!byTitle.has(key)) byTitle.set(key, b);
}

let updated = 0;
let skipped = 0;
const notFound = [];

const malformed = [];

for (let r = 1; r < rows.length; r++) {
  const cells = rows[r];
  const title = (cells[idx("title")] ?? "").trim();
  if (!title) continue;

  // Baris dengan jumlah kolom berbeda dari header = salah tempel (mis. kolom
  // terhapus di Excel). Lewati, jangan menulis data yang bergeser ke kolom lain.
  if (cells.length !== header.length) {
    malformed.push({ row: r + 1, title, kolom: cells.length, diharapkan: header.length });
    continue;
  }

  const book = byTitle.get(normalizeTitle(title));
  if (!book) {
    notFound.push(title);
    continue;
  }

  const patch = {};
  const author = (cells[idx("author")] ?? "").trim();
  const isbn = (cells[idx("isbn")] ?? "").replace(/[-\s]/g, "").trim();
  const year = (cells[idx("publication_year")] ?? "").trim();
  const publisher = (cells[idx("publisher")] ?? "").trim();
  const cover = (cells[idx("cover_url")] ?? "").trim();

  if (author && author !== book.author) patch.author = author;
  if (isbn && isbn !== book.isbn) patch.isbn = isbn;
  if (year) {
    const y = Number(year);
    if (!Number.isNaN(y) && y !== book.publication_year) patch.publication_year = y;
  }
  if (publisher && publisher !== book.publisher) patch.publisher = publisher;
  if (cover && cover !== book.cover_url) patch.cover_url = cover;

  if (Object.keys(patch).length === 0) {
    skipped++;
    continue;
  }

  if (dry) {
    updated++;
    console.log(`  (dry) ${title} → ${JSON.stringify(patch)}`);
    continue;
  }

  const { error: upErr } = await supabase.from("books").update(patch).eq("id", book.id);
  if (upErr) {
    console.error(`  ❌ ${title}: ${upErr.message}`);
    continue;
  }
  updated++;
  console.log(`  ✅ ${title} → ${Object.keys(patch).join(", ")}`);
}

if (!dry && updated > 0) {
  await supabase.from("audit_logs").insert({
    actor_user_id: null,
    action: "books.metadata_bulk_update",
    entity_type: "book",
    entity_id: "bulk",
    metadata: { updated, skipped, not_found: notFound.length, malformed: malformed.length, source: file },
  });
}

console.log(`\n${dry ? "DRY RUN" : "SELESAI"}: ${updated} diperbarui, ${skipped} tidak berubah, ${notFound.length} judul tidak ditemukan, ${malformed.length} baris tidak valid.`);
if (malformed.length) {
  console.log("Baris dilewati karena jumlah kolom tidak sesuai header:");
  malformed.slice(0, 10).forEach((m) =>
    console.log(`  - baris ${m.row} (${m.kolom} kolom, seharusnya ${m.diharapkan}): ${m.title}`),
  );
  if (malformed.length > 10) console.log(`  ... dan ${malformed.length - 10} lainnya`);
}
if (notFound.length) {
  console.log("Judul tidak ditemukan di database:");
  notFound.slice(0, 20).forEach((t) => console.log(`  - ${t}`));
  if (notFound.length > 20) console.log(`  ... dan ${notFound.length - 20} lainnya`);
}
