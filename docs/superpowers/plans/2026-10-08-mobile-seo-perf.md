# Mobile Sizing, Typography System, SEO, dan Performa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbaiki sizing mobile di seluruh aplikasi lewat token semantik di `@theme`, membuang kelas Tailwind yang mati, memperbaiki metadata SEO, dan memangkas bundle `XLSX`.

**Architecture:** Satu-satunya sumber kebenaran ukuran adalah blok `@theme` di `src/app/globals.css`. Token dinamai menurut **peran** (`--text-title`, bukan `--text-18px`) sehingga satu edit memperbaiki seluruh situs. Shared component (`Button`, `Field`, `Dialog`, `Drawer`, `DataTable`) memakai nilai mobile sebagai nilai dasar. Tidak ada perubahan pada `src/features/**`, `src/lib/**`, server action, atau authorization.

**Tech Stack:** Next.js 16.3.8 (App Router), React 19.2, Tailwind CSS v4, TypeScript 5, Supabase.

**Spec:** `docs/superpowers/specs/2026-10-08-mobile-seo-perf-design.md`

## Global Constraints

- Repo ini **belum git repo**. Task 1 adalah `git init` + commit awal. Semua `git commit` di langkah lain bergantung pada Task 1.
- Tidak ada test runner. Verifikasi = `npm run build`, `npm run lint`, dan grep assertion. Jangan menambah test framework.
- Tailwind v4. Token `@theme` menghasilkan utility secara otomatis: `--text-title` → `text-title`. Tidak perlu `@layer utilities` atau konfigurasi tambahan.
- Nilai warna (`text-ink`, `text-sky`, `text-coral`, `text-white`, `text-leaf`, `text-sun`, `text-berry`) dan alignment (`text-center`, `text-left`, `text-right`) **tidak boleh berubah**. 688 pemakaian warna; hanya ukuran yang diganti.
- Nilai `duration-150`, `duration-200`, `duration-300`, `size-3.5`, `size-2.5`, `size-4.5`, `size-1.5` **valid di Tailwind v4** — jangan disentuh. Yang mati hanya `duration-220/240/320` dan keluarga `animate-in`.
- Bahasa seluruh UI, komentar, dan identifier: Bahasa Indonesia. Hanya nama token dan property `Metadata`/`Viewport` yang bahasa Inggris.
- PRD §15: touch target minimum 56px untuk aksi utama siswa. WCAG 2.5.8: 44px floor untuk semua target sentuh.

## Review Focus

Lima kondisi yang paling mungkin menggigit orang yang memakai aplikasi ini, dan yang tidak diuji oleh langkah mana pun di plan ini karena semuanya presentational:

1. **Tabel di 360px dengan chip panjang** — "Terlambat" + ikon + padding 12px bisa melebar lebih dari lebar layar dan memaksa scroll horizontal pada tabel yang seharusnya muat. Task 4.
2. **Dialog di 320px** — `w-[min(560px,calc(100vw-2rem))]` dengan `px-4` menyisakan 288px konten; form dua kolom (`sm:grid-cols-2`) harus runtuh ke satu kolom, kalau tidak field-nya terpotong. Task 5.
3. **Empty state di tabel** — `colSpan` dengan `hidden sm:block` pada tabel dan `sm:hidden` pada card harus sama-sama menampilkan "tidak ada data", bukan salah satu kosong. Task 6.
4. **Long title buku di card mobile** — `/student/loans` card memakai `truncate` atau `line-clamp`; judul tanpa batas akan merusak tinggi kartu. Task 6.
5. **iOS safe area** — tanpa `viewportFit: 'cover'`, `env(safe-area-inset-bottom)` pada bottom-nav bernol dan tombol logout tepi bawah tertutup home indicator. Task 8.

---

### Task 1: Git init dan baseline

**Files:**
- Create: `.gitignore` sudah ada — **diverifikasi**, tidak diubah
- Modify: tidak ada

**Interfaces:**
- Consumes: tidak ada
- Produces: repo git yang bisa di-commit. Semua task berikutnya bergantung pada ini.

- [ ] **Step 1: Inisialisasi git dan commit baseline**

```bash
cd /home/dimskuyyyy/Smart-Library
git init
git add -A
git commit -m "chore: baseline sebelum perbaikan mobile/typography/SEO"
```

`.gitignore` sudah ada dan sudah mencakup `.next/`, `node_modules/`, `.env.local` — periksa sekali dengan `git status --short | grep -c '.env.local'` dan pastikan hasilnya `0`. Kalau bukan `0`, `.env.local` akan ikut ter-commit dan itu kebocoran kredensial Supabase; perbaiki `.gitignore` sebelum lanjut.

Expected: commit sukses, `git status` bersih.

- [ ] **Step 2: Pastikan baseline build hijau**

Run: `npm run build`
Expected: build selesai tanpa error TypeScript. Kalau gagal **sekarang**, perbaiki atau catat — bukan untuk diperbaiki dalam plan ini, tapi supaya Task 2 tidak salah menyalahkan plan.

---

### Task 2: Typography token di `@theme`

**Files:**
- Modify: `src/app/globals.css:11-55` (blok `@theme`)
- Test: tidak ada — verifikasi via `npm run build` dan grep

**Interfaces:**
- Consumes: tidak ada
- Produces: utilities Tailwind berikut, yang dipakai Task 3–8:
  - `text-display-lg` (1.75rem), `text-display-sm` (1.5rem), `text-title` (1.125rem), `text-body` (0.9375rem), `text-label` (0.8125rem), `text-meta` (0.75rem), `text-tap` (0.8125rem)
  - `min-h-tap-min` (44px) dari `--spacing-tap-min`
  - `min-h-tap-lg` (56px) dari `--spacing-tap-lg`

- [ ] **Step 1: Tambahkan token typography ke blok `@theme`**

Tambahkan di dalam `@theme` yang sudah ada di `src/app/globals.css`, setelah blok `--font-mono` (baris 45) dan sebelum blok `--radius-sm` (baris 47). Urutan itu penting: token typography dikelompokkan dengan token font, bukan disebar.

```css
  /* ---------- Typography scale ----------
     Dinamai menurut PERAN, bukan ukuran. Mengubah satu baris di sini
     mengubah setiap pemakaian token itu di seluruh aplikasi. Nilai dasar
     adalah ukuran mobile; ukuran yang lebih besar datang dari varian
     sm:/lg: di call-site, bukan dari token terpisah. */
  --text-display-lg: 1.75rem;   /* angka statistik utama, judul halaman */
  --text-display-sm: 1.5rem;    /* angka sekunder, judul card */
  --text-title: 1.125rem;       /* judul section, heading dialog */
  --text-body: 0.9375rem;       /* 15px — body text, isi tabel, deskripsi */
  --text-label: 0.8125rem;      /* 13px — label form, label tabel, chip */
  --text-meta: 0.75rem;         /* 12px — metadata, hint, breadcrumb, timestamp */
  --text-tap: 0.8125rem;        /* 13px — teks di dalam target sentuh */
```

Tambahkan juga di blok yang sama:

```css
  /* Target sentuh: 44px floor WCAG 2.5.8, 56px aksi utama siswa PRD §14.1 */
  --spacing-tap-min: 44px;
  --spacing-tap-lg: 56px;
```

- [ ] **Step 2: Pastikan `@theme` masih valid**

Run: `npm run build`
Expected: PASS. `@theme` yang salah sintaks akan membuat Tailwind membuang seluruh blok dan build tetap lulus dengan utilitas hilang — jadi build saja tidak cukup.

- [ ] **Step 3: Buktikan token menghasilkan utility**

Jalankan dev server di background, lalu ambil CSS hasil compile:

```bash
npm run dev > /tmp/sl-dev.log 2>&1 &
sleep 12
```

Curl route login dan grep CSS bundle untuk utility baru:

```bash
curl -s http://localhost:3000/login | grep -o '/_next/static/css/[^"]*\.css' | head -1
```

Lalu ambil file itu dan assert setiap token menghasilkan utility:

```bash
curl -s "http://localhost:3000$(curl -s http://localhost:3000/login | grep -o '/_next/static/css/[^"]*\.css' | head -1)" | grep -o -E '\.(text-display-lg|text-display-sm|text-title|text-body|text-label|text-meta|text-tap|min-h-tap-min|min-h-tap-lg)' | sort -u
```

Expected: output berisi **sembilan** nama utility, masing-masing sekali. Kalau ada yang hilang, nama token salah — cek ejaan di blok `@theme`.

- [ ] **Step 4: Hentikan dev server**

```bash
pkill -f "next dev"
```

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: typography token peran + spacing target sentuh di @theme"
```

---

### Task 3: Ganti ukuran literal dengan token (7 nilai otomatis)

**Files:**
- Modify: **seluruh** `src/**/*.tsx` yang memuat salah satu dari `text-4xl`, `text-3xl`, `text-2xl`, `text-xl`, `text-lg`, `text-base`, `text-[11px]`, `text-[10px]`

**Interfaces:**
- Consumes: token dari Task 2
- Produces: tidak ada. Task berikutnya sudah Immunology — semua call-site sudah memakai token.

- [ ] **Step 1: Terapkan penggantian satu-ke-satu**

Pemetaan ini satu-ke-satu, jadi aman sebagai lintasan tunggal. Urutan penting: ganti yang terbesar dulu supaya `text-2xl` tidak tertimpa oleh pola `text-`.

```bash
cd /home/dimskuyyyy/Smart-Library
# token -> literal lama
sed -i -E \
  -e 's/\btext-4xl\b/text-display-lg/g' \
  -e 's/\btext-3xl\b/text-display-lg/g' \
  -e 's/\btext-2xl\b/text-display-sm/g' \
  -e 's/\btext-xl\b/text-title/g' \
  -e 's/\btext-lg\b/text-title/g' \
  -e 's/\btext-base\b/text-body/g' \
  -e 's/\btext-\[11px\]/text-meta/g' \
  -e 's/\btext-\[10px\]/text-meta/g' \
  $(find src -name '*.tsx')
```

Teks turunan di token yang baru ikut terganti — itu yang diinginkan (`text-display-lg` ada di pola `text-lg`? tidak, `\b` mencegahnya: `display-lg` bukan batas kata di depan `lg`). Verifikasi di Step 2.

- [ ] **Step 2: Pastikan tidak ada literal tersisa dan tidak ada over-replace**

```bash
grep -rn -E '\btext-(4xl|3xl|2xl|xl|lg|base)\b|text-\[(10|11)px\]' src && echo "FAIL: literal tersisa" || echo "OK: bersih"
grep -rn 'text-display-lg\b' src | grep -c 'display-display' && echo "FAIL: over-replace" || echo "OK: tidak over-replace"
grep -rn -E '\btext-(ink|sky|coral|white|leaf|sun|berry)\b' src | wc -l
```

Expected: `OK: bersih`, `OK: tidak over-replace`, dan angka baris warna **tetap 688** — kalau berubah, artinya `sed` ikut menimpa nilai warna dan itu regresi. Bustuk angka ini dengan `git stash && grep -rc …` jika perlu memastikan.

- [ ] **Step 3: Build dan lint**

Run: `npm run build && npm run lint`
Expected: keduanya PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: ganti ukuran literal dengan token typography"
```

---

### Task 4: Tabel, chip, dan `text-sm`/`text-xs` per file

**Files:**
- Modify: `src/components/ui/data-table.tsx`
- Modify: `src/components/ui/status-chip.tsx`
- Modify: seluruh `src/**/*.tsx` yang masih memuat `text-sm` atau `text-xs`

**Interfaces:**
- Consumes: token dari Task 2
- Produces: `DataTable` dengan scroll-snap dan petunjuk scroll; semua teks bacaan memakai `text-body`, label memakai `text-label`, metadata memakai `text-meta`.

- [ ] **Step 1: `DataTable` — padding sel responsif**

Di `src/components/ui/data-table.tsx`, ganti padding sel `<td>`:

Dari: `className={cn("px-4 py-3.5 align-middle", c.className)}`
Jadi: `className={cn("px-3 py-3 align-middle sm:px-4 sm:py-3.5", c.className)}`

Dan padding header `<th>`:

Dari: `"px-4 py-3 text-xs font-bold text-ink-subtle uppercase tracking-wider font-mono"`
Jadi: `"px-3 py-3 text-meta font-bold text-ink-subtle uppercase tracking-wider font-mono sm:px-4"`

Nilai desktop kembali persis seperti semula lewat `sm:` — sesuai spec §7.

- [ ] **Step 2: `DataTable` — scroll snap**

Pada `<div className="overflow-x-auto ...">` tambahkan `snap-x snap-mandatory`, dan pada `<table>` tambahkan `snap-start`:

Dari: `<table className="w-full min-w-[640px] text-left text-sm">`
Jadi: `<table className="w-full min-w-[640px] snap-x snap-mandatory text-left text-body">`

Pada setiap `<tr>` di `<tbody>` tambahkan `snap-start`:

Dari: `className="hover:bg-surface/80 transition-colors duration-100"`
Jadi: `className="snap-start hover:bg-surface/80 transition-colors duration-100"`

- [ ] **Step 3: `DataTable` — petunjuk scroll, hanya di layar kecil**

Tambahkan tepat setelah `</div>` penutup wrapper tabel dan sebelum blok pagination (`{/* Pagination & Counter Footer */}`):

```tsx
      <p className="text-meta text-ink-subtle sm:hidden">
        Geser ke samping untuk melihat kolom lainnya.
      </p>
```

`sm:hidden` memastikan petunjuk ini tidak pernah muncul di desktop, di mana tabel sudah muat.

- [ ] **Step 4: `StatusChip` — pakai `text-label`**

Di `src/components/ui/status-chip.tsx`, pada baris `className` chip, ganti `px-3 py-1 text-sm font-semibold [&_svg]:size-4`
jadi `px-2.5 py-1 text-label font-semibold [&_svg]:size-4`.

`px-3` → `px-2.5` mencegah chip melebar melebihi lebar layar pada 360px — ini Review Focus #1.

- [ ] **Step 5: Ganti `text-sm` yang tersisa**

`text-sm` yang tersisa setelah Task 3 semuanya berada di `text-body` atau `text-label`:

```bash
cd /home/dimskuyyyy/Smart-Library
grep -rn '\btext-sm\b' src | wc -l
```

Untuk setiap hasil, pilih berdasarkan konteks:

- Teks bacaan panjang: paragraf, deskripsi, nama, isi tabel, pesan error, label dialog → `text-body`
- Teks pendek atau bertumpuk padat: nama kolom, label form, nama menu, nama tombol, isi chip → `text-label`

Batas yang jelas: kalau teksnya kalimat yang butuh dibaca, `text-body`. Kalau cuma satu sampai tiga kata atau angka, `text-label`.

Setelah diganti semua:

```bash
grep -rn '\btext-sm\b' src && echo "FAIL: masih ada" || echo "OK"
```

- [ ] **Step 6: Ganti `text-xs` yang tersisa**

Sama, dua tujuan:

- Label form, nama kolom tabel, nama kelompok, nama menu → `text-label`
- Hint, helper text, timestamp, breadcrumb, counter, footer kecil → `text-meta`

```bash
grep -rn '\btext-xs\b' src | wc -l
```

Setelah diganti semua:

```bash
grep -rn '\btext-xs\b' src && echo "FAIL: masih ada" || echo "OK"
```

- [ ] **Step 7: Build, lint, commit**

Run: `npm run build && npm run lint`
Expected: PASS.

```bash
git add -A
git commit -m "feat: token typography di tabel dan chip, snap-scroll, petunjuk scroll"
```

---

### Task 5: Shared component — touch target dan padding modal

**Files:**
- Modify: `src/components/ui/button.tsx:14-19`
- Modify: `src/components/ui/field.tsx`
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/drawer.tsx`

**Interfaces:**
- Consumes: token `text-*` dan `min-h-tap-*` dari Task 2
- Produces: `Button` dengan `sm` = 44px, `md` = 48px, `lg` = 56px. Tidak ada perubahan nama variant atau props.

- [ ] **Step 1: `Button` — naikkan `sm` ke 44px dan pakai token**

Di `src/components/ui/button.tsx`, ganti blok `size`:

```tsx
      size: {
        sm: "min-h-tap-min px-3 text-label [&_svg]:size-4 [&_svg]:shrink-0",
        md: "min-h-12 px-4 text-body sm:px-5 [&_svg]:size-5 [&_svg]:shrink-0",
        // Big Friendly Button (PRD §14.1): 56px untuk aksi utama
        lg: "min-h-tap-lg px-5 text-title sm:px-6 [&_svg]:size-5 [&_svg]:shrink-0",
      },
```

`sm` naik dari `min-h-10` (40px) ke 44px karena `sm` dipakai untuk kontrol toolbar dan aksi sekunder di seluruh aplikasi. `lg` tetap 56px. Padding `px` dikecilkan di mobile dan kembali ke nilai lama lewat `sm:`.

`defaultVariants` **tidak berubah** — `variant: "primary", size: "md"` tetap.

- [ ] **Step 2: `Field` — cegah overflow di grid**

Di `src/components/ui/field.tsx`, pada wrapper `Field`, ganti `className={cn("grid gap-1.5", className)}`
jadi `className={cn("grid min-w-0 gap-1.5", className)}`.

`min-w-0` mencegah field melebar melebihi kolomnya saat dipakai di dalam `grid-cols-2` yang sempit — ini Review Focus #2.

- [ ] **Step 3: `Dialog` — padding responsif dan target sentuh**

Di `src/components/ui/dialog.tsx`:

- Header: `className="flex items-center justify-between border-b border-outline px-6 py-4"` → `px-4 sm:px-6`
- Heading: `<h2 className="text-lg font-bold">` → `text-title`
- Tombol tutup: `className="flex size-10 items-center justify-center rounded-md ..."` → `flex min-h-tap-min min-w-tap-min items-center justify-center rounded-md`
- Body: `className="px-6 py-5"` → `px-4 py-4 sm:px-6 sm:py-5`

- [ ] **Step 4: `Drawer` — padding responsif, target sentuh, buang kelas mati**

Di `src/components/ui/drawer.tsx`:

- Header: `className="flex items-center justify-between border-b border-outline px-6 py-5"` → `px-4 sm:px-6`
- Heading: `font-display text-lg font-bold text-ink` → `font-display text-title font-bold text-ink`
- Deskripsi: `text-xs text-ink-muted` → `text-meta text-ink-muted`
- Tombol tutup: `flex size-9 items-center justify-center rounded-md` → `flex min-h-tap-min min-w-tap-min items-center justify-center rounded-md`
- Body: `flex-1 overflow-y-auto px-6 py-5 text-sm` → `flex-1 overflow-y-auto px-4 py-4 text-body sm:px-6 sm:py-5`
- Footer: `border-t border-outline bg-surface-sunken/50 px-6 py-4` → `px-4 sm:px-6`
- Backdrop: `transition-opacity duration-240 animate-in fade-in` → `transition-opacity duration-200 fade-in-key`
- Panel: `duration-240 ease-out animate-in slide-in-from-right` → `duration-200 ease-out slide-in-right-key`

`fade-in-key` dan `slide-in-right-key` adalah class yang Task 9 buat di `globals.css`. Kalau Task 9 belum dikerjakan, class itu belum ada dan animasi tidak jalan — itu tidak merusak apa pun, hanya tidak beranimasi. Kalau ingin Toast/CommandPalette ikut, jalankan **Task 9 sebelum Task 5**.

- [ ] **Step 5: Build, lint, commit**

Run: `npm run build && npm run lint`
Expected: PASS.

```bash
git add -A
git commit -m "feat: touch target 44px floor dan padding responsif di shared component"
```

---

### Task 6: Card fallback mobile untuk loans dan history

**Files:**
- Modify: `src/app/student/loans/page.tsx`
- Modify: `src/app/student/history/page.tsx`

**Interfaces:**
- Consumes: `StatusChip` dari `src/components/ui/status-chip.tsx`, token dari Task 2
- Produces: tidak ada untuk task lain.

**Konteks yang wajib dipenuhi:** PRD §15 menyatakan aplikasi siswa mobile-first, dan dua halaman ini adalah yang paling sering dibuka siswa di HP. Tabelnya `min-w-[560px]` (history) sehingga pada 375px selalu scroll.

- [ ] **Step 1: `history/page.tsx` — bungkus tabel dan card**

Baca `src/app/student/history/page.tsx` terlebih dahulu untuk melihat `<table>` yang sudah ada dan data kolomnya. Lalu:

1. Beri wrapper tabel yang sudah ada `className="hidden overflow-x-auto sm:block"`.
2. Tambahkan setelah wrapper itu blok card:

```tsx
      <ul className="space-y-3 sm:hidden">
        {rows.length === 0 ? (
          <li className="rounded-card border border-outline bg-surface-sunken/50 p-4 text-center text-body text-ink-subtle">
            Belum ada riwayat peminjaman.
          </li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="rounded-card border border-outline bg-background p-4 shadow-xs">
              <p className="truncate text-body font-semibold text-ink">{row.book_title}</p>
              <p className="mt-0.5 text-meta text-ink-subtle">{row.book_code}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <LoanStatusChip status={row.status} />
                <span className="text-meta text-ink-subtle">{formatDate(row.borrowed_at)}</span>
              </div>
            </li>
          ))
        )}
      </ul>
```

**Sesuaikan nama field dan import dengan apa yang benar-benar ada di file.** `LoanStatusChip` sudah diekspor dari `src/components/ui/status-chip.tsx`; `formatDate` dari `src/lib/format.ts` — verifikasi nama ekspornya sebelum memakai, jangan menebak. `truncate` pada judul buku wajib — tanpa itu judul panjang merusak tinggi kartu (Review Focus #4).

Pesan empty state **harus sama persis** dengan pesan empty state tabel yang sudah ada di file tersebut, supaya tidak ada kondisi di mana keduanya kosong (Review Focus #3).

- [ ] **Step 2: `loans/page.tsx` — bungkus tabel dan card**

Lakukan hal yang sama pada `src/app/student/loans/page.tsx`. Card memuat: judul buku (`truncate`), kode buku, `LoanStatusChip`, dan tanggal jatuh tempo. Tıştinya juga harus cocok dengan pesan empty state tabel yang sudah ada.

Bila halaman ini sebenarnya sudah merender daftar card dan bukan `<table>`, lewati Step 2 — periksa dulu, jangan memaksa card atas card.

- [ ] **Step 3: Build, lint, commit**

Run: `npm run build && npm run lint`
Expected: PASS. TypeScript akan gagal build kalau nama field atau import di Step 1 salah — itu memang pemeriksaan yang kita mau.

```bash
git add -A
git commit -m "feat: card list mobile untuk loans dan history siswa"
```

---

### Task 7: Grid tanpa breakpoint dan tipografi AppShell

**Files:**
- Modify: `src/app/admin/books/[id]/page.tsx:90`
- Modify: `src/app/admin/import/import-client.tsx:532`
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/components/ui/skeleton.tsx`

**Interfaces:**
- Consumes: token dari Task 2
- Produces: tidak ada untuk task lain.

- [ ] **Step 1: Tambahkan breakpoint pada grid yang squeezing**

`src/app/admin/books/[id]/page.tsx:90` — `className="grid grid-cols-3 gap-2 text-center"`
jadi `className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3"`

`src/app/admin/import/import-client.tsx:532` — `className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs"`
jadi `className="mt-3 grid grid-cols-2 gap-2 text-meta sm:grid-cols-4"`

`src/components/ui/skeleton.tsx:14` — `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"`
sudah punya breakpoint, tidak diubah.

- [ ] **Step 2: `AppShell` — target sentuh topbar**

Di `src/components/layout/app-shell.tsx`:

- Tombol hamburger: `flex size-10 items-center justify-center rounded-lg border border-outline` → `flex min-h-tap-min min-w-tap-min items-center justify-center rounded-lg border border-outline`
- Tombol collapse sidebar: `flex size-7 items-center justify-center rounded-md` → `flex size-9 items-center justify-center rounded-md` (pointer target di desktop, bukan sentuh — 36px cukup)
- Brand subtitle: `block truncate text-[11px]` sudah menjadi `text-meta` oleh Task 3, tidak diubah
- Group label sidebar: `text-[11px]` sudah menjadi `text-meta` oleh Task 3

- [ ] **Step 3: `AppShell` — bottom-nav siswa jadi ikon + label**

Ini perubahan visual terbesar di sisi mobile. Sekarang baris 406 meneruskan `collapsed={true}`, yang menyembunyikan label di dalam `NavItemLink` dan menyisakan kotak ikon 40px tanpa keterangan.

Di `src/components/layout/app-shell.tsx`, ganti pemanggilan bottom-nav:

Dari:
```tsx
            {navGroups
              .flatMap((g) => g.items)
              .slice(0, 4)
              .map((item) => (
                <NavItemLink key={item.href} item={item} collapsed={true} />
              ))}
```

Jadi:
```tsx
            {navGroups
              .flatMap((g) => g.items)
              .slice(0, 4)
              .map((item) => {
                const Icon = item.icon;
                const active =
                  usePathname() === item.href ||
                  (item.href !== "/student" && usePathname().startsWith(item.href + "/"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-tap-lg flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-tap transition-colors",
                      active ? "text-sky-deep" : "text-ink-muted",
                    )}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    <span className="w-full truncate text-center">{item.label}</span>
                  </Link>
                );
              })}
```

`usePathname()` sudah diimpor dan dipakai di file ini (`app-shell.tsx:197`). Kalau ESLint protes tentang hook di dalam `.map()`, pindahkan pemanggilan ke komponen anak kecil yang di-deklarasikan di file yang sama — **jangan** memanggil hook di dalam loop sebagai jalan pintas.

Tambah `py-2` pada `<nav>` agar baris 44px label tidak menempel tepi atas. Baris `<nav>` yang sekarang: `... px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden` → `... px-2 py-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden`

- [ ] **Step 4: Build, lint, commit**

Run: `npm run build && npm run lint`
Expected: PASS.

```bash
git add -A
git commit -m "feat: bottom-nav siswa ikon+label, target sentuh topbar, grid responsif"
```

---

### Task 8: SEO metadata, viewport, dan robots

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/login/page.tsx`
- Create: `src/app/robots.ts`

**Interfaces:**
- Consumes: tidak ada
- Produces: export `metadata` dan `viewport` di `src/app/layout.tsx`; file `src/app/robots.ts` yang menghasilkan `/robots.txt`.

- [ ] **Step 1: Tambah `viewport` export di root layout**

`viewport` **wajib** sebagai export terpisah dari `metadata` di Next.js 16 — meletakkannya di dalam `metadata` tidak bekerja. Tambahkan import `type Viewport` dan export-nya di `src/app/layout.tsx`:

```tsx
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Aktifkan env(safe-area-inset-*) yang sudah dipakai bottom-nav di app-shell.
  // Tanpa ini padding safe area bernilai nol dan tombol logout tepi bawah
  // tertutup home indicator di iPhone. Review Focus #5.
  viewportFit: "cover",
  themeColor: "#ffffff",
};
```

- [ ] **Step 2: Lengkapi `metadata` root**

Ganti export `metadata` di `src/app/layout.tsx` dengan:

```tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://smartlibrary.smpn17.sch.id"),
  title: {
    default: "Smart Library — SMPN 17 Tangerang Selatan",
    template: "%s — Smart Library",
  },
  description:
    "Sistem perpustakaan sekolah berbasis QR: katalog, peminjaman, pengembalian, dan pelaporan.",
  applicationName: "Smart Library",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Smart Library",
    title: "Smart Library — SMPN 17 Tangerang Selatan",
    description:
      "Sistem perpustakaan sekolah berbasis QR: katalog, peminjaman, pengembalian, dan pelaporan.",
  },
  twitter: { card: "summary" },
};
```

Domain di `metadataBase` harus diganti dengan domain sebenarnya jika sudah ada. Kalau domain belum ditentukan, ganti dengan `http://localhost:3000` dan beri komentar TODO — jangan menebak domain produksi yang belum ada, karena `metadataBase` yang salah membuat URL OG salah untuk semua halaman.

- [ ] **Step 3: Metadata khusus halaman login**

Di `src/app/login/page.tsx`, tambahkan import `type Metadata` dari `next` dan export:

```tsx
export const metadata: Metadata = {
  title: "Masuk",
  description:
    "Masuk ke Smart Library SMPN 17 Tangerang Selatan untuk meminjaman, mengembalikan, atau menjelajahi katalog buku.",
};
```

`/login` satu-satunya halaman yang boleh terindex, jadi metadata-nya yang paling spesifik.

- [ ] **Step 4: Buat `robots.ts`**

Buat file `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
        disallow: ["/admin", "/librarian", "/student", "/api"],
      },
    ],
  };
}
```

Halaman di balik autentikasi tidak akan pernah terindex, tapi `disallow` mencegah crawler mengonsumsikan kuota crawl pada URL yang menghasilkan redirect ke login.

- [ ] **Step 5: Build dan verifikasi route**

Run: `npm run build`
Expected: PASS, dan output build memuat `ƒ /robots.txt` atau `○ /robots.txt`.

Jalankan `npm run dev` di background lalu:

```bash
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/login | grep -o -E '<meta name="viewport"[^>]*>'
```

Expected: `robots.txt` berisi `Disallow: /admin`, `/librarian`, `/student`, `/api`. Tag viewport berisi `viewport-fit=cover` dan `theme-color`.

- [ ] **Step 6: Hentikan dev server dan commit**

```bash
pkill -f "next dev"
git add -A
git commit -m "feat: metadata root, viewport-fit cover, robots.txt"
```

---

### Task 9: Buang kelas Tailwind mati, tambah keyframes native

**Files:**
- Modify: `src/app/globals.css` (tambah keyframes + class baru)
- Modify: seluruh `src/**/*.tsx` yang memuat kelas mati

**Interfaces:**
- Consumes: class `fade-in-key` dan `slide-in-right-key` yang dipakai Task 5.
- Produces: dua utility baru yang menggantikan keluarga `animate-in`.

**Konteks:** `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-right`, `duration-220`, `duration-240`, `duration-320` berasal dari `tailwindcss-animate` yang **tidak ada di `package.json`**. Semua kelas itu menghasilkan CSS kosong — drawer, toast, command palette, dan QR scanner punya transisi yang tidak pernah berjalan.

- [ ] **Step 1: Tambah keyframes dan utility ke `globals.css`**

Tambahkan setelah blok `@keyframes rise` yang sudah ada (sekitar baris 88), sebelum blok `@media (prefers-reduced-motion)`:

```css
/* Keyframes native menggantikan kelas dari plugin tailwindcss-animate yang
   tidak terinstall. Nama berakhiran -key supaya tidak bentrok dengan utility
   standar Tailwind. */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: none; }
}

.fade-in-key {
  animation: fade-in 200ms ease-out both;
}

.slide-in-right-key {
  animation: slide-in-right 220ms ease-out both;
}
```

Blok `prefers-reduced-motion` yang sudah ada di `globals.css` otomatis menonaktifkan keduanya — tidak perlu tambahan.

- [ ] **Step 2: Ganti kelas mati satu per satu**

Daftar lengkap dari grep. Ganti hanya yang disebut; `duration-150/200/300` **bukan** termasuk dan harus tetap:

| Dari | Jadi | File |
|---|---|---|
| `transition-opacity duration-240 animate-in fade-in` | `transition-opacity duration-200 fade-in-key` | `ui/drawer.tsx` |
| `duration-240 ease-out animate-in slide-in-from-right` | `duration-200 ease-out slide-in-right-key` | `ui/drawer.tsx` |
| `animate-in fade-in` + `duration-200` | `fade-in-key` | `ui/toast.tsx` |
| `animate-in fade-in zoom-in-95` | `fade-in-key` | `layout/command-palette.tsx` |
| `animate-in fade-in` + `duration-200` | `fade-in-key` | `library/qr-scanner.tsx` |
| `duration-220` | `duration-200` | `layout/app-shell.tsx` (2 pemakaian) |

Untuk `command-palette.tsx`, `toast.tsx`, dan `qr-scanner.tsx`, baca file-nya dulu — jumlah dan posisi kelas berbeda dari tabel. Ganti seluruh kemunculannya, bukan hanya yang pertama.

- [ ] **Step 3: Pastikan tidak ada kelas mati tersisa**

```bash
cd /home/dimskuyyyy/Smart-Library
grep -rn -E 'animate-in|zoom-in-|slide-in-from-right|duration-(220|240|320)|(^|[^-a-z])fade-in( |")' src && echo "FAIL: masih ada" || echo "OK: bersih"
```

Perhatikan: `fade-in-key` **boleh ada**. Pola grep di atas sengaja tidak mencocokkannya, karena ia menuntut `fade-in` diikuti spasi atau kutip, sedangkan `fade-in-key` diikuti tanda hubung. Kalau hasilnya `FAIL`, periksa outputnya secara visual — kemungkinan besar yang terdeteksi justru `fade-in-key` yang memang sah.

- [ ] **Step 4: Pastikan tidak ada elemen yang jadi tidak terlihat**

Kelas `animate-in` membuat elemen tidak terlihat di awal animasi. Kalau sebuah elemen tiba-tiba tidak terlihat, berarti ia bergantung pada `opacity: 0` dari utility yang hilang.

Jalankan dev server, buka `/librarian/borrow` (memakai Drawer), dan buka Drawer dari situ. Pastikan panel terlihat dan animasinya berjalan.

```bash
npm run dev > /tmp/sl-dev.log 2>&1 &
sleep 12
# buka manual di browser; lalu:
pkill -f "next dev"
```

- [ ] **Step 5: Build, lint, commit**

Run: `npm run build && npm run lint`
Expected: PASS.

```bash
git add -A
git commit -m "fix: ganti kelas animasi mati dengan keyframes native"
```

---

### Task 10: Dynamic import XLSX

**Files:**
- Modify: `src/app/admin/import/import-client.tsx:5` (import), dan dua titik pemakaian

**Interfaces:**
- Consumes: tidak ada
- Produces: tidak ada.

**Konteks:** `import * as XLSX from "xlsx"` di level modul pada client component membuat parser spreadsheet penuh (~1MB+) ikut terunduh begitu route `/admin/import` dibuka, bahkan kalau pengguna tidak pernah mengimpor apa pun.

- [ ] **Step 1: Ganti import statis**

Di `src/app/admin/import/import-client.tsx`, ganti:

Dari: `import * as XLSX from "xlsx";`
Jadi: `import type * as XLSXType from "xlsx";`

`import type` tidak menghasilkan runtime code, jadi parser tidak ikut terunduh.

- [ ] **Step 2: Dynamic import di `downloadTemplate`**

Fungsi ini sudah `async`. Di awal body-nya, sebelum pemakaian pertama `XLSX.`:

```ts
    const XLSX = await import("xlsx");
```

- [ ] **Step 3: Dynamic import di pipeline parse**

Temukan fungsi yang membaca file yang dipilih pengguna. Di awal body-nya:

```ts
    const XLSX = await import("xlsx");
```

**Baca file-nya dulu dan pastikan fungsi itu sudah `async`.** Kalau belum, tambahkan `async` — dan pastikan `await` ada di tempat pemanggilnya. Kalau pemanggilnya bukan `async` dan tidak bisa jadi `async`, jadikan pemanggilan itu sendiri `await import("xlsx")` di baris pemakaian.

- [ ] **Step 4: Pastikan type-only import benar-benar terpakai**

Kalau `XLSXType` tidak dipakai di mana pun, **hapus barisnya sepenuhnya**. TypeScript akan complain pada import yang tidak terpakai.

- [ ] **Step 5: Verifikasi bundle mengecil**

Run: `npm run build`
Expected: PASS. Periksa ukuran route `/admin/import` di output build dan bandingkan dengan baseline yang dicatat di Task 1. Ukuran `./admin/import` harus turun sebagian megabyte.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "perf: dynamic import xlsx di route import"
```

---

### Task 11: Verifikasi akhir

**Files:**
- Modify: tidak ada

**Interfaces:**
- Consumes: seluruh hasil Task 1–10.

- [ ] **Step 1: Build dan lint bersih**

Run: `npm run build && npm run lint`
Expected: keduanya PASS, tanpa warning baru dibanding baseline Task 1.

- [ ] **Step 2: Grep assertion lengkap**

```bash
cd /home/dimskuyyyy/Smart-Library
for p in 'text-4xl' 'text-3xl' 'text-2xl' 'text-xl' 'text-lg' 'text-base' 'text-sm' 'text-xs' 'text-\[(10|11)px\]' 'min-h-10' 'size-7' 'size-8' 'animate-in' 'zoom-in-' 'slide-in-from-right' 'duration-2(20|40)' 'import \* as XLSX'; do
  hits=$(grep -rn -E "\\b${p}\\b" src | wc -l)
  if [ "$hits" -gt 0 ]; then echo "FAIL $p ($hits)"; grep -rn -E "\\b${p}\\b" src | head -5; else echo "PASS $p"; fi
done
```

Expected: semua `PASS`. Kalau ada `FAIL`,/itulah yang tertulis di spec §6 dan harus nol.

Pengecualian yang **diharapkan** masih ada dan bukan kegagalan:

- `text-sm`, `text-xs`, `text-lg` — nama utility masih valid Tailwind. Yang harus nol adalah **pemakaiannya**, dan grep di atas menghitung pemakaian. Kalau masih ada, berarti Task 4 Step 5/6 belum tuntas.
- `text-ink`, `text-sky`, `text-center` dan sejenisnya tidak masuk daftar — benar.

- [ ] **Step 3: Assert token benar-benar terpakai**

```bash
grep -rn -E '\btext-(display-lg|display-sm|title|body|label|meta|tap)\b' src | wc -l
```

Expected: jauh lebih dari 0. Kalau 0, Task 2 tidak menghasilkan utility dan seluruh Task 3–7 jadi sia-sia.

- [ ] **Step 4: Inspect visual mobile**

Jalankan `npm run dev`, lalu periksa viewport 375px dan 390px pada: `/student` (beranda), `/student/books`, `/student/loans`, `/student/history`, `/librarian/borrow`, dan satu tabel admin (`/admin/books`).

Yang harus benar:

- Semua target sentuh minimal 44px — cek dengan devtools, tidak dengan mata.
- Bottom-nav siswa menampilkan ikon **dan** label, tinggi minimal 56px.
- `/student/loans` dan `/student/history` menampilkan card, bukan tabel.
- Pesan empty state muncul di card maupun tabel, tidak salah satu kosong.
- Tabel admin bisa digeser dengan snap, petunjuk "Geser ke samping…" muncul dan hilang di desktop.
- Tidak ada teks yang lebih kecil dari 12px di mana pun.

- [ ] **Step 5: Inspect hierarki tipografi**

Di satu halaman dashboard (`/student` atau `/librarian`): judul harus terasa jelas lebih besar dan lebih bold dari body, dan angka statistik harus mendominasi. Kalau semuanya terasa berukuran sama, token belum diterapkan — cek apakah `text-display-lg` benar-benar ada di DOM.

- [ ] **Step 6: Font swap dan preload**

Spec §3.7. Di `src/app/layout.tsx`, tambahkan `display: "swap"` dan `preload: true` pada ketiga pemanggilan `next/font/google`:

```tsx
const display = Hubot_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const body = Atkinson_Hyperlegible({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});
```

`swap` sudah jadi default `next/font`, jadi ini konfirmasi eksplisit. Yang benar-benar di Iwodate: `preload` membuat font body (Atkinson Hyperlegible) dimuat bersama HTML, bukan setelah CSS terparse — itulah yang mencegah flash of invisible text di koneksi sekolah yang lambat.

Verifikasi lewat header preload:

```bash
npm run dev > /tmp/sl-dev.log 2>&1 &
sleep 12
curl -sI http://localhost:3000/login | grep -i 'x-nextjs-preload\|preload'
pkill -f "next dev"
```

Expected: `Atkinson_Hyperlegible` muncul di daftar preload.

- [ ] **Step 7: Commit hasil verifikasi**

```bash
git status --short
git add -A
git commit -m "test: verifikasi akhir grep assertion dan inspect mobile" || echo "tidak ada perubahan untuk di-commit"
```