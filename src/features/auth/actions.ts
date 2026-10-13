"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { supabaseConfigured } from "@/lib/supabase/env";
import { ROLE_HOME } from "@/lib/types";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";
import { getSession, tulisAudit } from "@/lib/auth";
import { validatePassword } from "@/lib/password";
import { verifyTotpToken } from "@/lib/totp";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { validateProductionEnv } from "@/lib/supabase/env";

const GENERIC_ERROR_AUTH = "Nama pengguna atau kata sandi salah. Periksa kembali lalu coba lagi.";

const LoginSchema = z.object({
  identifier: z.string().trim().min(1, "Isi nama pengguna atau email."),
  password: z.string().min(1, "Isi kata sandi."),
  totpCode: z.string().trim().optional(),
});

export interface LoginState {
  message?: string;
  requireTotp?: boolean;
}

/**
 * Simulasi komputasi kriptografis untuk menyeragamkan waktu respons (Constant Time),
 * mencegah penyerang menebak keberadaan akun berdasarkan perbedaan milidetik (Timing Attack).
 */
function dummyCryptoDelay() {
  const dummySalt = Buffer.from("smart_library_salt_smpn17_tangsel");
  const hash1 = pbkdf2Sync("dummy_password_timing_defense", dummySalt, 10000, 32, "sha256");
  const hash2 = pbkdf2Sync("dummy_password_timing_defense", dummySalt, 10000, 32, "sha256");
  timingSafeEqual(hash1, hash2);
}

async function getClientInfo() {
  let clientIp = "127.0.0.1";
  let locationStr = "Jaringan Lokal / Sekolah";
  let userAgent = "";
  let host = "";

  try {
    const h = await headers();
    userAgent = h.get("user-agent") || "";
    host = h.get("x-forwarded-host") || h.get("host") || "";
    // Ambil IP klien dari header reverse proxy standar (x-real-ip atau x-forwarded-for)
    const xReal = h.get("x-real-ip");
    const xff = h.get("x-forwarded-for");
    clientIp = xReal || (xff ? xff.split(",")[0]?.trim() : null) || "127.0.0.1";

    const city = h.get("x-vercel-ip-city");
    const country = h.get("x-vercel-ip-country");
    const region = h.get("x-vercel-ip-country-region") || h.get("x-region");

    if (city || country) {
      locationStr = [city, region, country].filter(Boolean).join(", ");
    }
  } catch {
    // Abaikan jika headers() tidak tersedia
  }

  return { clientIp, locationStr, userAgent, host };
}

/**
 * SATU-SATUNYA LOGIN SISTEM: Khusus Admin & Petugas Perpustakaan.
 * Dilindungi persistent rate limiting, anti-timing attack, dan audit logging.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    totpCode: formData.get("totp_code") || undefined,
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Data masuk belum lengkap." };
  }

  if (!supabaseConfigured) {
    return { message: "Server belum terhubung ke database. Hubungi administrator sistem." };
  }

  const envCheck = validateProductionEnv();
  if (!envCheck.valid && process.env.NODE_ENV === "production") {
    return { message: "Konfigurasi server perpustakaan belum lengkap. Hubungi administrator." };
  }

  const { clientIp, locationStr, userAgent } = await getClientInfo();
  const rawId = parsed.data.identifier.toLowerCase();

  // 1. RATE LIMITING & LOCKOUT (Persisten per IP dan per Username)
  const rateLimitKey = `admin_login:id:${rawId}`;
  const ipRateLimitKey = `admin_login:ip:${clientIp}`;

  const idStatus = await checkRateLimit(rateLimitKey, 5);
  const ipStatus = await checkRateLimit(ipRateLimitKey, 10);

  if (!idStatus.allowed || !ipStatus.allowed) {
    const waitSec = Math.max(idStatus.retryAfterSeconds, ipStatus.retryAfterSeconds);
    const waitMin = Math.ceil(waitSec / 60);
    await tulisAudit(null, "auth.rate_limited", "auth", rawId, {
      ip: clientIp,
      wait_minutes: waitMin,
      user_agent: userAgent,
    });
    return {
      message: `Terlalu banyak percobaan masuk yang gagal. Akun/IP terkunci selama ${waitMin} menit.`,
    };
  }

  // 3. AMBIL PROFIL & VALIDASI HANYA ROLE ADMIN / PETUGAS
  const svc = serviceClient();
  let email = rawId;

  let profileQuery = svc
    .from("profiles")
    .select("id, email, username, full_name, role, status, must_change_password, totp_enabled, totp_secret");

  if (rawId.includes("@")) {
    profileQuery = profileQuery.eq("email", rawId);
  } else {
    profileQuery = profileQuery.eq("username", rawId);
  }

  const { data: profile } = await profileQuery.single();

  // Jika akun tidak ditemukan atau BUKAN role admin/petugas (siswa tidak boleh login ke portal admin/petugas)
  if (!profile || (profile.role !== "admin" && profile.role !== "librarian")) {
    dummyCryptoDelay();
    await recordFailedAttempt(rateLimitKey, 5);
    await recordFailedAttempt(ipRateLimitKey, 10);
    await tulisAudit(null, "auth.failed", "auth", rawId, {
      ip: clientIp,
      reason: "invalid_credentials_or_unauthorized_role",
      user_agent: userAgent,
    });
    return { message: GENERIC_ERROR_AUTH };
  }

  // 5. VERIFIKASI 2FA TOTP JIKA DIAKTIFKAN PADA AKUN
  if (profile.totp_enabled && profile.totp_secret) {
    if (!parsed.data.totpCode) {
      return {
        requireTotp: true,
        message: "Akun ini dilindungi 2FA. Masukkan 6 digit kode dari aplikasi Authenticator Anda.",
      };
    }

    const isTotpValid = verifyTotpToken(profile.totp_secret, parsed.data.totpCode);
    if (!isTotpValid) {
      dummyCryptoDelay();
      await recordFailedAttempt(rateLimitKey, 5);
      await recordFailedAttempt(ipRateLimitKey, 10);
      await tulisAudit(profile.id, "auth.totp_failed", "auth", rawId, {
        ip: clientIp,
        user_agent: userAgent,
      });
      return {
        requireTotp: true,
        message: "Kode autentikasi 2FA salah atau telah kedaluwarsa.",
      };
    }
  }

  email = profile.email || `${profile.username}@sekolah.local`;

  // 6. AUTENTIKASI DENGAN SUPABASE (BCRYPT / ARGON2)
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth
    .signInWithPassword({
      email,
      password: parsed.data.password,
    })
    .catch((e: unknown) => ({ data: { user: null }, error: e as Error }));

  if (error || !authData?.user) {
    await recordFailedAttempt(rateLimitKey, 5);
    await recordFailedAttempt(ipRateLimitKey, 10);
    await tulisAudit(null, "auth.failed", "auth", rawId, {
      ip: clientIp,
      reason: "invalid_password",
      user_agent: userAgent,
    });
    return { message: GENERIC_ERROR_AUTH };
  }

  // 7. LOGIN BERHASIL: RESET RATE LIMIT & AUDIT LOG
  await resetRateLimit(rateLimitKey);
  await resetRateLimit(ipRateLimitKey);

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    return { message: "Akun ini sedang tidak aktif. Hubungi administrator." };
  }


  await tulisAudit(profile.id, "auth.login_success", "user", profile.id, {
    ip: clientIp,
    location: locationStr,
    role: "admin",
    name: profile.full_name,
    totp_used: Boolean(profile.totp_enabled),
    user_agent: userAgent,
  });

  console.info(`[AUTH] Login berhasil untuk '${rawId}' dari IP ${clientIp}`);

  // Jika diwajibkan ganti password saat login pertama
  if (profile.must_change_password) {
    redirect("/change-password");
  }

  redirect(ROLE_HOME.admin);
}

/** Alias untuk kompatibilitas mundur jika ada pemanggil adminLogin */
export const adminLogin = login;

/**
 * GANTI KATA SANDI (Wajib login pertama & reset password)
 */
export async function changePassword(
  _prev: { message?: string; ok?: boolean },
  formData: FormData,
): Promise<{ message?: string; ok?: boolean }> {
  const session = await getSession();
  if (!session) redirect("/login");

  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (newPassword !== confirmPassword) {
    return { message: "Konfirmasi kata sandi tidak cocok." };
  }

  const validation = validatePassword(newPassword, {
    username: session.profile.username,
    email: session.profile.email ?? undefined,
    fullName: session.profile.full_name,
  });

  if (!validation.valid) {
    return { message: validation.message };
  }

  const svc = serviceClient();
  const { error: authErr } = await svc.auth.admin.updateUserById(session.userId, {
    password: newPassword,
  });

  if (authErr) {
    console.error("[AUTH] Gagal update kata sandi Supabase:", authErr);
    return { message: "Gagal memperbarui kata sandi. Coba beberapa saat lagi." };
  }

  await svc
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", session.userId);

  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/change-password");

  await tulisAudit(session.userId, "auth.password_changed", "user", session.userId, {
    username: session.profile.username,
    role: session.profile.role,
  });

  console.info(`[AUTH] Kata sandi berhasil diperbarui untuk @${session.profile.username}. Redirecting to /admin`);
  redirect(ROLE_HOME.admin);
}

/**
 * BUKA KUNCI IDENTIFIER (Reset Darurat Rate Limit):
 * Digunakan jika akun/IP sah terlanjur terkunci akibat percobaan berulang.
 */
export async function unlockIdentifier(rawIdentifier: string): Promise<{ ok: boolean; message: string }> {
  const rawId = rawIdentifier.toLowerCase().trim();
  await resetRateLimit(`admin_login:id:${rawId}`);
  await resetRateLimit(`admin_login:ip:${rawId}`);
  await resetRateLimit(`login:id:${rawId}`);
  await resetRateLimit(`login:ip:${rawId}`);
  console.info(`[AUTH] Rate limit reset manual untuk identifier/IP: ${rawId}`);
  return { ok: true, message: `Status lockout untuk '${rawId}' berhasil direset.` };
}

/**
 * LOGOUT: Invalidasi sesi Supabase secara tuntas dan hapus semua cookie auth.
 */
export async function logout() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Abaikan jika sudah tidak ada sesi
  }

  try {
    const cookieStore = await cookies();
    const all = cookieStore.getAll();
    for (const c of all) {
      if (c.name.startsWith("sb-")) {
        cookieStore.set(c.name, "", {
          path: "/",
          maxAge: 0,
          expires: new Date(0),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
      }
    }
  } catch {
    // Abaikan jika tidak di context writable cookie
  }

  redirect("/login");
}
