const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password123",
  "admin123",
  "siswa123",
  "perpustakaan",
  "smpn17tangsel",
  "smpn17",
  "tangsel17",
  "semangat",
  "bismillah",
  "indonesia",
  "rahasia",
  "qwerty123",
  "pass1234",
  "11223344",
  "00000000",
]);

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validasi kekuatan kata sandi:
 * - Minimal 8 karakter
 * - Bukan kata sandi umum
 * - Tidak boleh sama persis dengan identifier (NIS / username / email)
 */
export function validatePassword(
  password: string,
  context?: { username?: string; nis?: string; email?: string; fullName?: string },
): PasswordValidationResult {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: "Kata sandi minimal 8 karakter.",
    };
  }

  const lower = password.toLowerCase().trim();

  if (COMMON_PASSWORDS.has(lower)) {
    return {
      valid: false,
      message: "Kata sandi terlalu mudah ditebak. Gunakan kombinasi huruf, angka, atau simbol.",
    };
  }

  if (context?.username && lower === context.username.toLowerCase()) {
    return {
      valid: false,
      message: "Kata sandi tidak boleh sama dengan username.",
    };
  }

  if (context?.nis && lower === context.nis.toLowerCase()) {
    return {
      valid: false,
      message: "Kata sandi tidak boleh sama dengan NIS.",
    };
  }

  if (context?.email && lower === context.email.toLowerCase()) {
    return {
      valid: false,
      message: "Kata sandi tidak boleh sama dengan email.",
    };
  }

  return { valid: true };
}

/**
 * Mendeteksi apakah kata sandi yang digunakan merupakan kata sandi bawaan (default).
 */
export function isDefaultPassword(
  password: string,
  identifier: string,
): boolean {
  const p = password.toLowerCase().trim();
  const id = identifier.toLowerCase().trim();
  return (
    p === id ||
    p === "siswa123" ||
    p === "admin123" ||
    p === "12345678" ||
    p.startsWith("siswa") ||
    COMMON_PASSWORDS.has(p)
  );
}
