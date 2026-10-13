# Smart Library — SMP Negeri 17 Tangerang Selatan

Sistem informasi sirkulasi dan manajemen perpustakaan berbasis web untuk SMP Negeri 17 Tangerang Selatan. Platform ini mengotomasi peminjaman, pengembalian, inventaris katalog, dan penerbitan kartu anggota digital dengan identifikasi QR Code serta audit trail aktivitas.

Production URL: [https://perpustakaansmp17tangsel.web.id](https://perpustakaansmp17tangsel.web.id)

---

## Arsitektur & Desain Sistem

### 1. Transaksi Sirkulasi Atomik
Operasi peminjaman (`borrow_book`) dan pengembalian (`return_book`) diisolasi melalui PostgreSQL Stored Procedures (RPC). Pendekatan ini memastikan konsistensi status eksemplar, batas kuota peminjaman siswa, dan perhitungan denda terlambat dieksekusi dalam satu transaksi atomik guna mencegah *concurrency issues* dan peminjaman ganda (*double-borrowing*).

### 2. Autentikasi & Kontrol Akses (RBAC)
Sistem memisahkan alur otorisasi dan identifikasi:
- **Staf Perpustakaan (Admin & Pustakawan)**: Akses terpusat melalui portal tunggal di `/login` untuk meja sirkulasi, inventaris katalog, eksemplar, data siswa, laporan, dan log audit. Dilindungi *dual-key rate limiting* (per-IP dan per-akun), *anti-timing delays*, dan *audit trail* aktivitas.
- **Siswa & Publik**: Akses katalog publik di `/books` dan kartu anggota digital berbasis token kriptografis acak di `/card/[token]` tanpa memerlukan akun/kata sandi, mencegah kendala lupa password dan meminimalisir risiko kebocoran data siswa.


### 3. Performa & Antarmuka Responsif
- **React Server Components (RSC)**: Meminimalkan *client-side bundle size* dengan merender katalog dan laporan secara langsung di server.
- **Client Scanner Isolation**: Pemindai kamera perangkat (`html5-qrcode`) diisolasi pada layer client untuk efisiensi resource. Modul berat seperti pengolah spreadsheet diimpor secara dinamis (*lazy loaded*).
- **Aksesibilitas & Standar Mobile**: Desain antarmuka mematuhi standar rasio kontras WCAG 2.1 AA, *touch target* minimal 44×44 px, serta layout adaptif untuk viewport desktop hingga mobile (390 px).

---

## Tech Stack

| Layer | Teknologi | Keterangan |
|---|---|---|
| **Framework** | Next.js 16.3 (App Router, Turbopack) | Server Components & Route Handlers |
| **Runtime & UI** | React 19, Tailwind CSS v4 | UI styling berbasis CSS tokens (@theme) |
| **Database** | PostgreSQL via Supabase | Row Level Security (RLS) & RPC Functions |
| **Identifikasi QR** | `html5-qrcode`, `qrcode` | Pemindai kamera client-side & generator SVG |
| **Validasi Skema** | Zod | Validasi data form dan server actions |
| **Ikonografi** | Lucide React | Ikon antarmuka terstandarisasi |

---

## Struktur Direktori

```
Smart-Library/
├── docs/
│   └── decisions/          # Architecture Decision Records (ADRs)
├── public/                 # Aset statis publik (logo institusi, manifest)
├── scripts/
│   ├── seed.mjs            # Seeder data awal untuk demonstrasi
│   └── test-all-features.mjs # Suite pengujian end-to-end 26 fitur otomatis
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── admin/          # Panel kontrol admin (sirkulasi, katalog, siswa, audit)
│   │   ├── books/          # Katalog buku publik dan detail buku
│   │   ├── card/           # Kartu anggota digital siswa via token (/card/[token])
│   │   ├── login/          # Portal masuk staf terpusat
│   │   ├── api/            # Endpoint internal (ekspor laporan, sitemap)
│   │   ├── globals.css     # Definisi tema, token tipografi, dan variabel CSS
│   │   └── layout.tsx      # Root layout, metadata global, dan font loader
│   ├── components/
│   │   ├── dashboard/      # Panel metrik, grafik tren, dan visualisasi aktivitas
│   │   ├── layout/         # Shell navigasi (desktop sidebar & mobile bar)
│   │   ├── library/        # Komponen scanner QR, struk sirkulasi, kartu ID-1
│   │   ├── login/          # Formulir autentikasi dan layout institusi
│   │   └── ui/             # Primitif UI (Button, DataTable, Dialog, Drawer, Field)
│   ├── features/           # Server actions dan query database terisolasi
│   └── lib/                # Konfigurasi Supabase, utilitas RBAC, dan helper format
└── supabase/               # Skema basis data, migration scripts, dan RLS policies
```

---

## Panduan Instalasi Lokal

### Prasyarat
- Node.js >= 20.x
- npm >= 10.x
- Proyek Supabase aktif

### 1. Klon Repositori & Instalasi Dependensi
```bash
git clone https://github.com/DimasAkbarF/Smart-Library.git
cd Smart-Library
npm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` ke `.env.local`:
```bash
cp .env.example .env.local
```

Lengkapi konfigurasi berikut:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### 3. Inisialisasi Skema Basis Data
Jalankan file SQL berikut secara berurutan di SQL Editor Supabase:
1. `supabase/schema.sql` (Tabel inti, fungsi RPC transaksi sirkulasi, trigger)
2. `supabase/migration_002.sql` (Atribut profil dan email)
3. `supabase/migration_003.sql` (Audit sirkulasi dan aturan denda)
4. `supabase/migration_004.sql` (Indeks pencarian katalog dan nomor eksemplar)
5. `supabase/migration_005.sql` (Penguatan kebijakan keamanan RLS)

### 4. Seeding Data Demo (Opsional)
Untuk menginisialisasi akun pengujian dan data contoh:
```bash
npm run seed
```

### 5. Menjalankan Server Pengembangan
```bash
npm run dev
```
Aplikasi dapat diakses melalui `http://localhost:3000`.

---

## Kredensial Pengujian (Demo) & Akses

| Peran | Pengenal (Email / Username / Token) | Kata Sandi | Rute Masuk / Akses |
|---|---|---|---|
| Admin Perpustakaan | `admin` (atau `admin@sekolah.local`) | `admin123` | `/login` → `/admin` |
| Siswa (Kartu Digital) | Token acak contoh: `STU-7F9C2BF4FC1E38E6796D` | *(Tanpa kata sandi)* | `/card/STU-7F9C2BF4FC1E38E6796D` |
| Publik | Bebas akses | *(Tanpa kata sandi)* | `/books` (Katalog Buku) |

---

## Validasi & Quality Assurance

Jalankan perintah berikut sebelum membuka pull request atau rilis produksi:

```bash
# Validasi tipe statis TypeScript
npx tsc --noEmit

# Analisis linting kode (ESLint)
npm run lint

# Kompilasi build produksi Next.js
npm run build

# Pengujian End-to-End Otomatis (26 Fitur Lengkap)
node scripts/test-all-features.mjs
```

---

## Catatan Keputusan Arsitektur (ADRs)

Seluruh keputusan teknis dan arsitektural didokumentasikan secara rinci di direktori [`docs/decisions/`](docs/decisions/README.md):
- [ADR-001: Sentralisasi Autentikasi Staf & Penghapusan Cloudflare Turnstile](docs/decisions/ADR-001-centralized-staff-auth-and-removal-of-turnstile.md)
- [ADR-002: Kontinuitas Sesi & Manajemen Cookie dengan Supabase SSR](docs/decisions/ADR-002-session-continuity-and-cookie-transport.md)
- [ADR-003: Kartu Perpustakaan Digital Siswa Berbasis Token Acak](docs/decisions/ADR-003-tokenized-digital-student-cards.md)
- [ADR-004: Transaksi Sirkulasi Atomik via PostgreSQL Stored Procedures (RPC)](docs/decisions/ADR-004-atomic-circulation-via-postgresql-rpc.md)


---

## Lisensi

Proyek ini dirilis di bawah lisensi [MIT](LICENSE). Dikembangkan untuk SMP Negeri 17 Tangerang Selatan.
