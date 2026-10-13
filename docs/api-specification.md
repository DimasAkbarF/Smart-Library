# Spesifikasi API dan Desain Antarmuka (API & Interface Design Specification)

Dokumen ini mendefinisikan kontrak antarmuka publik, REST endpoints, Server Actions, validasi batas sistem (*boundary validation*), dan struktur galat (*error semantics*) pada sistem **Smart Library SMP Negeri 17 Tangerang Selatan**.

---

## 1. Prinsip Desain Antarmuka

1. **Contract-First & Type Safety:** Seluruh interaksi antar-modul dan klien-server dijamin oleh TypeScript static typing dan validasi runtime Zod di layer batas (*system boundary*).
2. **Consistent Error Semantics:** Semua respons galat mengikuti format terstruktur yang dapat diprediksi mesin dan manusia.
3. **Hyrum's Law Awareness:** Internal implementasi disembunyikan di balik abstraksi Server Actions dan RPC PostgreSQL untuk mencegah ketergantungan klien pada detail tabel internal.
4. **Idempotensi & Transaksi Atomik:** Mutasi status sirkulasi (peminjaman dan pengembalian) dilindungi *row-level locking* (`SELECT ... FOR UPDATE`) untuk mencegah kondisi balapan (*race conditions*).

---

## 2. Kontrak REST API

### `GET /api/export`
Mengunduh data perpustakaan dalam format CSV berstandar UTF-8 BOM dengan proteksi *CSV Formula Injection*.

#### Otorisasi
- **Role Wajib:** `admin` atau `librarian` (Memerlukan cookie sesi Supabase SSR yang valid).
- **Respons Tidak Terotentikasi:** HTTP 401/403:
  ```json
  {
    "error": "Akses ditolak. Peran tidak memiliki izin.",
    "statusCode": 403
  }
  ```

#### Parameter Query
| Parameter | Tipe | Wajib | Nilai yang Didukung | Keterangan |
|---|---|---|---|---|
| `type` | `string` | Ya | `"loans"`, `"books"`, `"students"` | Jenis entitas data yang akan diekspor |
| `status` | `string` | Tidak | `"ACTIVE"`, `"OVERDUE"`, `"RETURNED"` | Filter status peminjaman (khusus `type=loans`) |
| `q` | `string` | Tidak | `string` (maks. 64 karakter) | Kata kunci pencarian teks |

#### Respons Sukses (HTTP 200)
- **Content-Type:** `text/csv; charset=utf-8`
- **Content-Disposition:** `attachment; filename="[nama_entitas].csv"`
- **Cache-Control:** `no-store, no-cache, must-revalidate, private`
- **Mitigasi Keamanan:** Nilai sel yang diawali karakter formula (`=`, `+`, `-`, `@`, `\t`, `\r`) secara otomatis diawali tanda kutip tunggal (`'`).

---

## 3. Kontrak Server Actions

Semua mutasi data utama menggunakan Next.js Server Actions dengan validasi skema Zod di lapisan entri.

### 3.1 Modul Autentikasi (`src/features/auth/actions.ts`)

#### `login(prevState: LoginState, formData: FormData): Promise<LoginState>`
- **Input:**
  - `identifier`: string (Username atau Email staf, min. 1 karakter)
  - `password`: string (Kata sandi, min. 1 karakter)
  - `totp_code`: string (Opsional, 6 digit kode authenticator jika 2FA aktif)
- **Output (`LoginState`):**
  ```typescript
  interface LoginState {
    message?: string;
    requireTotp?: boolean;
  }
  ```
- **Aturan Keamanan:**
  - Rate limiting per identifier (5x) dan per IP (10x).
  - Anti-timing attack delay via PBKDF2 pada kegagalan autentikasi.

#### `changePassword(prevState, formData: FormData): Promise<{ message?: string; ok?: boolean }>`
- **Prasyarat:** Sesi aktif terotentikasi.
- **Validasi:** Minimal 8 karakter, konfirmasi cocok, tidak mengandung nama/username.

#### `unlockIdentifier(rawIdentifier: string): Promise<{ ok: boolean; message: string }>`
- Reset manual darurat rate-limit lockout untuk identifier atau IP tertentu.

---

### 3.2 Modul Sirkulasi (`src/features/loans/actions.ts`)

#### `resolveQr(rawToken: string): Promise<ResolveResult>`
Memindai token QR atau kode inventaris menjadi entitas diskriminatif yang siap diproses di meja sirkulasi.
- **Input:** `rawToken` (String alfanumerik `^[A-Z0-9-]{1,64}$`)
- **Output (`ResolveResult` - Discriminated Union):**
  ```typescript
  type ResolveResult =
    | { type: "STUDENT"; student: Student; activeCount: number }
    | { type: "BOOK"; copy: BookCopy; loan: ActiveLoanInfo | null };
  ```

#### `borrowAction(studentId: string, copyId: string): Promise<BorrowResult>`
Mencatat peminjaman buku baru secara atomik via RPC `borrow_book`.
- **Output:**
  ```typescript
  type BorrowResult =
    | { ok: true; receipt: Receipt }
    | { ok: false; code: "LIMIT_EXCEEDED" | "COPY_UNAVAILABLE" | "STUDENT_INACTIVE" | string };
  ```

#### `returnAction(copyId: string): Promise<ReturnResult>`
Mencatat pengembalian eksemplar buku dan menghitung denda via RPC `return_book`.
- **Output:**
  ```typescript
  type ReturnResult =
    | { ok: true; receipt: Receipt }
    | { ok: false; code: "NO_ACTIVE_LOAN" | string };
  ```

#### `listLoans(filters: LoanFilters, pageSize?: number): Promise<PaginatedLoans>`
Mengambil daftar riwayat sirkulasi dengan paginasi terstruktur:
- **Output:**
  ```typescript
  interface PaginatedLoans {
    rows: Loan[];
    total: number;
    page: number;
    pageCount: number;
  }
  ```

---

## 4. Tipe Data Domain & Discriminated Unions (`src/lib/types.ts`)

| Tipe Domain | Jenis Tipe | Nilai yang Didukung / Properti Kunci |
|---|---|---|
| `Role` | Enum Union | `"admin" \| "librarian"` *(staf terotentikasi)* |
| `CopyStatus` | Discriminated Enum | `"AVAILABLE" \| "BORROWED" \| "LOST" \| "DAMAGED" \| "INACTIVE"` |
| `LoanStatus` | Discriminated Enum | `"ACTIVE" \| "RETURNED" \| "OVERDUE" \| "CANCELLED"` |
| `Student` | Interface | `id, nis, name, class_id, qr_token, status` |
| `Book` | Interface | `id, isbn, title, author, publisher, total_copies, available_copies` |
| `BookCopy` | Interface | `id, book_id, inventory_code, qr_token, condition, status` |

---

## 5. Idempotensi & Mitigasi Balapan Sirkulasi

Transaksi peminjaman dan pengembalian dirancang *idempotent-safe* melalui basis data:
1. **Row Locking:** Baris eksemplar di tabel `book_copies` dikunci secara eksklusif menggunakan `SELECT ... FOR UPDATE` selama transaksi RPC berlangsung.
2. **Kondisi Validasi:** Jika eksemplar berstatus selain `'AVAILABLE'` pada saat transaksi dieksekusi, transaksi langsung dibatalkan (*abort*) dan mengembalikan kode galat spesifik tanpa mutasi parsial.
3. **Penyimpanan Tanda Terima (`Receipt`):** Setiap transaksi berhasil menghasilkan objek struk atomik yang memuat rincian waktu, tanggal jatuh tempo, dan nominal denda.
