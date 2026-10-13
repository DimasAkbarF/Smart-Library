# Architecture Decision Records (ADRs)

Dokumen ini mencatat keputusan-keputusan arsitektural penting (*Architecture Decision Records*) yang diambil dalam pengembangan sistem **Smart Library SMP Negeri 17 Tangerang Selatan**.

ADR mendokumentasikan konteks masalah, alasan pemilihan solusi (*why*), alternatif yang dipertimbangkan, serta konsekuensi teknis dari setiap keputusan arsitektur.

---

## Indeks Keputusan Arsitektur

| Nomor | Judul Keputusan | Status | Tanggal | Ringkasan Dampak |
|---|---|---|---|---|
| [ADR-001](./ADR-001-centralized-staff-auth-and-removal-of-turnstile.md) | **Sentralisasi Autentikasi Staf & Penghapusan Cloudflare Turnstile** | `Accepted` | 2026-10-14 | Menghapus Turnstile, memusatkan portal masuk di `/login`, dan mengandalkan dual-key rate limiting serta anti-timing defense. |
| [ADR-002](./ADR-002-session-continuity-and-cookie-transport.md) | **Kontinuitas Sesi & Manajemen Cookie dengan Supabase SSR** | `Accepted` | 2026-10-14 | Mengatasi pemutusan sesi otomatis, mengeliminasi bug reset password saat login, dan menerapkan deteksi skema HTTPS/HTTP dinamis. |
| [ADR-003](./ADR-003-tokenized-digital-student-cards.md) | **Kartu Perpustakaan Digital Siswa Berbasis Token Acak** | `Accepted` | 2026-10-14 | Menggantikan akun login siswa dengan token kriptografis `/card/[token]` untuk kemudahan akses dan pencegahan IDOR. |
| [ADR-004](./ADR-004-atomic-circulation-via-postgresql-rpc.md) | **Transaksi Sirkulasi Atomik via PostgreSQL RPC** | `Accepted` | 2026-10-14 | Mengisolasi peminjaman dan pengembalian buku dalam stored procedure untuk mencegah *double-borrowing* dan *race condition*. |

---

## Format & Siklus Hidup ADR

Setiap ADR menggunakan format:
1. **Title & Number:** Urutan sekuensial `ADR-XXX: Judul`
2. **Status:** `Proposed` | `Accepted` | `Superseded by ADR-XXX` | `Deprecated`
3. **Date:** Tanggal persetujuan (YYYY-MM-DD)
4. **Context:** Latar belakang masalah, batasan, dan kebutuhan sistem
5. **Decision:** Solusi teknis spesifik yang disepakati
6. **Alternatives Considered:** Opsi lain yang dievaluasi beserta alasan penolakannya
7. **Consequences:** Keuntungan dan kompensasi/mitigasi teknis yang dihasilkan

> **Catatan Pengembang & Agen AI:**  
> Jangan menghapus ADR lama saat sebuah keputusan arsitektur diperbarui. Buat ADR baru dengan nomor berikutnya dan beri catatan `Superseded by ADR-XXX` pada ADR lama guna menjaga rekam jejak evolusi arsitektur sistem.
