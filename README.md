# Smart Library — SMP Negeri 17 Tangerang Selatan

Sistem otomasi dan manajemen perpustakaan sekolah modern berbasis **Next.js 16 (App Router)** dan **Supabase (PostgreSQL)** dengan identifikasi cepat menggunakan **QR Code** untuk sirkulasi buku dan kartu anggota digital siswa.

Dirancang dengan prinsip **Academic Editorial Design System**: tipografi institusi yang berwibawa (*Newsreader*, *IBM Plex Sans*, *IBM Plex Mono*), palet warna resmi sekolah (`#1B2F5B`), tata letak responsif hingga perangkat mobile 390px, serta kepatuhan aksesibilitas kontras WCAG AA.

---

## ✨ Fitur Utama

### 1. 🔄 Meja Sirkulasi Cepat (Peminjaman & Pengembalian)
- **Pemindai Kamera QR**: Menggunakan kamera perangkat (termasuk kamera belakang smartphone) untuk pemindaian instan kartu siswa dan barcode/QR eksemplar buku.
- **Pencarian Manual**: Fallback pencarian instan via NIS siswa atau kode inventaris buku.
- **Transaksi Atomik (PostgreSQL RPC)**: Menjamin integritas data tanpa pinjaman ganda (*anti double-borrow*) menggunakan transaksi database `borrow_book` dan `return_book`.
- **Struk Digital & Cetak**: Bukti peminjaman dan pengembalian instan dengan tanggal jatuh tempo yang otomatis terhitung.

### 2. 📚 Manajemen Katalog Koleksi & Eksemplar
- Pencarian dan filter koleksi berdasarkan judul, pengarang, penerbit, kategori, dan nomor ISBN.
- Pencatatan status inventaris tiap eksemplar fisik (*Tersedia*, *Dipinjam*, *Rusak*, *Hilang*).
- **Generator & Cetak Label QR**: Pembuatan kode QR vektor SVG otomatis dan stiker label buku siap cetak.

### 3. 🪪 Kartu Anggota Digital Siswa (Standar ID-1)
- Setiap siswa terdaftar memiliki kartu pelajar/perpustakaan digital dengan QR unik.
- Format ukuran standar kartu identitas internasional **ID-1 (85.60 × 53.98 mm)** dengan logo resmi sekolah dan watermark, siap cetak dari browser.
- Portal mandiri siswa untuk melihat daftar buku yang sedang dipinjam, jatuh tempo, denda, dan riwayat sirkulasi.

### 4. 📊 Dashboard Admin & Audit Log Real-Time
- **Panel Metrik Sirkulasi 4-Sel**: *Dipinjam hari ini*, *Dikembalikan hari ini*, *Sedang dipinjam*, dan *Terlambat* (langsung terhubung ke daftar transaksi terfilter).
- **Visualisasi Tren Sirkulasi**: Grafik interaktif 7 hari & 14 hari dengan skala adaptif dan deteksi transaksi harian.
- **Pencatatan Audit Keamanan**: Setiap aktivitas login mencatat alamat IP klien dan perkiraan lokasi ke log audit.
- **Pencegahan Brute-Force**: Proteksi *rate limiting* berbasis IP dan identitas pengguna.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.3 (Turbopack)](https://nextjs.org/)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, RPC Functions)
- **Tipografi**: `@next/font/google` (*Newsreader*, *IBM Plex Sans*, *IBM Plex Mono*)
- **QR & Scanner**: `html5-qrcode`, `qrcode` (SVG Vector)
- **Validasi**: [Zod](https://zod.dev/), `react-hook-form`
- **Ikonografi**: `lucide-react`

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Klon Repositori
```bash
git clone https://github.com/DimasAkbarF/Smart-Library.git
cd Smart-Library
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env.local`)
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lengkapi variabel lingkungan berikut dari dasbor proyek Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Inisialisasi Database Supabase
Jalankan berkas migrasi SQL secara berurutan di **SQL Editor** Supabase:
1. `supabase/schema.sql` (skema tabel, RPC transaksi sirkulasi, RLS, fungsi pemicu)
2. `supabase/migration_002.sql` (dukungan email profil)
3. `supabase/migration_003.sql` (kebijakan denda & audit sirkulasi)
4. `supabase/migration_004.sql` (indeks performa pencarian & nomor inventaris)
5. `supabase/migration_005.sql` (kebijakan keamanan RLS & peran pengguna)

### 5. Seeding Data Contoh (Opsional)
Untuk mengisi data pengguna awal, akun demo, dan buku contoh:
```bash
npm run seed
```

### 6. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000).

---

## 🔑 Akun Demo Pengujian

| Peran | Identitas (NIS / Username) | Kata Sandi | Halaman Utama |
|---|---|---|---|
| **Admin Perpustakaan** | `admin` | `admin123` | `/admin` |
| **Siswa Terdaftar** | `20260001` | `siswa123` | `/student` |

---

## 📁 Struktur Direktori

```
Smart-Library/
├── public/                 # Aset publik statis (logo sekolah SMPN 17)
├── scripts/
│   └── seed.mjs            # Skrip seeder database demo
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── admin/          # Dasbor, katalog buku, siswa, sirkulasi, audit log
│   │   ├── student/        # Portal siswa (beranda, buku saya, kartu profil)
│   │   ├── login/          # Halaman masuk terintegrasi
│   │   ├── api/            # Route handler (ekspor data, sitemap)
│   │   ├── globals.css     # Token tema Academic Editorial & Tailwind @theme
│   │   └── layout.tsx      # Root layout & font loader
│   ├── components/
│   │   ├── dashboard/      # Grafik interaktif, aktivitas feed, panel perhatian
│   │   ├── layout/         # Shell navigasi (sidebar desktop, bottom bar mobile)
│   │   ├── library/        # QR Scanner, QR Modal, Kartu Siswa, Struk
│   │   ├── login/          # Panel brand institusi & form kartu masuk
│   │   └── ui/             # Primitif UI (Button, DataTable, Dialog, Drawer, Field)
│   ├── features/           # Server actions & data queries per domain
│   └── lib/                # Autentikasi RBAC, klien Supabase, utilitas format
└── supabase/               # Skema database & file migrasi SQL
```

---

## 🧪 Validasi Kualitas Kode

```bash
# Pemeriksaan tipe data TypeScript
npx tsc --noEmit

# Pemeriksaan linter ESLint
npm run lint

# Kompilasi build produksi Next.js
npm run build
```

---

## 📄 Lisensi

Didistribusikan di bawah lisensi [MIT](LICENSE). Dibuat untuk sistem otomasi perpustakaan SMP Negeri 17 Tangerang Selatan.
