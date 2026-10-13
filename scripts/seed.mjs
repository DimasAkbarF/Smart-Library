/**
 * Seed akun admin/petugas + data contoh perpustakaan.
 * Jalankan: npm run seed   (butuh .env.local terisi)
 *
 * Akun yang dibuat:
 *   admin (Perpustakaan) -> Role: admin
 *   (Login siswa DIHAPUS, data siswa hanya sebagai data anggota sirkulasi)
 */
import { readFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
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

function fail(step, res) {
  const detail = res?.error ? JSON.stringify(res.error) : "respon kosong tanpa user";
  throw new Error(`${step} gagal: ${detail}`);
}

// 1. Akun Admin/Petugas (Password acak kuat jika tidak disetel di env)
const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || ("Pustaka17#" + randomBytes(5).toString("hex"));
const adminUser = {
  username: "admin",
  email: process.env.ADMIN_EMAIL || "admin@sekolah.sch.id",
  password: adminPassword,
  full_name: "Administrator Perpustakaan",
  role: "admin",
};

const created = await supabase.auth.admin.createUser({
  email: adminUser.email,
  password: adminUser.password,
  email_confirm: true,
});

let adminId = created.data?.user?.id;
if (!adminId) {
  // Jika sudah ada: perbarui kata sandi dan cari id
  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) fail("listUsers", list);
  adminId = list.data?.users?.find((x) => x.email === adminUser.email)?.id;
  if (adminId) {
    await supabase.auth.admin.updateUserById(adminId, { password: adminUser.password });
  }
}
if (!adminId) fail("createUser " + adminUser.email, created);

const prof = await supabase.from("profiles").upsert(
  {
    id: adminId,
    username: adminUser.username,
    email: adminUser.email,
    full_name: adminUser.full_name,
    role: "admin",
    status: "active",
    must_change_password: true, // Wajib ganti sandi pada login pertama
  },
  { onConflict: "id" },
);
if (prof.error) fail("profiles.upsert " + adminUser.username, prof);

console.log("\n=======================================================");
console.log("AKUN ADMIN BERHASIL DIBUAT/DIPERBARUI:");
console.log(`Username     : ${adminUser.username}`);
console.log(`Email        : ${adminUser.email}`);
console.log(`Password Baru: ${adminUser.password}`);
console.log("Catatan      : Harap simpan kata sandi ini dan ganti saat login!");
console.log("=======================================================\n");

// 2. Data Anggota Siswa (Hanya data anggota, TANPA akun login / kredensial auth)
const { data: kelas } = await supabase.from("classes").select("id").eq("name", "VII-A").single();
const studentQrToken = "STU-" + randomBytes(10).toString("hex").toUpperCase();
const siswa = await supabase.from("students").upsert(
  {
    nis: "20260001",
    name: "Dimas Pratama",
    class_id: kelas?.id ?? null,
    qr_token: studentQrToken,
    status: "active",
    user_id: null, // Tanpa login siswa
  },
  { onConflict: "nis" },
);
if (siswa.error) fail("students.upsert", siswa);
console.log(`OK Siswa Anggota: 20260001 (Token: ${studentQrToken})`);

// 3. Buku contoh + eksemplar
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
console.log("\nSelesai seeding database. Portal login siap di /login.");
