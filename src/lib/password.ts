/**
 * Kebijakan kata sandi Smart Library SMPN 17 Tangsel.
 *
 * CATATAN: file ini SENGAJA tanpa import apa pun agar bisa diuji langsung oleh
 * `scripts/test-password-policy.mjs` (Node 24 type-stripping) tanpa tooling tambahan.
 */

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
 * Kebijakan tunggal (sumber kebenaran untuk server, UI, dan test).
 *
 * minClasses = 3 (bukan 4): 3 kata sandi acak yang panjang sudah memenuhi
 * "huruf besar + huruf kecil + angka" tanpa perlu simbol, sehingga tidak
 * memaksa staff sekolah memakai pola yang unicodable di keyboard sekolah.
 */
export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  minClasses: 3,
} as const;

export const PASSWORD_SYMBOLS = "!@#$%^&*()-_=+[]{}<>?,.;:'\"\\|/~`";

const RE_UPPER = /[A-Z]/;
const RE_LOWER = /[a-z]/;
const RE_DIGIT = /[0-9]/;
const RE_SYMBOL = /[!@#$%^&*()\-_=+[\]{}<>?,.;:'"\\|/~`]/;

export function countCharacterClasses(password: string): number {
  let n = 0;
  if (RE_UPPER.test(password)) n++;
  if (RE_LOWER.test(password)) n++;
  if (RE_DIGIT.test(password)) n++;
  if (RE_SYMBOL.test(password)) n++;
  return n;
}

export interface PasswordContext {
  username?: string;
  nis?: string;
  email?: string;
  fullName?: string;
}

function matchesIdentifier(password: string, context?: PasswordContext): boolean {
  if (!context) return false;
  const lower = password.toLowerCase().trim();
  if (context.username && lower.includes(context.username.toLowerCase().trim())) return true;
  if (context.nis && lower.includes(context.nis.toLowerCase().trim())) return true;
  if (context.email && lower.includes(context.email.toLowerCase().trim())) return true;
  return false;
}

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string, context?: PasswordContext) => boolean;
}

/** Aturan yang ditampilkan sebagai daftar centang di UI (client & server). */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `Minimal ${PASSWORD_POLICY.minLength} karakter`,
    test: (p) => p.length >= PASSWORD_POLICY.minLength,
  },
  { id: "upper", label: "Mengandung huruf besar (A-Z)", test: (p) => RE_UPPER.test(p) },
  { id: "lower", label: "Mengandung huruf kecil (a-z)", test: (p) => RE_LOWER.test(p) },
  { id: "digit", label: "Mengandung angka (0-9)", test: (p) => RE_DIGIT.test(p) },
  {
    id: "symbol",
    label: "Mengandung simbol (mis. ! @ # $ % &)",
    test: (p) => RE_SYMBOL.test(p),
  },
  {
    id: "classes",
    label: `Memiliki minimal ${PASSWORD_POLICY.minClasses} dari 4 jenis karakter`,
    test: (p) => countCharacterClasses(p) >= PASSWORD_POLICY.minClasses,
  },
  {
    id: "common",
    label: "Bukan kata sandi umum atau bawaan",
    test: (p) => !COMMON_PASSWORDS.has(p.toLowerCase().trim()) && !isDefaultPassword(p, ""),
  },
  {
    id: "identifier",
    label: "Tidak sama dengan username, NIS, atau email",
    test: (p, ctx) => !matchesIdentifier(p, ctx),
  },
];

export type PasswordStrengthLevel = "lemah" | "sedang" | "kuat" | "sangat kuat";

export interface PasswordStrength {
  /** 0..4 */
  score: number;
  level: PasswordStrengthLevel;
  satisfied: { id: string; label: string; ok: boolean }[];
}

/**
 * Indikator kekuatan 4 level. Dihitung dari kelas karakter + panjang.
 * Ini murni presentasi: server tetap menjadi sumber kebenaran.
 */
export function checkPasswordStrength(
  password: string,
  context?: PasswordContext,
): PasswordStrength {
  const satisfied = PASSWORD_RULES.map((r) => ({
    id: r.id,
    label: r.label,
    ok: r.test(password, context),
  }));

  const classes = countCharacterClasses(password);
  let score = 0;
  if (classes >= 3) score++;
  if (password.length >= PASSWORD_POLICY.minLength) score++;
  if (classes === 4) score++;
  if (password.length >= 16) score++;
  score = Math.min(4, score);

  const level: PasswordStrengthLevel =
    score <= 1 ? "lemah" : score === 2 ? "sedang" : score === 3 ? "kuat" : "sangat kuat";

  return { score, level, satisfied };
}

/**
 * Validasi kekuatan kata sandi (server = sumber kebenaran).
 * - Minimal PASSWORD_POLICY.minLength karakter
 * - Minimal PASSWORD_POLICY.minClasses jenis karakter
 * - Bukan kata sandi umum / bawaan
 * - Tidak boleh sama persis dengan identifier (NIS / username / email)
 */
export function validatePassword(
  password: string,
  context?: PasswordContext,
): PasswordValidationResult {
  if (!password || password.length < PASSWORD_POLICY.minLength) {
    return {
      valid: false,
      message: `Kata sandi minimal ${PASSWORD_POLICY.minLength} karakter.`,
    };
  }

  if (password.length > PASSWORD_POLICY.maxLength) {
    return {
      valid: false,
      message: `Kata sandi maksimal ${PASSWORD_POLICY.maxLength} karakter.`,
    };
  }

  const classes = countCharacterClasses(password);
  if (classes < PASSWORD_POLICY.minClasses) {
    return {
      valid: false,
      message: `Kata sandi harus memiliki minimal ${PASSWORD_POLICY.minClasses} jenis karakter dari: huruf besar, huruf kecil, angka, dan simbol.`,
    };
  }

  const lower = password.toLowerCase().trim();

  if (COMMON_PASSWORDS.has(lower)) {
    return {
      valid: false,
      message: "Kata sandi terlalu mudah ditebak. Gunakan kombinasi huruf, angka, atau simbol.",
    };
  }

  if (matchesIdentifier(password, context)) {
    return {
      valid: false,
      message: "Kata sandi tidak boleh sama dengan username, NIS, atau email.",
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
