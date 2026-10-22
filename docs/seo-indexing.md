# SEO & Pengindeksan — Smart Library SMPN 17 Tangsel

Dokumen ini adalah panduan operasional pengindeksan untuk
`https://perpustakaansmp17tangsel.web.id` (Next.js 16 App Router + Vercel + Supabase).

---

## 1. Diagnosis laporan "Page Indexing" (22 Okt 2026)

Sumber: `https___perpustakaansmp17tangsel.web.id_-Coverage-2026-10-22.xlsx`
(GSC: 195 "Discovered – currently not indexed", 1 "Duplicate, Google chose different canonical").

### Angka yang membuktikan akar masalah

| Pengukuran | Nilai |
|---|---|
| URL di `sitemap.xml` | 211 (4 statis + 207 buku) |
| Halaman buku yang **benar-benar ter-rayapi** | 12 (halaman 1 katalog) |
| 207 − 12 | **195** ← persis dengan angka "Discovered – currently not indexed" |

### Akar masalah #1 — canonical paginasi menunjuk ke `/books`

`src/app/books/page.tsx` memakai metadata statis:

```ts
export const metadata: Metadata = { alternates: { canonical: "/books" } };
```

Metadata statis itu berlaku untuk **semua** variasi query string. Akibatnya
`/books?page=2` … `/books?page=18` semuanya menghapus `<link rel="canonical" href=".../books">`.
Google mengonsolidasikan 17 halaman katalog menjadi satu URL, **berhenti menjelajah**,
dan tidak pernah sampai ke 195 halaman buku di halaman 2–18.

Verifikasi (sebelum perbaikan):

```
GET /books?page=2  ->  200
<link rel="canonical" href="https://perpustakaansmp17tangsel.web.id/books">   ← salah
```

### Akar masalah #2 — `canonical: "/"` di root layout

`src/app/layout.tsx` mendefinisikan `alternates: { canonical: "/" }` dan
`robots: { index: true, follow: true }` di **root layout**. Next.js mewarisi metadata
layout teratas ke seluruh route, sehingga:

* `/card/<token>` (kartu anggota siswa) menghasilkan `canonical: "/"` → halaman privat
  menunjuk ke homepage;
* `/faq` (redirect) menghasilkan `canonical: "/"`;
* root `/` sendiri adalah **redirect 307 berbasis sesi** (admin → `/admin`, publik → `/books`)
  tetapi tetap membawa `canonical` ke dirinya sendiri → Google memilih `/books` sebagai
  versi kanonik, dan GSC melaporkan 1 URL sebagai **"Duplicate, Google chose different
  canonical"** (yaitu URL root, karena `<link rel="canonical">` dan `sitemap.xml`
  sama-sama]interface root, sedangkan konten sebenarnya ada di `/books`).

### Akar masalah #3 — `robots.txt` membocorkan seluruh permukaan internal

`robots.txt` lama memuat grup khusus Googlebot:

```
User-Agent: Googlebot
Allow: /
```

Karena grup `Googlebot` ada, Google **hanya memakai grup itu** dan mengabaikan grup `*`.
Artinya Googlebot bebas merayapi `/admin/*` (16 halaman, semuanya 302 ke `/login`),
`/api/*`, dan `/card/<token>` — **kartu anggota digital siswa**. Semua URL `/admin/*`
berisi konten identik dengan `/login` → sinyal duplikat, crawl budget terbuang, dan
permukaan privat bocor ke mesin pencari.

### Akar masalah #4 — 207 halaman buku dengan konten nyaris identik

Data saat ini (queried langsung ke Supabase):

| Field | Terisi |
|---|---|
| `author` = "Koleksi Perpustakaan" | **205 dari 207** |
| `isbn` | 2 dari 207 |
| `cover_url` | **0 dari 207** |
| `publisher` | 207 (semua "SMP Negeri 17 Tangerang Selatan") |
| `publication_year` | 2 dari 207 |

Artinya 207 halaman buku pada dasarnya hanya berbeda pada judulnya. Setelah perbaikan
teknis canonical, Google akan merayapi semuanya — tetapi jika isinya tetap homogen,
Google akan menurunkan semuanya ke "Crawled – currently not indexed" (thin content).
**Perbaikan teknis + pengayaan data harus berjalan beriringan.**

---

## 2. Perbaikan yang sudah diterapkan di repo ini

| File | Perubahan |
|---|---|
| `src/app/layout.tsx` | Hapus `alternates.canonical` & `robots` dari root layout (tiadaRoute yang mewarisi metadata root lagi). |
| `src/app/books/page.tsx` | `generateMetadata()` → canonical **self-referencing** per halaman (`/books?page=N`), filter/pencarian → `noindex` + canonical `/books`, judul unik per halaman. |
| `src/app/books/[id]/page.tsx` | `robots index,follow`; **breadcrumb** yang bisa diklik + `BreadcrumbList` JSON-LD; section **"Buku terkait"** (6 tautan keluar, kategori yang sama). |
| `src/features/catalog/queries.ts` | `getRelatedBooks()` (cache 1 jam); sanitasi `category_id` non-UUID → 500 berubah menjadi 200. |
| `src/app/robots.ts` | Satu grup `Googlebot` **dan** satu grup `*` yang identik: allow `/`, disallow `/admin`, `/api`, `/card`, `/change-password`. Ditambah `Host:` kanonik. |
| `src/app/sitemap.ts` | Hanya URL yang boleh diindeks: `/books` (prio 1.0), `/informasi`, dan 207 halaman buku. Buang `/` (redirect sesi), `/login` (noindex), `/faq` (redirect). `lastmod` buku memakai `created_at`, bukan `new Date()` palsu. |
| `src/app/login/page.tsx` | `robots: { index: false, follow: true }` (portal staf). |
| `src/app/faq/page.tsx` | `permanentRedirect()` → 308, bukan 307. |
| `src/proxy.ts` | Redirect host `www.` → apex (301) + http→https (301) + normalisasi trailing slash. |
| `next.config.ts` | `trailingSlash: false` eksplisit (URL `/books`, bukan `/books/`). |
| `src/components/layout/public-shell.tsx` | Footer site-wide berisi tautan `Katalog`, `Profil & FAQ`, `Peta Situs` — memberi jalur crawl dari **setiap** halaman. |
| `scripts/google-indexing.mjs` | Tool (export / ping / index) — lihat §5. |

### Konsekuensi yang diharapkan

1. Googlebot sekarang bisa menjelajah `/books` → `/books?page=2` → … → `/books?page=18`
   (canonical self-referencing, tautan "Berikutnya" tetap HTML anchor).
2. Setiap halaman buku punya ≥1 inbound link (dari daftar) + 6 outbound link (buku terkait)
   + breadcrumb → panjang jalan crawl (click depth) turun drastis.
3. Permukaan privat (`/admin`, `/api`, `/card`) tidak lagi dirayapi Googlebot.
4. Hanya satu versi URL per konten → 1 URL "Duplicate" hilang.

---

## 3. Strategi pengindeksan & internal linking (rekomendasi lanjutan)

### 3.1 Struktur URL yang dipakai (final)

```
/                          307 → /books            (redirect sesi; TIDAK ada di sitemap)
/books                     katalog, halaman 1      canonical: /books        prio 1.0
/books?page=2..18          katalog, halaman 2..18   canonical: /books?page=N  (self)
/books?cat=<uuid>          tampilan filter         noindex, canonical /books
/books?q=<kata>            hasil pencarian         noindex, canonical /books
/books/<uuid>              detail buku             canonical: /books/<uuid>  prio 0.7
/informasi                 profil + FAQ            canonical: /informasi      prio 0.8
/faq                       308 → /informasi
/login                     portal staf             noindex
/card/<token>              kartu anggota siswa     noindex + Disallow robots.txt
/admin/*, /api/*           internal                Disallow robots.txt
```

### 3.2 Prioritas internal linking (urutan usaha)

1. **Paginasi katalog** — sudah: canonical self + anchor "Berikutnya". Pastikan
   `?page=18` (halaman terakhir) tetap tertaut dari halaman 17.
2. **Buku terkait** — sudah: 6 buku per kategori dari tiap halaman detail.
   Jika data kategori diperkaya, tambahkan blok "Buku populer" di `/informasi`.
3. **Breadcrumb** — sudah di halaman detail (`Katalog Buku › Kategori › Judul`).
4. **Footer site-wide** — sudah: `Katalog`, `Profil & FAQ`, `Peta Situs` di semua
   halaman publik (termasuk 207 halaman buku).
5. **Halaman kategori yang bisa diindeks** (rekomendasi, opsional): saat ini kategori
   hanya berupa query (`?cat=<uuid>`) sehingga tidak punya URL mandiri. Jika ingin
  **layak**, buat route `/kategori/[slug]` dengan canonical sendiri, `<h1>` berisi nama
   kategori, dan daftar buku — ini memberi 8–12 URL hub baru yang kuat.
6. **Halaman "koleksi kurikulum"** (opsional): 1–2 halaman kurasi (Kurikulum Merdeka,
   Fiksi, Sains) yang menautkan ke buku terkait → jalur crawl premium.

### 3.3 Sitemap & robots final

`/sitemap.xml` (dari `src/app/sitemap.ts`):

```xml
<urlset>
  <url><loc>https://perpustakaansmp17tangsel.web.id/books</loc><priority>1</priority></url>
  <url><loc>https://perpustakaansmp17tangsel.web.id/informasi</loc><priority>0.8</priority></url>
  <url><loc>https://perpustakaansmp17tangsel.web.id/books/<uuid></loc><priority>0.7</priority></url>
  ...
</urlset>
```

Aturan: sitemap hanya berisi URL **canonical & indexable**; tidak ada URL duplikat,
tidak ada redirect, tidak ada `noindex`. Kapasitas 50.000 URL — masih jauh di bawah
batas (209 URL sekarang).

`/robots.txt` (dari `src/app/robots.ts`):

```
User-Agent: Googlebot
User-Agent: Googlebot-Image
User-Agent: Googlebot-Favicon
User-Agent: Google-Extended
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /card
Disallow: /change-password

User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /card
Disallow: /change-password

User-Agent: GPTBot
User-Agent: ClaudeBot
User-Agent: PerplexityBot
User-Agent: Applebot-Extended
User-Agent: CCBot
User-Agent: Bytespider
Disallow: /

Host: https://perpustakaansmp17tangsel.web.id
Sitemap: https://perpustakaansmp17tangsel.web.id/sitemap.xml
```

> **Jangan pernah memakai `Disallow` untuk URL yang ingin diindeks** — URL yang
> diblokir tidak akan pernah dibaca, termasuk tag `noindex`-nya. Untuk `/login`
> gunakan tag `noindex` (sudah) dan biarkan Googlebot freely merayapi sekali.

---

## 4. Canonical & konsistensi URL

### 4.1 Implementasi yang dipakai (App Router)

`src/app/books/page.tsx` — canonical dinamis:

```tsx
export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const hasFilter = Boolean(sp.q || sp.cat || sp.avail);

  return {
    title: page > 1 && !hasFilter ? `Katalog Buku Perpustakaan — Halaman ${page}` : "Katalog Koleksi Buku Perpustakaan",
    alternates: { canonical: !hasFilter && page > 1 ? `/books?page=${page}` : "/books" },
    robots: hasFilter ? { index: false, follow: true } : { index: true, follow: true },
  };
}
```

`src/app/books/[id]/page.tsx` — canonical per buku:

```tsx
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookDetail(id);
  if (!book) return { title: "Buku Tidak Ditemukan", robots: { index: false } };
  return {
    title: `${book.title} karya ${book.author} — Smart Library SMPN 17 Tangsel`,
    alternates: { canonical: `/books/${id}` },
    robots: { index: true, follow: true },
  };
}
```

Karena `metadataBase` sudah diset di root layout
(`https://perpustakaansmp17tangsel.web.id`), path relatif otomatis menjadi URL absolut.

### 4.2 Setara untuk Pages Router (bila Needed)

```tsx
// pages/books/[id].tsx
export const getServerSideProps = async ({ params }) => ({ props: { book: await getBook(params.id) } });

export default function BookPage({ book }: { book: Book }) {
  return (
    <Head>
      <link rel="canonical" href={`https://perpustakaansmp17tangsel.web.id/books/${book.id}`} />
      <meta name="robots" content="index, follow" />
    </Head>
    /* ... */
  );
}
```

Aturan main: **canonical harus menunjuk ke URL yang mengembalikan 200, self-referencing,
dan tidak berubah-ubah**. Jangan pernah menaruh canonical di root layout.

### 4.3 HTTP → HTTPS, WWW → non-WWW, trailing slash

| Lapisan | Pengaturan | Status |
|---|---|---|
| Vercel | Domain `www.perpustakaansmp17tangsel.web.id` **ditambahkan** sebagai domain alias, lalu dibuat **Redirect (308) → apex**. Hapus domain www setelah redirect aktif. | 👈 wajib di dashboard Vercel (redirect berbasis host tidak bisa di `next.config`) |
| Vercel | HTTPS otomatis + "Always Use HTTPS" | aktif (HSTS sudah dikirim: `max-age=63072000; includeSubDomains; preload`) |
| `src/proxy.ts` | `www.` → apex **301** | ✅ diimplementasikan |
| `src/proxy.ts` | `http` → `https` **301** | ✅ ada |
| `next.config.ts` | `trailingSlash: false` → Next otomatis **308** dari `/books/` ke `/books` | ✅ diimplementasikan |
| `next.config.ts` | Redirect rute lama (`/admin/login`, `/student/*`, `/librarian/*`) **301** | ✅ ada |

> Kalau memakai Cloudflare (proxy oranye), buat **Redirect Rule**:
> `http*://www.perpustakaansmp17tangsel.web.id/*` → `https://perpustakaansmp17tangsel.web.id/$1`, status 301.

Setelah semua aktif, uji:

```bash
curl -I https://www.perpustakaansmp17tangsel.web.id/books        # -> 301 ke apex
curl -I http://perpustakaansmp17tangsel.web.id/books              # -> 301 ke https
curl -I https://perpustakaansmp17tangsel.web.id/books/           # -> 308 ke /books
```

---

## 5. Google Indexing API & otomatisasi

### 5.1 ⚠️ Reality check (wajib dibaca)

**Google Indexing API resmi HANYA untuk 3 tipe halaman:**

1. `JobPosting` (lowongan kerja, dengan markup `EnableJobPosting`),
2. `BroadcastEvent` (acara *live* yang sedang berlangsung, dengan markup `BroadcastEvent`),
3. halaman video *live* (schema `VideoObject` + `liveBroadcastDetails`).

Kutipan dari dokumentasi Google: *"Using the Indexing API to submit pages that contain
JobPosting markup is the only way to guarantee that all eligible job postings will be
indexed."* Penggunaan API di luar cakupan itu melanggar
[Google Search Essentials – Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
dan dapat berujung **manual action / de-indexing seluruh situs**.

Halaman katalog buku Smart Library **tidak** memakai JobPosting/BroadcastEvent markup,
jadi **tidak boleh** dikirim lewat Indexing API. Jalur yang benar & aman untuk 207
halaman buku:

1. Perbaiki canonical + pagination (✅ sudah) → Googlebot mengikuti tautan HTML.
2. Sitemap bersih + tautan internal (✅ sudah).
3. Submit sitemap ulang (mode `ping` di bawah atau GSC UI).
4. GSC → **URL Inspection** → "Request Indexing" untuk URL prioritas (homepage katalog,
   `/informasi`, 5–10 buku paling relevan).
5. Pantau **Page Indexing** mingguan; "Discovered – currently not indexed" harus turun
   menjadi "Crawled – currently not indexed" lalu "Indexed".

Kuadra Indexing API: kuota default berbasis proyek (ratusan permintaan *publish* per
hari; jalur bulk lowongan kerja punya kuota terpisah yang bisa dinaikkan lewat
formulir kuota). Mengirim 207 URL sekaligus **dalam satu batch** tidak didukung API
(`urlNotifications:publish` hanya menerima satu `url` per permintaan) dan pattern
"seribu request mendadak" justru dibaca sebagai sinyal spam.

### 5.2 Setup Service Account (Google Cloud Console)

1. Buka <https://console.cloud.google.com> → buat **project baru** (mis. "Smart Library SEO").
2. Menu **APIs & Services → Library** → cari **"Indexing API"** → **Enable**.
   (Untuk mode `ping`, aktifkan juga **"Search Console API"**.)
3. **APIs & Services → Credentials** → **Create Credentials → Service Account**
   → nama `smart-library-indexing` → **Create** (lewati akses ke Google Workspace).
4. Buka service account yang dibuat → tab **Keys** → **Add key → Create new key**
   → tipe **JSON** → **Create**. File `*.json` terunduh (simpan sebagai Secret, jangan
   di-commit).
5. Salin **Service account email** (format `...@...iam.gserviceaccount.com`).
6. Buka **Google Search Console → Settings → Users and permissions → Add user**,
   tempel email tersebut, hak akses **Full** (atau minimal "Full" agar bisa submit
   sitemap; user non-owner pun bisa memakai Indexing API, tetapi GSC tetap dipakai
   untuk verifikasi & monitoring).
7. Simpan file JSON di lokasi aman, lalu set env:

```bash
export GOOGLE_SERVICE_ACCOUNT_JSON=/run/secrets/smart-library-indexing.json
export SITE_URL=https://perpustakaansmp17tangsel.web.id
```

> File JSON **tidak boleh** masuk repo. Tambahkan `*.json` untuk kunci service account
> ke `.gitignore` bila disimpan di dalam project.

### 5.3 Script yang tersedia (`scripts/google-indexing.mjs`)

Mode 1 — export daftar URL dari sitemap ke CSV/TXT (untuk audit/manual submit):

```bash
node scripts/google-indexing.mjs export
# -> seo-urls.csv, seo-urls.txt
```

Mode 2 — submit sitemap lewat Search Console API (ini yang benar & aman):

```bash
node scripts/google-indexing.mjs ping
```

Mode 3 — Indexing API (hanya untuk JobPosting/BroadcastEvent; **jangan** untuk katalog buku):

```bash
node scripts/google-indexing.mjs index --file seo-urls.csv
```

Skrip memakai `node:crypto` saja (tanpa dependency baru): menandatangani JWT RS256,
menukar token OAuth2 `https://oauth2.googleapis.com/token`, lalu memanggil
`https://indexing.googleapis.com/v3/urlNotifications:publish` (satu URL per permintaan)
atau `https://www.googleapis.com/webmasters/v3/sites/{site}/sitemaps/sitemap.xml` (PUT).

Mode `index` sengaja mengirim **satu URL per panggilan** (bukan batch) dan menolak URL
di luar host situs.

### 5.4 Best practice pengindeksan (aman & tidak terbaca spam)

* Kirim **satu** URL per permintaan, jeda 1–2 detik antar request.
* Jangan pernah mengirim URL `noindex`, URL redirect, atau URL canonical lain.
* Jangan mengirim URL yang tidak berubah (sitemap + tautan internal lebih baik).
* Komunikasikan lewat HTTP `200`/`304` + `Last-Modified`/`ETag` yang benar — Google
  lebih dulu memeriksa URL itu memang bisa di-crawl.
* Batasi total kuota harian; jangan ulangi request yang sama di hari yang sama.
* Setelah URL masuk indeks, **jangan** kirim ulang; pakai sitemap `lastmod` sebagai
  sinyal perubahan.
* Jangan gunakan `URL_CRAWL` pada URL yang isinya berubah tiap detik (halaman borrow).

---

## 6. Checklist pasca-deploy

1. Deploy ke `main` (Vercel) — remember: merge ke `main`, bukan push branch.
2. `curl -I` periksa: `/books` (200), `/books?page=2` (200 + canonical page=2),
   `/login` (200 + noindex), `/faq` (308), `/card/x` (404/200 + noindex),
   `www.` (301), `http://` (301), `/books/` (308).
3. GSC → **Sitemaps** → submit `sitemap.xml` ulang (atau `node scripts/google-indexing.mjs ping`).
4. GSC → **URL Inspection** → cek `https://.../books?page=2`: canonical harus
   `https://.../books?page=2` (bukan `/books`).
5. GSC → **Page Indexing → Test Live URL** untuk 5 URL buku; klik "Request Indexing".
6. Pantau mingguan: targetkan 195 URL "Discovered" → "Crawled" → "Indexed" dalam 2–4
   minggu.
7. **Pengayaan data (wajib, kalau tidak halaman tetap tipis):** isi `author`, `isbn`,
   `publication_year`, `cover_url` untuk 207 buku. 205 buku saat ini bertuliskan
   author generik "Koleksi Perpustakaan". Alur yang sudah disiapkan:

   ```bash
   npm run books:export                      # -> docs/template-koleksi-buku.csv (207 baris)
   # buka di Excel/Sheets, isi kolom 'author' (+ opsional isbn/tahun/penerbit/sampul)
   npm run books:apply -- --file docs/koleksi-buku.csv --dry   # lihat dulu apa yang berubah
   npm run books:apply -- --file docs/koleksi-buku.csv         # terapkan
   ```

   Aturan skrip: pencocokan per judul (toleran tanda kutip & spasi), hanya kolom
   terisi yang diperbarui, judul tidak pernah diubah, baris dengan jumlah kolom
   tidak sesuai header dilewati (bukan ditulis dengan data bergeser), dan semua
   perubahan dicatat di `audit_logs`.

   > Catatan: menu **Impor Data** (`/admin/import`) **tidak** cocok untuk tujuan
   > ini — impor mencocokkan `judul+penulis`, sehingga-changing author akan
   > membuat **judul ganda** di katalog, bukan memperbarui.
8. Opsional: buat route `/kategori/[slug]` agar kategori punya URL hub yang diindeks.

---

## 7. Referensi

* Google Search Central – *Consolidate duplicate URLs*: <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>
* Google – *Indexing API best practices*: <https://developers.google.com/search/docs/crawling-indexing/vision-api>
  (catatan: policy yang sama berlaku untuk Indexing API)
* Google – *Build and submit a sitemap*: <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>
* Google – *Robots.txt introduction*: <https://developers.google.com/search/docs/crawling-indexing/robots/intro>
* Google – *Spam policies*: <https://developers.google.com/search/docs/essentials/spam-policies>
