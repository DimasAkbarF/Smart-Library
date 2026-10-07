# Smart Library — SMPN 17 Tangerang Selatan

Aplikasi perpustakaan sekolah berbasis QR (Next.js + Supabase). QR hanya
identifier cepat; sumber kebenaran tetap database.

## 1. Siapkan Supabase (sekali saja)

1. Buat project gratis di https://supabase.com → catat **Project URL**,
   **anon key**, dan **service-role key** (Settings → API).
2. Buka **SQL Editor** → jalankan isi file berikut berurutan:
   - `supabase/schema.sql` (tabel, RPC transaksi, RLS, data awal)
   - `supabase/migration_002.sql` (kolom email profil)

## 2. Jalankan lokal

```bash
cp .env.example .env.local   # isi URL + keys dari langkah 1
npm install
npm run seed                 # akun demo + data contoh
npm run dev                  # buka http://localhost:3000
```

Akun demo (password di `scripts/seed.mjs`):

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin Data |
| `penjaga` | `jaga123` | Penjaga Perpustakaan |
| `20260001` | `siswa123` | Siswa |

## 3. Alur coba utama

1. Masuk sebagai **admin** → Buku → Tambah buku (isi jumlah eksemplar)
   → QR Code → Cetak (catat satu kode `BOOK-xxxx`) → Siswa → tambah siswa.
2. Masuk sebagai **penjaga** → Pinjam Buku → ketik NIS siswa → ketik
   kode `BOOK-xxxx` → Konfirmasi → struk muncul.
3. Masuk sebagai **siswa** (`20260001`) → lihat pinjaman di Beranda/Buku Saya.
4. Kembali sebagai **penjaga** → Kembalikan → ketik kode buku → Konfirmasi.

Tanpa kamera pun semua alur bisa dicoba lewat input kode manual.

## 4. Struktur penting

```
supabase/            schema + migrasi SQL
scripts/seed.mjs     akun demo + data contoh
src/app/             login, student/, librarian/, admin/, api/export
src/features/        auth, catalog, loans (aksi transaksi), admin/*
src/components/     ui/ (button, field, chip, table, dialog),
                    library/ (scanner, book-card, receipt, QR),
                    layout/ (app-shell)
src/lib/             auth (DAL + RBAC), supabase clients, nav,
                     format, errors (pesan ramah), types
```

## 5. Prinsip yang dijaga dari PRD

- Pinjam/kembali **hanya** lewat RPC `borrow_book` / `return_book`
  (transaction + `FOR UPDATE` + unique index anti double-borrow + audit).
- Role dicek di **server setiap aksi** (`assertRole`); sembunyikan menu
  bukan pengaman.
- Error teknis tak pernah tampil mentah (`lib/errors.ts`).
- Kebijakan denda/batas di tabel `library_policies`, bukan hard-code.
- Anti submit ganda: tombol terkunci saat proses + unique partial
  index di DB. Header `Idempotency-Key` belum diimplementasikan
  (indeks DB sudah mencegah loan ganda nyata).
