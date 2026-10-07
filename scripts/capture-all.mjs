import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const OUT_DIR = "/home/dimskuyyyy/.gemini/antigravity-cli/brain/d7f8243c-d6c0-4af2-8775-061cf129dd06/scratch/screens";
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CHROME_PATH = "/usr/bin/google-chrome";
const BASE_URL = "http://localhost:3000";

async function login(page, username, password) {
  console.log(`Logging in as ${username}...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
  await page.type('input[name="identifier"]', username);
  await page.type('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.click('button[type="submit"]'),
  ]);
  console.log(`Current URL after login: ${page.url()}`);
}

async function capture(page, route, filename, viewport = { width: 1280, height: 800 }) {
  await page.setViewport(viewport);
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 600));
  const file = path.join(OUT_DIR, filename);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`Saved screenshot: ${filename} (${viewport.width}x${viewport.height})`);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();

  try {
    // 1. Login Page
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
    await page.screenshot({ path: path.join(OUT_DIR, "01_login_desktop.png") });
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(OUT_DIR, "01_login_mobile.png") });

    // 2. Admin Flow
    await page.setViewport({ width: 1280, height: 800 });
    await login(page, "admin", "admin123");

    await capture(page, "/admin", "02_admin_dashboard_desktop.png");
    await capture(page, "/admin", "02_admin_dashboard_mobile.png", { width: 390, height: 844 });
    await capture(page, "/admin/books", "03_admin_books.png");
    await capture(page, "/admin/copies", "04_admin_copies.png");
    await capture(page, "/admin/qr", "05_admin_qr.png");
    await capture(page, "/admin/import", "06_admin_import.png");
    await capture(page, "/admin/students", "07_admin_students.png");
    await capture(page, "/admin/reports", "08_admin_reports.png");
    await capture(page, "/admin/audit-logs", "09_admin_audit_logs.png");

    // Clear cookies for next user
    const client = await page.target().createCDPSession();
    await client.send("Network.clearBrowserCookies");

    // 3. Librarian Flow
    await login(page, "penjaga", "jaga123");
    await capture(page, "/librarian", "10_librarian_dashboard_desktop.png");
    await capture(page, "/librarian", "10_librarian_dashboard_mobile.png", { width: 390, height: 844 });
    await capture(page, "/librarian/borrow", "11_librarian_borrow.png");
    await capture(page, "/librarian/return", "12_librarian_return.png");
    await capture(page, "/librarian/transactions", "13_librarian_transactions.png");

    // Clear cookies for next user
    await client.send("Network.clearBrowserCookies");

    // 4. Student Flow
    await login(page, "20260001", "siswa123");
    await capture(page, "/student", "14_student_dashboard_desktop.png");
    await capture(page, "/student", "14_student_dashboard_mobile.png", { width: 390, height: 844 });
    await capture(page, "/student/books", "15_student_books.png");
    await capture(page, "/student/loans", "16_student_loans.png");
    await capture(page, "/student/history", "17_student_history.png");

    console.log("All screenshots successfully captured!");
  } catch (err) {
    console.error("Error capturing screenshots:", err);
  } finally {
    await browser.close();
  }
}

main();
