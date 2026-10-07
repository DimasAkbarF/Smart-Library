/**
 * Seed akun demo + data contoh.
 * Jalankan: npm run seed   (butuh .env.local terisi)
 *
 * Akun yang dibuat:
 *   admin / admin123   → Admin Data
 *   penjaga / jaga123  → Penjaga Perpustakaan
 *   20260001 / siswa123 → Siswa (Dimas Pratama, VII-A)
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
  if (m) process.env[m[1]] = m[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

// Preflight: host harus bisa dihubungi sebelum lanjut
try {
  const ping = await supabase.from("library_policies").select("id").eq("id", 1).single();
  if (ping.error) throw new Error(ping.error.message);
} catch (e) {
  throw new Error(
    `Tidak dapat menghubungi Supabase (${process.env.NEXT_PUBLIC_SUPABASE_URL}). ` +
    `Penyebab: ${e.message}. Pastikan Project URL benar, project Active, dan schema.sql sudah dijalankan.`,
  );
}

const users = [
  { username: "admin", email: "admin@sekolah.local", password: "admin123", full_name: "Admin Perpustakaan", role: "admin" },
  { username: "penjaga", email: "penjaga@sekolah.local", password: "jaga123", full_name: "Penjaga Perpustakaan", role: "librarian" },
  { username: "20260001", email: "siswa@sekolah.local", password: "siswa123", full_name: "Dimas Pratama", role: "student" },
];

function fail(step, res) {
  const detail = res?.error ? JSON.stringify(res.error) : "respon kosong tanpa user";
  throw new Error(`${step} gagal: ${detail}`);
}

const userIds = {};

for (const u of users) {
  const created = await supabase.auth.admin.createUser({ email: u.email, password: u.password, email_confirm: true });
  let userId = created.data?.user?.id;
  if (!userId) {
    // Sudah ada dari seed sebelumnya: cari lewat daftar user
    const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (list.error) fail("listUsers", list);
    userId = list.data?.users?.find((x) => x.email === u.email)?.id;
  }
  if (!userId) fail("createUser " + u.email, created);
  userIds[u.username] = userId;
  const prof = await supabase.from("profiles").upsert(
    { id: userId, username: u.username, email: u.email, full_name: u.full_name, role: u.role, status: "active" },
    { onConflict: "id" },
  );
  if (prof.error) fail("profiles.upsert " + u.username, prof);
  console.log("OK akun:", u.username);
}

// Siswa contoh tertaut ke akun siswa
const { data: kelas } = await supabase.from("classes").select("id").eq("name", "VII-A").single();
const siswa = await supabase.from("students").upsert(
  { nis: "20260001", name: "Dimas Pratama", class_id: kelas?.id ?? null, qr_token: "SIS-20260001", status: "active",
    user_id: userIds["20260001"] },
  { onConflict: "nis" },
);
if (siswa.error) fail("students.upsert", siswa);
console.log("OK siswa: 20260001");

// Buku contoh + eksemplar
const { data: kat } = await supabase.from("categories").select("id, name");
const fiksi = kat?.find((c) => c.name === "Fiksi")?.id ?? null;
const pelajaran = kat?.find((c) => c.name === "Pelajaran")?.id ?? null;
const contoh = [
  { title: "Laskar Pelangi", author: "Andrea Hirata", publisher: "Bentang Pustaka", publication_year: 2005, category_id: fiksi, copies: 3, location: "Rak A-1" },
  { title: "Bumi", author: "Tere Liye", publisher: "Gramedia", publication_year: 2014, category_id: fiksi, copies: 2, location: "Rak A-1" },
  { title: "Matematika Kelas VII", author: "Tim Kemdikbud", publisher: "Kemdikbud", publication_year: 2023, category_id: pelajaran, copies: 5, location: "Rak B-2" },
];
for (const b of contoh) {
  const { data: ada } = await supabase.from("books").select("id").eq("title", b.title).single();
  const bookId = ada?.id ?? (await supabase.from("books").insert({
    title: b.title, author: b.author, publisher: b.publisher,
    publication_year: b.publication_year, category_id: b.category_id,
  }).select("id").single()).data?.id;
  if (!bookId) continue;
  const { count } = await supabase.from("book_copies").select("id", { count: "exact", head: true }).eq("book_id", bookId);
  const kurang = b.copies - (count ?? 0);
  if (kurang > 0) {
    await supabase.from("book_copies").insert(
      Array.from({ length: kurang }, () => ({ book_id: bookId, inventory_code: "", qr_token: "", location: b.location })),
    );
  }
  console.log("OK buku:", b.title);
}
console.log("\nSelesai. Masuk dengan username di atas.");
