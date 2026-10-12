# PRD — Redesain Total Smart Library SMPN 17 Tangerang Selatan

| | |
|---|---|
| Status | Draf untuk review |
| Dokumen terkait | `design.md` (token visual, tipografi, motif, komponen) |
| Cakupan | Tata letak, arsitektur informasi, alur, komponen, dan konten seluruh aplikasi |
| Di luar cakupan | Perubahan skema database, logika bisnis denda/masa pinjam, fitur baru di luar daftar §6 |

---

## 1. Latar belakang

Tampilan saat ini terkesan template generik: sistem desain asing (Flip7), efek glow, bentuk serba bulat, dekorasi palsu, dan fokus form dimatikan. Masalahnya tidak hanya visual. Tata letak juga dibuat per halaman tanpa pola bersama, sehingga pengguna harus belajar ulang di setiap layar. Redesain ini mengganti **tampilan dan tata letak sekaligus**, dengan acuan pola yang dipakai produk institusional besar (portal perbankan, sistem perpustakaan universitas, konsol admin): hierarki jelas, pola halaman konsisten, padat informasi di sisi admin, ringkas di sisi siswa.

## 2. Tujuan dan non-tujuan

### Tujuan
1. **Kredibel sebagai layanan sekolah negeri.** Tidak ada elemen yang terkesan mainan atau template.
2. **Sirkulasi lebih cepat.** Petugas menyelesaikan satu peminjaman dengan scan kartu + scan buku tanpa menyentuh mouse.
3. **Siswa langsung tahu statusnya.** Apa yang sedang dipinjam dan kapan harus kembali terlihat tanpa navigasi.
4. **Konsisten.** Semua halaman memakai pola tata letak yang sama, sehingga halaman baru bisa dibuat dari komponen yang ada.
5. **Dapat diakses.** Memenuhi WCAG 2.1 AA di alur utama.

### Non-tujuan
- Menambah fitur baru (e-book, rekomendasi AI, gamifikasi, dll).
- Mengubah aturan bisnis peminjaman.
- Dark mode (ditunda; token disiapkan agar bisa ditambah nanti).

## 3. Pengguna

| Peran | Perangkat utama | Kebutuhan utama | Masalah saat ini |
|---|---|---|---|
| **Petugas perpustakaan** (guru/staf) | Laptop/PC di meja sirkulasi, scanner QR/USB | Proses pinjam–kembali cepat, cari anggota dan buku, lihat keterlambatan | Antarmuka bergaya mainan, tidak ada alur keyboard, tabel longgar |
| **Admin sekolah** | Laptop | Kelola koleksi dan anggota, lihat laporan | Informasi tersebar, tidak ada pola halaman yang konsisten |
| **Siswa** | HP (utama) | Cari buku, lihat pinjaman dan jatuh tempo, tunjukkan kartu anggota | Status pinjaman tidak menonjol, kartu belum tegas sebagai kartu identitas |

> Peran dan hak akses mengikuti yang sudah ada di aplikasi. PRD ini tidak menambah peran baru.

## 4. Metrik keberhasilan

Ukur sebelum dan sesudah redesain (uji dengan 3–5 petugas dan 10 siswa).

| Metrik | Target |
|---|---|
| Waktu satu peminjaman (kartu → buku → konfirmasi) | ≤ 15 detik, setara atau lebih cepat dari sekarang |
| Siswa menemukan tanggal jatuh tempo pinjaman tanpa bantuan | ≥ 90% berhasil dalam ≤ 5 detik |
| Siswa menemukan buku dari katalog | ≥ 90% berhasil dalam ≤ 30 detik |
| Skor Lighthouse Accessibility (halaman utama) | ≥ 95 |
| Pelanggaran axe tingkat serious/critical | 0 |
| Pembacaan QR kartu anggota dari layar HP oleh scanner meja | ≥ 95% percobaan pertama |
| Sisa token/kelas terlarang (Flip7, glow, `rounded-full`, `border-l-[6px]`) | 0 |

## 5. Prinsip tata letak

1. **Satu pola halaman per jenis halaman.** Daftar, detail, formulir, dan dasbor masing-masing punya satu rangka baku (§8).
2. **Konten dulu, hiasan tidak ada.** Hierarki dibangun dari ukuran huruf, jarak, dan garis tipis.
3. **Aksi utama selalu di tempat yang sama.** Kanan atas header halaman (admin) atau tombol penuh di dasar konten (siswa mobile).
4. **Jangan pindah halaman jika cukup panel samping.** Detail cepat membuka drawer, bukan halaman baru, sehingga petugas tidak kehilangan konteks daftar.
5. **Mobile-first untuk siswa, desktop-first untuk admin.** Admin tetap harus berfungsi di tablet dan layak di HP.

## 6. Cakupan halaman

Rute yang sudah diketahui dari repo ditandai ✔. Rute lain perlu dikonfirmasi ke struktur `src/app` sebelum dikerjakan.

| Area | Halaman | Rute | Prioritas |
|---|---|---|---|
| Otentikasi | Login | `/login` ✔ | P0 |
| Admin | Dasbor | `/admin` ✔ | P0 |
| Admin | Meja peminjaman | `/admin/borrow` ✔ | P0 |
| Admin | Meja pengembalian | `/admin/return` ✔ | P0 |
| Admin | Koleksi buku (daftar, detail, form) | `/admin/books` ✔ | P0 |
| Admin | Anggota/siswa | (konfirmasi) | P1 |
| Admin | Riwayat transaksi | (konfirmasi) | P1 |
| Admin | Laporan | (konfirmasi) | P2 |
| Admin | Pengaturan | (konfirmasi) | P2 |
| Siswa | Beranda | `/student` ✔ | P0 |
| Siswa | Katalog + detail buku | `/student/books` ✔ | P0 |
| Siswa | Pinjaman saya | (konfirmasi) | P0 |
| Siswa | Kartu anggota / profil | `/student/profile` ✔ | P0 |
| Global | Palet perintah, notifikasi, state kosong/error/memuat | komponen | P0 |

## 7. Sistem tata letak

### 7.1 Breakpoint dan grid

| Nama | Lebar | Kolom | Margin | Gutter |
|---|---|---|---|---|
| `sm` (HP) | 0–639 | 4 | 16 | 16 |
| `md` (tablet) | 640–1023 | 8 | 24 | 24 |
| `lg` (laptop) | 1024–1439 | 12 | 32 | 24 |
| `xl` (desktop) | ≥ 1440 | 12 | auto (konten maks 1280) | 24 |

Konten bacaan (deskripsi buku, kebijakan) dibatasi 68 karakter per baris. Tabel dan dasbor boleh selebar area konten.

### 7.2 Rangka aplikasi (App Shell)

**Admin (desktop ≥ 1024)**
```
┌───────────┬──────────────────────────────────────────────┐
│ Sidebar   │ Topbar: [breadcrumb]        [cari ⌘K] [🔔] [👤]│
│ 248px     ├──────────────────────────────────────────────┤
│ tetap     │ Konten (padding 32, maks 1280)                │
│           │                                              │
└───────────┴──────────────────────────────────────────────┘
```
- Sidebar: logo + nama unit di atas; grup menu **Sirkulasi · Koleksi · Anggota · Laporan · Pengaturan**; profil dan keluar di dasar. Dapat diciutkan menjadi 64px (ikon saja) dengan tooltip.
- Topbar 56px: breadcrumb kiri; pencarian global (membuka palet perintah dengan `Ctrl/⌘+K`), notifikasi, menu akun kanan.
- Tablet/HP: sidebar menjadi drawer dari kiri dengan tombol menu di topbar.

**Siswa**
- **HP:** topbar 56px (nama halaman + notifikasi), konten satu kolom, **bottom bar 4 item** (Beranda, Katalog, Pinjaman, Kartu) setinggi 64px + safe-area.
- **Tablet/desktop:** bottom bar diganti topbar horizontal dengan tautan yang sama; konten maks 1040px, di tengah.

**Login:** tanpa shell. Dua kolom di desktop, satu kolom di HP.

### 7.3 Pola halaman baku

**A. Halaman daftar** (koleksi, anggota, riwayat)
```
Breadcrumb
Judul halaman (h1 + garis ganda)                  [Aksi utama]
Deskripsi satu baris (opsional)
────────────────────────────────────────────────────────────
[Cari…]  [Filter ▾] [Filter ▾]  [Urutkan ▾]      Menampilkan 1–25 dari 312
Chip filter aktif: [Kelas 8B ✕] [Tersedia ✕]  Hapus semua
────────────────────────────────────────────────────────────
Tabel (header sticky, baris 44px, pilih baris → drawer detail)
────────────────────────────────────────────────────────────
Paginasi: ◀ 1 2 3 … 13 ▶      Baris per halaman [25 ▾]
```
- Klik baris membuka **drawer kanan** (480px) berisi detail ringkas dan aksi. Tautan "Buka halaman penuh" untuk detail lengkap.
- Di HP, tabel menjadi daftar baris bertumpuk dan drawer menjadi halaman penuh.

**B. Halaman detail**
```
Breadcrumb
Judul + status chip                               [Aksi sekunder] [Aksi utama]
────────────────────────────────────────────────────────────
Kolom utama (8/12)                  │ Panel samping (4/12)
 Tab: Ringkasan · Eksemplar · Riwayat│  Metadata ringkas
 Konten tab                          │  Status, nomor panggil
```

**C. Formulir**
- Satu kolom, lebar maks 640px, dikelompokkan dalam seksi berjudul (h3) dan dipisah garis tipis.
- Bilah aksi lengket di dasar: [Batal] [Simpan]. Validasi inline, ringkasan error di atas jika ada lebih dari satu.
- Peringatan jika meninggalkan halaman dengan perubahan belum tersimpan.

**D. Dasbor**
- Baris metrik (satu panel, 4 metrik dipisah garis vertikal) → area utama 8/12 (grafik sirkulasi) + 4/12 (perlu perhatian) → tabel/log lebar penuh.

## 8. Spesifikasi per halaman

### 8.1 Login (`/login`)
- Desktop: panel kiri 5/12 (latar `primary`: logo resmi, nama unit, 3 layanan, jam layanan), panel kanan 7/12 (form 400px).
- HP: logo + nama unit ringkas di atas, form langsung di bawahnya, jam layanan dan kontak di kaki halaman.
- Field: NIS/nama pengguna, kata sandi (dengan tombol lihat), tombol **Masuk**. Tautan bantuan: "Lupa kata sandi? Hubungi petugas perpustakaan."
- Enter mengirim form. Fokus awal di field pertama. Error spesifik di bawah field.
- Dihapus: rak buku CSS, slogan, ilustrasi dekoratif.

### 8.2 Dasbor admin (`/admin`)
Urutan dari atas:
1. Header halaman: "Dasbor" + tanggal hari ini. Aksi utama di kanan: **Pinjamkan buku** (primary) dan **Terima pengembalian** (secondary), keduanya menuju meja sirkulasi.
2. Panel metrik (satu panel, 4 sel): Dipinjam hari ini · Dikembalikan hari ini · Sedang dipinjam · Terlambat. Setiap sel: angka, label, keterangan satu baris. Klik sel membuka daftar terfilter. Tanpa animasi hitung.
3. Baris dua kolom: **Sirkulasi 30 hari** (grafik garis/batang, 8/12; pinjam = biru brand, kembali = abu tua; ada tabel data alternatif untuk pembaca layar) dan **Perlu tindak lanjut** (4/12; daftar terlambat + buku rusak/hilang, maksimal 5 baris + "Lihat semua").
4. **Log sirkulasi** lebar penuh: waktu, anggota, rombel, judul, jenis (Pinjam/Kembali), petugas. 10 baris terbaru.

### 8.3 Meja sirkulasi (`/admin/borrow`, `/admin/return`)
Satu layar, dua kolom (desktop): kiri 7/12 alur kerja, kanan 5/12 panel pendukung.
- **Kiri:** stepper dua langkah: **1 Anggota** → **2 Buku**. Satu kolom input yang selalu fokus (menerima scanner USB atau ketikan). Tombol kamera membuka viewfinder dengan bingkai sudut.
- **Kanan:** kartu ringkasan anggota (foto, nama, NIS, rombel, pinjaman aktif, denda/terlambat jika ada) dan daftar buku yang sedang diproses.
- Konfirmasi di dasar: **Selesaikan peminjaman** menghasilkan struk dengan tombol **Cetak** dan **Transaksi berikutnya**.
- Mode pengembalian memakai rangka sama; langkah 1 = scan buku, anggota otomatis terisi dari pinjaman aktif.
- Pintasan: `/` fokus input · `Enter` konfirmasi · `Esc` batal · `Ctrl+P` cetak struk · `N` transaksi baru. Ditampilkan di kaki halaman.
- Setiap hasil scan memberi umpan balik teks + ikon + warna (sukses/gagal) dan diumumkan lewat `aria-live`.

### 8.4 Koleksi buku admin (`/admin/books`)
- Pola halaman daftar (§7.3-A). Kolom: Sampul mini, Judul/Pengarang, Nomor panggil (mono), Kategori, Eksemplar (tersedia/total), Status.
- Filter: kategori Dewey, status ketersediaan, penerbit/tahun (jika ada datanya). Pencarian judul/pengarang/ISBN/kode.
- Drawer detail: metadata, daftar eksemplar dengan status masing-masing, tombol Ubah, Cetak label.
- Aksi header: **Tambah buku**. Impor massal hanya jika sudah ada di aplikasi.

### 8.5 Beranda siswa (`/student`)
Urutan di HP:
1. Sapaan (Newsreader) + kelas/NIS.
2. Kolom pencarian katalog.
3. **Sedang dipinjam**: kartu per buku (sampul, judul, nomor panggil, tanggal kembali, chip sisa hari). Diurutkan jatuh tempo terdekat. Jika kosong: "Belum ada pinjaman aktif" + tautan ke katalog.
4. Tombol penuh **Tampilkan kartu anggota**.
5. **Baru di perpustakaan**: baris sampul bisa digeser (maks 8), tanpa auto-scroll.
- Di desktop: kolom pinjaman 7/12, kolom kartu anggota ringkas + pencarian 5/12.

### 8.6 Katalog dan detail buku (`/student/books`)
- Pencarian di atas (lengket), filter berupa chip horizontal (kategori) + tombol Filter untuk panel lengkap (bottom sheet di HP).
- Hasil: grid sampul (2 kolom HP, 3 tablet, 5–6 desktop) dengan judul, pengarang, badge ketersediaan. Opsi tampilan daftar.
- Detail buku: sampul besar, judul, pengarang, nomor panggil, kategori, sinopsis, ketersediaan "Tersedia (2/3)", dan lokasi rak jika datanya ada. Catatan: peminjaman tetap lewat petugas (kecuali alur reservasi sudah ada di aplikasi).

### 8.7 Pinjaman saya
- Tab: **Aktif** · **Riwayat**. Aktif ditampilkan sebagai "slip tanggal kembali" (lihat `design.md` §4.1). Riwayat berupa daftar bertanggal dengan stempel KEMBALI.

### 8.8 Kartu anggota (`/student/profile`)
- Kartu digital berproporsi CR80, dengan QR besar dan quiet zone. Tombol **Perbesar QR** (menaikkan kecerahan layar bila diizinkan browser) dan **Unduh/Cetak**.
- Di bawah kartu: data profil (NIS, nama, rombel, tanggal bergabung) dan tombol Keluar.

### 8.9 Elemen global
- **Palet perintah:** dialog tengah 560px, input di atas, hasil dikelompokkan (Halaman, Buku, Anggota, Aksi). Navigasi panah, Enter memilih, Esc menutup.
- **Notifikasi:** popover di topbar (admin) / halaman penuh (siswa). Daftar bertanggal, bisa ditandai dibaca.
- **State standar:** Memuat (skeleton), Kosong, Error + coba lagi, Offline (banner), Tanpa akses. Memakai komponen `EmptyState` dan `ErrorState` bersama.

## 9. Persyaratan fungsional

| ID | Persyaratan | Prioritas |
|---|---|---|
| FR-01 | Seluruh halaman §6 menggunakan App Shell dan pola halaman baku §7 | P0 |
| FR-02 | Token dari `design.md` §1–3 menjadi satu-satunya sumber warna, radius, dan bayangan; semua token Flip7 dihapus | P0 |
| FR-03 | Font Newsreader, IBM Plex Sans, IBM Plex Mono dimuat lewat `next/font` | P0 |
| FR-04 | Sirkulasi dapat diselesaikan sepenuhnya dengan keyboard + scanner USB | P0 |
| FR-05 | Scanner kamera bekerja di meja sirkulasi dengan umpan balik teks dan ikon | P0 |
| FR-06 | Tabel admin: header sticky, paginasi, pencarian, filter, urutan, drawer detail | P0 |
| FR-07 | Tabel menjadi daftar bertumpuk di lebar < 640px | P0 |
| FR-08 | Kartu anggota berproporsi CR80, QR terbaca scanner meja | P0 |
| FR-09 | Stylesheet cetak untuk kartu anggota dan struk transaksi | P1 |
| FR-10 | Palet perintah dengan pencarian halaman, buku, anggota | P1 |
| FR-11 | Status chip memakai teks (bukan hanya warna) dan ikon untuk Terlambat | P0 |
| FR-12 | Sampul cadangan tipografis per kelas Dewey bila buku tanpa gambar | P1 |
| FR-13 | Semua daftar dan form punya state memuat, kosong, error | P0 |
| FR-14 | Teks UI mengikuti panduan microcopy `design.md` §10; tanpa emoji dan tanda seru | P1 |
| FR-15 | Sidebar admin dapat diciutkan dan preferensinya diingat | P2 |

## 10. Persyaratan non-fungsional

- **Aksesibilitas:** WCAG 2.1 AA; fokus terlihat di semua elemen interaktif; urutan tab logis; landmark (`header`, `nav`, `main`) dan label ARIA yang benar; `prefers-reduced-motion` dihormati; target sentuh ≥ 44px untuk siswa.
- **Kinerja:** LCP ≤ 2,5 dtk pada HP kelas menengah dengan koneksi 4G; tanpa pergeseran tata letak berarti (CLS ≤ 0,1); gambar sampul dimuat lazy dengan dimensi tetap.
- **Responsif:** diuji di 390, 768, 1024, 1440 px.
- **Peramban:** dua versi stabil terakhir Chrome, Safari (iOS), Edge, Firefox. Android Chrome dan iOS Safari wajib karena dipakai siswa.
- **Konsistensi:** tidak ada warna, ukuran huruf, atau radius di luar token.
- **Konten:** bahasa Indonesia baku yang natural; tidak ada data placeholder di produksi.

## 11. Rencana kerja bertahap

| Fase | Isi | Keluaran | Kriteria selesai |
|---|---|---|---|
| **0. Persiapan** | Kumpulkan logo, warna, kontak, jam layanan (`design.md` §14); audit rute di `src/app` | Aset dan daftar rute final | §6 tanpa tanda "(konfirmasi)" untuk P0 |
| **1. Prototipe** | Login dengan token, font, dan motif final | Satu layar utuh | Lolos review tim di HP dan desktop |
| **2. Fondasi** | Token, font, primitif (Button, Field, StatusChip, DataTable, EmptyState/ErrorState), App Shell admin dan siswa | Pustaka komponen | Semua primitif memenuhi `design.md`; grep token terlarang = 0 |
| **3. Sisi siswa** | Beranda, katalog, detail buku, pinjaman saya, kartu anggota | Alur siswa lengkap | Uji dengan 10 siswa memenuhi §4 |
| **4. Sisi admin** | Dasbor, meja sirkulasi, koleksi buku, lalu anggota/riwayat | Alur admin lengkap | Uji dengan petugas memenuhi §4 |
| **5. Penyelesaian** | Cetak, palet perintah, microcopy, audit kontras dan a11y, bersih-bersih sisa Flip7 | Rilis kandidat | Semua kriteria §12 terpenuhi |

Tiap fase dirilis sebagai pull request terpisah agar mudah ditinjau dan dibatalkan.

## 12. Kriteria penerimaan

1. Tidak ada kelas atau token terlarang: `grep -rE "rounded-full|border-l-\[6px\]|glow|bg-cream|teal|coral|outline-none" src/` hanya mengembalikan penggunaan yang disengaja (avatar bulat).
2. Semua pasangan teks/latar lolos AA berdasarkan alat kontras.
3. `npx tsc --noEmit`, `npm run lint`, dan `npm run build` lolos tanpa error.
4. axe: 0 pelanggaran serious/critical di login, beranda siswa, katalog, meja sirkulasi, dasbor, koleksi.
5. Satu transaksi peminjaman selesai hanya dengan keyboard dan scanner.
6. QR dari kartu di layar HP terbaca scanner meja sirkulasi dalam percobaan pertama (≥ 19 dari 20 kali).
7. Screenshot sebelum/sesudah di 4 lebar layar dilampirkan di setiap PR.
8. Tidak ada teks placeholder atau data palsu di build produksi.

## 13. Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Logo/warna resmi belum tersedia | Palet harus diganti belakangan | Token terpusat; ganti dua variabel lalu cek kontras |
| Perubahan tata letak mengganggu kebiasaan petugas | Sirkulasi melambat saat transisi | Uji dengan petugas di fase 4, pertahankan urutan langkah yang sama, beri pintasan keyboard |
| Cakupan membengkak | Jadwal molor | Kerjakan berdasarkan prioritas P0 → P2; PR per fase |
| Data asli (foto, jam layanan, sampul) tidak lengkap | Hasil terlihat palsu | Sembunyikan bagian yang datanya belum ada, jangan isi placeholder |
| Kinerja HP siswa yang rendah | Halaman lambat | Batasi font (3 keluarga, subset), lazy-load sampul, tanpa animasi berat |
| Scanner kamera tidak konsisten di peramban tertentu | Sirkulasi macet | Selalu sediakan input manual dan dukungan scanner USB |

## 14. Pertanyaan terbuka

1. Apa warna dan bentuk logo resmi SMPN 17? (menentukan `primary` dan `accent`)
2. Rute apa saja yang ada selain yang bertanda ✔? Apakah ada halaman anggota, riwayat, laporan, pengaturan?
3. Apakah siswa bisa reservasi atau memperpanjang pinjaman dari aplikasi, atau semua lewat petugas?
4. Apakah data buku punya sampul, ISBN, nomor panggil/Dewey, dan lokasi rak? Jika tidak, bagian terkait disembunyikan atau data dilengkapi?
5. Perangkat apa yang dipakai di meja sirkulasi (scanner USB, kamera laptop, tablet)?
6. Apakah kartu anggota dicetak di kartu PVC atau hanya digital?
7. Siapa yang menyetujui desain akhir (kepala perpustakaan, wakil kepala sekolah)?
