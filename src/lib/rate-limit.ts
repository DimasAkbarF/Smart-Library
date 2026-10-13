interface RateLimitEntry {
  count: number;
  firstFailedAt: number;
  lockedUntil: number;
  backoffLevel: number;
}

const store = new Map<string, RateLimitEntry>();

// Pembersihan berkala memori setiap 5 menit
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (now > entry.lockedUntil && now > entry.firstFailedAt + 2 * 60 * 60 * 1000) {
      store.delete(key);
    }
  }
}

/**
 * Menghitung durasi lockout dengan backoff progresif:
 * - Percobaan ke-5: 15 menit (15 * 60 detik)
 * - Percobaan ke-6: 30 menit (30 * 60 detik)
 * - Percobaan ke-7+: 60 menit (60 * 60 detik)
 */
function calculateLockoutMs(level: number): number {
  if (level <= 1) return 15 * 60 * 1000; // 15 menit
  if (level === 2) return 30 * 60 * 1000; // 30 menit
  return 60 * 60 * 1000; // 60 menit
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Memeriksa apakah kunci tertentu (IP atau identifier) sedang dalam status terkunci.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
): RateLimitCheckResult {
  purgeExpired();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    return {
      allowed: true,
      remaining: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  // Jika sedang dalam masa lockout
  if (now < entry.lockedUntil) {
    const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfter),
    };
  }

  // Jika lockout sudah lewat lebih dari 1 jam sejak kegagalan pertama tanpa gagal baru, reset
  if (now > entry.firstFailedAt + 60 * 60 * 1000 && now >= entry.lockedUntil) {
    store.delete(key);
    return {
      allowed: true,
      remaining: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  const remaining = Math.max(0, maxAttempts - entry.count);
  return {
    allowed: remaining > 0,
    remaining,
    retryAfterSeconds: 0,
  };
}

/**
 * Mencatat percobaan gagal dan mengaktifkan backoff progresif saat menyentuh batas maksimum.
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts: number = 5,
): { count: number; lockedUntil: number; retryAfterSeconds: number } {
  purgeExpired();
  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = {
      count: 1,
      firstFailedAt: now,
      lockedUntil: 0,
      backoffLevel: 0,
    };
    store.set(key, entry);
    return { count: 1, lockedUntil: 0, retryAfterSeconds: 0 };
  }

  entry.count += 1;

  if (entry.count >= maxAttempts) {
    entry.backoffLevel += 1;
    const lockoutMs = calculateLockoutMs(entry.backoffLevel);
    entry.lockedUntil = now + lockoutMs;
    const retryAfter = Math.ceil(lockoutMs / 1000);
    return { count: entry.count, lockedUntil: entry.lockedUntil, retryAfterSeconds: retryAfter };
  }

  return { count: entry.count, lockedUntil: entry.lockedUntil, retryAfterSeconds: 0 };
}

/**
 * Menghapus catatan percobaan saat login berhasil.
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}
