import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const PORT = 9222;

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

  close() {
    if (this.ws) this.ws.close();
  }
}

async function measureHttpLatency(url, iterations = 10) {
  const times = [];
  const reqHeaders = { "x-forwarded-proto": "https" };
  // Warm up
  await fetch(url, { headers: reqHeaders });

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const res = await fetch(url, { headers: reqHeaders });
    await res.text();
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);
  const min = times[0];
  const max = times[times.length - 1];
  const median = times[Math.floor(times.length / 2)];
  const p95 = times[Math.floor(times.length * 0.95)];
  return { min, max, median, p95 };
}

async function measureBrowserMetrics(routes) {
  const tmpProfile = await fs.mkdtemp(path.join(os.tmpdir(), "chrome-perf-profile-"));
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
  const results = {};

  try {
    const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" });
    const tabData = await newTabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("Performance.enable");

    for (const route of routes) {
      const fullUrl = `${BASE_URL}${route}`;
      await cdp.send("Page.navigate", { url: fullUrl });
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { result: timingRes } = await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByType('paint');
          const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
          return {
            dns: nav ? Math.round(nav.domainLookupEnd - nav.domainLookupStart) : 0,
            tcp: nav ? Math.round(nav.connectEnd - nav.connectStart) : 0,
            ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
            download: nav ? Math.round(nav.responseEnd - nav.responseStart) : 0,
            domInteractive: nav ? Math.round(nav.domInteractive - nav.startTime) : 0,
            domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : 0,
            loadComplete: nav ? Math.round(nav.loadEventEnd - nav.startTime) : 0,
            fcp: Math.round(fcp),
          };
        })()`,
        returnByValue: true,
      });

      results[route] = timingRes.value;
    }

    cdp.close();
  } finally {
    chrome.kill();
    await fs.rm(tmpProfile, { recursive: true, force: true }).catch(() => {});
  }

  return results;
}

async function getBundleSizes() {
  const nextStaticDir = path.join(process.cwd(), ".next/static");
  let totalJsBytes = 0;
  let totalCssBytes = 0;

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.name.endsWith(".js")) {
        const stat = await fs.stat(full);
        totalJsBytes += stat.size;
      } else if (e.name.endsWith(".css")) {
        const stat = await fs.stat(full);
        totalCssBytes += stat.size;
      }
    }
  }

  await walk(nextStaticDir);
  return {
    totalJsKB: Math.round(totalJsBytes / 1024),
    totalCssKB: Math.round(totalCssBytes / 1024),
  };
}

async function main() {
  console.log("📊 === STEP 1: MEASURING BASELINE PERFORMANCE ===");
  console.log(`Base URL: ${BASE_URL}`);

  console.log("\n1. Measuring HTTP Latency (10 iterations)...");
  const latencyLogin = await measureHttpLatency(`${BASE_URL}/login`);
  const latencyBooks = await measureHttpLatency(`${BASE_URL}/books`);
  const latencySearch = await measureHttpLatency(`${BASE_URL}/books?q=matematika`);

  console.log(`- /login:        median=${latencyLogin.median.toFixed(1)}ms, p95=${latencyLogin.p95.toFixed(1)}ms`);
  console.log(`- /books:        median=${latencyBooks.median.toFixed(1)}ms, p95=${latencyBooks.p95.toFixed(1)}ms`);
  console.log(`- /books?q=...:  median=${latencySearch.median.toFixed(1)}ms, p95=${latencySearch.p95.toFixed(1)}ms`);

  console.log("\n2. Measuring Real Browser Performance via Chrome DevTools CDP...");
  const browserMetrics = await measureBrowserMetrics(["/login", "/books"]);
  console.log("Browser Navigation Timings (ms):", JSON.stringify(browserMetrics, null, 2));

  console.log("\n3. Measuring Static Assets Bundle Size...");
  const bundles = await getBundleSizes();
  console.log(`- Total JS in .next/static:  ${bundles.totalJsKB} KB`);
  console.log(`- Total CSS in .next/static: ${bundles.totalCssKB} KB`);

  console.log("\n=== MEASUREMENT COMPLETE ===");
}

main().catch(console.error);
