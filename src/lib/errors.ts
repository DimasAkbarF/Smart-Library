/**
 * Mapping kode error mesin (dari RPC / validasi) ke kalimat ramah
 * Bahasa Indonesia. FE tidak pernah menampilkan kode mentah (PRD §8.5).
 */
const PESAN: Record<string, string> = {
  STUDENT_NOT_FOUND: "Data siswa tidak ditemukan. Coba scan ulang atau cari NIS secara manual.",
  STUDENT_INACTIVE: "Akun siswa ini sedang tidak aktif. Hubungi admin data.",
  COPY_NOT_FOUND: "Kode buku tidak terdaftar. Periksa kembali kode atau QR-nya.",
  COPY_NOT_AVAILABLE: "Buku ini sedang tidak tersedia. Pilih eksemplar lain yang berstatus Tersedia.",
  COPY_ALREADY_BORROWED: "Buku ini baru saja dipinjam. Muat ulang dan pilih buku lain.",
  LOAN_LIMIT_REACHED: "Siswa sudah mencapai batas jumlah peminjaman. Kembalikan dulu buku yang masih dipinjam.",
  ACTIVE_LOAN_NOT_FOUND: "Tidak ada peminjaman aktif untuk buku ini. Mungkin buku sudah dikembalikan.",
  QR_INVALID: "QR tidak dikenali. Pastikan kode terlihat jelas, atau masukkan kode secara manual.",
  QR_UNKNOWN: "QR tidak dikenali. Pastikan kode terlihat jelas, atau masukkan kode secara manual.",
  FORBIDDEN: "Anda tidak memiliki akses untuk tindakan ini.",
  UNAUTHENTICATED: "Sesi berakhir. Silakan masuk kembali.",
};

export function pesanRamah(kode: string | null | undefined, fallback?: string): string {
  if (!kode) return fallback ?? "Terjadi kesalahan. Data belum berubah, silakan coba lagi.";
  return PESAN[kode] ?? fallback ?? "Terjadi kesalahan. Data belum berubah, silakan coba lagi.";
}

/** Ambil kode error dari pesan exception Postgres / Supabase. */
export function kodeDariError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e ?? "");
  const m = msg.match(
    /(STUDENT_NOT_FOUND|STUDENT_INACTIVE|COPY_NOT_FOUND|COPY_NOT_AVAILABLE|COPY_ALREADY_BORROWED|LOAN_LIMIT_REACHED|ACTIVE_LOAN_NOT_FOUND|QR_INVALID|QR_UNKNOWN|FORBIDDEN|UNAUTHENTICATED)/,
  );
  return m?.[1] ?? "";
}
