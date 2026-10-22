# ADR-005: Strategi URL Kanonik, Paginasi, dan Permukaan Pengindeksan

## Status
Accepted

## Date
2026-10-22

## Context
Laporan Page Indexing Google Search Console (22 Okt 2026) untuk
`https://perpustakaansmp17tangsel.web.id` menunjukkan:

- **195 URL** berstatus *"Discovered – currently not indexed"*.
- **1 URL** berstatus *"Duplicate, Google chose different canonical with user"*.

Audit terhadap URL produksi menemukan empat penyebab:

1. **Canonical paginasi statis.** `src/app/books/page.tsx` mendefinisikan
   `alternates: { canonical: "/books" }` sebagai metadata statis. Karena metadata
   statis berlaku untuk semua query string, `/books?page=2…18` semuanya menunjuk
   canonical ke `/books`. Google mengonsolidasikan 17 halaman katalog menjadi satu
   URL dan berhenti menjelajah. Repo ini memiliki **207** halaman buku; hanya **12**
   (halaman 1 katalog) yang pernah dirayapi → `207 − 12 = 195`, persis cocok dengan
   laporan GSC.
2. **`alternates.canonical` di root layout.** `src/app/layout.tsx` menyetel
   `canonical: "/"` yang diwarisi seluruh route, termasuk `/card/<token>`
   (kartu anggota siswa) dan root `/` yang merupakan redirect 307 berbasis sesi
   (admin → `/admin`, publik → `/books`) → GSC melaporkan 1 URL "Duplicate".
3. **`robots.txt` bocor ke permukaan internal.** Grup khusus `User-Agent: Googlebot`
   hanya berisi `Allow: /` tanpa `Disallow`; Google memakai grup khusus itu dan
   mengabaikan grup `*`, sehingga `/admin/*`, `/api/*`, dan `/card/<token>`
   dirayapi Googlebot.
4. **Konten nyaris identik pada 207 halaman buku.** 205 dari 207 buku memiliki
   `author` generik "Koleksi Perpustakaan", tanpa ISBN, sampul, maupun tahun terbit.

## Decision

1. **Satu URL kanonik per konten; canonical tidak pernah di root layout.**
   `alternates.canonical` dan `robots` hanya didefinisikan per route publik.
   Metadata layout teratas tidak lagi memuat canonical maupun directives robots.
2. **Paginasi katalog memakai query string dengan canonical self-referencing.**
   `/books?page=N` (N > 1) memiliki canonical ke dirinya sendiri; `/books` (halaman 1)
   canonical ke `/books`. Tampilan hasil filter/pencarian (`?cat=`, `?q=`, `?avail=`)
   memakai `noindex` + canonical `/books`.
3. **Katalog sebagai beranda kanonik.** Root `/` adalah redirect berbasis sesi,
   jadi tidak stabil sebagai URL kanonik: root tidak masuk sitemap, dan `/books`
   menjadi URL beranda (prioritas 1.0). `/login` (portal staf) dan `/faq`
   (redirect 308 ke `/informasi`) juga tidak masuk sitemap.
4. **Permukaan privat ditutup untuk semua bot.** `robots.txt` memuat grup
   `Googlebot` dan grup `*` yang identik: allow `/`, disallow `/admin`, `/api`,
   `/card`, `/change-password`. Konten privat memakai tag `noindex`, bukan
   `Disallow`, agar tag-nya sempat dibaca Google.
5. **Konsistensi host & trailing slash.** `trailingSlash: false` di `next.config.ts`
   (Next otomatis 308), redirect `www` → apex dan `http` → `https` 301 di
   `src/proxy.ts`, plus domain alias `www` di Vercel dengan redirect 308.
6. **Internal linking strengthens each book page.** Breadcrumb yang dapat diklik,
   JSON-LD `BreadcrumbList`, blok "Buku terkait" (6 buku kategori yang sama),
   dan tautan footer site-wide (`Katalog`, `Profil & FAQ`, `Peta Situs`).
7. **Indexing API tidak dipakai untuk katalog.** API itu resmi hanya untuk
   `JobPosting`/`BroadcastEvent`; penggunaan di luar cakupan berisiko de-indexing.
   Jalur resmi: sitemap + tautan internal + URL Inspection "Request Indexing".

## Alternatives Considered

### Opsi A: Mempertahankan paginasi query string apa adanya
- **Kelebihan:** tanpa perubahan kode pada route katalog.
- **Kekurangan:** canonical tetap sama untuk semua halaman → 195 halaman tidak pernah
  dirayapi. Ditolak.

### Opsi B: Paginasi berbasis path (`/books/page/2`, atau `generateStaticParams` + route segment)
- **Kelebihan:** URL lebih "bersih", tidak ada query string.
- **Kekurangan:** memerlukan route/segment baru, perubahan link builder, dan
  duplikasi logika filter;Fitur ini belum diperlukan karena canonical self-referencing
  + query string sudah diterima Google. Ditolak (YAGNI).

### Opsi C: Menambahkan `generateStaticParams` untuk 207 halaman buku
- **Kelebihan:** HTML statis, TTFB sangat cepat saat dirayapi.
- **Kekurangan:** build-time butuh DB produksi; revalidasi manual saat koleksi berubah.
- **Ditolak sementara:** TTFB saat ini ~0,9 s masih di bawah ambang crawl budget;
  `unstable_cache` (120–3600 s) sudah menekan beban DB. Evaluasi ulang bila crawl
  masih lambat.

### Opsi D: Menggunakan Google Indexing API untuk 207 halaman buku
- **Kelebihan:** permintaan indexing eksplisit.
- **Kekurangan:** melanggar kebijakan spam Google (API hanya untuk JobPosting/
  BroadcastEvent), kuota harian terbatas, dan tidak menyelesaikan akar masalah.
  Ditolak.

## Consequences

- **Positif:** 195 URL "Discovered" memiliki jalur crawl yang jelas (canonical
  self-referencing + anchor "Berikutnya" + 6 tautan "buku terkait" per halaman);
  `/admin`, `/api`, `/card` tidak lagi dirayapi Googlebot; 1 URL "Duplicate"
  hilang karena hanya `/books` yang menjadi versi kanonik katalog.
- **Negatif:** `/books?page=N` kini terindeks sebagai 18 URL terpisah (canonical
  berbeda) — itu memang slice katalog yang sah;
  `/books` (halaman 1) tetap menjadi yang utama lewat `priority 1.0` dan tautan
  footer/nav.
- **Utang teknis:** 207 halaman buku masih thin (205/207 author generik). Enrichment
  data lewat `/admin/import` wajib dilakukan, jika halaman tetap tidak lolos
  "Crawled – currently not indexed".
- **Operasional:** setelah deploy, submit ulang sitemap dan pantau Page Indexing
  mingguan (target: 195 → "Crawled" dalam 2–4 minggu).
