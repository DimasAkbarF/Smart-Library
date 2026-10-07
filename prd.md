# PRD — Smart Library System

**Target:** SMP Negeri 17 Tangerang Selatan  
**Platform:** Web Application  
**Status:** Product Requirements Document  
**Primary Language:** Bahasa Indonesia  
**Design System:** Skylearn-adapted  
**Version:** 1.0

---

## 1. Product Overview

**Smart Library System** adalah aplikasi perpustakaan berbasis web dengan QR Code untuk mempercepat dan merapikan proses identifikasi siswa, peminjaman, pengembalian, pencatatan koleksi, dan pelaporan perpustakaan di SMP Negeri 17 Tangerang Selatan.

Sistem memiliki tiga role utama:

1. **Siswa** — mencari dan memantau buku serta riwayat peminjaman pribadi.
2. **Penjaga Perpustakaan** — menjalankan operasi harian perpustakaan, terutama scan QR siswa, scan QR buku, peminjaman, pengembalian, dan pengecekan transaksi.
3. **Admin Data** — mengelola master data siswa, buku, eksemplar, kategori, pengguna, dan pembuatan QR.

Prinsip produk:

- QR Code menjadi **identifier**, bukan tempat menyimpan data lengkap.
- Data sumber tetap berada di database server.
- Setiap **buku fisik/eksemplar** memiliki identifier unik agar transaksi dapat dilacak dengan presisi.
- Siswa tidak menjalankan transaksi peminjaman sendiri pada MVP; transaksi dikonfirmasi oleh Penjaga Perpustakaan.
- UI harus terasa seperti **perpustakaan sekolah modern**: hangat, terang, jelas, dan tenang; bukan dashboard SaaS generik, bukan kartun anak-anak.

---

## 2. Goals

### 2.1 Business Goals

- Mengurangi pencatatan manual saat peminjaman dan pengembalian.
- Mengurangi salah identifikasi siswa atau buku.
- Memiliki status ketersediaan buku yang konsisten.
- Memudahkan admin memasukkan data buku dalam jumlah besar melalui import.
- Menyediakan riwayat transaksi yang dapat ditelusuri.
- Menyediakan data yang siap digunakan untuk laporan perpustakaan.

### 2.2 User Goals

**Siswa** ingin menemukan buku dan mengetahui buku apa yang sedang dipinjam tanpa harus bertanya ke petugas.

**Penjaga Perpustakaan** ingin menyelesaikan transaksi hanya dengan beberapa langkah scan dan konfirmasi.

**Admin Data** ingin mengelola ribuan data buku/siswa secara efisien dan menghasilkan QR secara massal.

### 2.3 Non-Goals MVP

- Pembayaran online.
- Integrasi marketplace buku.
- Rekomendasi berbasis AI.
- RFID/NFC.
- Self-checkout penuh oleh siswa.
- Sinkronisasi otomatis dengan sistem akademik sekolah jika API resmi belum tersedia.

---

## 3. Target Users

### 3.1 Siswa

Karakteristik UX:

- Lebih banyak akses melalui HP.
- Membutuhkan informasi singkat dan mudah dipindai.
- Tidak membutuhkan tabel administrasi yang padat.
- Harus bisa memahami status buku hanya dari label, ikon, dan teks.

### 3.2 Penjaga Perpustakaan

Karakteristik UX:

- Menggunakan perangkat yang sama berulang kali sepanjang jam layanan.
- Tugas bersifat operasional dan repetitif.
- Scanner dan input pencarian harus menjadi fokus utama.
- Harus ada keyboard shortcut dan alur cepat untuk penggunaan desktop.

### 3.3 Admin Data

Karakteristik UX:

- Mengelola data dalam jumlah besar.
- Membutuhkan tabel, filter, import/export, bulk action, audit trail.
- Membutuhkan feedback yang jelas ketika batch data gagal sebagian.

---

## 4. Core Concepts & Terminology

### 4.1 Buku vs Eksemplar

**Buku (title)** adalah informasi bibliografis, misalnya "Laskar Pelangi".

**Eksemplar (physical copy)** adalah buku fisik tertentu yang ditempel QR.

Contoh:

```text
Title:
Laskar Pelangi

Copies:
BOOK-000001
BOOK-000002
BOOK-000003
```

Meskipun judulnya sama, ketiga buku fisik memiliki ID berbeda.

### 4.2 QR Code

QR berisi identifier/token minimal, misalnya:

```text
BOOK-000001
```

atau payload URL pendek:

```text
https://library.smpn17tangsel.sch.id/q/BOOK-000001
```

Data seperti judul, penulis, status, dan peminjam **tidak ditanam langsung ke QR**.

### 4.3 Status Eksemplar

Minimal:

- `AVAILABLE`
- `BORROWED`
- `LOST`
- `DAMAGED`
- `INACTIVE`

### 4.4 Status Loan

Minimal:

- `ACTIVE`
- `RETURNED`
- `OVERDUE`
- `CANCELLED`

`OVERDUE` dapat dihitung berdasarkan tanggal jatuh tempo; sistem tetap menyimpan status transaksi yang jelas untuk pelaporan.

---

## 5. Roles & Access Control

| Capability | Siswa | Penjaga | Admin Data |
|---|:---:|:---:|:---:|
| Login/logout | ✓ | ✓ | ✓ |
| Lihat katalog buku | ✓ | ✓ | ✓ |
| Lihat detail buku | ✓ | ✓ | ✓ |
| Lihat pinjaman sendiri | ✓ | ✓ | ✓ |
| Lihat semua transaksi | — | ✓ | ✓ |
| Scan QR siswa | — | ✓ | — |
| Scan QR buku | — | ✓ | ✓ |
| Buat transaksi pinjam | — | ✓ | — |
| Proses pengembalian | — | ✓ | — |
| Tambah/edit data buku | — | — | ✓ |
| Kelola eksemplar | — | — | ✓ |
| Kelola data siswa | — | — | ✓ |
| Kelola kategori | — | — | ✓ |
| Generate QR | — | — | ✓ |
| Cetak QR massal | — | — | ✓ |
| Import CSV/XLSX | — | — | ✓ |
| Export data | — | ✓ | ✓ |
| Laporan perpustakaan | — | ✓ | ✓ |
| Audit log | — | — | ✓ |

**RBAC rule:** backend harus selalu memvalidasi role/permission. Menyembunyikan menu di frontend bukan security boundary.

---

## 6. Functional Requirements

## 6.1 Authentication

### FR-AUTH-01
User dapat login menggunakan username/email dan password.

### FR-AUTH-02
Session harus bersifat server-controlled dan aman.

### FR-AUTH-03
Setelah login, user diarahkan ke dashboard sesuai role.

### FR-AUTH-04
User dapat logout.

### FR-AUTH-05
Password harus disimpan menggunakan password hashing yang aman; plaintext password tidak boleh disimpan.

---

## 6.2 Student Experience

### FR-STU-01 — Dashboard

Menampilkan:

- Sapaan singkat.
- Jumlah buku yang sedang dipinjam.
- Buku yang segera jatuh tempo.
- Shortcut ke katalog.
- Riwayat terbaru.

### FR-STU-02 — Katalog

Siswa dapat:

- Search judul/penulis/ISBN.
- Filter kategori.
- Filter status tersedia.
- Membuka detail buku.

### FR-STU-03 — Detail Buku

Menampilkan:

- Cover jika tersedia.
- Judul.
- Penulis.
- Penerbit.
- Tahun.
- Kategori.
- Ketersediaan eksemplar.
- Informasi aturan peminjaman bila relevan.

### FR-STU-04 — Peminjaman Saya

Menampilkan:

- Buku aktif.
- Tanggal pinjam.
- Jatuh tempo.
- Status keterlambatan.
- Riwayat pengembalian.

Siswa **tidak dapat mengubah status transaksi**.

---

## 6.3 Guard / Librarian Experience

### FR-LIB-01 — Transaction Workspace

Halaman utama penjaga berfokus pada dua aksi utama:

```text
[ PINJAM BUKU ]    [ KEMBALIKAN BUKU ]
```

### FR-LIB-02 — Scan Student QR

Scanner membaca QR siswa lalu menampilkan identitas ringkas:

- Nama.
- NIS.
- Kelas.
- Status akun.
- Jumlah pinjaman aktif.

### FR-LIB-03 — Scan Book QR

Scanner membaca QR eksemplar lalu menampilkan:

- Judul.
- Kode eksemplar.
- Status.
- Lokasi/rak jika tersedia.

### FR-LIB-04 — Pre-flight Validation

Sebelum tombol konfirmasi aktif, server memvalidasi:

- siswa masih aktif;
- eksemplar valid;
- eksemplar tersedia untuk dipinjam;
- siswa tidak melampaui batas pinjaman;
- tidak ada loan aktif untuk eksemplar yang sama;
- aturan tanggal jatuh tempo terpenuhi.

### FR-LIB-05 — Confirm Borrow

Setelah konfirmasi:

- loan dibuat;
- status eksemplar menjadi `BORROWED`;
- snapshot data penting transaksi disimpan bila dibutuhkan untuk audit;
- event audit dicatat;
- UI menampilkan hasil transaksi.

### FR-LIB-06 — Return

Petugas dapat:

- Scan QR buku.
- Menemukan transaksi aktif.
- Melihat siswa peminjam.
- Melihat jatuh tempo.
- Melihat keterlambatan.
- Mengonfirmasi pengembalian.

### FR-LIB-07 — Search Fallback

Jika kamera gagal atau QR rusak, penjaga dapat mencari menggunakan:

- kode buku;
- NIS;
- nama siswa;
- judul buku.

QR adalah jalur utama, **bukan single point of failure**.

---

## 6.4 Admin Data Experience

### FR-ADM-01 — Book Management

CRUD data title/bibliografi.

### FR-ADM-02 — Copy Management

Setiap physical copy memiliki:

- copy ID;
- inventory code;
- QR token;
- condition;
- status;
- lokasi/rak;
- tanggal registrasi.

### FR-ADM-03 — Student Management

CRUD/import:

- NIS.
- Nama.
- Kelas.
- Status siswa.
- User account jika diperlukan.

### FR-ADM-04 — Bulk Import

Admin dapat upload CSV/XLSX.

Sistem harus:

1. Membaca file.
2. Memvalidasi kolom wajib.
3. Membuat preview.
4. Menampilkan error per baris.
5. Menampilkan jumlah valid/error.
6. Meminta konfirmasi.
7. Memproses dalam batch.
8. Memberikan hasil import.

### FR-ADM-05 — QR Generation

Admin dapat:

- Generate QR satu eksemplar.
- Generate QR banyak eksemplar.
- Download PNG.
- Download PDF siap cetak.
- Filter berdasarkan batch/kategori/range ID.

### FR-ADM-06 — Audit Log

Perubahan data penting dicatat:

- actor;
- action;
- entity;
- entity ID;
- timestamp;
- metadata perubahan yang relevan.

---

# 7. Core User Flows

## 7.1 Flow — Admin Menambahkan Buku dan QR

```text
Admin login
  ↓
Manajemen Buku
  ↓
Tambah Judul
  ↓
Isi metadata bibliografi
  ↓
Simpan
  ↓
Tambahkan jumlah eksemplar
  ↓
Server membuat copy ID unik
  ↓
Server membuat QR token
  ↓
Admin membuka "Cetak QR"
  ↓
Preview layout label
  ↓
Download PDF
  ↓
Print
  ↓
Tempel QR pada buku fisik
```

### Contoh

```text
Title: Bumi
Copies: 3

BOOK-000101
BOOK-000102
BOOK-000103
```

Setiap QR ditempel di satu buku fisik.

---

## 7.2 Flow — Import 1.000 Buku

```text
Upload XLSX
  ↓
Parse file
  ↓
Schema validation
  ↓
Normalize string/date
  ↓
Duplicate detection
  ↓
Preview
  ↓
Confirm import
  ↓
Database transaction/batch
  ↓
Generate copy IDs
  ↓
Generate QR tokens
  ↓
Generate printable batch
  ↓
Import report
```

Jika 20 baris invalid, 980 baris valid **tidak boleh diam-diam dianggap berhasil total**. UI harus memberi hasil per baris/batch.

---

## 7.3 Flow — Borrow

```text
Penjaga login
  ↓
Pilih "Pinjam Buku"
  ↓
Scan QR siswa
  ↓
GET student context
  ↓
Tampilkan ringkasan siswa
  ↓
Scan QR buku
  ↓
GET copy context
  ↓
Server validation
  ↓
Review screen
  ↓
Konfirmasi
  ↓
POST /loans
  ↓
DB transaction
  ↓
Success receipt
```

### Algoritma borrow

```pseudo
function borrowBook(studentId, copyId, librarianId):
    require authenticated(librarianId)
    require hasRole(librarianId, LIBRARIAN)

    begin transaction

    student = lockAndGetStudent(studentId)
    copy = lockAndGetBookCopy(copyId)

    if student == null:
        reject("STUDENT_NOT_FOUND")

    if student.status != ACTIVE:
        reject("STUDENT_INACTIVE")

    if copy == null:
        reject("COPY_NOT_FOUND")

    if copy.status != AVAILABLE:
        reject("COPY_NOT_AVAILABLE")

    activeCount = countActiveLoans(studentId)
    if activeCount >= policy.maxActiveLoans:
        reject("LOAN_LIMIT_REACHED")

    duplicate = findActiveLoanByCopy(copyId)
    if duplicate exists:
        reject("COPY_ALREADY_BORROWED")

    dueAt = calculateDueDate(now(), policy.loanDurationDays)

    loan = createLoan(
        studentId,
        copyId,
        librarianId,
        borrowedAt=now(),
        dueAt=dueAt,
        status=ACTIVE
    )

    updateCopyStatus(copyId, BORROWED)
    writeAuditLog(...)

    commit transaction

    return loan
```

### Important engineering rule

Gunakan **database transaction + row locking/optimistic concurrency** ketika membuat loan. Dua petugas tidak boleh bisa meminjam eksemplar yang sama secara bersamaan karena race condition.

---

## 7.4 Flow — Return

```text
Penjaga login
  ↓
Pilih "Kembalikan Buku"
  ↓
Scan QR buku
  ↓
Cari active loan
  ↓
Tampilkan siswa + buku + due date
  ↓
Hitung late days
  ↓
Tampilkan denda jika kebijakan sekolah menggunakannya
  ↓
Konfirmasi
  ↓
POST /returns
  ↓
DB transaction
  ↓
Loan = RETURNED
  ↓
Copy = AVAILABLE
  ↓
Success
```

### Algoritma return

```pseudo
function returnBook(copyId, librarianId):
    require authenticated(librarianId)
    require hasRole(librarianId, LIBRARIAN)

    begin transaction

    copy = lockAndGetBookCopy(copyId)
    loan = lockAndGetActiveLoanByCopy(copyId)

    if copy == null:
        reject("COPY_NOT_FOUND")

    if loan == null:
        reject("ACTIVE_LOAN_NOT_FOUND")

    nowAt = now()
    lateDays = max(0, dateDiff(nowAt, loan.dueAt))
    fine = calculateFine(lateDays, policy)

    updateLoan(
        loan.id,
        returnedAt=nowAt,
        status=RETURNED,
        fineAmount=fine
    )

    updateCopyStatus(copyId, AVAILABLE)
    writeAuditLog(...)

    commit transaction

    return {loan, lateDays, fine}
```

---

# 8. Frontend Architecture & Engineering Algorithms

## 8.1 Recommended FE Stack

Stack dapat disesuaikan, tetapi struktur yang direkomendasikan:

- **Next.js + TypeScript** untuk web application.
- **Tailwind CSS** atau CSS variables untuk token design system.
- **React Hook Form + Zod** untuk form validation.
- **TanStack Query** untuk server state/caching jika aplikasi menggunakan client-side data fetching intensif.
- QR scanner berbasis browser camera API dengan library scanner yang stabil.
- Virtualized table bila data sangat besar.

### Prinsip FE

- Server state tidak disamakan dengan local UI state.
- Form validation terjadi di client untuk UX dan server untuk security.
- Semua data penting berasal dari API/server.
- Jangan melakukan business-rule enforcement hanya di frontend.

---

## 8.2 FE State Model

Pisahkan:

```text
Server State
- books
- students
- loans
- dashboard metrics

UI State
- active modal
- scanner open/closed
- selected student
- selected book
- filter state
- import step
```

### QR Scanner State Machine

```text
IDLE
 ↓ openScanner
SCANNING
 ↓ decode
DETECTED
 ↓ validate locally
RESOLVING
 ↓ API success
RESOLVED
 ↓ next action
SCANNING / REVIEW

Any state
 ↓ error
ERROR
 ↓ retry
SCANNING
```

Jangan langsung membuat transaksi ketika kamera mendeteksi QR. Detection hanya menghasilkan **candidate identifier**; transaksi tetap memerlukan validasi server dan konfirmasi petugas.

---

## 8.3 Scan Debounce / Duplicate Decode Prevention

Kamera dapat mendeteksi QR berkali-kali dalam satu detik. Gunakan lock/debounce.

```pseudo
if scannerLocked:
    ignore(decodedValue)

scannerLocked = true
resolve(decodedValue)

finally:
    after 800-1200ms:
        scannerLocked = false
```

Pastikan nilai QR yang sama tidak memicu banyak request paralel.

---

## 8.4 Optimistic vs Pessimistic Update

Untuk transaksi buku gunakan **pessimistic/server-confirmed update**.

Jangan melakukan:

```text
UI -> langsung anggap buku dipinjam
```

Gunakan:

```text
UI confirm
  ↓
API
  ↓
DB transaction
  ↓
response success
  ↓
refresh/update UI
```

Alasannya: status stok dan loan adalah data inventaris yang harus konsisten.

---

## 8.5 API Error Mapping

FE tidak menampilkan error teknis mentah.

Contoh:

```text
COPY_NOT_AVAILABLE
→ "Buku ini sedang tidak tersedia."

STUDENT_INACTIVE
→ "Akun siswa ini sedang tidak aktif."

LOAN_LIMIT_REACHED
→ "Siswa sudah mencapai batas peminjaman."

QR_INVALID
→ "QR tidak dikenali. Coba scan lagi atau cari kode secara manual."
```

---

# 9. Backend Architecture & Engineering Algorithms

## 9.1 Recommended BE Architecture

Gunakan layered architecture:

```text
Route / Controller
       ↓
Service / Use Case
       ↓
Repository / Data Access
       ↓
Database
```

Contoh:

```text
POST /api/loans
        ↓
LoanController
        ↓
BorrowBookService
        ↓
StudentRepository
BookCopyRepository
LoanRepository
        ↓
PostgreSQL/MySQL
```

Business logic berada di service/use-case layer, bukan tersebar di route handler.

---

## 9.2 REST API Contract

### Auth

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Books

```text
GET    /api/books
GET    /api/books/:id
POST   /api/books
PATCH  /api/books/:id
DELETE /api/books/:id
```

### Book Copies

```text
GET    /api/book-copies
POST   /api/book-copies
PATCH  /api/book-copies/:id
POST   /api/book-copies/:id/qr
POST   /api/book-copies/qr/bulk
```

### Students

```text
GET    /api/students
GET    /api/students/:id
POST   /api/students
PATCH  /api/students/:id
```

### Loans

```text
POST   /api/loans
GET    /api/loans
GET    /api/loans/:id
POST   /api/loans/:id/return
```

### Import / Reports

```text
POST   /api/import/books
POST   /api/import/students
GET    /api/reports/loans
GET    /api/reports/books
```

---

## 9.3 QR Resolve Endpoint

Scanner sebaiknya resolve QR terlebih dahulu.

```text
POST /api/qr/resolve
```

Request:

```json
{
  "type": "BOOK",
  "token": "BOOK-000001"
}
```

Response:

```json
{
  "type": "BOOK",
  "id": "copy_123",
  "code": "BOOK-000001",
  "title": "Laskar Pelangi",
  "status": "AVAILABLE"
}
```

**Jangan** menganggap response resolve sebagai authorization. Endpoint transaksi tetap melakukan validasi ulang.

---

## 9.4 Idempotency

Endpoint transaksi harus aman terhadap double-submit.

Contoh:

```text
POST /api/loans
Idempotency-Key: 9a8c...unique-request-id
```

Jika browser mengirim request yang sama dua kali karena network retry, server tidak boleh membuat dua loan.

---

## 9.5 Database Transaction Boundary

### Borrow

Satu transaction mencakup:

1. Lock student jika aturan membutuhkan counter.
2. Lock book copy.
3. Validate.
4. Create loan.
5. Update copy status.
6. Create audit log.
7. Commit.

### Return

Satu transaction mencakup:

1. Lock copy.
2. Lock active loan.
3. Calculate late/fine.
4. Update loan.
5. Update copy.
6. Create audit log.
7. Commit.

---

# 10. Data Model / ERD Concept

```text
USER
 ├── id
 ├── role
 ├── username
 ├── password_hash
 └── status

STUDENT
 ├── id
 ├── user_id
 ├── nis
 ├── name
 ├── class_id
 ├── qr_token
 └── status

CLASS
 ├── id
 └── name

BOOK
 ├── id
 ├── isbn
 ├── title
 ├── author
 ├── publisher
 ├── publication_year
 ├── category_id
 └── cover_url

BOOK_COPY
 ├── id
 ├── book_id
 ├── inventory_code
 ├── qr_token
 ├── condition
 ├── location
 └── status

CATEGORY
 ├── id
 └── name

LOAN
 ├── id
 ├── student_id
 ├── book_copy_id
 ├── librarian_id
 ├── borrowed_at
 ├── due_at
 ├── returned_at
 ├── status
 └── fine_amount

AUDIT_LOG
 ├── id
 ├── actor_user_id
 ├── action
 ├── entity_type
 ├── entity_id
 ├── metadata_json
 └── created_at
```

### Relationship

```text
USER 1 ─── 0..1 STUDENT
CLASS 1 ─── N STUDENT
CATEGORY 1 ─── N BOOK
BOOK 1 ─── N BOOK_COPY
STUDENT 1 ─── N LOAN
BOOK_COPY 1 ─── N LOAN
USER 1 ─── N LOAN (as librarian)
USER 1 ─── N AUDIT_LOG
```

---

# 11. QR Design & Printing System

## 11.1 QR Payload

Pilihan MVP:

```text
BOOK-000001
```

Untuk public/deep-link use case:

```text
https://library.smpn17tangsel.sch.id/q/BK_01J...
```

Token harus cukup unik dan tidak mudah bentrok.

Untuk security yang lebih baik, gunakan opaque random ID/token dibanding predictable database integer.

## 11.2 Label QR

Ukuran label rekomendasi ditentukan berdasarkan printer dan media sekolah. Label harus memiliki:

- QR besar.
- Kode eksemplar dicetak sebagai teks.
- Nama singkat sistem.
- Optional: kode inventaris sekolah.

Contoh:

```text
┌─────────────────────────┐
│ SMART LIBRARY           │
│                         │
│       [ QR CODE ]       │
│                         │
│ BOOK-000001             │
│ SMPN 17 TANGERANG SELATAN│
└─────────────────────────┘
```

### Engineering Requirements

- QR harus memiliki quiet zone yang cukup.
- Jangan menimpa pola QR dengan logo besar.
- Sediakan PDF batch sehingga admin dapat mencetak banyak label sekaligus.
- Simpan mapping `copy_id -> qr_token` permanen.
- QR yang terlanjur dipasang jangan berubah hanya karena metadata buku berubah.

---

# 12. UI/UX Design Direction — Skylearn Adaptation

## 12.1 Design Intent

Sistem memakai **bahasa visual Skylearn**, tetapi konteksnya perpustakaan sekolah, bukan aplikasi les.

Target visual:

- Terang.
- Ramah.
- Sedikit playful.
- Terstruktur.
- Tidak penuh ilustrasi.
- Tidak menggunakan gradient berlebihan.
- Tidak menggunakan glassmorphism.
- Tidak menggunakan neon/glow sebagai default.
- Tidak menjadikan setiap section sebagai card.

Komponen dibuat lebih dewasa daripada edtech anak umum agar cocok untuk lingkungan SMP dan petugas sekolah.

---

## 12.2 Color Tokens

Gunakan token asli Skylearn:

```css
--color-sky: #3B82F6;
--color-sky-bright: #60A5FA;
--color-sky-deep: #1D4ED8;
--color-sky-soft: #DBEAFE;

--color-sun: #FBBF24;
--color-sun-bright: #FCD34D;
--color-sun-deep: #D97706;

--color-leaf: #22C55E;
--color-leaf-soft: #DCFCE7;
--color-leaf-deep: #16A34A;

--color-coral: #F87171;
--color-coral-soft: #FEE2E2;

--color-berry: #A855F7;

--color-background: #FFFFFF;
--color-surface: #F8FAFC;
--color-surface-sunken: #F1F5F9;
--color-ink: #0F172A;
--color-ink-muted: #475569;
--color-ink-subtle: #94A3B8;
--color-ink-faint: #CBD5E1;
--color-outline: #E2E8F0;
--color-outline-strong: #94A3B8;
```

### Color semantics

- Sky = primary navigation/action.
- Leaf = available/active/success/progress.
- Sun = achievement/stat highlight only.
- Coral = warning/error/review state.
- Berry = secondary/extra information.

**Sun tidak digunakan sebagai tombol primary.**

---

## 12.3 Typography

Gunakan:

- **Hubot Sans** untuk heading/display.
- **Atkinson Hyperlegible** untuk body/UI.
- **Lexend Deca** hanya bila ada kebutuhan reading-focused content.
- **JetBrains Mono** untuk kode buku, NIS, angka statistik tertentu.

Minimum:

- Kid/student-facing body: 16px.
- Instruction: 18px.
- Touch target: minimum 56px.

---

# 13. Information Architecture

## 13.1 Siswa

```text
Dashboard
├── Katalog
├── Buku Saya
├── Riwayat
└── Profil
```

### Dashboard student

Layout desktop:

```text
┌─────────────────────────────────────────────────────┐
│ Logo   Dashboard  Katalog  Buku Saya        Profil  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Halo, Budi                                         │
│ Lihat buku yang tersedia atau cek pinjamanmu.     │
│                                                     │
│ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│ │ 2           │ │ 1           │ │ 0            │  │
│ │ Dipinjam    │ │ Segera jatuh│ │ Terlambat    │  │
│ └─────────────┘ └─────────────┘ └──────────────┘  │
│                                                     │
│ Buku yang sedang kamu pinjam                       │
│ [Book] [Book]                                      │
│                                                     │
│ Jelajahi katalog                                    │
│ [ Cari buku...                         ]            │
└─────────────────────────────────────────────────────┘
```

Hindari dashboard yang terlalu banyak widget. Prioritaskan **apa yang siswa butuhkan hari ini**.

---

## 13.2 Penjaga Perpustakaan

```text
Beranda
Transaksi
├── Pinjam
├── Kembali
└── Transaksi Aktif
Katalog
Laporan
```

### Transaction workspace

Desktop sebaiknya split-panel, bukan full-screen dashboard card wall:

```text
┌───────────────┬─────────────────────────────────────┐
│ Transaksi     │ Pinjam Buku                         │
│               │                                     │
│ ● Pinjam      │ 1. Identifikasi siswa              │
│ ○ Kembali     │                                     │
│               │ [ Scan QR Siswa ]                  │
│               │                                     │
│               │ Siswa terpilih                     │
│               │ Budi • VIII-A • 20261234           │
│               │                                     │
│               │ 2. Identifikasi buku               │
│               │ [ Scan QR Buku ]                   │
│               │                                     │
│               │ Laskar Pelangi                     │
│               │ BOOK-000001 • Tersedia             │
│               │                                     │
│               │ [ Batalkan ]  [ Konfirmasi ]       │
└───────────────┴─────────────────────────────────────┘
```

### UX rule

Petugas tidak perlu berpindah halaman untuk setiap transaksi. Setelah sukses:

```text
Success
  ↓
[ Transaksi berikutnya ]
```

Scanner kembali ke state siap scan.

---

## 13.3 Admin Data

```text
Dashboard
Data
├── Buku
├── Eksemplar
├── Siswa
├── Kelas
└── Kategori
QR Code
├── Generate
└── Cetak Batch
Import / Export
Laporan
Audit Log
```

Admin UI lebih padat dan data-oriented, sesuai konsep **Parent/Teacher Mode** dari Skylearn, tetapi tanpa ilustrasi berlebih.

---

# 14. Core Components

## 14.1 Big Friendly Button

Digunakan pada action utama seperti:

- Scan QR.
- Konfirmasi peminjaman.
- Konfirmasi pengembalian.

Min-height 56-64px.

---

## 14.2 Scan Card

Bukan card dekoratif besar. Gunakan satu area scanner yang jelas:

```text
┌──────────────────────────────┐
│                              │
│          camera              │
│                              │
│     ┌──────────────────┐     │
│     │  scan frame      │     │
│     └──────────────────┘     │
│                              │
│ Arahkan kamera ke QR buku.   │
│                              │
│ [ Input kode manual ]        │
└──────────────────────────────┘
```

Gunakan border/overlay sederhana. Hindari animasi scanning yang berlebihan.

---

## 14.3 Status Chip

Gunakan kombinasi icon + label + warna.

```text
✓ Tersedia
↗ Dipinjam
! Terlambat
× Rusak
```

Warna bukan satu-satunya sinyal.

---

## 14.4 Book Card

Book card hanya berisi informasi penting:

- cover;
- judul;
- penulis;
- status;
- kategori.

Jangan menaruh 8-10 metadata di card.

---

## 14.5 Data Table

Untuk admin:

- sticky header;
- pagination;
- search;
- filter;
- column visibility jika diperlukan;
- bulk select;
- responsive fallback.

Tabel boleh padat pada Admin Data, tetapi font tetap terbaca dan action tidak tersembunyi hanya di hover.

---

# 15. Mobile UX

## Siswa

Mobile-first.

Bottom navigation dapat digunakan jika jumlah menu terbatas:

```text
Beranda | Katalog | Buku Saya | Profil
```

Touch target minimum 56px.

## Penjaga

Desktop-first untuk workstation, tetapi scan camera harus nyaman pada tablet/HP.

## Admin

Desktop/tablet-first karena pekerjaan data intensif.

---

# 16. Accessibility

Wajib mengikuti prinsip dari Skylearn:

- Target kontras teks tinggi.
- Jangan menggunakan warna saja sebagai status.
- Semua tombol keyboard accessible.
- Focus ring terlihat.
- Scanner dapat diakses dengan fallback input manual.
- Error message inline dan spesifik.
- Reduced motion mengikuti `prefers-reduced-motion`.
- Semua icon penting memiliki accessible label.
- Tidak ada tombol kritis yang hanya muncul saat hover.

### Copy error

Jangan:

> ERROR 409 INVALID STATE

Gunakan:

> Buku ini sedang dipinjam. Pilih buku lain atau proses pengembalian terlebih dahulu.

---

# 17. UX Copy

Gaya bahasa: ramah, langsung, tidak kekanak-kanakan.

### Empty states

```text
Belum ada buku yang sedang kamu pinjam.
Jelajahi katalog untuk menemukan buku berikutnya.
```

### QR error

```text
QR belum dikenali.
Pastikan kode terlihat jelas, atau masukkan kode buku secara manual.
```

### Successful borrow

```text
Peminjaman berhasil.
Laskar Pelangi tercatat atas nama Budi.
Jatuh tempo: 10 Oktober 2026.
```

### Successful return

```text
Pengembalian berhasil.
Buku sudah kembali ke koleksi tersedia.
```

---

# 18. API Validation Rules

Semua input divalidasi server-side.

## Student

```text
nis:
- required
- unique
- normalized

name:
- required
- trimmed
```

## Book

```text
isbn:
- optional
- normalized

title:
- required
- trimmed
```

## Book Copy

```text
inventory_code:
- required
- unique

qr_token:
- generated by server
- unique
```

---

# 19. Security Requirements

### SEC-01 — Authentication

Gunakan password hashing modern dan secure session.

### SEC-02 — Authorization

Setiap protected endpoint memvalidasi role/permission.

### SEC-03 — QR tidak dianggap rahasia

QR buku boleh terlihat secara fisik. Jangan menjadikan possession of QR sebagai bukti authorization.

### SEC-04 — Server-side Validation

Semua business rule divalidasi di server.

### SEC-05 — CSRF

Jika memakai cookie-based auth, proteksi CSRF harus diterapkan sesuai framework.

### SEC-06 — Rate Limiting

Login dan endpoint sensitif harus memiliki rate limit.

### SEC-07 — Input Sanitization

Semua input import/search/form harus dinormalisasi dan divalidasi.

### SEC-08 — Audit Trail

Perubahan penting harus dapat ditelusuri.

### SEC-09 — Import Safety

File upload dibatasi ukuran dan tipe; jangan mengeksekusi file upload sebagai script.

### SEC-10 — PII Minimization

Tampilkan hanya data siswa yang diperlukan pada layar operasional.

---

# 20. Import Algorithm

## CSV/XLSX Book Import

```pseudo
rows = parse(file)

for row in rows:
    normalized = normalize(row)
    result = validate(normalized)

    if result.invalid:
        errors.add(row.number, result.errors)
        continue

    if duplicateInFile(normalized):
        errors.add(row.number, ["DUPLICATE_IN_FILE"])
        continue

    if duplicateInDatabase(normalized):
        errors.add(row.number, ["DUPLICATE_IN_DATABASE"])
        continue

    validRows.add(normalized)

showPreview(validRows, errors)

if confirmed:
    begin transaction or controlled batch process
    persist(validRows)
    commit
```

Untuk file besar, gunakan background job/batch processing bila arsitektur deployment mendukungnya. UI harus menampilkan progress dan final report.

---

# 21. Search Algorithm

MVP:

- exact/prefix match untuk kode;
- case-insensitive search untuk judul/penulis;
- filter kategori/status.

Contoh:

```text
q = normalize(search)

search books where
    title ILIKE %q%
    OR author ILIKE %q%
    OR isbn = normalized(q)
    OR book_code = normalized(q)
```

Untuk skala besar, tambahkan database index/full-text search sesuai engine yang dipakai.

---

# 22. Pagination & Performance

### Admin lists

Gunakan server-side pagination.

Contoh:

```text
GET /api/books?page=1&pageSize=25
```

### Rules

- Jangan mengambil seluruh tabel 10.000+ row ke browser.
- Debounce search input sekitar 250-350ms.
- Cache query katalog yang aman untuk di-cache.
- Invalidate cache setelah mutation relevan.
- Gunakan skeleton/loading state yang stabil, bukan layout jumping.

---

# 23. Error & Recovery UX

Kategori error:

### User error

Contoh: QR salah.

Action:

```text
Pesan jelas + Retry + Manual input
```

### Business rule error

Contoh: buku sudah dipinjam.

Action:

```text
Jelaskan kenapa + alternatif tindakan
```

### Network error

```text
Tidak dapat terhubung ke server.
Data transaksi belum berubah.
[Coba lagi]
```

### Unknown error

Tampilkan pesan aman untuk user dan log detail teknis ke server.

---

# 24. Observability

Server minimal memiliki structured logs untuk:

- authentication failures;
- borrow attempts;
- return attempts;
- import jobs;
- QR generation;
- unexpected exceptions.

Jangan log password, session secret, atau data sensitif yang tidak diperlukan.

Metrics MVP:

- successful borrow count;
- return count;
- QR scan failure rate;
- import success/error rows;
- average transaction duration (optional).

---

# 25. Design System Implementation

Buat CSS variables/tokens agar warna/spacing tidak tersebar di komponen.

### Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-card: 20px;
--radius-modal: 28px;
--radius-pill: 999px;
```

### Spacing

```text
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128
```

### Shadows

Card:

```text
0 8px 24px rgba(15, 23, 42, 0.06)
```

Modal:

```text
0 24px 48px rgba(15, 23, 42, 0.12)
```

Gunakan shadow ringan. Elevation bukan dekorasi utama.

---

# 26. Avoiding AI-Slop UI

UI harus menghindari pola yang terlihat seperti hasil generator template:

### Jangan

- Semua section dibungkus card.
- Gradient biru-ungu sebagai background.
- Glassmorphism.
- Glow besar pada setiap CTA.
- 6-8 KPI cards di atas dashboard tanpa alasan.
- Ilustrasi stock generik yang tidak relevan.
- Emoji sebagai icon utama.
- Copy seperti "Unlock your learning journey".
- Sidebar dengan terlalu banyak nested menu tanpa hirarki.
- Tombol icon-only untuk action penting.

### Gunakan

- Ruang putih.
- Hierarki tipografi yang jelas.
- Satu primary action per context.
- Section yang mengalir tanpa harus menjadi card.
- Border halus.
- Table yang kuat untuk pekerjaan data.
- Scanner sebagai focal point saat transaksi.
- Warna Skylearn berdasarkan semantic role.
- Ilustrasi buku hanya di area yang memang membantu orientasi.

---

# 27. Dashboard Requirements

## Student Dashboard

Prioritas urutan:

1. Greeting.
2. Status pinjaman.
3. Buku aktif/yang segera jatuh tempo.
4. Search katalog.
5. Rekomendasi berbasis kategori/manual editorial bila nanti dibutuhkan.

## Librarian Dashboard

Prioritas urutan:

1. Quick action pinjam/kembali.
2. Transaksi aktif.
3. Peringatan overdue.
4. Statistik harian minimal.

## Admin Dashboard

Prioritas urutan:

1. Jumlah judul buku.
2. Jumlah eksemplar.
3. Buku sedang dipinjam.
4. Overdue.
5. Import terakhir.
6. Activity/audit terbaru.

Jangan mengejar jumlah KPI; tampilkan hanya metrik yang membantu keputusan operasional.

---

# 28. Notifications

MVP:

- Toast sukses.
- Inline error.
- Banner untuk warning penting.

Notifikasi tidak mengganggu scanner.

Untuk transaksi:

```text
Success toast 2-4 detik
+ permanent transaction result
```

Jangan mengandalkan toast saja untuk data penting.

---

# 29. Business Rules

Nilai kebijakan berikut **harus configurable**, bukan hard-coded:

```text
maxActiveLoans
loanDurationDays
finePerDay
allowRenewal
maxRenewalCount
```

MVP default dapat ditetapkan setelah sekolah menyepakati aturan resmi.

Sistem tidak boleh mengarang kebijakan sekolah ketika data belum tersedia.

---

# 30. Edge Cases

## EC-01 — QR rusak

Fallback manual code.

## EC-02 — Kamera tidak tersedia

Tampilkan input kode.

## EC-03 — Buku sudah dipinjam

Tolak transaction creation.

## EC-04 — Dua petugas scan buku sama

Database concurrency control memastikan hanya satu transaksi berhasil.

## EC-05 — Internet putus setelah klik confirm

Client tidak boleh menganggap sukses hanya karena tombol diklik. Gunakan idempotency dan query status untuk recovery.

## EC-06 — Siswa nonaktif

Tolak peminjaman.

## EC-07 — Buku hilang/rusak

Admin dapat mengubah status copy ke `LOST`/`DAMAGED`; copy tidak dapat dipinjam.

## EC-08 — Eksemplar diganti

Buat copy baru dengan QR baru. Jangan memindahkan QR lama ke object fisik lain tanpa audit.

## EC-09 — Duplikat NIS

Import menolak duplikat dan memberi detail row.

## EC-10 — Buku judul sama

Identifier tetap berdasarkan `BOOK_COPY`, bukan judul.

---

# 31. Non-Functional Requirements

## Performance

Target UX:

- First meaningful UI cepat pada koneksi sekolah yang wajar.
- API read sederhana idealnya < 500ms pada kondisi normal.
- Borrow/return transaction idealnya < 1s server time pada kondisi normal.

Angka tersebut adalah target engineering, bukan SLA final.

## Reliability

- Tidak boleh ada transaksi setengah berhasil.
- Loan dan status copy harus konsisten.

## Maintainability

- TypeScript strict.
- ESLint + formatter.
- Shared validation schema.
- Service layer untuk business rules.
- Migration versioned.
- Test untuk use case kritis.

---

# 32. Testing Strategy

## Unit Tests

Test:

- calculateDueDate;
- calculateLateDays;
- calculateFine;
- validateBorrow;
- validateReturn;
- QR token parser.

## Integration Tests

Test:

- POST loan;
- POST return;
- import data;
- role authorization;
- concurrent borrow scenario.

## E2E Tests

### Borrow

```text
login librarian
→ open borrow
→ scan/enter student
→ scan/enter book
→ confirm
→ verify loan appears
→ verify copy becomes BORROWED
```

### Return

```text
login librarian
→ open return
→ scan/enter book
→ confirm
→ verify loan RETURNED
→ verify copy AVAILABLE
```

### Admin import

```text
upload file
→ preview
→ confirm
→ verify created records
→ verify QR mapping
```

---

# 33. Definition of Done — MVP

Fitur dianggap selesai jika:

- [ ] Tiga role dapat login.
- [ ] RBAC berjalan di backend.
- [ ] Admin dapat CRUD buku.
- [ ] Admin dapat membuat eksemplar fisik.
- [ ] Sistem menghasilkan QR unik per eksemplar.
- [ ] Admin dapat mencetak QR massal dalam PDF.
- [ ] Data siswa dapat diimport.
- [ ] Buku dapat diimport.
- [ ] Penjaga dapat scan QR siswa.
- [ ] Penjaga dapat scan QR buku.
- [ ] Borrow memakai DB transaction.
- [ ] Return memakai DB transaction.
- [ ] Sistem mencegah double borrow.
- [ ] Sistem mencegah pinjam buku non-available.
- [ ] Siswa dapat melihat katalog.
- [ ] Siswa dapat melihat pinjaman sendiri.
- [ ] Riwayat transaksi tersedia.
- [ ] Audit log tersedia untuk mutation penting.
- [ ] Manual input tersedia sebagai fallback QR.
- [ ] UI responsive.
- [ ] Accessibility baseline terpenuhi.
- [ ] Error state tidak bocor dengan detail teknis.

---

# 34. MVP Screen Inventory

## Public/Auth

```text
/login
```

## Student

```text
/student/dashboard
/student/books
/student/books/:id
/student/loans
/student/history
/student/profile
```

## Librarian

```text
/librarian/dashboard
/librarian/borrow
/librarian/return
/librarian/transactions
/librarian/books
/librarian/reports
```

## Admin

```text
/admin/dashboard
/admin/books
/admin/books/:id
/admin/copies
/admin/students
/admin/classes
/admin/categories
/admin/qr
/admin/import
/admin/reports
/admin/audit-logs
```

---

# 35. Suggested Component Structure

```text
src/
├── app/
├── components/
│   ├── ui/
│   │   ├── Button
│   │   ├── Input
│   │   ├── Badge
│   │   ├── Modal
│   │   ├── DataTable
│   │   └── EmptyState
│   ├── library/
│   │   ├── BookCard
│   │   ├── BookStatusBadge
│   │   ├── QRScanner
│   │   ├── QRResult
│   │   ├── LoanReview
│   │   └── TransactionReceipt
│   └── layout/
├── features/
│   ├── auth/
│   ├── books/
│   ├── book-copies/
│   ├── students/
│   ├── loans/
│   ├── imports/
│   └── reports/
├── lib/
│   ├── api/
│   ├── validation/
│   ├── auth/
│   └── utils/
└── types/
```

Struktur feature-first boleh dipakai jika tim lebih nyaman; yang penting boundary antara UI, domain/use-case, dan data access tetap jelas.

---

# 36. Recommended Delivery Phases

## Phase 1 — Foundation

- Auth.
- RBAC.
- Database/migrations.
- Design tokens.
- Layout shell.

## Phase 2 — Master Data

- Students.
- Books.
- Categories.
- Book copies.
- Import.

## Phase 3 — QR

- QR generation.
- QR print PDF.
- Scanner.
- Resolve endpoint.

## Phase 4 — Transactions

- Borrow.
- Return.
- Loan history.
- Overdue.

## Phase 5 — Reporting & Audit

- Dashboard.
- Reports.
- Audit log.

## Phase 6 — Hardening

- Concurrency tests.
- Security review.
- Accessibility review.
- Mobile QA.
- Printer/QR physical validation.

---

# 37. Acceptance Criteria — Critical Flows

## Borrow Acceptance

**Given** student aktif dan copy available  
**When** librarian scan student → scan book → confirm  
**Then** satu loan aktif dibuat, copy berubah `BORROWED`, dan success result tampil.

## Borrow Conflict Acceptance

**Given** copy sudah `BORROWED`  
**When** librarian mencoba meminjamkannya lagi  
**Then** API menolak request dan tidak membuat loan kedua.

## Return Acceptance

**Given** copy memiliki active loan  
**When** librarian scan copy dan confirm return  
**Then** loan berubah `RETURNED`, returned timestamp tersimpan, copy menjadi `AVAILABLE`.

## QR Acceptance

**Given** admin memiliki 100 eksemplar  
**When** admin generate QR batch  
**Then** 100 QR unik dibuat dan dapat diunduh dalam layout PDF print-ready.

## Import Acceptance

**Given** file memiliki valid dan invalid rows  
**When** admin menjalankan import  
**Then** sistem memperlihatkan preview/error detail dan tidak menyatakan semua baris berhasil jika ada yang gagal.

---

# 38. Open Decisions Requiring School Confirmation

Hal berikut tidak boleh diasumsikan sebelum mendapat aturan resmi sekolah:

- Batas jumlah buku yang dapat dipinjam siswa.
- Lama peminjaman.
- Apakah ada denda uang atau hanya sanksi administrasi.
- Apakah perpanjangan diizinkan.
- Apakah guru ikut menggunakan sistem sebagai borrower.
- Format nomor inventaris sekolah.
- Apakah siswa memiliki QR fisik atau QR digital di aplikasi.
- Struktur data kelas/rombel.
- Apakah data buku tersedia sebagai Excel/CSV dan kolomnya apa saja.
- Apakah data siswa tersedia sebagai Excel/CSV.
- Lokasi/rak buku yang perlu dilacak.

---

# 39. Data Onboarding Plan for SMP Negeri 17 Tangerang Selatan

Sebelum production launch, minta data awal dari sekolah.

## Minimum Book Dataset

```text
inventory_code (jika ada)
title
author
publisher
year
isbn (jika ada)
category
quantity
location (jika ada)
```

## Minimum Student Dataset

```text
nis
name
class
status
```

### Recommended onboarding

```text
Excel/CSV sekolah
      ↓
Data cleansing
      ↓
Import preview
      ↓
Admin confirmation
      ↓
Create titles
      ↓
Create copies
      ↓
Generate QR
      ↓
Print
      ↓
Label physical books
      ↓
Sample scan QA
      ↓
Production
```

Jangan memasukkan data asli ke environment development tanpa prosedur akses yang disetujui sekolah.

---

# 40. Final Product Principle

**Smart Library System bukan aplikasi QR yang kebetulan punya database.**

QR hanyalah mekanisme input cepat.

Sumber kebenaran tetap:

```text
Database
   ↓
Book Copy
   ↓
Loan
   ↓
Audit Log
```

UI berfungsi membuat alur tersebut mudah dipahami dan cepat digunakan.

Untuk Siswa, pengalaman harus sederhana.  
Untuk Penjaga, pengalaman harus cepat.  
Untuk Admin Data, pengalaman harus presisi.

Hasil akhirnya harus terasa seperti **perpustakaan sekolah modern yang dirancang dengan sistem visual Skylearn**, bukan dashboard SaaS generik yang diberi warna biru.
