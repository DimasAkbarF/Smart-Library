interface RateLimitEntry {
  count: number;
  resetAt: number;
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
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Memeriksa apakah permintaan melampaui ambang batas rate limit.
 * Mengembalikan allowed: false jika limit terlampaui.
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  purgeExpired();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    return {
      allowed: true,
      remaining: maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  if (entry.count >= maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfter),
    };
  }

  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Mencatat percobaan gagal untuk kunci tertentu.
 */
export function recordFailedAttempt(
  key: string,
  windowMs: number = 15 * 60 * 1000,
): number {
  purgeExpired();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }

  entry.count += 1;
  return entry.count;
}

/**
 * Menghapus catatan percobaan saat login berhasil.
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}
