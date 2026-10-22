#!/usr/bin/env node
/**
 * Export template metadata koleksi buku -> CSV untuk diisi petugas.
 *
 * Usage: node scripts/export-book-metadata.mjs
 * Output: docs/template-koleksi-buku.csv
 *
 * Kolom yang perlu diisi petugas (yang，其余 sudah terisi data saat ini):
 *   author             - penulis asli (WAJIB: 205/207 buku masih generik)
 *   isbn               - ISBN (opsional tapi sangat membantu structured data)
 *   publication_year   - tahun terbit (opsional)
 *   publisher          - penerbit (opsional)
 *   cover_url          - URL sampul (opsional, boleh kosong)
 *
 * PEMAKAIAN: hasil akhir diimpor ulang dengan
 *   node scripts/apply-book-metadata.mjs --file docs/koleksi-buku.csv
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from("books")
  .select("title, author, isbn, publication_year, publisher, cover_url, categories(name)")
  .order("title");

if (error) {
  console.error("Gagal membaca buku:", error.message);
  process.exit(1);
}

const GENERIC = new Set(["Koleksi Perpustakaan", "Tanpa penulis", ""]);

const esc = (v) => {
  const s = (v ?? "").toString();
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const header = "title,author,isbn,publication_year,publisher,cover_url,category";
const rows = (data ?? []).map((b) =>
  [
    b.title,
    GENERIC.has(b.author) ? "" : b.author, // biarkan kosong = perlu diisi petugas
    b.isbn ?? "",
    b.publication_year ?? "",
    b.publisher ?? "",
    b.cover_url ?? "",
    b.categories?.name ?? "",
  ]
    .map(esc)
    .join(","),
);

const out = [header, ...rows].join("\n");
writeFileSync("docs/template-koleksi-buku.csv", out, "utf8");

const perluDiisi = (data ?? []).filter((b) => GENERIC.has(b.author)).length;
console.log(`✅ docs/template-koleksi-buku.csv dibuat (${(data ?? []).length} buku)`);
console.log(`   ${perluDiisi} buku perlu diisi kolom 'author' (author asli).`);
console.log("   Tips: buka file di Excel/Sheets, isi kolom author (+ opsional isbn/tahun), simpan ulang sebagai CSV.");
