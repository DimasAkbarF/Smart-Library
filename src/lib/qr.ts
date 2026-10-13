import { randomBytes } from "node:crypto";

/**
 * Menghasilkan token QR resmi siswa yang acak dan aman (kriptografis).
 * Menghilangkan penggunaan NIS mentah atau format tertebak seperti SIS-2024001
 * sehingga tidak bisa dipalsukan atau ditebak oleh pihak lain.
 */
export function generateStudentQrToken(): string {
  // 10 bytes hex = 20 karakter hex (80 bit entropi kriptografis)
  return `STU-${randomBytes(10).toString("hex").toUpperCase()}`;
}

/**
 * Memvalidasi apakah token sesuai format token QR baru yang aman
 */
export function isSecureStudentQrToken(token: string): boolean {
  return /^STU-[A-F0-9]{16,32}$/.test(token.trim());
}
