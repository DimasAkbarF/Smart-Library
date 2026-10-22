import { serviceClient } from "@/lib/supabase/service";
import { supabaseConfigured } from "@/lib/supabase/env";

interface RateLimitEntry {
  count: number;
  firstFailedAt: number;
  lockedUntil: number;
  backoffLevel: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Pembersihan berkala memori setiap 5 menit
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.lockedUntil && now > entry.firstFailedAt + 2 * 60 * 60 * 1000) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Menghitung durasi lockout dengan backoff progresif:
 * - Percobaan ke-5: 15 menit
 * - Percobaan ke-6: 30 menit
 * - Percobaan ke-7+: 60 menit
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
 * Mendukung persistensi Supabase database dengan fallback otomatis ke memory store.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
): Promise<RateLimitCheckResult> {
  purgeExpired();
  const now = Date.now();

  let entry = memoryStore.get(key);

  // Jika terhubung ke database Supabase, periksa data persisten di tabel auth_rate_limits
  if (supabaseConfigured) {
    try {
      const svc = serviceClient();
      // maybeSingle(): data=null tanpa error bila baris memang tidak ada.
      const { data, error } = await svc
        .from("auth_rate_limits")
        .select("count, first_failed_at, locked_until, backoff_level")
        .eq("key", key)
        .maybeSingle();

      if (error) {
        // DB tidak bisa dibaca → JANGAN reset counter di memori (fallback normal).
      } else if (data) {
        entry = {
          count: Number(data.count),
          firstFailedAt: Number(data.first_failed_at),
          lockedUntil: Number(data.locked_until),
          backoffLevel: Number(data.backoff_level),
        };
        memoryStore.set(key, entry);
      } else if (entry) {
        // Baris di database sudah dihapus (mis. oleh `scripts/reset-lockout.mjs`
        // atau admin yang membuka kunci akun). Database adalah sumber kebenaran,
        // jadi counter di memori harus ikut dibuang — kalau tidak, akun tetap
        // terkunci sampai server restart.
        memoryStore.delete(key);
        entry = undefined;
      }
    } catch {
      // Graceful fallback ke memoryStore jika tabel belum dimigrasi atau koneksi terputus
    }
  }

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
    memoryStore.delete(key);
    if (supabaseConfigured) {
      try {
        const svc = serviceClient();
        await svc.from("auth_rate_limits").delete().eq("key", key);
      } catch {
        /* abaikan */
      }
    }
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
 * Disimpan secara persisten ke database Supabase.
 */
export async function recordFailedAttempt(
  key: string,
  maxAttempts: number = 5,
): Promise<{ count: number; lockedUntil: number; retryAfterSeconds: number }> {
  purgeExpired();
  const now = Date.now();
  let entry = memoryStore.get(key);

  if (!entry) {
    entry = {
      count: 1,
      firstFailedAt: now,
      lockedUntil: 0,
      backoffLevel: 0,
    };
  } else {
    entry.count += 1;
    if (entry.count >= maxAttempts) {
      entry.backoffLevel += 1;
      const lockoutMs = calculateLockoutMs(entry.backoffLevel);
      entry.lockedUntil = now + lockoutMs;
    }
  }

  memoryStore.set(key, entry);

  // Simpan secara persisten ke database
  if (supabaseConfigured) {
    try {
      const svc = serviceClient();
      await svc.from("auth_rate_limits").upsert(
        {
          key,
          count: entry.count,
          first_failed_at: entry.firstFailedAt,
          locked_until: entry.lockedUntil,
          backoff_level: entry.backoffLevel,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
    } catch (err) {
      console.warn("[RATE LIMIT DB WARNING] Gagal menyimpan rate limit ke database:", err);
    }
  }

  const retryAfter = entry.lockedUntil > now ? Math.ceil((entry.lockedUntil - now) / 1000) : 0;
  return {
    count: entry.count,
    lockedUntil: entry.lockedUntil,
    retryAfterSeconds: retryAfter,
  };
}

/**
 * Menghapus catatan percobaan saat login berhasil.
 */
export async function resetRateLimit(key: string): Promise<void> {
  memoryStore.delete(key);
  if (supabaseConfigured) {
    try {
      const svc = serviceClient();
      await svc.from("auth_rate_limits").delete().eq("key", key);
    } catch {
      /* abaikan */
    }
  }
}
