# Sistem Desain — Smart Library SMPN 17 Tangerang Selatan

Dokumen ini menggantikan seluruh isi design.md lama (Flip7). Semua keputusan di sini konkret dan bisa diuji. Kalau ada kata sifat tanpa angka, anggap itu belum selesai.

## 0. Prinsip

1. **Terasa seperti institusi, bukan aplikasi.** Referensi: katalog perpustakaan nasional, situs universitas, portal bank. Tenang, rapat, jelas. Bukan dashboard SaaS.
2. **Satu warna brand, satu aksen.** Warna lain hanya untuk status.
3. **Struktur dari garis dan tipografi, bukan dari bayangan dan kartu.** Hairline rule, ukuran huruf, dan jarak yang membentuk hierarki.
4. **Setiap elemen dekoratif harus punya fungsi perpustakaan.** Nomor panggil, slip tanggal kembali, kode klasifikasi. Tidak ada ilustrasi pengisi.
5. **Data asli atau tidak ditampilkan.** Tidak ada angka, foto, atau kontak placeholder di produksi.

## 1. Warna

Warna brand di bawah adalah **asumsi awal** (biru tinta tua + kuningan). Ganti `primary` dan `accent` dengan warna dari logo/seragam SMPN 17 begitu logo asli tersedia, lalu cek ulang kontras.

```css
@theme {
  /* Permukaan */
  --color-paper: #F7F6F2;          /* latar halaman */
  --color-surface: #FFFFFF;        /* panel, tabel, input */
  --color-surface-sunken: #EFEDE7; /* header tabel, area cekung */

  /* Tinta */
  --color-ink: #161B26;            /* teks utama */
  --color-ink-muted: #4A5160;      /* teks sekunder */
  --color-ink-subtle: #666C7A;     /* caption, placeholder (cek >= 4.5:1 di atas paper) */

  /* Garis */
  --color-rule: #DAD7CE;
  --color-rule-strong: #B9B5A8;

  /* Brand */
  --color-primary: #1B2F5B;        /* tombol utama, link, fokus */
  --color-primary-hover: #13234A;
  --color-primary-soft: #E6EAF3;   /* item nav aktif, baris terpilih */

  /* Aksen: HANYA untuk stempel, garis ganda header, ornamen kartu anggota */
  --color-accent: #B8892B;         /* dekoratif, jangan dipakai sebagai teks */
  --color-accent-ink: #7A5A12;     /* versi teks */

  /* Status (teks / latar / garis) */
  --color-success: #1E6B45;  --color-success-bg: #E8F2EC;  --color-success-line: #B7D6C4;
  --color-warning: #8A5300;  --color-warning-bg: #FBF1DC;  --color-warning-line: #E8CF97;
  --color-danger:  #A12B2B;  --color-danger-bg:  #FBEAEA;  --color-danger-line:  #E8B9B9;
  --color-info:    #1B2F5B;  --color-info-bg:    #E6EAF3;  --color-info-line:    #BCC6DE;
}
```

Aturan pakai:
- Teks status selalu memakai token tua (`--color-success`, dst.), bukan shade terang.
- Status tidak boleh hanya dibedakan dengan warna. Selalu ada label teks, dan ikon kecil untuk Terlambat.
- Semua pasangan teks/latar harus lolos WCAG AA (4.5:1 teks normal, 3:1 teks besar dan ikon). Verifikasi dengan alat kontras sebelum merge, jangan percaya angka di dokumen ini.

## 2. Tipografi

| Peran | Font | Dipakai untuk |
|---|---|---|
| Judul | **Newsreader** (600) | H1, H2, judul buku, nama di kartu anggota |
| UI | **IBM Plex Sans** (400/500/600) | Semua teks antarmuka, tabel, form, tombol |
| Kode | **IBM Plex Mono** (400/500) | NIS, kode eksemplar, nomor panggil, ID transaksi |

Muat lewat `next/font/google` dengan `display: "swap"` dan subset `latin`. Jangan pakai Inter, Geist, atau Poppins.

Skala:

| Token | Ukuran / tinggi baris | Font & berat | Catatan |
|---|---|---|---|
| `display` | 40/48 (mobile 32/40) | Newsreader 600 | hanya login dan beranda siswa |
| `h1` | 28/36 | Newsreader 600 | judul halaman |
| `h2` | 20/28 | Newsreader 600 | judul seksi |
| `h3` | 16/24 | Plex Sans 600 | judul panel |
| `body` | 15/24 (admin 14/20) | Plex Sans 400 | teks isi |
| `label` | 12/16, uppercase, tracking 0.06em | Plex Sans 600 | label field, header tabel |
| `caption` | 12/16 | Plex Sans 400 | keterangan |
| `code` | 13/20 | Plex Mono 500 | NIS, kode buku |

Aturan: angka di tabel dan KPI memakai `font-variant-numeric: tabular-nums`. Panjang baris teks bacaan maksimal 68 karakter.

## 3. Bentuk, jarak, elevasi

- **Radius:** `2px` untuk badge/chip, `4px` untuk tombol dan input, `6px` untuk panel dan modal. Tidak ada `rounded-full` kecuali avatar bulat.
- **Elevasi:** tidak ada bayangan di komponen biasa. Panel = latar putih + border 1px `--color-rule`. Satu-satunya bayangan: modal dan dropdown (`0 8px 24px rgb(22 27 38 / 0.12)`).
- **Jarak:** kelipatan 4px. Padding panel 20px (admin 16px). Gap antarseksi 32px.
- **Garis ganda header:** judul halaman diberi garis ganda tipis di bawahnya (1px `--color-ink` + 3px jarak + 1px `--color-rule-strong`). Ini satu-satunya "gaya editorial", dipakai konsisten, bukan di semua tempat.
- **Fokus:** `outline: 2px solid var(--color-primary); outline-offset: 2px;` pada semua elemen interaktif. Dilarang `outline-none` tanpa pengganti.
- **Target sentuh:** minimal 44×44px untuk siswa (mobile), 36px tinggi untuk admin desktop.
- **Animasi:** hanya transisi warna/opasitas 120ms. Tidak ada scale, bounce, atau counter berputar. Hormati `prefers-reduced-motion`.

## 4. Motif khas perpustakaan

Tiga motif saja. Selain ini, tidak ada ornamen.

### 4.1 Slip Tanggal Kembali
Daftar pinjaman siswa ditampilkan seperti slip tanggal di sampul belakang buku: baris tanggal bergaris, tanggal jatuh tempo ditulis dengan Plex Mono, dan yang sudah dikembalikan diberi tanda "KEMBALI" bergaya stempel (border 1.5px `--color-accent-ink`, huruf kapital, rotasi -3°, hanya di struk dan detail transaksi).

### 4.2 Nomor Panggil
Setiap buku menampilkan nomor panggil dalam kotak kecil bergaris (Plex Mono), contoh:
```
 813
 PRA
 b
```
Dewey (3 digit), 3 huruf pertama pengarang, huruf pertama judul. Muncul di kartu buku, tabel admin, dan struk.

### 4.3 Sampul Cadangan per Kelas Dewey
Buku tanpa gambar sampul mendapat sampul tipografis: warna latar sesuai kelas Dewey, judul Newsreader putih, nama pengarang kecil di bawah, garis aksen tipis di punggung kiri (bukan border 6px). Rasio 2:3.

| Kelas | Bidang | Warna |
|---|---|---|
| 000 | Umum | `#5B6770` |
| 100 | Filsafat & Psikologi | `#6B4E7A` |
| 200 | Agama | `#7A5A12` |
| 300 | Ilmu Sosial | `#2F6F73` |
| 400 | Bahasa | `#A5502F` |
| 500 | Sains & Matematika | `#2E6B4A` |
| 600 | Teknologi | `#3B5B8C` |
| 700 | Seni & Olahraga | `#9A3F5A` |
| 800 | Sastra | `#7A4B2A` |
| 900 | Sejarah & Geografi | `#4E5D2E` |

Teks putih di atas semua warna ini harus dicek kontrasnya.

## 5. Komponen

**Tombol** (tinggi 40px, admin 36px, radius 4px, Plex Sans 500 14px)
- `primary`: latar `--color-primary`, teks putih, hover `--color-primary-hover`.
- `secondary`: latar putih, border `--color-rule-strong`, teks `--color-ink`.
- `ghost`: transparan, hover `--color-surface-sunken`.
- `danger`: latar `--color-danger`, teks putih, hanya untuk aksi destruktif.
- Disabled: opasitas 50% + `cursor-not-allowed`. Tidak ada varian `gold`.

**Input / Select / Textarea**
- Latar putih, border 1px `--color-rule-strong`, radius 4px, tinggi 40px.
- Label di atas field (label 12px uppercase), teks bantuan di bawah (caption), error di bawah dengan ikon + teks `--color-danger` dan `aria-describedby`.
- Fokus: border `--color-primary` + ring 2px sesuai aturan fokus global.

**Status chip** (tinggi 22px, radius 2px, padding 0 8px, 12px/600, ikon 12px opsional)
- Tersedia: success. Dipinjam: info. Jatuh tempo ≤ 2 hari: warning. Terlambat: danger + ikon. Rusak/Hilang: danger.

**Tabel data**
- Header: latar `--color-surface-sunken`, label 12px uppercase, sticky.
- Baris: tinggi 44px (padat: 36px), garis bawah 1px `--color-rule`, tanpa zebra, hover `--color-primary-soft`.
- Angka rata kanan, kode memakai Plex Mono.
- Mobile: tabel berubah menjadi daftar baris bertumpuk (nama + status di atas, metadata di bawah). Tidak ada scroll horizontal untuk data penting.

**Navigasi admin (sidebar)**
- Lebar 248px, latar putih, border kanan 1px. Logo sekolah + "Perpustakaan SMPN 17" di atas.
- Item aktif: latar `--color-primary-soft`, teks `--color-primary`, batang kiri 2px. Bukan pill.
- Grup: Sirkulasi, Koleksi, Anggota, Laporan, Pengaturan.

**Navigasi siswa (mobile)**
- Bottom bar 4 item: Beranda, Katalog, Pinjaman, Kartu. Ikon 24px + label 12px selalu terlihat. Latar putih solid, border atas 1px. Tanpa blur.

**Metrik (pengganti KPI card)**
- Tanpa kartu berwarna. Angka (Plex Sans 600 28px tabular) + label 12px uppercase + satu baris keterangan. Dipisahkan garis vertikal 1px dalam satu panel, bukan empat kotak terpisah.

## 6. Layar contoh A: Login

Dua kolom di desktop (kiri 5/12 informasi, kanan 7/12 form), satu kolom di mobile (form dulu).

```
┌───────────────────────────────┬─────────────────────────────────────┐
│ [Logo]  PERPUSTAKAAN          │                                     │
│  SMP NEGERI 17                │   Masuk                             │
│  TANGERANG SELATAN            │   ═══════════════                   │
│ ───────────────────────────── │   Gunakan NIS atau nama pengguna    │
│                               │   yang terdaftar di perpustakaan.   │
│ Layanan                       │                                     │
│  • Pinjam & kembali via QR    │   NIS / NAMA PENGGUNA               │
│  • Katalog koleksi            │   [____________________________]    │
│  • Kartu anggota digital      │   KATA SANDI                        │
│                               │   [____________________] [Lihat]    │
│ Jam layanan                   │                                     │
│  Sen–Jum  07.00–15.00         │   [          Masuk          ]       │
│  (isi sesuai jadwal asli)     │   Lupa kata sandi? Hubungi petugas  │
│                               │   perpustakaan.                     │
│ ───────────────────────────── │                                     │
│ Alamat · Kontak · Tahun       │                                     │
└───────────────────────────────┴─────────────────────────────────────┘
```

- Panel kiri: latar `--color-primary`, teks putih, logo asli. Tanpa rak buku CSS, tanpa slogan. Isinya fakta layanan.
- Panel kanan: latar `--color-paper`, form dalam panel putih bergaris maksimal 400px.
- Judul "Masuk" memakai `h1` Newsreader + garis ganda.
- Pesan error login spesifik: "NIS atau kata sandi tidak cocok. Periksa kembali, atau hubungi petugas perpustakaan."

## 7. Layar contoh B: Beranda Siswa (mobile, 390px)

```
Selamat siang, Rina                    ← Newsreader 28
Kelas 8B · NIS 2024012                 ← caption + mono
═══════════════════════════════════
[ 🔍 Cari judul, pengarang, atau topik ]

SEDANG DIPINJAM (2)                    ← label
┌─────────────────────────────────┐
│ [cover] Laskar Pelangi           │
│         Andrea Hirata  [813|HIR|l]│
│  Kembali: Jum, 17 Okt 2026       │  ← mono
│  ● Sisa 5 hari                   │  ← info chip
├─────────────────────────────────┤
│ [cover] Bumi Manusia             │
│  Kembali: Rab, 15 Okt 2026       │
│  ▲ Sisa 3 hari                   │  ← warning chip
└─────────────────────────────────┘

[ Tampilkan Kartu Anggota ]          ← tombol primary penuh
═══════════════════════════════════
 Beranda   Katalog   Pinjaman   Kartu
```

Aturan: jatuh tempo lebih dari 2 hari = info (biru tenang), ≤ 2 hari = warning, lewat = danger. Tidak ada merah sebelum benar-benar terlambat.

## 8. Kartu anggota & struk

- **Kartu:** rasio CR80 (85,6 × 54 mm). Kop "Perpustakaan SMP Negeri 17 Tangerang Selatan" (Newsreader), garis aksen `--color-accent` 2px di bawah kop, foto 3×4 kiri, nama (Newsreader), NIS dan kelas (mono), QR kanan dengan quiet zone minimal 4 modul (putih penuh), kontras QR hitam di atas putih. Nomor anggota mono di bawah QR.
- **Struk transaksi:** lebar 80 mm, Plex Mono, header institusi, daftar buku + nomor panggil + tanggal kembali, stempel KEMBALI untuk pengembalian, ID transaksi.
- Keduanya punya `@media print` sendiri: tanpa sidebar, tanpa warna latar, ukuran fisik tepat.

## 9. Meja sirkulasi (admin)

- Dua langkah tetap terlihat bersamaan: **1 Anggota** → **2 Buku**. Langkah aktif diberi batang kiri 2px, langkah selesai ditandai ikon centang + ringkasan.
- Viewfinder kamera: bingkai sudut tipis (corner brackets) 2px putih di atas video, tanpa animasi garis scan. Tinggi minimal 320px di desktop.
- Keyboard-first: `/` fokus ke kolom pencarian, `Enter` konfirmasi, `Esc` batal, `Ctrl+P` cetak struk. Input scanner USB (keyboard wedge) diterima otomatis di kolom aktif. Daftar pintasan ditampilkan di kaki halaman.
- Hasil scan: umpan balik teks + warna + (opsional) bunyi pendek, tidak hanya warna.

## 10. Microcopy

| Konteks | Salah (gaya AI) | Benar |
|---|---|---|
| Kosong | "Oops! Belum ada buku 📚" | "Belum ada pinjaman aktif." + tautan "Telusuri katalog" |
| Berhasil | "Yeay, berhasil!" | "Peminjaman dicatat. Kembali paling lambat 17 Okt 2026." |
| Error | "Terjadi kesalahan." | "Kode buku tidak ditemukan. Periksa label pada buku, lalu coba lagi." |
| Tombol | "Mulai Petualangan" | "Pinjam buku", "Kembalikan buku", "Lihat kartu anggota" |
| Feed | "Human Activity Feed" | "Log Sirkulasi" |

Aturan: kalimat aktif, tanpa tanda seru, tanpa emoji di UI, tanggal format "Jum, 17 Okt 2026", istilah konsisten (pinjam / kembali / jatuh tempo / terlambat).

## 11. Keadaan yang wajib dirancang

Untuk setiap daftar dan form: **loading** (skeleton garis, bukan spinner penuh layar), **kosong**, **error** (dengan tombol coba lagi), **offline** (banner tipis), dan **tanpa hak akses**. Satu komponen `EmptyState` dan satu `ErrorState` dipakai bersama.

## 12. Urutan implementasi

1. **Prototipe satu layar:** Login (§6) dengan font, warna, dan motif final. Review di desktop dan HP asli. Jika belum terasa berkarakter, perbaiki di sini dulu.
2. Token di `globals.css` (§1–3) + muat font + hapus semua sisa Flip7.
3. Primitif: Button, Field, StatusChip, DataTable, EmptyState/ErrorState.
4. AppShell admin dan navigasi siswa.
5. Beranda siswa (§7), katalog + kartu buku (§4), kartu anggota (§8).
6. Dashboard admin dan meja sirkulasi (§9).
7. Print stylesheet, microcopy pass, audit kontras.

## 13. Verifikasi

Otomatis: `npx tsc --noEmit`, `npm run lint`, `npm run build`, plus axe/Lighthouse accessibility ≥ 95 di login, beranda siswa, katalog, dan meja sirkulasi.

Manual:
- Cek kontras semua pasangan warna di §1 dan §4.3 dengan alat kontras.
- Navigasi penuh dengan keyboard (Tab/Shift+Tab/Enter/Esc) di semua alur sirkulasi.
- Screenshot sebelum/sesudah di 390px, 768px, 1440px untuk setiap layar yang diubah.
- Uji pindai QR kartu anggota dari layar HP dengan scanner meja sirkulasi, dan hasil cetak kartu pada kertas.
- Cari sisa kelas terlarang: `grep -rE "rounded-full|border-l-\[6px\]|glow|bg-cream|teal|coral|outline-none" src/`.

## 14. Yang dibutuhkan dari pihak sekolah

Logo resmi (SVG/PNG resolusi tinggi) dan warnanya, nama resmi unit perpustakaan, alamat, kontak, jam layanan, aturan masa pinjam dan denda, serta foto asli perpustakaan jika ingin dipakai. Tanpa ini, bagian terkait tetap dikosongkan atau disembunyikan, bukan diisi placeholder.
