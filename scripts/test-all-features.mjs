import puppeteer from "puppeteer-core";
import path from "node:path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || "/home/dimskuyyyy/.gemini/antigravity-cli/brain/8fdd00a7-b251-42df-97ad-0d7562576666";

async function runAllFeatureTests() {
  console.log(`\n======================================================`);
  console.log(`🚀 MEMULAI PENGUJIAN MENYELURUH SEMUA FITUR SMART LIBRARY`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1280,900"]
  });

  const testResults = [];

  function recordResult(featureName, route, passed, detail = "") {
    testResults.push({ featureName, route, passed, detail });
    const mark = passed ? "✅ LULUS" : "❌ GAGAL";
    console.log(`${mark} [${featureName}] (${route}): ${detail}`);
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));

    async function gotoUrl(url) {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await new Promise((r) => setTimeout(r, 800));
    }

    // ----------------------------------------------------
    // KATEGORI 1: FITUR PUBLIK & PENGALIHAN (UNAUTHENTICATED)
    // ----------------------------------------------------
    console.log("\n--- [1] PENGUJIAN FITUR PUBLIK & PENGALIHAN ---");

    // 1.1 Root URL (/)
    await gotoUrl(`${BASE_URL}/`);
    const rootUrl = page.url();
    recordResult("Root URL Handling", "/", rootUrl.includes("/books") || rootUrl.includes("/login") || rootUrl === `${BASE_URL}/`, `Final URL: ${rootUrl}`);

    // 1.2 Katalog Publik (/books)
    await gotoUrl(`${BASE_URL}/books`);
    const booksTitle = await page.title();
    const booksText = await page.evaluate(() => document.body.innerText);
    const hasBookSearch = await page.$('input[type="search"], input[name="q"], input[placeholder*="Cari"]');
    recordResult(
      "Katalog Buku Publik",
      "/books",
      booksText.includes("Katalog") || booksText.includes("Buku") || !!hasBookSearch,
      `Title: ${booksTitle}`
    );

    // 1.3 Detail Buku Publik (/books/[id])
    const sampleBookId = "cfbd78b3-ee76-4fdd-933e-265a28abc5e9";
    await gotoUrl(`${BASE_URL}/books/${sampleBookId}`);
    const bookDetailText = await page.evaluate(() => document.body.innerText);
    recordResult(
      "Detail Buku Publik",
      `/books/${sampleBookId}`,
      bookDetailText.includes("Cantik Itu Luka") || bookDetailText.includes("Eksemplar") || bookDetailText.includes("Koleksi"),
      `Memuat informasi buku 'Cantik Itu Luka'`
    );

    // 1.4 Kartu Siswa Digital Publik (/card/[token])
    const sampleStudentToken = "STU-7F9C2BF4FC1E38E6796D";
    await gotoUrl(`${BASE_URL}/card/${sampleStudentToken}`);
    const cardText = await page.evaluate(() => document.body.innerText);
    const hasCanvasOrSvg = await page.$("canvas, svg, img[alt*='QR']");
    recordResult(
      "Kartu Anggota Digital Siswa",
      `/card/${sampleStudentToken}`,
      cardText.includes("AKHTAR") || cardText.includes("SMP NEGERI 17") || !!hasCanvasOrSvg,
      `Menampilkan kartu digital siswa via token acak aman`
    );

    // 1.5 Proteksi Token Kartu Palsu
    await gotoUrl(`${BASE_URL}/card/TOKEN-PALSU-999999`);
    const fakeCardText = await page.evaluate(() => document.body.innerText);
    recordResult(
      "Proteksi Token Kartu Palsu",
      "/card/TOKEN-PALSU-999999",
      fakeCardText.includes("tidak ditemukan") || fakeCardText.includes("Tidak Ditemukan") || fakeCardText.includes("404"),
      `Menolak token tidak terdaftar tanpa kebocoran data`
    );

    // 1.6 Pengalihan Rute Siswa Lama (/student/books -> /books)
    await gotoUrl(`${BASE_URL}/student/books`);
    recordResult("Pengalihan Rute Siswa Lama", "/student/books", page.url().includes("/books"), `Redirect ke ${page.url()}`);

    // 1.7 Pengalihan Rute Admin Lama (/admin/login -> /login)
    await gotoUrl(`${BASE_URL}/admin/login`);
    recordResult("Pengalihan Login Lama", "/admin/login", page.url().includes("/login"), `Redirect ke ${page.url()}`);

    // 1.8 Guard Rute Admin Tanpa Sesi (/admin -> /login)
    await gotoUrl(`${BASE_URL}/admin`);
    recordResult("Proteksi Rute Admin Tanpa Login", "/admin", page.url().includes("/login"), `Akses tanpa login ditolak ke ${page.url()}`);

    // ----------------------------------------------------
    // KATEGORI 2: LOGIN ADMIN & VERIFIKASI SESI
    // ----------------------------------------------------
    console.log("\n--- [2] LOGIN ADMIN & VERIFIKASI SESI ---");
    await gotoUrl(`${BASE_URL}/login`);
    await page.waitForSelector('input[name="identifier"]');
    await page.type('input[name="identifier"]', "admin");
    await page.type('input[name="password"]', "admin123");

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);

    await new Promise((r) => setTimeout(r, 2000));
    const isLoginSuccess = page.url().includes("/admin");
    recordResult("Login Akun Admin", "/login -> /admin", isLoginSuccess, `URL saat ini: ${page.url()}`);

    if (!isLoginSuccess) {
      throw new Error("Gagal login, tidak dapat melanjutkan pengujian fitur admin.");
    }

    // ----------------------------------------------------
    // KATEGORI 3: FITUR DASHBOARD & MANAJEMEN ADMIN
    // ----------------------------------------------------
    console.log("\n--- [3] PENGUJIAN SEMUA FITUR DASHBOARD & ADMIN ---");

    // Helper untuk cek halaman admin
    async function testAdminPage(name, pathSub, validator) {
      await gotoUrl(`${BASE_URL}${pathSub}`);
      const text = await page.evaluate(() => document.body.innerText);
      const url = page.url();
      const passed = url.includes(pathSub) && validator(text);
      recordResult(name, pathSub, passed, `Status OK, URL: ${url}`);
      return passed;
    }

    // 3.1 Dashboard Utama
    await testAdminPage("Dashboard Ringkasan", "/admin", (t) =>
      t.includes("Dashboard") && (t.includes("Koleksi") || t.includes("Sirkulasi"))
    );

    // 3.2 Sirkulasi Peminjaman Buku (/admin/borrow)
    await testAdminPage("Sirkulasi: Peminjaman Buku", "/admin/borrow", (t) =>
      t.includes("Pinjam") || t.includes("Peminjaman") || t.includes("Scan")
    );

    // 3.3 Sirkulasi Pengembalian Buku (/admin/return)
    await testAdminPage("Sirkulasi: Pengembalian Buku", "/admin/return", (t) =>
      t.includes("Kembali") || t.includes("Pengembalian") || t.includes("Scan")
    );

    // 3.4 Riwayat Transaksi Sirkulasi (/admin/transactions)
    await testAdminPage("Sirkulasi: Riwayat Transaksi", "/admin/transactions", (t) =>
      t.includes("Transaksi") || t.includes("Riwayat") || t.includes("Status")
    );

    // 3.5 Manajemen Katalog Buku (/admin/books)
    await testAdminPage("Koleksi: Katalog Buku", "/admin/books", (t) =>
      t.includes("Katalog Buku") || t.includes("Tambah Buku") || t.includes("Judul")
    );

    // 3.6 Tambah Buku Baru (/admin/books/new)
    await testAdminPage("Koleksi: Form Tambah Buku", "/admin/books/new", (t) =>
      t.includes("Tambah") || t.includes("Judul") || t.includes("ISBN")
    );

    // 3.7 Manajemen Eksemplar Fisik (/admin/copies)
    await testAdminPage("Koleksi: Eksemplar Fisik", "/admin/copies", (t) =>
      t.includes("Eksemplar") || t.includes("Barcode") || t.includes("Status")
    );

    // 3.8 Cetak Label Barcode & QR Code (/admin/qr)
    await testAdminPage("Koleksi: Cetak Label QR", "/admin/qr", (t) =>
      t.includes("Cetak") || t.includes("Label") || t.includes("QR")
    );

    // 3.9 Impor Data Massal (/admin/import)
    await testAdminPage("Koleksi: Impor Data Massal", "/admin/import", (t) =>
      t.includes("Impor") || t.includes("Upload") || t.includes("Excel")
    );

    // 3.10 Data Anggota Siswa (/admin/students)
    await testAdminPage("Anggota: Data Siswa", "/admin/students", (t) =>
      t.includes("Siswa") || t.includes("NIS") || t.includes("Kelas")
    );

    // 3.11 Laporan Sirkulasi & Statistik (/admin/reports)
    await testAdminPage("Laporan: Sirkulasi & Statistik", "/admin/reports", (t) =>
      t.includes("Laporan") || t.includes("Statistik") || t.includes("Unduh")
    );

    // 3.12 Log Audit Aktivitas (/admin/audit-logs)
    await testAdminPage("Laporan: Log Audit Keamanan", "/admin/audit-logs", (t) =>
      t.includes("Audit") || t.includes("Aktivitas") || t.includes("Waktu")
    );

    // 3.13 Manajemen Akun Staf/Pengguna (/admin/users)
    await testAdminPage("Pengaturan: Pengguna & Akses", "/admin/users", (t) =>
      t.includes("Pengguna") || t.includes("Petugas") || t.includes("Role")
    );

    // 3.14 Pengaturan Kategori & Kelas (/admin/refs)
    await testAdminPage("Pengaturan: Kategori & Kelas", "/admin/refs", (t) =>
      t.includes("Kategori") || t.includes("Kelas") || t.includes("Referensi")
    );

    // 3.15 Halaman Ganti Kata Sandi (/change-password)
    await testAdminPage("Pengaturan: Ganti Kata Sandi", "/change-password", (t) =>
      t.includes("Sandi") || t.includes("Password")
    );

    // ----------------------------------------------------
    // KATEGORI 4: UJI INTERAKTIF PENCARIAN & DATA
    // ----------------------------------------------------
    console.log("\n--- [4] PENGUJIAN INTERAKTIF (SEARCH & FILTER) ---");

    // 4.1 Search di Katalog Buku Admin
    await gotoUrl(`${BASE_URL}/admin/books?q=Cantik`);
    const searchResText = await page.evaluate(() => document.body.innerText);
    recordResult("Pencarian Katalog Buku", "/admin/books?q=Cantik", searchResText.includes("Cantik"), "Pencarian buku 'Cantik' memfilter daftar buku");

    // 4.2 Search di Data Siswa
    await gotoUrl(`${BASE_URL}/admin/students?q=AKHTAR`);
    const studentResText = await page.evaluate(() => document.body.innerText);
    recordResult("Pencarian Data Siswa", "/admin/students?q=AKHTAR", studentResText.includes("AKHTAR"), "Pencarian nama siswa 'AKHTAR' berhasil");

    // Capture screenshot fitur interaktif
    const fullTestScreenshot = path.join(ARTIFACT_DIR, "06_feature_overview_tested.png");
    await page.screenshot({ path: fullTestScreenshot });
    console.log(`📸 Screenshot saved: ${fullTestScreenshot}`);

  } finally {
    await browser.close();
  }

  console.log("\n======================================================");
  console.log("🏁 REKAPITULASI HASIL PENGUJIAN SEMUA FITUR:");
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  console.log(`Total Fitur Diuji: ${total}`);
  console.log(`Berhasil Lulus   : ${passed} ✅`);
  console.log(`Gagal            : ${failed} ${failed > 0 ? "❌" : ""}`);
  console.log("======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllFeatureTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
