# SEO & Indexing Action Plan — Smart Library SMP Negeri 17 Tangerang Selatan

Daftar aksi implementasi dan verifikasi untuk memastikan situs resmi terindeks secara optimal di Google Search Console dan mesin pencari.

---

## Tahap 1: Verifikasi Google Search Console (Immediate / Prioritas Tinggi)

- [x] **Pindahkan file HTML verifikasi Google ke direktori publik**
  - **Status:** Selesai (`public/google71d4fde80b9f342b.html`).
  - **Tujuan:** Memenuhi metode verifikasi *HTML File Upload*.
- [x] **Sisipkan meta tag verifikasi Google ke root layout**
  - **Status:** Selesai (`<meta name="google-site-verification" content="moQUHIkJGba0sgC0I_eMpolduulMFTkFLafDnO5YSOI" />`).
  - **Tujuan:** Memenuhi metode verifikasi *HTML Tag*.
- [x] **Standarisasi URL ke protokol HTTPS**
  - **Status:** Selesai (`metadataBase`, `canonical`, `sitemap.xml`, `robots.txt`, dan JSON-LD).
- [ ] **Lakukan Verifikasi di Google Search Console**
  - **Instruksi:** Kembali ke tab Google Search Console, klik tombol **Verifikasi** pada metode File HTML atau Tag HTML.
- [ ] **Kirimkan Peta Situs (Sitemap)**
  - **Instruksi:** Di menu Google Search Console > **Sitemaps**, masukkan URL: `sitemap.xml` lalu klik **Submit**.

---

## Tahap 2: Penguatan Metadata & Rich Snippets (Completed)

- [x] **Konfigurasi Open Graph Image & URL Lengkap**
  - **Aksi:** Menambahkan `og:image` (logo sekolah 512×512) dan `og:url` ke metadata `src/app/layout.tsx`.
- [x] **Konfigurasi Twitter Card Preview**
  - **Aksi:** Menambahkan `twitter:image` untuk rendering kartu preview yang menarik saat link dibagikan di media sosial.
- [x] **Penyelarasan Canonical URL**
  - **Aksi:** Menambahkan `alternates: { canonical: "/" }` di root metadata untuk mencegah duplicate content issues.

---

## Tahap 3: Pemeliharaan Keamanan & Proteksi Crawling

- [x] **Perlindungan Data Internal Sekolah**
  - **Status:** Direktori `/admin`, `/student`, dan `/api` tetap berada di bawah aturan `Disallow` pada `robots.txt`.
- [x] **Pengamanan Akses Kamera Siswa/Petugas**
  - **Status:** Header `Permissions-Policy: camera=(self)` aktif untuk menjamin fitur pemindai QR hanya berjalan di domain resmi.
