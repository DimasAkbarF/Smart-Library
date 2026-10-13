#!/usr/bin/env node

/**
 * Script Opsional: Bersih-bersih Kredensial Siswa di Tabel Auth & Profiles
 * SMP Negeri 17 Tangerang Selatan
 *
 * TUJUAN:
 *   Menghapus akun login siswa dari auth.users dan profiles,
 *   TANPA MENGHAPUS data siswa (NIS, nama, kelas, qr_token) dan riwayat pinjam buku.
 *
 * PENGGUNAAN:
 *   node scripts/cleanup-student-credentials.mjs --dry-run   (Pratinjau data yang akan dibersihkan)
 *   node scripts/cleanup-student-credentials.mjs --confirm   (Eksekusi pembersihan nyata)
 */

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) process.env[m[1]] = m[2];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Kesalahan: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum disetel.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const isConfirm = process.argv.includes("--confirm");
const isDryRun = process.argv.includes("--dry-run");

if (!isConfirm && !isDryRun) {
  console.log(`
========================================================================
PERINGATAN PEMBERSIHAN KREDENSIAL SISWA (OPSIONAL)
========================================================================
Skrip ini akan menonaktifkan & menghapus seluruh akun autentikasi siswa
(auth.users & profiles dengan role = 'student').

Data anggota siswa (NIS, Nama, Rombel Kelas, Token QR) dan seluruh data
riwayat transaksi peminjaman (loans) TETAP UTUH dan TIDAK AKAN DIHAPUS.

Silakan pilih opsi eksekusi:
  node scripts/cleanup-student-credentials.mjs --dry-run
    -> Menampilkan pratinjau jumlah akun yang akan dibersihkan tanpa mengubah database.

  node scripts/cleanup-student-credentials.mjs --confirm
    -> Menjalankan pembersihan kredensial secara permanen ke database Supabase.
========================================================================
`);
  process.exit(0);
}

async function main() {
  console.log("Memeriksa data profil siswa di Supabase...");

  const { data: studentProfiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, username, email, full_name, role")
    .eq("role", "student");

  if (pErr) {
    console.error("Gagal membaca profiles:", pErr.message);
    process.exit(1);
  }

  const { data: linkedStudents, error: sErr } = await supabase
    .from("students")
    .select("id, nis, name, user_id")
    .not("user_id", "is", null);

  if (sErr) {
    console.error("Gagal membaca students:", sErr.message);
    process.exit(1);
  }

  console.log(`\nRingkasan Analisis Data:`);
  console.log(`- Jumlah profil siswa di tabel 'profiles': ${studentProfiles?.length ?? 0}`);
  console.log(`- Jumlah siswa yang tertaut 'user_id'    : ${linkedStudents?.length ?? 0}`);

  if (isDryRun) {
    console.log("\n[DRY RUN SELESAI] Tidak ada perubahan yang disimpan ke database.");
    console.log("Untuk menjalankan pembersihan sesungguhnya, jalankan dengan bendera --confirm.");
    return;
  }

  console.log("\n[EKSEKUSI PEMBERSIHAN DIMULAI...]");

  // 1. Lepaskan relasi user_id dari tabel students
  if (linkedStudents && linkedStudents.length > 0) {
    const { error: unhookErr } = await supabase
      .from("students")
      .update({ user_id: null })
      .not("user_id", "is", null);

    if (unhookErr) {
      console.error("Gagal melepaskan user_id dari tabel students:", unhookErr.message);
      process.exit(1);
    }
    console.log(`✓ Berhasil melepaskan user_id pada ${linkedStudents.length} siswa (Data NIS & nama tetap utuh).`);
  }

  // 2. Hapus entitas profiles siswa
  if (studentProfiles && studentProfiles.length > 0) {
    const studentUserIds = studentProfiles.map((p) => p.id);

    const { error: delProfErr } = await supabase
      .from("profiles")
      .delete()
      .in("id", studentUserIds);

    if (delProfErr) {
      console.error("Gagal menghapus entri profiles siswa:", delProfErr.message);
      process.exit(1);
    }
    console.log(`✓ Berhasil menghapus ${studentProfiles.length} profil siswa dari tabel profiles.`);

    // 3. Hapus akun auth.users via Supabase Admin API
    let authDeleted = 0;
    for (const uid of studentUserIds) {
      try {
        const { error: authErr } = await supabase.auth.admin.deleteUser(uid);
        if (!authErr) authDeleted++;
      } catch {
        // Abaikan jika user auth sudah tidak ada
      }
    }
    console.log(`✓ Berhasil menghapus ${authDeleted} akun auth siswa di auth.users.`);
  }

  console.log("\n=======================================================");
  console.log("PEMBERSIHAN SELESAI DENGAN AMAN.");
  console.log("Kredensial login siswa telah dibersihkan.");
  console.log("Seluruh data anggota perpustakaan dan riwayat sirkulasi tetap utuh.");
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("Galat tak terduga:", err);
  process.exit(1);
});
