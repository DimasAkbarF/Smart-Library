#!/usr/bin/env node

/**
 * Script Pemulihan Darurat: Reset Kunci Akun / IP yang Terkunci (Rate Limiting)
 * SMP Negeri 17 Tangerang Selatan
 *
 * Cara Penggunaan:
 *   node scripts/reset-lockout.mjs <username_atau_ip>
 *   node scripts/reset-lockout.mjs --all
 *   node scripts/reset-lockout.mjs --list
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
  console.error("Kesalahan: Variabel lingkungan NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum disetel.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const arg = process.argv[2];

if (!arg || arg === "--help" || arg === "-h") {
  console.log(`
Petunjuk Reset Kunci Akun / IP Perpustakaan SMPN 17 Tangsel:
  node scripts/reset-lockout.mjs <identifier_atau_ip>   Reset lockout untuk user/IP tertentu
  node scripts/reset-lockout.mjs --all                 Reset semua akun/IP yang terkunci
  node scripts/reset-lockout.mjs --list                Lihat daftar entri yang sedang terkunci
`);
  process.exit(0);
}

async function main() {
  if (arg === "--list") {
    const { data, error } = await supabase
      .from("auth_rate_limits")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Gagal membaca tabel auth_rate_limits:", error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log("Tidak ada entri rate limit/lockout aktif di database.");
      return;
    }

    const now = Date.now();
    console.log(`\nDitemukan ${data.length} catatan rate limit:`);
    for (const row of data) {
      const isLocked = row.locked_until > now;
      const sisaDetik = isLocked ? Math.ceil((row.locked_until - now) / 1000) : 0;
      console.log(`- Kunci: ${row.key}`);
      console.log(`  Percobaan Gagal : ${row.count}`);
      console.log(`  Status Terkunci : ${isLocked ? `YA (sisa ${Math.ceil(sisaDetik / 60)} menit / ${sisaDetik} detik)` : "TIDAK"}`);
      console.log(`  Level Backoff   : ${row.backoff_level}`);
      console.log(`  Terakhir Update : ${row.updated_at}\n`);
    }
    return;
  }

  if (arg === "--all") {
    const { error } = await supabase
      .from("auth_rate_limits")
      .delete()
      .neq("key", "__never_match__");

    if (error) {
      console.error("Gagal mereset semua rate limit:", error.message);
      process.exit(1);
    }

    console.log("Berhasil mereset seluruh catatan rate limit dan lockout di database.");
    return;
  }

  // Reset target tertentu
  const target = arg.toLowerCase().trim();
  const keysToMatch = [
    target,
    `login:id:${target}`,
    `admin_login:id:${target}`,
    `login:ip:${target}`,
    `admin_login:ip:${target}`,
  ];

  const { error } = await supabase
    .from("auth_rate_limits")
    .delete()
    .in("key", keysToMatch);

  if (error) {
    console.error(`Gagal mereset lockout untuk '${target}':`, error.message);
    process.exit(1);
  }

  console.log(`Berhasil membuka kunci / mereset rate limit untuk: '${target}'`);
}

main().catch((err) => {
  console.error("Galat tak terduga:", err);
  process.exit(1);
});
