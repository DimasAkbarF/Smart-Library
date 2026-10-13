# ADR-003: Kartu Perpustakaan Digital Siswa Berbasis Token Acak Tanpa Autentikasi Akun

## Status
Accepted

## Date
2026-10-14

## Context
Perpustakaan SMPN 17 Tangerang Selatan membutuhkan cara bagi ratusan siswa untuk mengakses kartu anggota perpustakaan digital dan QR Code peminjaman secara mudah melalui smartphone masing-masing.

Pendekatan umum biasanya adalah membuatkan akun individual (username/NISN + password) bagi setiap siswa. Namun, pendekatan ini memiliki tantangan berat di lingkungan sekolah menengah pertama:
1. **Beban Administratif:** Siswa sering lupa kata sandi, memerlukan reset berkala dari petugas perpustakaan.
2. **Friksi Akses:** Memerlukan proses login setiap kali siswa ingin meminjam buku di meja sirkulasi, memperlambat antrean peminjaman.
3. **Risiko Keamanan Data Anak:** Menyimpan kredensial login massal untuk ratusan siswa di bawah umur meningkatkan risiko kompromi akun dan peminjaman atas nama orang lain.

## Decision
1. **Akses Berbasis Token Kriptografis Unik (`card_token`):**
   - Setiap siswa diterbitkan sebuah token acak berentropi tinggi saat pendaftaran anggota, dengan format `STU-[A-F0-9]{20}` (contoh: `STU-7F9C2BF4FC1E38E6796D`).
   - Kartu digital dapat diakses secara publik dan instan melalui URL: `/card/[token]`.
2. **Pencegahan IDOR (Insecure Direct Object Reference) & Scraping:**
   - Parameter URL kartu sama sekali tidak menggunakan ID numerik sekuensial (misalnya `/card/123`) atau NISN siswa.
   - Panjang dan keacakan token menjadikannya mustahil untuk ditebak melalui serangan enumerasi (*brute-force*).
   - Jika token tidak ditemukan di database, sistem menampilkan pesan netral kartu tidak terdaftar tanpa membocorkan struktur data sekolah.
3. **Penghapusan Rute Login Siswa:**
   - Rute lama `/student/*` dialihkan ke katalog buku publik `/books`.
   - Siswa tidak memiliki sesi login, mengurangi total permukaan serangan (*attack surface*) otentikasi aplikasi.

## Alternatives Considered

### Opsi A: Akun Siswa dengan Login NISN dan Kata Sandi Tanggal Lahir
- **Kelebihan:** Standar umum portal akademik.
- **Kekurangan:** Format tanggal lahir sangat mudah ditebak oleh sesama teman sekelas, memicu risiko peminjaman fiktif atau pencurian identitas sirkulasi.
- **Alasan Ditolak:** Risiko privasi dan keamanan tinggi bagi siswa.

### Opsi B: Kartu Fisik Plastik RFID / Barcode Tanpa Web Portal
- **Kelebihan:** Tidak memerlukan akses internet siswa.
- **Kekurangan:** Biaya cetak tinggi, kartu sering tertinggal atau hilang, penggantian kartu fisik membebani anggaran sekolah.
- **Alasan Ditolak:** Kartu digital berbasis token web jauh lebih efisien, dapat disimpan di tangkapan layar smartphone siswa, dan hemat biaya.

## Consequences
- **Positif:**
  - Siswa dapat membuka kartu anggota dan memperlihatkan QR Code ke petugas sirkulasi dalam hitungan detik tanpa hambatan login.
  - Zero tiket komplain *"lupa kata sandi"* ke petugas perpustakaan.
  - Aman dari serangan scraping dan IDOR.
- **Negatif / Mitigasi:**
  - Siapa pun yang memiliki tautan token dapat melihat nama, kelas, dan QR kartu siswa tersebut. Dimitigasi dengan menjaga kerahasiaan tautan kartu oleh siswa (seperti halnya kartu fisik), serta membatasi data yang ditampilkan hanya pada identitas dasar perpustakaan tanpa data pribadi sensitif (seperti NIK, alamat rumah, atau nomor telepon).
