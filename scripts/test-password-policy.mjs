#!/usr/bin/env node
/**
 * Test kebijakan kata sandi (Blok 5).
 * Assertion-based, tanpa framework, tanpa DB.
 * Mengimpor langsung modul TS (Node 24 type-stripping) — src/lib/password.ts
 * sengaja dibuat tanpa import agar bisa diuji tanpa tooling tambahan.
 */
import assert from "node:assert/strict";

const {
  validatePassword,
  checkPasswordStrength,
  countCharacterClasses,
  PASSWORD_POLICY,
} = await import("../src/lib/password.ts");

let passed = 0;
function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✅ LULUS ${name}`);
  } catch (e) {
    console.error(`❌ GAGAL ${name}: ${e.message}`);
    process.exitCode = 1;
  }
}

/* --- 1. Minimal panjang 12 karakter --- */
check("menolak kata sandi < 12 karakter", () => {
  const r = validatePassword("Ab1!efghij"); // 10 karakter
  assert.equal(r.valid, false);
  assert.match(r.message, /minimal 12 karakter/i);
});

check("menerima kata sandi >= 12 karakter", () => {
  const r = validatePassword("Ab1!efghijkl");
  assert.equal(r.valid, true, r.message);
});

/* --- 2. Minimal 3 jenis karakter --- */
check("menolak hanya 2 jenis karakter (huruf + angka)", () => {
  const r = validatePassword("abcdefghij12");
  assert.equal(r.valid, false);
  assert.match(r.message, /minimal 3 jenis karakter/i);
});

check("menerima 3 jenis karakter (tanpa simbol)", () => {
  const r = validatePassword("Abcdefghij12");
  assert.equal(r.valid, true, r.message);
});

check("menerima 4 jenis karakter", () => {
  const r = validatePassword("Abcdefghij1!");
  assert.equal(r.valid, true, r.message);
});

check("countCharacterClasses menghitung kelas dengan benar", () => {
  assert.equal(countCharacterClasses("abc"), 1);
  assert.equal(countCharacterClasses("Abc123"), 3);
  assert.equal(countCharacterClasses("Abc123!"), 4);
});

/* --- 3. Larangan kata sandi umum / bawaan --- */
check("menolak kata sandi umum", () => {
  assert.equal(validatePassword("admin123").valid, false);
  assert.equal(validatePassword("password123").valid, false);
  assert.equal(validatePassword("perpustakaan").valid, false);
});

/* --- 4. Larangan identifier (username/NIS/email) --- */
check("menolak kata sandi yang memuat username", () => {
  const r = validatePassword("Administrator1!", { username: "administrator" });
  assert.equal(r.valid, false);
  assert.match(r.message, /username, NIS, atau email/i);
});

check("menolak kata sandi yang sama dengan email", () => {
  const r = validatePassword("Petugas@Sekolah.local1", { email: "petugas@sekolah.local" });
  assert.equal(r.valid, false);
});

/* --- 5. Panjang maksimum --- */
check("menolak kata sandi > 128 karakter", () => {
  const r = validatePassword("A1!".repeat(60));
  assert.equal(r.valid, false);
  assert.match(r.message, /maksimal 128 karakter/i);
});

/* --- 6. Indikator kekuatan (4 level) --- */
check("kekuatan: 'abc' -> lemah", () => {
  const s = checkPasswordStrength("abc");
  assert.equal(s.score, 0);
  assert.equal(s.level, "lemah");
});

check("kekuatan: sandi pendek 2 kelas -> 'lemah'", () => {
  const s = checkPasswordStrength("abc12345");
  assert.equal(s.level, "lemah");
});

check("kekuatan: 12 karakter 3 kelas -> 'sedang'", () => {
  const s = checkPasswordStrength("Abcdefgh1234");
  assert.equal(s.level, "sedang");
});

check("kekuatan: 12 karakter 4 kelas -> 'kuat'", () => {
  const s = checkPasswordStrength("Abcdefgh1234!");
  assert.equal(s.level, "kuat");
});

check("kekuatan: sandi sangat kuat -> level 'sangat kuat'", () => {
  const s = checkPasswordStrength("Abcdefgh1234!xyz");
  assert.equal(s.level, "sangat kuat");
  assert.equal(s.score, 4);
});

check("indikator kekuatan mencantumkan semua aturan", () => {
  const s = checkPasswordStrength("Abcdefgh1234!");
  const ids = s.satisfied.map((r) => r.id);
  for (const expected of ["length", "upper", "lower", "digit", "symbol", "classes", "common", "identifier"]) {
    assert.ok(ids.includes(expected), `aturan ${expected} hilang`);
  }
  assert.equal(s.satisfied.find((r) => r.id === "length").ok, true);
});

check("policy constants konsisten", () => {
  assert.equal(PASSWORD_POLICY.minLength, 12);
  assert.equal(PASSWORD_POLICY.minClasses, 3);
});

/* --- 7. Anti-leak: nilai kata sandi tidak boleh muncul di pesan --- */
check("pesan error tidak membocorkan nilai kata sandi", () => {
  const secret = "RahasiaKuat123!";
  const r = validatePassword("abc", { username: secret });
  assert.equal(r.valid, false);
  assert.ok(!JSON.stringify(r).includes(secret), "pesan error memuat nilai kata sandi");
});

console.log(`\n======================================================`);
console.log(`🔐 TEST KEBIJAKAN KATA SANDI: ${passed} LULUS, ${process.exitCode ? "ADA GAGAL" : "0 GAGAL"}`);
console.log(`======================================================`);
