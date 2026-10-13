import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const PORT = 9222;
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.join(process.cwd(), ".browser-tests");

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        } else if (msg.method) {
          const callbacks = this.listeners.get(msg.method) || [];
          for (const cb of callbacks) cb(msg.params);
        }
      };
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, cb) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(cb);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runBrowserTests() {
  console.log("🚀 Starting Chrome DevTools Browser Testing...");
  await fs.mkdir(ARTIFACT_DIR, { recursive: true });

  const tmpProfile = await fs.mkdtemp(path.join(os.tmpdir(), "chrome-test-profile-"));
  const chrome = spawn(
    "google-chrome",
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${tmpProfile}`,
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--window-size=1280,900",
    ],
    { stdio: "ignore" }
  );

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const results = [];

  try {
    // 1. Get browser targets
    const versionRes = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    const versionData = await versionRes.json();
    console.log(`✅ Attached to ${versionData.Browser}`);

    // Create a new tab
    const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE_URL + "/login")}`, {
      method: "PUT",
    });
    const tabData = await newTabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    // Enable DevTools domains
    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Network.enable");

    // Helper to test a page
    async function testPage(testName, url, expectations) {
      console.log(`\n🔍 [Test] ${testName}: ${url}`);
      const consoleMessages = [];
      const networkEvents = [];

      const onConsole = (params) => {
        const text = params.args ? params.args.map((a) => a.value || a.description || "").join(" ") : params.text;
        consoleMessages.push({ type: params.type, text });
      };
      const onException = (params) => {
        consoleMessages.push({ type: "error", text: params.exceptionDetails?.text || "Uncaught exception" });
      };
      const onResponse = (params) => {
        networkEvents.push({
          url: params.response.url,
          status: params.response.status,
          headers: params.response.headers,
        });
      };

      cdp.on("Runtime.consoleAPICalled", onConsole);
      cdp.on("Runtime.exceptionThrown", onException);
      cdp.on("Network.responseReceived", onResponse);

      // Navigate
      await cdp.send("Page.navigate", { url });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get current URL
      const { result: urlEval } = await cdp.send("Runtime.evaluate", {
        expression: "window.location.href",
      });
      const finalUrl = urlEval.value;

      // Get DOM evaluation
      let domChecks = {};
      if (expectations.evaluateDom) {
        const { result: evalRes } = await cdp.send("Runtime.evaluate", {
          expression: `(${expectations.evaluateDom.toString()})()`,
          returnByValue: true,
        });
        domChecks = evalRes.value || {};
      }

      // Capture screenshot if requested
      let screenshotPath = null;
      if (expectations.screenshotName) {
        const { data: base64 } = await cdp.send("Page.captureScreenshot", { format: "png" });
        screenshotPath = path.join(ARTIFACT_DIR, expectations.screenshotName);
        await fs.writeFile(screenshotPath, Buffer.from(base64, "base64"));
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
      }

      // Filter console errors
      const errors = consoleMessages.filter((m) => m.type === "error");

      const passed =
        (!expectations.expectedUrl || finalUrl.includes(expectations.expectedUrl)) &&
        (!expectations.maxErrors || errors.length <= expectations.maxErrors) &&
        (!expectations.customCheck || expectations.customCheck({ finalUrl, domChecks, errors, networkEvents }));

      const testResult = {
        name: testName,
        url,
        finalUrl,
        passed,
        domChecks,
        consoleMessages,
        errorCount: errors.length,
        screenshot: screenshotPath,
      };

      results.push(testResult);
      console.log(`Status: ${passed ? "PASSED ✅" : "FAILED ❌"} (Final URL: ${finalUrl}, Errors: ${errors.length})`);
      if (errors.length > 0) {
        console.log(`Errors observed:`, errors.map((e) => e.text).slice(0, 3));
      }
      return testResult;
    }

    // TEST 1: Single Login Portal (/login)
    await testPage("Login Portal UI & DOM", `${BASE_URL}/login`, {
      expectedUrl: "/login",
      screenshotName: "01_login_page.png",
      evaluateDom: () => {
        const title = document.title;
        const userInput = document.querySelector('input[name="identifier"]');
        const passInput = document.querySelector('input[name="password"]');
        const nisInput = document.querySelector('input[name="nis"]');
        const totpInput = document.querySelector('input[name="totp_code"]');
        const submitBtn = document.querySelector('button[type="submit"]');
        const bodyText = document.body.innerText;
        return {
          title,
          hasUserInput: !!userInput,
          userPlaceholder: userInput?.getAttribute("placeholder") || "",
          hasPassInput: !!passInput,
          hasNisInput: !!nisInput, // MUST BE FALSE
          hasTotpInput: !!totpInput, // MUST BE FALSE
          hasSubmitBtn: !!submitBtn,
          submitText: submitBtn?.innerText || "",
          noStudentLoginMention: !bodyText.toLowerCase().includes("login siswa"),
        };
      },
      customCheck: ({ domChecks }) => {
        return (
          domChecks.hasUserInput &&
          domChecks.hasPassInput &&
          !domChecks.hasNisInput &&
          !domChecks.hasTotpInput &&
          domChecks.noStudentLoginMention &&
          !domChecks.userPlaceholder.toLowerCase().includes("admin")
        );
      },
    });

    // TEST 2: Old /admin/login redirect to /login
    await testPage("Redirect legacy /admin/login", `${BASE_URL}/admin/login`, {
      expectedUrl: "/login",
      customCheck: ({ finalUrl }) => finalUrl.endsWith("/login") || finalUrl.includes("/login"),
    });

    // TEST 3: Old student route redirect (/student/loans)
    await testPage("Redirect legacy student route /student/loans", `${BASE_URL}/student/loans`, {
      expectedUrl: "/login",
      customCheck: ({ finalUrl }) => finalUrl.endsWith("/login") || finalUrl.includes("/login"),
    });

    // TEST 4: Old student catalog redirect (/student/books)
    await testPage("Redirect legacy student books /student/books to /books", `${BASE_URL}/student/books`, {
      expectedUrl: "/books",
      customCheck: ({ finalUrl }) => finalUrl.includes("/books"),
    });

    // TEST 5: Public Catalog (/books)
    await testPage("Public Catalog Page", `${BASE_URL}/books`, {
      expectedUrl: "/books",
      screenshotName: "02_public_catalog.png",
      evaluateDom: () => {
        const searchInput = document.querySelector('input[type="search"], input[name="q"], input[placeholder*="Cari"]');
        const bodyText = document.body.innerText;
        return {
          title: document.title,
          hasSearch: !!searchInput,
          catalogHeading: document.querySelector("h1, h2")?.innerText || "",
          isNotLoginPage: !bodyText.includes("Masuk ke Perpustakaan"),
        };
      },
      customCheck: ({ domChecks }) => domChecks.isNotLoginPage,
    });

    // TEST 6: Unauthenticated Admin Guard (/admin)
    await testPage("Admin Route Guard (Unauthenticated)", `${BASE_URL}/admin`, {
      expectedUrl: "/login",
      customCheck: ({ finalUrl }) => finalUrl.includes("/login"),
    });

    // TEST 7: Student Digital Card Token Endpoint (/card/[token])
    await testPage("Student Card Invalid Token Guard", `${BASE_URL}/card/STU-INVALIDTOKEN999999`, {
      expectedUrl: "/card/STU-INVALIDTOKEN999999",
      screenshotName: "03_card_invalid_token.png",
      evaluateDom: () => {
        const text = document.body.innerText;
        return {
          showsNotFoundOrError:
            text.includes("tidak ditemukan") ||
            text.includes("Tidak Ditemukan") ||
            text.includes("tidak valid") ||
            text.includes("404"),
          noPersonalDataLeaked: !text.includes("NISN") && !text.includes("Kelas"),
        };
      },
      customCheck: ({ domChecks }) => domChecks.showsNotFoundOrError,
    });

    cdp.close();
  } finally {
    chrome.kill();
    await fs.rm(tmpProfile, { recursive: true, force: true }).catch(() => {});
  }

  console.log("\n==========================================");
  console.log("🏁 DevTools Test Summary:");
  let allPassed = true;
  for (const r of results) {
    console.log(`- ${r.name}: ${r.passed ? "PASSED" : "FAILED"}`);
    if (!r.passed) allPassed = false;
  }
  console.log("==========================================");
  return { allPassed, results };
}

runBrowserTests()
  .then(({ allPassed }) => {
    process.exit(allPassed ? 0 : 1);
  })
  .catch((err) => {
    console.error("Fatal test error:", err);
    process.exit(1);
  });
