import puppeteer from "puppeteer-core";
import path from "node:path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || "/home/dimskuyyyy/.gemini/antigravity-cli/brain/8fdd00a7-b251-42df-97ad-0d7562576666";

async function run() {
  console.log("🚀 Launching browser for Login-to-Dashboard test...");
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1280,900"]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    const consoleLogs = [];
    page.on("console", (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on("pageerror", (err) => console.error("Page error:", err.message));
    page.on("request", (req) => {
      if (req.url().includes("/admin")) {
        console.log(`[REQ] ${req.method()} ${req.url()}`);
        console.log(`   Headers Cookie: ${req.headers()["cookie"]}`);
      }
    });
    page.on("response", (res) => {
      const setCookie = res.headers()["set-cookie"];
      if (setCookie || res.url().includes("login") || res.url().includes("admin")) {
        console.log(`[NET] ${res.status()} ${res.url()}`);
        if (setCookie) console.log(`   Set-Cookie: ${setCookie}`);
      }
    });

    // 1. Navigate to /login
    console.log("📍 Navigating to /login...");
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
    console.log("Current URL:", page.url());

    // Screenshot before login
    const loginImg = path.join(ARTIFACT_DIR, "04_login_screen.png");
    await page.screenshot({ path: loginImg });
    console.log("📸 Screenshot saved:", loginImg);

    // 2. Fill form
    console.log("✍️ Typing credentials...");
    await page.waitForSelector('input[name="identifier"]');
    await page.type('input[name="identifier"]', "admin");

    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]', "admin123");

    // 3. Submit
    console.log("🖱️ Clicking Masuk button...");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }).catch(e => console.log("Navigation wait info:", e.message)),
      page.click('button[type="submit"]')
    ]);

    await new Promise(r => setTimeout(r, 2000));
    const cookiesRightAfter = await page.cookies();
    console.log("Cookies right after submit:", cookiesRightAfter);
    const currentUrl = page.url();
    console.log("🎯 Final URL after submit:", currentUrl);

    // Screenshot after login
    const dashImg = path.join(ARTIFACT_DIR, "05_after_login_dashboard.png");
    await page.screenshot({ path: dashImg });
    console.log("📸 Screenshot saved:", dashImg);

    // Check if on dashboard
    const isDashboard = currentUrl.includes("/admin");
    console.log("Is on /admin?", isDashboard);

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log("Snippet of page text:", bodyText.slice(0, 300).replace(/\n+/g, " "));

    // 4. Test session persistence on reload
    console.log("🔄 Testing reload on /admin...");
    await page.goto(`${BASE_URL}/admin`, { waitUntil: "networkidle0" });
    const reloadUrl = page.url();
    console.log("URL after reload:", reloadUrl);

    const cookies = await page.cookies();
    const authCookies = cookies.filter(c => c.name.includes("sb-") || c.name.includes("auth"));
    console.log("Auth cookies found:", authCookies.map(c => `${c.name} (httpOnly=${c.httpOnly}, secure=${c.secure}, sameSite=${c.sameSite})`));

    if (isDashboard && reloadUrl.includes("/admin")) {
      console.log("🎉 SUCCESS: Login to admin dashboard fully functional and verified!");
    } else {
      console.error("❌ FAILED to enter /admin dashboard.");
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
