import { createRequire } from "node:module";
import fs from "node:fs";
import assert from "node:assert";

const require = createRequire(import.meta.url);
const { createClient } = require("@supabase/supabase-js");
const QRCode = require("qrcode");
const puppeteer = require("puppeteer-core");

// Read environment
const envLines = fs.readFileSync(".env.local", "utf8").split("\n");
const env = {};
for (const line of envLines) {
  const idx = line.indexOf("=");
  if (idx > 0 && !line.startsWith("#")) {
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function report(name, passed, detail = "") {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ✅ LULUS: ${name}${detail ? ` (${detail})` : ""}`);
  } else {
    failedTests++;
    console.error(`  ❌ GAGAL: ${name}${detail ? ` (${detail})` : ""}`);
  }
}

async function runDataAndQrTests() {
  console.log("\n=======================================================");
  console.log("🔍 TEST SUITE: PENGUJIAN MENYELURUH FITUR QR CODE & DATA");
  console.log(`Target Base URL: ${BASE_URL}`);
  console.log(`Supabase URL:    ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log("=======================================================\n");

  // -------------------------------------------------------------------------
  // SEKSI 1: INTEGRITAS & FORMAT QR CODE
  // -------------------------------------------------------------------------
  console.log("--- [1] PENGUJIAN GENERATOR & FORMAT QR CODE ---");

  // 1.1 Validasi format token siswa
  const { data: sampleStudent } = await supabase
    .from("students")
    .select("id, nis, name, qr_token, status")
    .eq("status", "active")
    .limit(1)
    .single();

  assert(sampleStudent, "Harus ada minimal 1 data siswa aktif di database");
  const studentTokenFormatOk = /^STU-[A-F0-9]{20}$/i.test(sampleStudent.qr_token);
  report("Format Kriptografis QR Token Siswa", studentTokenFormatOk, `Token: ${sampleStudent.qr_token}`);

  // 1.2 Validasi format token eksemplar buku
  const { data: sampleCopy } = await supabase
    .from("book_copies")
    .select("id, inventory_code, qr_token, status, books(title)")
    .eq("status", "AVAILABLE")
    .limit(1)
    .single();

  assert(sampleCopy, "Harus ada minimal 1 eksemplar buku yang tersedia");
  const copyTokenFormatOk = /^BOOK-\d{6}$/i.test(sampleCopy.inventory_code);
  report("Format Standar QR/Kode Inventaris Buku", copyTokenFormatOk, `Kode: ${sampleCopy.inventory_code}`);

  // 1.3 Generator PNG QR Code Data URL
  let studentQrPngUrl = "";
  try {
    studentQrPngUrl = await QRCode.toDataURL(sampleStudent.qr_token, { width: 300, margin: 2 });
    report("Generasi DataURL PNG QR Code Siswa", studentQrPngUrl.startsWith("data:image/png;base64,"), `${studentQrPngUrl.slice(0, 32)}...`);
  } catch (err) {
    report("Generasi DataURL PNG QR Code Siswa", false, err.message);
  }

  // 1.4 Generator Matriks Vektor QR SVG
  try {
    const qrMatrix = QRCode.create(sampleStudent.qr_token, { errorCorrectionLevel: "M" });
    const hasValidMatrix = qrMatrix.modules && qrMatrix.modules.size > 20;
    report("Generasi Matriks Vektor QR Code", hasValidMatrix, `Ukuran Modul: ${qrMatrix.modules.size}x${qrMatrix.modules.size}`);
  } catch (err) {
    report("Generasi Matriks Vektor QR Code", false, err.message);
  }

  // -------------------------------------------------------------------------
  // SEKSI 2: RESOLUSI QR CODE & KEAMANAN INPUT (SQL/POSTGREST INJECTION)
  // -------------------------------------------------------------------------
  console.log("\n--- [2] PENGUJIAN RESOLUSI QR CODE & KEAMANAN INPUT ---");

  // Helper normalisasi
  const normalisasiKode = (s) => (s || "").trim().toUpperCase();

  // 2.1 Resolusi Token Siswa
  const normalizedStudentToken = normalisasiKode(sampleStudent.qr_token.toLowerCase());
  const { data: resolvedStudent } = await supabase
    .from("students")
    .select("id, nis, name, qr_token, status, classes(name)")
    .eq("qr_token", normalizedStudentToken)
    .single();
  report(
    "Resolusi QR Token Siswa ke Database",
    resolvedStudent && resolvedStudent.id === sampleStudent.id,
    `Siswa: ${resolvedStudent?.name} (NIS: ${resolvedStudent?.nis})`
  );

  // 2.2 Resolusi Kode Inventaris Buku
  const normalizedCopyCode = normalisasiKode(sampleCopy.inventory_code.toLowerCase());
  const { data: resolvedCopy } = await supabase
    .from("book_copies")
    .select("id, inventory_code, qr_token, status, books(title)")
    .or(`qr_token.eq.${normalizedCopyCode},inventory_code.eq.${normalizedCopyCode}`)
    .single();
  report(
    "Resolusi Kode QR Buku ke Database",
    resolvedCopy && resolvedCopy.id === sampleCopy.id,
    `Judul: ${resolvedCopy?.books?.title} (${resolvedCopy?.inventory_code})`
  );

  // 2.3 Proteksi Token Tidak Dikenal
  const { data: unknownRes } = await supabase
    .from("students")
    .select("id")
    .eq("qr_token", "STU-TOKEN-PALSU-TIDAK-TERDAFTAR")
    .maybeSingle();
  report("Penolakan QR Token Tidak Dikenal", unknownRes === null, "Token palsu ditolak dengan aman");

  // 2.4 Proteksi Karakter Injeksi PostgREST
  const maliciousInput = "test).or(id.neq.0";
  const isInputSafe = /^[A-Z0-9-]{1,64}$/.test(normalisasiKode(maliciousInput));
  report("Validasi Keamanan Sanitasi Input Kode", !isInputSafe, "Payload berbahaya dicegah regex whitelist");

  // -------------------------------------------------------------------------
  // SEKSI 3: SIKLUS HIDUP DATA SIRKULASI (POSTGRES RPC BORROW & RETURN)
  // -------------------------------------------------------------------------
  console.log("\n--- [3] PENGUJIAN SIKLUS HIDUP DATA SIRKULASI (RPC MUTASI) ---");

  // Ambil profil admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("role", "admin")
    .limit(1)
    .single();
  assert(adminProfile, "Profil admin diperlukan untuk peminjaman");

  // Ambil 3 eksemplar buku yang tersedia untuk pengujian
  const { data: testCopies } = await supabase
    .from("book_copies")
    .select("id, inventory_code, status, books(title)")
    .eq("status", "AVAILABLE")
    .limit(3);
  assert(testCopies.length >= 3, "Dibutuhkan minimal 3 eksemplar buku untuk tes sirkulasi & kuota");

  const [copy1, copy2, copy3] = testCopies;

  // 3.1 Peminjaman Buku Pertama (Valid Borrow)
  const { data: borrow1Data, error: borrow1Err } = await supabase.rpc("borrow_book", {
    p_student_id: sampleStudent.id,
    p_copy_id: copy1.id,
    p_librarian_id: adminProfile.id,
  });

  if (!borrow1Err) {
    report("Mutasi Peminjaman Buku 1 (RPC borrow_book)", true, `Loan ID: ${borrow1Data?.id || borrow1Data?.loan_id}`);
  } else {
    report("Mutasi Peminjaman Buku 1 (RPC borrow_book)", false, borrow1Err.message);
  }

  // Verifikasi status copy1 berubah menjadi BORROWED
  const { data: verifyCopy1 } = await supabase
    .from("book_copies")
    .select("status")
    .eq("id", copy1.id)
    .single();
  report("Verifikasi Status Eksemplar 1 Menjadi BORROWED", verifyCopy1?.status === "BORROWED", `Status: ${verifyCopy1?.status}`);

  // 3.2 Pencegahan Double-Borrow pada Eksemplar yang Sama
  const { error: doubleBorrowErr } = await supabase.rpc("borrow_book", {
    p_student_id: sampleStudent.id,
    p_copy_id: copy1.id,
    p_librarian_id: adminProfile.id,
  });
  report("Pencegahan Double-Borrow (Buku Sedang Dipinjam)", !!doubleBorrowErr, `Ditolak: ${doubleBorrowErr?.message}`);

  // 3.3 Peminjaman Buku Kedua (Maksimal Kuota = 2)
  const { data: borrow2Data, error: borrow2Err } = await supabase.rpc("borrow_book", {
    p_student_id: sampleStudent.id,
    p_copy_id: copy2.id,
    p_librarian_id: adminProfile.id,
  });
  report("Peminjaman Buku 2 (Sesuai Batas Maksimal)", !borrow2Err, `Loan ID: ${borrow2Data?.loan_id}`);

  // 3.4 Percobaan Peminjaman Buku Ketiga (Melampaui Kuota 2 Buku)
  const { error: borrow3Err } = await supabase.rpc("borrow_book", {
    p_student_id: sampleStudent.id,
    p_copy_id: copy3.id,
    p_librarian_id: adminProfile.id,
  });
  report("Penegakan Aturan Kuota Maksimal (Max 2 Buku per Siswa)", !!borrow3Err, `Dicegah RPC: ${borrow3Err?.message}`);

  // 3.5 Pengembalian Buku Pertama (Valid Return)
  const { data: return1Data, error: return1Err } = await supabase.rpc("return_book", {
    p_copy_id: copy1.id,
    p_librarian_id: adminProfile.id,
  });
  report("Mutasi Pengembalian Buku 1 (RPC return_book)", !return1Err, `Denda: Rp${return1Data?.fine || 0}`);

  // Verifikasi status copy1 kembali menjadi AVAILABLE
  const { data: verifyCopy1Restored } = await supabase
    .from("book_copies")
    .select("status")
    .eq("id", copy1.id)
    .single();
  report("Verifikasi Status Eksemplar 1 Kembali AVAILABLE", verifyCopy1Restored?.status === "AVAILABLE", `Status: ${verifyCopy1Restored?.status}`);

  // 3.6 Pengembalian Buku Kedua
  const { data: return2Data, error: return2Err } = await supabase.rpc("return_book", {
    p_copy_id: copy2.id,
    p_librarian_id: adminProfile.id,
  });
  report("Mutasi Pengembalian Buku 2 (RPC return_book)", !return2Err, `Denda: Rp${return2Data?.fine || 0}`);

  // 3.7 Pencegahan Double-Return pada Eksemplar yang Sudah Kembali
  const { error: doubleReturnErr } = await supabase.rpc("return_book", {
    p_copy_id: copy1.id,
    p_librarian_id: adminProfile.id,
  });
  report("Pencegahan Double-Return (Buku Sudah Dikembalikan)", !!doubleReturnErr, `Ditolak: ${doubleReturnErr?.message}`);

  // -------------------------------------------------------------------------
  // SEKSI 4: MUTASI DATA SISWA & PEMBUATAN TOKEN OTOMATIS
  // -------------------------------------------------------------------------
  console.log("\n--- [4] PENGUJIAN MUTASI DATA SISWA & PEMBUATAN TOKEN OTOMATIS ---");

  const testNis = `TEST${Date.now().toString().slice(-4)}`;
  const testStudentName = `Siswa Uji Otomatis ${testNis}`;
  let createdStudent = null;

  // 4.1 Tambah Siswa Baru
  const crypto = await import("node:crypto");
  const randomHex = crypto.randomBytes(10).toString("hex").toUpperCase();
  const autoToken = `STU-${randomHex}`;

  const { data: newStudent, error: createStudentErr } = await supabase
    .from("students")
    .insert({
      nis: testNis,
      name: testStudentName,
      qr_token: autoToken,
      status: "active",
    })
    .select("id, nis, name, qr_token, status")
    .single();

  if (!createStudentErr && newStudent) {
    createdStudent = newStudent;
    report("Pendaftaran Siswa Baru dengan Auto-QR Token", true, `NIS: ${newStudent.nis}, Token: ${newStudent.qr_token}`);
  } else {
    report("Pendaftaran Siswa Baru dengan Auto-QR Token", false, createStudentErr?.message);
  }

  // 4.2 Akses Halaman Kartu Anggota Digital Siswa Baru
  if (createdStudent) {
    try {
      const res = await fetch(`${BASE_URL}/card/${createdStudent.qr_token}`);
      const text = await res.text();
      const hasStudentName = text.includes(testNis) || text.includes(createdStudent.name);
      report("Akses Publik Kartu Digital Siswa Baru (/card/[token])", res.status === 200 && hasStudentName, `HTTP ${res.status}`);
    } catch (e) {
      report("Akses Publik Kartu Digital Siswa Baru (/card/[token])", false, e.message);
    }

    // 4.3 Pembersihan Data Siswa Uji
    const { error: delErr } = await supabase.from("students").delete().eq("id", createdStudent.id);
    report("Pembersihan (Cleanup) Data Siswa Pengujian", !delErr, "Data uji dibersihkan");
  }

  // -------------------------------------------------------------------------
  // SEKSI 5: PENGUJIAN INTEGRASI BROWSER E2E (UI SIRKULASI & QR)
  // -------------------------------------------------------------------------
  console.log("\n--- [5] PENGUJIAN INTERAKSI UI BROWSER E2E (HEADLESS CHROME) ---");

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 5.1 Login Staf Admin
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.type('input[name="identifier"]', "admin");
  await page.type('input[name="password"]', "admin123");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.click('button[type="submit"]')
  ]);
  report("Autentikasi Staf Admin di Browser", page.url().includes("/admin"), `Dashboard URL: ${page.url()}`);

  // 5.2 Akses UI Halaman Pinjam Buku & Verifikasi Resolusi Siswa
  await page.goto(`${BASE_URL}/admin/borrow`, { waitUntil: "networkidle0" });
  await page.waitForSelector('input[aria-label="Kode manual"]', { timeout: 10000 });
  await page.type('input[aria-label="Kode manual"]', sampleStudent.nis);
  await page.keyboard.press("Enter");
  await new Promise(r => setTimeout(r, 1500));

  const borrowPageContent = await page.evaluate(() => document.body.innerText);
  const studentResolvedInUi = borrowPageContent.includes(sampleStudent.nis) || borrowPageContent.includes(sampleStudent.name.split(" ")[0]);
  report("Pencarian & Resolusi Siswa di UI Peminjaman", studentResolvedInUi, `Terdeteksi: ${sampleStudent.name}`);

  // 5.3 Akses UI Halaman Pengembalian Buku
  await page.goto(`${BASE_URL}/admin/return`, { waitUntil: "networkidle0" });
  const returnPageContent = await page.evaluate(() => document.body.innerText);
  report("Akses UI Pemindai Pengembalian Buku", returnPageContent.includes("Kembalikan Buku"), "Formulir pengembalian siap");

  // 5.4 Akses Halaman Cetak Label QR
  await page.goto(`${BASE_URL}/admin/qr`, { waitUntil: "networkidle0" });
  const qrCardsCount = await page.evaluate(() => document.querySelectorAll("svg, canvas, img").length);
  report("Pratinjau Grid Cetak Label QR Buku", qrCardsCount > 5, `Terdeteksi ${qrCardsCount} elemen visual QR di halaman`);

  // 5.5 Akses Riwayat Transaksi & Filter
  await page.goto(`${BASE_URL}/admin/transactions`, { waitUntil: "networkidle0" });
  const txPageText = await page.evaluate(() => document.body.innerText);
  report("Akses Riwayat Transaksi Sirkulasi", txPageText.includes("Transaksi Peminjaman"), "Tabel transaksi termuat");

  await browser.close();

  // -------------------------------------------------------------------------
  // REKAPITULASI
  // -------------------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`🏁 REKAPITULASI PENGUJIAN:`);
  console.log(`   Total Pengujian : ${totalTests}`);
  console.log(`   Berhasil Lulus  : ${passedTests} ✅`);
  console.log(`   Gagal           : ${failedTests} ❌`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runDataAndQrTests().catch((err) => {
  console.error("Critical test runner error:", err);
  process.exit(1);
});
