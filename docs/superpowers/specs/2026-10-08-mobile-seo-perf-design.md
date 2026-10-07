# Design Spec — Mobile Sizing, SEO, dan Performa

**Status:** menunggu review
**Tanggal:** 2026-10-08
**Scope:** perbaikan mobile (semua role, semua breakpoint) + SEO minimal yang benar + optimasi performa

---

## 1. Masalah

Aplikasi Next.js 16.3.8 / React 19.2 / Tailwind v4 perpustakaan sekolah dengan tiga role
(student, librarian, admin). Structurally sehat: `src/app` (RSC) → `src/features/*` (domain
logic) → `src/components/ui` (design system) → `src/lib`. Tidak ada refactor arsitektur
yang dibutuhkan.

Yang rusak adalah detail presentation:

1. **Touch target di bawah standar.** PRD §15 mensyaratkan minimum 56px untuk siswa;
   WCAG 2.5.8 mensyaratkan 44px untuk semua target sentuh. Implementasi saat ini
   melanggar keduanya di beberapa tempat.
2. **Viewport tidak dikonfigurasi.** Bottom navigation memakai
   `env(safe-area-inset-bottom)` tetapi `viewport-fit=cover` tidak di-set, sehingga
   padding tersebut tidak berefek pada iPhone.
3. **Tabel lebar tanpa fallback.** Lima tabel memakai `min-w-[640px]` di dalam
   `overflow-x-auto`. Secara fungsional bisa digeser, tapi tidak ada affordance
   scroll-snap maupun petunjuk visual.
4. **Grid tanpa breakpoint.** Beberapa `grid-cols-3` / `grid-cols-2` tanpa prefiks
   `sm:` membuat konten sempit pada layar 360px.
5. **Tipografi berorientasi desktop.** `text-[11px]`, angka statistik `text-3xl`,
   label `font-mono uppercase` — terlalu kecil pada layar HP.

Selain itu ada dua temuan di luar scope mobile:

6. **Kelas animasi mati.** `animate-in`, `fade-in`, `zoom-in-95`,
   `slide-in-from-right`, dan `duration-220/240/320` berasal dari paket
   `tailwindcss-animate` yang **tidak ada di `package.json`**. Seluruh kelas tersebut
   menghasilkan CSS kosong. Drawer, toast, command palette, dan QR scanner punya
   transisi yang tidak pernah berjalan.
7. **Bundle `XLSX` statis.** `src/app/admin/import/import-client.tsx:5` mengimpor
   `* as XLSX from "xlsx"` di level modul pada client component. Bundle route
   tersebut membawa parser spreadsheet penuh yang baru dipakai saat pengguna
   menekan tombol unduh template atau memilih file.

## 2. Keputusan yang sudah diambil

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Tipografi | **Full typography system** — token peran di `@theme`, semua ukuran px di JSX diganti | Dipilih eksplisit oleh pengguna. Skala `text-xs`/`text-sm`/`text-[11px]` mencakup 390 pemakaian dengan nilai yang sama untuk peran yang berbeda; token peran membuatnya dapat diperbaiki di satu tempat. |
| Tabel | Snap-scroll + affordance di semua tabel; card-list fallback **hanya** di `/student/loans` dan `/student/history` | Tabel admin di HP memang tepat untuk digeser. Card fallback di kelima tabel ≈300 baris baru tanpa nilai. |
| Breakpoint | Seimbang, semua role | Dipilih eksplisit oleh pengguna. |
| SEO | Minimal tapi benar | Hanya `/login` yang publik. Sitemap dan JSON-LD tidak ada gunanya. |
| Animasi | Buang semua kelas mati, andalkan native | Nol dependency baru. |
| Font | `display: 'swap'` + preload, tanpa ubah family | Atkinson Hyperlegible (body) adalah font utama yang dibaca di layar kecil; swap menghilangkan blocking render di koneksi lambat. |

## 3. Arsitektur

### 3.1 Typography system

Keputusan pengguna: **full typography system** — semua ukuran teks menjadi token
semantik, tidak ada lagi nilai px hardcoded di JSX. Skala angka mentah
(`text-sm`, `text-xs`, `text-[11px]`) diganti utility peran yang dinamai
menurut fungsinya, sehingga satu edit di `globals.css` mengubah seluruh situs.

**Prinsip:** token dinamai menurut **peran**, bukan ukuran. `text-label` bukan
"12px" — kalau 12px ternyata terlalu kecil untuk label di layar HP, satu token
diubah dan semua label ikut benar. inilah yang membuat sistem ini bekerja;
token bernama `text-xs` tidak akan accomplish apa pun.

Token di `@theme` (`src/app/globals.css`), sebagai `--text-*` agar Tailwind
menghasilkan utility `text-*` yang bisa dipakai langsung:

| Token | Nilai mobile | Peran |
|---|---|---|
| `--text-display-lg` | `1.75rem` | Angka statistik utama, judul halaman |
| `--text-display-sm` | `1.5rem` | Angka sekunder, judul card |
| `--text-title` | `1.125rem` | Judul section, heading dialog |
| `--text-body` | `0.9375rem` (15px) | Body text, isi tabel, deskripsi |
| `--text-label` | `0.8125rem` (13px) | Label form, label tabel, chip |
| `--text-meta` | `0.75rem` (12px) | Metadata, hint, breadcrumb, timestamp |
| `--text-tap` | `0.8125rem` | Teks di dalam target sentuh — minimum agar label tetap terbaca |

Nilai mobile adalah nilai dasar; ukuran yang lebih besar datang dari utility
`sm:` / `lg:` di call-site yang butuh. Contoh: heading halaman adalah
`text-display-sm lg:text-display-lg`, bukan satu nilai yang benar untuk semua
layar.

Aturan penggantian untuk seluruh 89 file `src/`:

| Nilai lama | Token baru | Catatan |
|---|---|---|
| `text-4xl` | `text-display-lg` | hanya di login, 1 pemakaian |
| `text-3xl` | `text-display-lg` | 19 pemakaian, statistik dashboard |
| `text-2xl` | `text-display-sm` | 30 pemakaian |
| `text-xl` | `text-title` | 4 pemakaian |
| `text-lg` | `text-title` | 25 pemakaian, termasuk heading dialog |
| `text-base` | `text-body` | 27 pemakaian |
| `text-sm` | `text-body` | 125 pemakaian, perlu review per call-site |
| `text-xs` | `text-label` atau `text-meta` | 219 pemakaian, pembagian berbasis konteks |
| `text-[11px]` | `text-meta` | 21 pemakaian, semua terlalu kecil |
| `text-[10px]` | `text-meta` | 4 pemakaian, semua terlalu kecil |

Dua kasus yang butuh penilaian, bukan penggantian otomatis:

- **`text-sm` → `text-label` pada tabel.** Isi tabel 15px pada 360px membuat
  tabel perlu scroll lebih dalam dari yang sebenarnya diperlukan. Sel tabel
  menjadi `text-label`, header tetap `text-meta`.
- **`text-xs` → `text-label` pada chip dan badge.** `StatusChip` memakai
  `text-sm` saat ini; pada layar HP 15px di dalam chip membuat chip terlalu
  lebar. Setelah token, chip memakai `text-label`.

Nilai **`text-ink`, `text-sky`, `text-coral`, `text-white`** dan Alignment
(`text-center`, `text-left`, `text-right`) **tidak disentuh** — itu warna dan
layout, bukan tipografi. 469 + 96 + 46 + 34 + 26 + 22 + 7 pemakaian warna tidak
berubah sama sekali.

**Penggantian token `text-4xl` sampai `text-base` bisa dilakukan otomatis** —
tujuh nilai memetakan satu-ke-satu dan aman diganti global dengan satu lintasan
regex.
`text-sm` dan `text-xs` tidak: keduanya punya dua token tujuan, jadi keduanya
ditangani per file, bukan global.

Token spacing yang ditambahkan bersamaan:

- `--spacing-tap-min`: 44px — floor semua target sentuh (WCAG 2.5.8).
- `--spacing-tap-lg`: 56px — target utama untuk siswa (PRD §14.1).

### 3.2 Shared component

`Button` (`src/components/ui/button.tsx`) adalah titik perubahan terbesar:

| Size | Saat ini | Sesudah |
|---|---|---|
| `sm` | `min-h-10 text-sm` (40px) | `min-h-11 text-sm` (44px) |
| `md` | `min-h-12 text-base` (48px) | tetap |
| `lg` | `min-h-14 text-lg` (56px) | tetap — sudah memenuhi PRD |

`sm` naik ke 44px karena `sm` dipakai untuk kontrol toolbar dan aksi sekunder
di seluruh app; 40px tidak memenuhi standar. `lg` tidak disentuh karena sudah 56px.

`Field` / `Input` / `Select` (`src/components/ui/field.tsx`): `min-h-12` sudah 48px
dan `text-base` sudah 16px (mencegah iOS auto-zoom). Tidak ada perubahan ukuran;
hanya `min-w-0` ditambahkan ke wrapper agar tidak meledak dalam grid.

`Dialog` / `Drawer` (`src/components/ui/dialog.tsx`, `drawer.tsx`): padding
horizontal `px-6` → `px-4 sm:px-6`, tombol tutup `size-10` → `size-11`,
heading `text-lg` → `text-base sm:text-lg`. Drawer juga kehilangan `animate-in`
/ `slide-in-from-right` dan_gets_ keyframes native (§3.4).

`AppShell` (`src/components/layout/app-shell.tsx`):
- Tombol hamburger `size-10` → `size-11`.
- Item bottom-nav `w-10 h-10` → `min-h-11 min-w-11` dengan label teks di bawah
  ikon (saat ini `collapsed={true}` menyembunyikan label, menyisakan kotak ikon
  40px yang sulit ditebak).
- Tombol collapse sidebar `size-7` → `size-9` (desktop, target mouse, bukan
  sentuh — tidak wajib 44px, tapi 28px terlalu kecil untuk pointer).
- Breadcrumb `hidden sm:flex` dipertahankan; di bawah `sm` topbar hanya brand.

### 3.3 Tabel

`DataTable` (`src/components/ui/data-table.tsx`):

- `overflow-x-auto` dipertahankan dan diberi `snap-x snap-mandatory` pada
  `<table>` bersama `snap-start` per `<td>` agar baris berhenti tepat di tepi.
- Tambahkan petunjuk scroll yang hanya muncul di layar kecil: satu baris teks
  kecil di bawah tabel, `sm:hidden`,chts "Geser untuk melihat kolom lain".
- Padding sel `px-4 py-3.5` → `px-3 py-3 sm:px-4 sm:py-3.5` agar lebih lega di
  HP tanpawali ruang di desktop.

`/student/loans` dan `/student/history` mendapat card list pada breakpoint
mobile dengan tabel disembunyikan `hidden sm:block` dan card `sm:hidden`. Card
berisi-field yang sudah ada di kolom tabel — bukan data baru. Komponen card
digabung sebagai internal helper di file masing-masing, bukan komponen baru di
`components/ui`, karena hanya dipakai di dua halaman ini.

Tabel `import-client.tsx:553`, `transactions-client.tsx:90`, dan
`admin/books/[id]/page.tsx:188` hanya mendapat perbaikan padding yang sama;
tidak mendapat card fallback.

### 3.4 Kelas animasi mati

Semua pemakaian `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-right`,
`duration-220`, `duration-240`, `duration-320`, `shadow-2xs` dihapus. Setiap
komponen yang kehilangan animasinya diberi keyframes native di `globals.css`,
di sebelah `@keyframes rise` yang sudah ada:

```css
@keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes slide-in-right { from { transform: translateX(100%) } to { transform: none } }
```

Drawer memakai `slide-in-right`, toast dan backdrop memakai `fade-in`. Semua
otomatis nonaktif oleh blok `prefers-reduced-motion` yang sudah ada di
`globals.css:94`.

Nilai `duration-150`, `duration-200`, `duration-300` **dipertahankan** — itu
utility standar Tailwind, bukan dari plugin.

### 3.5 Bundle XLSX

`import-client.tsx` mengimpor `XLSX` secara statis. Diubah menjadi dynamic import
di dua titik pemakaian:

- `downloadTemplate()` — sudah async, jadi `const XLSX = await import("xlsx")`.
- Pipeline parse file — dipanggil setelah file dipilih pengguna.

Hanya `import type` yang tetap statis di level modul, karena tipe tidak
menghasilkan runtime code.

### 3.6 SEO

Semua halaman selain `/login` berada di balik `requireRole`. Tidak ada konten
publik untuk di-index. Scope:

- `src/app/layout.tsx`: tambah `metadataBase`, `title.template`, `openGraph`
  dan `twitter` dengan nilai default yang benar, plus `robots` default.
- `src/app/layout.tsx`: tambah export `viewport` dengan `themeColor`
  (`#ffffff`, sesuai `--color-background`) dan `viewportFit: 'cover'` — yang
  terakhir mengaktifkan `env(safe-area-inset-*)` yang sudah dipakai AppShell.
- `src/app/login/page.tsx`: `metadata` khusus dengan title dan description
  yang menyebut sekolah, plus `openGraph`.
- `src/app/robots.ts` (file baru): izinkan `/` dan `/login`, disallow
  `/admin`, `/librarian`, `/student`, `/api`.
- Tidak ada `sitemap.ts` dan tidak ada JSON-LD.

Metadata per-route di area admin/librarian/student **tidak** ditulis. Halaman
terindex yang isinya salah adalah hasil yang lebih buruk daripada tidak
ada metadata sama sekali.

### 3.7 Font

`src/app/layout.tsx` — tiga font `next/font/google` mendapat `display: 'swap'`
eksplisit dan `preload: true`. Nilai default `next/font` sudah `swap` untuk font
yang dimuat lewat build, jadi ini pada dasarnya konfirmasi eksplisit; yang
berubah adalah penambahan preload pada `Atkinson Hyperlegible` (font body)
sehingga tidak blocking.

Dengan typography system, peran kedua font ditegaskan dan inilah yang membuat
tampilan terasa berbeda dari template dashboard generik — bukan karena family
yang berbeda, melainkan karena hierarkinya:

- `--font-display` hanya dipakai oleh `--text-display-lg`, `--text-display-sm`,
  dan `--text-title`. Judul dan angka statistik.
- `--font-sans` dipakai oleh `--text-body`, `--text-label`, `--text-meta`.
  Seluruh teks bacaan.

Atkinson Hyperlegible sudah `subsets: ["latin"]` dan `weight: ["400", "700"]` —
sudah minimal, tidak dipangkas lebih lanjut karena keterbacaan adalah alasan
principal PRD memilih font ini.

## 4. Aliran data dan batas perubahan

Perubahan ini murni presentational — tidak ada perubahan pada alur data,
server action, query Supabase, atau authorization. Tidak ada perubahan pada
`src/features/**` maupun `src/lib/**`.

Satu-satunya hal yang menyerupai logika adalah keyframes animasi di
`globals.css`, yang murni CSS.

## 5. Penanganan error

Tidak ada jalur error baru. Tidak ada fetch, tidak ada state server, tidak ada
boundary yang perlu ditambah.

Satu risiko yang harus dicek saat implementasi: menghapus kelas `animate-in`
tidak boleh meninggalkan elemen yang bergantung pada `opacity: 0` dari utility
yang hilang. Kalau ada elemen yang terlihat hilang setelah animated utility
dihapus, itu bug — perbaiki dengan memastikan keyframes menggantikan animate-in
meng-set opacity awal.

## 6. Pengujian

Repo ini tidak punya test runner terpasang (`package.json` scripts: dev, build,
start, lint, seed). Menambah test framework untuk perubahan CSS melampaui proporsi
nilai — tidak ada logika bisnis yang berubah.

Verifikasi yang dijalankan:

1. `npm run build` — harus lulus tanpa error TypeScript.
2. `npm run lint` — harus lulus tanpa warning baru.
3. Grep assertion: setelah perubahan, nilai-nilai ini harus **tidak ada** lagi
   di `src/`:

   | Pola | Alasan |
   |---|---|---|
   | `text-4xl`, `text-3xl`, `text-2xl`, `text-xl`, `text-lg`, `text-base` | — | digantikan token peran |
   | `text-sm` | — | digantikan `text-body` / `text-label` |
   | `text-xs` | — | digantikan `text-label` / `text-meta` |
   | `text-\[1[01]px\]` | — | terlalu kecil, digantikan `text-meta` |
   | `min-h-10`, `size-7`, `size-8` | — | di bawah floor 44px |
   | `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-right` | — | plugin tidak terinstall |
   | `duration-220`, `duration-240`, `duration-320` | — | bukan utility Tailwind |
   | `import \* as XLSX` | — | harus dynamic import |

   Ini pemeriksaan runnable dan deterministik — satu perintah shell yang gagal
   kalau ada yang tertinggal.

   **`text-9xl` sampai `text-sm` sengaja TIDAK masuk daftar.** Nama itu masih
   valid Tailwind; yang hilang adalah pemakaiannya. `text-ink`, `text-sky`,
   `text-center` dan sejenisnya juga tetap — itu warna dan layout.

   `size-9` juga tidak masuk daftar: itu nilai akhir tombol collapse sidebar di
   desktop (`app-shell.tsx`), yang targetnya pointer bukan sentuh.
4. Inspect manual di viewport 375px dan 390px untuk: siswa beranda, katalog,
   loans (card view), history (card view), librarian borrow, dan satu tabel
   admin.
5. Inspect hierarki tipografi di satu halaman dashboard: judul harus terasa
   jelas lebih besar dan lebih bold dari body, dan angka statistik harus
   mendominasi. Kalau semuanya terasa berukuran sama, tokennya belum
  diterapkan dengan benar — periksa apakah `text-display-lg` benar-benar terpasang.

## 7. Di luar scope

- Refactor arsitektur folder. Strukturnya sudah benar.
- Tailwind plugin baru apa pun.
- Sitemap, JSON-LD, structured data.
- Test framework baru.
- Dark mode.
- Desktop layout — tidak ada perubahan visual yang disengaja di >=768px, kecuali
  dua hal: padding tabel yang kembali ke nilai lama lewat varian `sm:`, dan
  tombol collapse sidebar yang membesar dari 28px ke 36px (pointer target,
  disengaja).
- Perbaikan `dashboard/interactive-chart.tsx` yang sudah `size-2.5` — itu valid
  di Tailwind v4, bukan kelas mati.