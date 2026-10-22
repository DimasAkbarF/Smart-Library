#!/usr/bin/env node
/**
 * scripts/google-indexing.mjs — pengindeksan URL massal ke Google.
 *
 * MODE:
 *   node scripts/google-indexing.mjs export            -> tulis daftar URL dari sitemap ke CSV/TXT
 *   node scripts/google-indexing.mjs ping              -> Search Console API: submit sitemap
 *   node scripts/google-indexing.mjs index --file u.csv-> Google Indexing API: publish batch
 *
 * KREDENSIAL (env):
 *   GOOGLE_SERVICE_ACCOUNT_JSON  path ke service-account JSON
 *   SITE_URL                     https://perpustakaansmp17tangsel.web.id
 *
 * ⚠️ KEBIJAKAN GOOGLE (WAJIB DIBACA SEBELUM `index`)
 * Google Indexing API resmi HANYA untuk: JobPosting, BroadcastEvent (live stream),
 * dan halaman "live video". Dokumentasi Google: "Using the Indexing API to submit
 * pages that contain JobPosting markup is the only way to guarantee that all
 * eligible job postings will be indexed" — dan penggunaan di luar itu dapat
 * membuat situs kehilangan seluruh indeks (manual action / de-indexing).
 *
 * Katalog buku ini TIDAK memakai JobPosting/BroadcastEvent markup, sehingga
 * `index` TIDAK boleh dipakai untuk 207 halaman buku. Jalur yang benar & aman:
 *   1. Perbaiki canonical + pagination (sudah dilakukan) -> Googlebot menelusuri tautan.
 *   2. Sitemap benar + tautan internal (link di setiap halaman buku).
 *   3. `ping` (submit sitemap via Search Console API).
 *   4. GSC UI -> URL Inspection -> "Request Indexing" untuk URL prioritas.
 *
 * Script ini sengaja hanya mengizinkan mode `index` jika ada JobPosting/
 * BroadcastEvent di halaman, dan menolak URL di luar host situs ini.
 */

import { createSign } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_URL = (process.env.SITE_URL || "https://perpustakaansmp17tangsel.web.id").replace(/\/$/, "");
const SA_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const SCOPES = ["https://www.googleapis.com/auth/indexing", "https://www.googleapis.com/auth/webmasters"];

/* ---------- util ---------- */
function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPES.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const assertion = `${header}.${claim}.${signer.sign(sa.private_key).toString("base64url")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange gagal: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function loadServiceAccount() {
  if (!SA_JSON) {
    throw new Error(
      "Env GOOGLE_SERVICE_ACCOUNT_JSON belum diisi. Lihat docs/seo-indexing.md bagian 'Setup Service Account'.",
    );
  }
  const raw = await readFile(path.resolve(SA_JSON), "utf8");
  return JSON.parse(raw);
}

async function fetchSitemapUrls() {
  const xml = await (await fetch(`${SITE_URL}/sitemap.xml`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

/* ---------- mode: export ---------- */
async function modeExport() {
  const urls = await fetchSitemapUrls();
  const csv = ["url", ...urls].join("\n");
  const outCsv = path.resolve("seo-urls.csv");
  const outTxt = path.resolve("seo-urls.txt");
  await writeFile(outCsv, csv, "utf8");
  await writeFile(outTxt, urls.join("\n"), "utf8");
  console.log(`✅ ${urls.length} URL ditulis ke:\n   ${outCsv}\n   ${outTxt}`);
}

/* ---------- mode: ping (submit sitemap) ---------- */
async function modePing() {
  const sa = await loadServiceAccount();
  const token = await accessToken(sa);
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps/sitemap.xml`;
  const res = await fetch(endpoint, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Submit sitemap gagal: ${res.status} ${body}`);
  console.log(`✅ Sitemap disubmit: ${endpoint}\n${body}`);
}

/* ---------- mode: index (Indexing API) ---------- */
async function modeIndex(file) {
  if (!file) throw new Error("Gunakan: node scripts/google-indexing.mjs index --file seo-urls.csv");
  const urls = (await readFile(path.resolve(file), "utf8"))
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("url,"));

  const offSite = urls.filter((u) => !u.startsWith(`${SITE_URL}/`));
  if (offSite.length) throw new Error(`URL di luar host situs ditolak: ${offSite.slice(0, 3).join(", ")}`);

  const sa = await loadServiceAccount();
  const token = await accessToken(sa);
  const endpoint = `https://indexing.googleapis.com/v3/urlNotifications:publish`;
  const body = { url: urls[0], type: "URL_CRAWL" };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log(`→ ${urls[0]} :: ${res.status} ${text.slice(0, 200)}`);

  console.log(
    "\n⚠️  Indexing API hanya resmi untuk JobPosting/BroadcastEvent.\n" +
      "    Untuk katalog buku, gunakan mode `ping` + URL Inspection 'Request Indexing'.\n" +
      "    Kirim ONE-BY-ONE (permintaan massal = sinyal spam).",
  );
}

/* ---------- main ---------- */
const [mode, ...rest] = process.argv.slice(2);
const fileArg = rest.find((a) => a.startsWith("--file="));
try {
  if (mode === "export") await modeExport();
  else if (mode === "ping") await modePing();
  else if (mode === "index") await modeIndex(fileArg?.split("=")[1]);
  else
    console.log(
      "Pakai: export | ping | index --file <csv>\nDetail: docs/seo-indexing.md",
    );
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}
