import puppeteer from "puppeteer-core";
import path from "node:path";
import { readFileSync, existsSync } from "node:fs";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || "/home/dimskuyyyy/.gemini/antigravity-cli/brain/8fdd00a7-b251-42df-97ad-0d7562576666";

/**
 * Bersihkan penghitung rate limit `change_password:*` setelah skenario gagal,
 * supaya test suite tidak meninggalkan akun admin terkunci (server bug yang
 * mudah lupa). Memakai service role; hanya untuk lingkungan uji.
 */
async function bersihkanRateLimitGantiSandi() {
  try {
    if (existsSync(".env.local")) {
      for (const line of readFileSync(".env.local", "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
        if (m) process.env[m[1]] = m[2];
      }
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return;
    const { createClient } = await import("@supabase/supabase-js");
    const svc = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    await svc.from("auth_rate_limits").delete().like("key", "change_password:%");
  } catch {
    // Abaikan: tidak boleh menggagalkan test.
  }
}

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

    // 1.9 Pencarian Katalog Langsung di Halaman Profil (/informasi)
    await gotoUrl(`${BASE_URL}/informasi`);
    const profilSearch = await page.evaluate(() => {
      const form = document.querySelector('form[action="/books"]');
      const input = form?.querySelector('input[name="q"]');
      const label = input?.id ? document.querySelector(`label[for="${input.id}"]`) : null;
      return {
        hasForm: !!form && !!input,
        hasLabel: !!label,
        method: (form?.getAttribute("method") ?? "").toLowerCase(),
      };
    });
    let typeaheadText = "";
    if (profilSearch.hasForm) {
      await page.type('form[action="/books"] input[name="q"]', "Cantik", { delay: 50 });
      const link = await page
        .waitForSelector('#catalog-search-results a[href^="/books/"]', { timeout: 10000 })
        .catch(() => null);
      if (link) typeaheadText = await page.evaluate((el) => el.textContent ?? "", link);
    }
    recordResult(
      "Pencarian Katalog di Halaman Profil",
      "/informasi",
      profilSearch.hasForm && profilSearch.hasLabel && profilSearch.method === "get" && typeaheadText.includes("Cantik"),
      `Form GET ke /books: ${profilSearch.hasForm}, label terlihat: ${profilSearch.hasLabel}, typeahead: ${typeaheadText.trim().slice(0, 60) || "tidak ada hasil"}`
    );

    // 1.10 Submit Pencarian Membawa ke Halaman Hasil Katalog (/books?q=)
    if (profilSearch.hasForm) {
      await page.keyboard.press("Enter");
      await page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 1200));
    }
    const hasilSearch = await page.evaluate(() => document.body.innerText);
    recordResult(
      "Submit Pencarian ke Halaman Katalog",
      "/informasi -> /books?q=Cantik",
      page.url().includes("/books?q=Cantik") && hasilSearch.includes("Cantik"),
      `URL: ${page.url()}`
    );

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

    // 3.13 Manajemen Akun Staf/Pengguna (/admin/users) + dialog reset password (admin-ketik)
    await gotoUrl(`${BASE_URL}/admin/users`);
    const usersText = await page.evaluate(() => document.body.innerText);
    const usersPageOk =
      page.url().includes("/admin/users") &&
      (usersText.includes("Pengguna") || usersText.includes("Petugas") || usersText.includes("Role")) &&
      usersText.includes("Reset Kata Sandi");
    const resetClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "Reset Kata Sandi",
      );
      if (!btn) return false;
      btn.click();
      return true;
    });
    const resetPwdField = resetClicked
      ? await page.waitForSelector('input[name="new-password"]', { timeout: 5000 }).catch(() => null)
      : null;
    recordResult(
      "Pengaturan: Pengguna & Akses",
      "/admin/users",
      usersPageOk && !!resetPwdField,
      resetPwdField
        ? "Tabel pengguna + dialog reset dengan field kata sandi baru"
        : `Halaman OK: ${usersPageOk}; field reset ditemukan: ${!!resetPwdField}`
    );

    // 3.14 Pengaturan Kategori & Kelas (/admin/refs)
    await testAdminPage("Pengaturan: Kategori & Kelas", "/admin/refs", (t) =>
      t.includes("Kategori") || t.includes("Kelas") || t.includes("Referensi")
    );

    // 3.15 Halaman Ganti Kata Sandi (/change-password)
    await testAdminPage("Pengaturan: Ganti Kata Sandi", "/change-password", (t) =>
      t.includes("Sandi") || t.includes("Password")
    );

    // 3.16 Validasi form ganti kata sandi (Blok 5):
    //      - 3 field wajib ada (sandi saat ini / baru / konfirmasi)
    //      - konfirmasi tidak cocok DITOLAK (tanpa menyentuh akun)
    //      - sandi saat ini salah DITOLAK (tanpa mengubah password)
    //      - nilai kata sandi tidak bocor ke HTML/log
    console.log("\n--- [3.16] VALIDASI FORM GANTI KATA SANDI ---");
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await gotoUrl(`${BASE_URL}/change-password`);
    const hasThreeFields =
      !!(await page.$('input[name="current_password"]')) &&
      !!(await page.$('input[name="new_password"]')) &&
      !!(await page.$('input[name="confirm_password"]'));
    recordResult(
      "Form Ganti Sandi: 3 field wajib",
      "/change-password",
      hasThreeFields,
      hasThreeFields ? "current_password + new_password + confirm_password ada" : "field wajib tidak lengkap"
    );

    const strengthVisible = await page.evaluate(() =>
      document.body.innerText.includes("Minimal 12 karakter")
    );
    recordResult(
      "Form Ganti Sandi: daftar syarat & indikator kekuatan",
      "/change-password",
      strengthVisible,
      strengthVisible ? "syarat kebijakan tampil" : "syarat tidak tampil"
    );

    // Skenario A: konfirmasi tidak cocok
    await page.type('input[name="current_password"]', "admin123");
    await page.type('input[name="new_password"]', "PerpustakaanKuat17!");
    await page.type('input[name="confirm_password"]', "PerpustakaanKuat18!");
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 2500));
    const mismatchText = await page.evaluate(() => document.body.innerText);
    const mismatchRejected = /konfirmasi kata sandi baru tidak cocok/i.test(mismatchText);
    recordResult(
      "Form Ganti Sandi: konfirmasi tidak cocok ditolak",
      "/change-password",
      mismatchRejected,
      mismatchRejected ? "pesan error tampil" : "tidak ada penolakan konfirmasi"
    );

    // Skenario B: kata sandi saat ini salah -> ditolak, password lama TIDAK berubah
    await gotoUrl(`${BASE_URL}/change-password`);
    await page.type('input[name="current_password"]', "PasswordSalahSekali123!");
    await page.type('input[name="new_password"]', "PerpustakaanKuat17!");
    await page.type('input[name="confirm_password"]', "PerpustakaanKuat17!");
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 4000));
    const wrongCurrentText = await page.evaluate(() => document.body.innerText);
    const wrongCurrentRejected = /kata sandi saat ini salah/i.test(wrongCurrentText);
    recordResult(
      "Form Ganti Sandi: sandi saat ini salah ditolak",
      "/change-password",
      wrongCurrentRejected,
      wrongCurrentRejected ? "pesan error tampil" : "tidak ada penolakan sandi lama"
    );

    // Pembersihan: percobaan gagal di atas menambah penghitung rate limit
    // `change_password:*`. Test suite harus TIDAK meninggalkan akun terkunci.
    await bersihkanRateLimitGantiSandi();

    // Skenario C: anti-leak — nilai kata sandi tidak boleh muncul di respons server
    // (Catatan: `value` pada elemen <input type=password> memang selalu ada di DOM
    //  browser; yang diuji di sini adalah kebocoran ke HTML/respons server.)
    const actionBodies = [];
    const respHandler = async (res) => {
      if (!res.url().includes("/change-password")) return;
      try {
        const type = res.request().resourceType();
        if (type === "document" || type === "fetch" || type === "xhr") {
          actionBodies.push(await res.text());
        }
      } catch {
        // respons sudahPager: abaikan
      }
    };
    page.on("response", respHandler);

    await gotoUrl(`${BASE_URL}/change-password`);
    await page.type('input[name="current_password"]', "PasswordSalahSekali123!");
    await page.type('input[name="new_password"]', "PerpustakaanKuat17!");
    await page.type('input[name="confirm_password"]', "PerpustakaanKuat17!");
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 4000));
    page.off("response", respHandler);

    const secrets = ["PerpustakaanKuat17!", "PasswordSalahSekali123!"];
    const leaked = actionBodies.filter((t) => secrets.some((s) => t.includes(s)));
    recordResult(
      "Form Ganti Sandi: nilai sandi tidak bocor ke respons server",
      "/change-password",
      leaked.length === 0,
      leaked.length === 0 ? `${actionBodies.length} respons diperiksa, bersih` : `bocor di ${leaked.length} respons`
    );

    // Skenario C2: halaman yang baru dimuat tidak boleh memuat nilai sandi
    await gotoUrl(`${BASE_URL}/change-password`);
    const freshHtml = await page.content();
    const freshLeak = secrets.filter((s) => freshHtml.includes(s));
    recordResult(
      "Form Ganti Sandi: halaman baru tidak memuat nilai sandi",
      "/change-password",
      freshLeak.length === 0,
      freshLeak.length === 0 ? "bersih" : `bocor: ${freshLeak.length} nilai`
    );

    // Skenario D: tidak ada error React "Too many re-renders" (#441) di console
    const reactRenderLoop = consoleErrors.filter((t) =>
      /Too many re-renders|Minified React error #441/i.test(t)
    );
    recordResult(
      "Tanpa render loop React (#441)",
      "/change-password",
      reactRenderLoop.length === 0,
      reactRenderLoop.length === 0 ? "console bersih" : reactRenderLoop[0]?.slice(0, 160)
    );

    // CATATAN: jalur sukses (ganti sandi berhasil) TIDAK diuji otomatis karena
    // akan mengubah kata sandi akun admin sungguhan di database. Verifikasi
    // manual: isi "sandi saat ini" yang benar + sandi baru sesuai kebijakan.

    // 3.17 Kebijakan kata sandi pada pembuatan akun admin (/admin/users)
    //      Password lemah harus DITOLAK server (tanpa membuat akun baru).
    console.log("\n--- [3.17] KEBIJAKAN KATA SANDI DI /admin/users ---");
    await gotoUrl(`${BASE_URL}/admin/users`);

    const ujiUsername = `uji.policy.${Date.now().toString().slice(-6)}`;
    const openCreate = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        /Tambah Pengguna/i.test(b.textContent || "")
      );
      if (btn) btn.click();
      return !!btn;
    });
    await new Promise((r) => setTimeout(r, 800));
    recordResult(
      "Admin Users: dialog pembuatan akun terbuka",
      "/admin/users",
      openCreate,
      openCreate ? "tombol 'Tambah Pengguna' diklik" : "tombol tidak ditemukan"
    );

    if (openCreate) {
      const filled = await page.evaluate((username) => {
        const set = (name, value) => {
          const el = document.querySelector(`input[name="${name}"]`);
          if (!el) return false;
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          ).set;
          setter.call(el, value);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          return true;
        };
        return (
          set("full_name", "Uji Kebijakan Sandi") &&
          set("username", username) &&
          set("email", `${username}@sekolah.local`) &&
          set("password", "Lembah123") // 9 karakter, 2 jenis karakter
        );
      }, ujiUsername);

      await new Promise((r) => setTimeout(r, 300));
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll("button")].find(
          (b) => /Buat akun/i.test(b.textContent || "") && b.type === "submit"
        );
        btn?.click();
      });
      await new Promise((r) => setTimeout(r, 3000));

      const bodyText = await page.evaluate(() => document.body.innerText);
      const rejected = /minimal 12 karakter|jenis karakter/i.test(bodyText);
      const notCreated = !bodyText.includes(ujiUsername);
      recordResult(
        "Admin Users: password lemah ditolak server",
        "/admin/users",
        filled && rejected && notCreated,
        rejected && notCreated
          ? "server menolak password lemah, akun tidak dibuat"
          : `rejected=${rejected} notCreated=${notCreated}`
      );
    }


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
