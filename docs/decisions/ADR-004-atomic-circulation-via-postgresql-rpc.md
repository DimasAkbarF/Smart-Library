# ADR-004: Transaksi Sirkulasi Atomik Menggunakan PostgreSQL Stored Procedures (RPC)

## Status
Accepted

## Date
2026-10-14

## Context
Operasi sirkulasi perpustakaan (peminjaman dan pengembalian buku) melibatkan pembaruan beberapa entitas data secara simultan:
1. Peminjaman (`borrow_book`): Memvalidasi batas maksimal buku aktif siswa, memeriksa ketersediaan eksemplar fisik (`status = 'available'`), mencatat baris baru di tabel `transactions`, mengubah status eksemplar menjadi `'borrowed'`, dan mengurangi jumlah eksemplar tersedia di katalog.
2. Pengembalian (`return_book`): Memperbarui tanggal pengembalian di `transactions`, menghitung keterlambatan dan denda, mengubah status eksemplar kembali ke `'available'`, dan memperbarui agregat katalog.

Jika operasi-operasi ini dieksekusi secara terpisah dari client-side atau melalui beberapa query terpisah di Node.js server action:
- **Race Condition / Double Borrowing:** Dua petugas dapat meminjamkan eksemplar yang sama secara bersamaan.
- **Data Inconsistency:** Jika koneksi terputus di tengah proses (misalnya eksemplar diupdate tapi tabel transaksi gagal dibuat), basis data berada dalam status korup (*partial state*).

## Decision
1. **Penerapan Stored Procedure PostgreSQL (RPC):**
   - Seluruh logika bisnis sirkulasi dibungkus ke dalam fungsi PostgreSQL berorientasi transaksi: `borrow_book()` dan `return_book()`.
   - Next.js server actions hanya memanggil `supabase.rpc('borrow_book', { ... })` dan `supabase.rpc('return_book', { ... })`.
2. **ACID Transactions & Row-Level Locking:**
   - Di dalam fungsi RPC, baris eksemplar dikunci menggunakan `SELECT ... FOR UPDATE` untuk mencegah peminjaman ganda (*double-borrowing*) saat akses konkuren tinggi.
   - Jika salah satu validasi gagal (misal kuota pinjam terlampaui atau eksemplar sudah dipinjam), seluruh transaksi di-`ROLLBACK` otomatis oleh PostgreSQL.
3. **Pemisahan Otorisasi Eksekusi:**
   - Fungsi RPC hanya dapat dipanggil oleh service role atau user terotentikasi dengan hak akses staf perpustakaan.

## Alternatives Considered

### Opsi A: Multi-Query Transaction Menggunakan ORM di Node.js (Prisma / Drizzle)
- **Kelebihan:** Logika bisnis ditulis dalam TypeScript di lapisan aplikasi.
- **Kekurangan:** Memerlukan koneksi langsung TCP PostgreSQL pooler yang persisten, sulit dikelola di lingkungan serverless/edge Next.js, dan rentan terhadap koneksi lambat di jaringan seluler.
- **Alasan Ditolak:** Supabase PostgREST API tidak mendukung multi-statement interactive transactions tanpa stored procedures.

### Opsi B: Validasi Sekuensial di Server Actions Tanpa Transaksi
- **Kelebihan:** Implementasi cepat di kode Next.js.
- **Kekurangan:** Celah inkonsistensi data parah jika terjadi kegagalan jaringan di tengah alur.
- **Alasan Ditolak:** Standar keandalan data perpustakaan tidak mengizinkan kemungkinan eksemplar berstatus ganda atau hilang dari catatan sirkulasi.

## Consequences
- **Positif:**
  - Menjamin integritas data 100% konsisten (ACID compliant).
  - Peminjaman ganda (*double borrowing*) dapat dicegah secara deterministik di level basis data.
  - Latensi lebih rendah karena seluruh alur validasi dan mutasi dieksekusi dalam 1 kali round-trip RPC ke database.
- **Negatif / Mitigasi:**
  - Logika bisnis perpustakaan terbagi antara kode TypeScript (UI & Server Actions) dan PL/pgSQL (RPC). Dimitigasi dengan mendokumentasikan skema SQL secara terstruktur di `supabase/schema.sql` dan memelihara migration script versi terkontrol.
