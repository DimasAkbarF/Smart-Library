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
import { verifyTurnstile } from "@/lib/turnstile";
import { isDefaultPassword, validatePassword } from "@/lib/password";
import { verifyTotpToken } from "@/lib/totp";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { validateProductionEnv } from "@/lib/supabase/env";

const GENERIC_ERROR_STUDENT = "NIS atau kata sandi salah. Periksa kembali lalu coba lagi.";
const GENERIC_ERROR_ADMIN = "Nama pengguna atau kata sandi salah. Periksa kembali lalu coba lagi.";

const LoginSchema = z.object({
  identifier: z.string().trim().min(1, "Isi NIS atau nama pengguna."),
  password: z.string().min(1, "Isi kata sandi."),
  turnstileToken: z.string().optional(),
});

const AdminLoginSchema = z.object({
  identifier: z.string().trim().min(1, "Isi nama pengguna atau email."),
  password: z.string().min(1, "Isi kata sandi."),
  totpCode: z.string().trim().optional(),
  turnstileToken: z.string().optional(),
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
    const cfIp = h.get("cf-connecting-ip");
    const xReal = h.get("x-real-ip");
    const xff = h.get("x-forwarded-for");
    clientIp = cfIp || xReal || (xff ? xff.split(",")[0]?.trim() : null) || "127.0.0.1";

    const city = h.get("cf-ipcity") || h.get("x-vercel-ip-city");
    const country = h.get("cf-ipcountry") || h.get("x-vercel-ip-country");
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
 * LOGIN SISWA: Khusus siswa (NIS).
 * Wajib Cloudflare Turnstile, anti-brute force, generic error, timing defense, audit log.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    turnstileToken: formData.get("cf-turnstile-response") || formData.get("turnstile_token"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Data masuk belum lengkap." };
  }

  if (!supabaseConfigured) {
    return { message: "Server belum terhubung ke database. Hubungi admin perpustakaan." };
  }

  const envCheck = validateProductionEnv();
  if (!envCheck.valid && process.env.NODE_ENV === "production") {
    return { message: "Konfigurasi server perpustakaan belum lengkap. Hubungi administrator." };
  }

  const { clientIp, locationStr, userAgent, host } = await getClientInfo();
  const rawId = parsed.data.identifier.toLowerCase();

  // 1. VERIFIKASI CLOUDFLARE TURNSTILE TERLEBIH DAHULU SEBELUM CEK DB/PASSWORD
  const turnstileResult = await verifyTurnstile(parsed.data.turnstileToken, clientIp, {
    action: "login",
    expectedHostname: host,
  });
  if (!turnstileResult.success) {
    await tulisAudit(null, "auth.login_bot_blocked", "auth", rawId, {
      ip: clientIp,
      reason: turnstileResult.message,
      user_agent: userAgent,
    });
    return { message: turnstileResult.message || "Tantangan keamanan gagal." };
  }

  // 2. RATE LIMITING (Terpisah per IP dan per Identitas)
  const rateLimitKey = `login:id:${rawId}`;
  const ipRateLimitKey = `login:ip:${clientIp}`;

  const idStatus = checkRateLimit(rateLimitKey, 5);
  const ipStatus = checkRateLimit(ipRateLimitKey, 15);

  if (!idStatus.allowed || !ipStatus.allowed) {
    const waitSec = Math.max(idStatus.retryAfterSeconds, ipStatus.retryAfterSeconds);
    const waitMin = Math.ceil(waitSec / 60);
    await tulisAudit(null, "auth.login_rate_limited", "auth", rawId, {
      ip: clientIp,
      wait_minutes: waitMin,
      user_agent: userAgent,
    });
    return {
      message: `Terlalu banyak percobaan masuk yang gagal. Silakan tunggu ${waitMin} menit sebelum mencoba lagi.`,
    };
  }

  // 3. AMBIL EMAIL & VALIDASI ROLE SISWA
  const svc = serviceClient();
  let email = rawId;

  const { data: profile } = await svc
    .from("profiles")
    .select("id, email, username, full_name, role, status, must_change_password")
    .eq("username", rawId)
    .single();

  // Jika akun tidak ditemukan atau bukan role 'student' (petugas/admin harus ke /admin/login)
  if (!profile || profile.role !== "student") {
    dummyCryptoDelay();
    recordFailedAttempt(rateLimitKey, 5);
    recordFailedAttempt(ipRateLimitKey, 15);
    await tulisAudit(null, "auth.login_failed", "auth", rawId, {
      ip: clientIp,
      reason: "invalid_credentials_or_wrong_portal",
      user_agent: userAgent,
    });
    return { message: GENERIC_ERROR_STUDENT };
  }

  email = profile.email || `${rawId}@sekolah.local`;

  // 4. AUTENTIKASI DENGAN SUPABASE
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth
    .signInWithPassword({
      email,
      password: parsed.data.password,
    })
    .catch((e: unknown) => ({ data: { user: null }, error: e as Error }));

  if (error || !authData?.user) {
    recordFailedAttempt(rateLimitKey, 5);
    recordFailedAttempt(ipRateLimitKey, 15);
    await tulisAudit(null, "auth.login_failed", "auth", rawId, {
      ip: clientIp,
      reason: "invalid_password",
      user_agent: userAgent,
    });
    return { message: GENERIC_ERROR_STUDENT };
  }

  // 5. LOGIN BERHASIL: RESET RATE LIMIT
  resetRateLimit(rateLimitKey);
  resetRateLimit(ipRateLimitKey);

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    return {
      message: "Akun ini sedang tidak aktif. Silakan hubungi admin perpustakaan.",
    };
  }

  // 6. DETEKSI PASSWORD DEFAULT / FIRST LOGIN
  const usedDefault = isDefaultPassword(parsed.data.password, profile.username);
  if (usedDefault || profile.must_change_password) {
    await svc.from("profiles").update({ must_change_password: true }).eq("id", profile.id);
    revalidatePath("/change-password");
    revalidatePath("/", "layout");
    console.info(`[AUTH DIAGNOSTIC] Siswa '${rawId}' dialihkan ke /change-password. usedDefault: ${usedDefault}, must_change_password: ${profile.must_change_password}`);
    await tulisAudit(profile.id, "auth.force_password_change_required", "user", profile.id, {
      ip: clientIp,
      reason: usedDefault ? "default_password_detected" : "flag_set",
    });
    redirect("/change-password");
  }

  // 7. CATAT AUDIT LOG
  await tulisAudit(profile.id, "auth.login", "user", profile.id, {
    ip: clientIp,
    location: locationStr,
    role: "student",
    name: profile.full_name,
    identifier: rawId,
    user_agent: userAgent,
  });

  redirect(ROLE_HOME.student);
}

/**
 * LOGIN ADMIN / PETUGAS: Khusus admin dan petugas perpustakaan (/admin/login).
 * Didukung 2FA TOTP opsional/terkonfigurasi, Turnstile, anti-brute force, generic error.
 */
export async function adminLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = AdminLoginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    totpCode: formData.get("totp_code") || undefined,
    turnstileToken: formData.get("cf-turnstile-response") || formData.get("turnstile_token"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Data masuk belum lengkap." };
  }

  if (!supabaseConfigured) {
    return { message: "Server belum terhubung ke database. Hubungi admin perpustakaan." };
  }

  const envCheck = validateProductionEnv();
  if (!envCheck.valid && process.env.NODE_ENV === "production") {
    return { message: "Konfigurasi server perpustakaan belum lengkap. Hubungi administrator." };
  }

  const { clientIp, locationStr, userAgent, host } = await getClientInfo();
  const rawId = parsed.data.identifier.toLowerCase();

  // 1. VERIFIKASI CLOUDFLARE TURNSTILE TERLEBIH DAHULU
  const turnstileResult = await verifyTurnstile(parsed.data.turnstileToken, clientIp, {
    action: "login",
    expectedHostname: host,
  });
  if (!turnstileResult.success) {
    await tulisAudit(null, "admin_auth.login_bot_blocked", "auth", rawId, {
      ip: clientIp,
      reason: turnstileResult.message,
      user_agent: userAgent,
    });
    return { message: turnstileResult.message || "Tantangan keamanan gagal." };
  }

  // 2. RATE LIMITING ADMIN (Lebih ketat: maks 5x gagal, lockout 15-60 menit)
  const rateLimitKey = `admin_login:id:${rawId}`;
  const ipRateLimitKey = `admin_login:ip:${clientIp}`;

  const idStatus = checkRateLimit(rateLimitKey, 5);
  const ipStatus = checkRateLimit(ipRateLimitKey, 10);

  if (!idStatus.allowed || !ipStatus.allowed) {
    const waitSec = Math.max(idStatus.retryAfterSeconds, ipStatus.retryAfterSeconds);
    const waitMin = Math.ceil(waitSec / 60);
    await tulisAudit(null, "admin_auth.rate_limited", "auth", rawId, {
      ip: clientIp,
      wait_minutes: waitMin,
      user_agent: userAgent,
    });
    return {
      message: `Terlalu banyak percobaan masuk gagal. Akun/IP terkunci selama ${waitMin} menit.`,
    };
  }

  // 3. AMBIL EMAIL & VALIDASI ROLE ADMIN
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

  // Jika akun tidak ditemukan atau bukan role 'admin'
  if (!profile || profile.role !== "admin") {
    dummyCryptoDelay();
    recordFailedAttempt(rateLimitKey, 5);
    recordFailedAttempt(ipRateLimitKey, 10);
    await tulisAudit(null, "admin_auth.failed", "auth", rawId, {
      ip: clientIp,
      reason: "invalid_credentials_or_unauthorized_role",
      user_agent: userAgent,
    });
    return { message: GENERIC_ERROR_ADMIN };
  }

  // 4. VERIFIKASI 2FA TOTP JIKA DIAKTIFKAN
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
      recordFailedAttempt(rateLimitKey, 5);
      recordFailedAttempt(ipRateLimitKey, 10);
      await tulisAudit(profile.id, "admin_auth.totp_failed", "auth", rawId, {
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

  // 5. AUTENTIKASI DENGAN SUPABASE
  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth
    .signInWithPassword({
      email,
      password: parsed.data.password,
    })
    .catch((e: unknown) => ({ data: { user: null }, error: e as Error }));

  if (error || !authData?.user) {
    recordFailedAttempt(rateLimitKey, 5);
    recordFailedAttempt(ipRateLimitKey, 10);
    await tulisAudit(null, "admin_auth.failed", "auth", rawId, {
      ip: clientIp,
      reason: "invalid_password",
      user_agent: userAgent,
    });
    return { message: GENERIC_ERROR_ADMIN };
  }

  // 6. LOGIN BERHASIL
  resetRateLimit(rateLimitKey);
  resetRateLimit(ipRateLimitKey);

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    return { message: "Akun admin ini sedang tidak aktif." };
  }

  // Deteksi password default
  const usedDefault = isDefaultPassword(parsed.data.password, profile.username);
  if (usedDefault || profile.must_change_password) {
    await svc.from("profiles").update({ must_change_password: true }).eq("id", profile.id);
    revalidatePath("/change-password");
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    console.info(`[AUTH DIAGNOSTIC] Admin '${rawId}' dialihkan ke /change-password. usedDefault: ${usedDefault}, must_change_password: ${profile.must_change_password}`);
    redirect("/change-password");
  }

  await tulisAudit(profile.id, "admin_auth.login_success", "user", profile.id, {
    ip: clientIp,
    location: locationStr,
    role: "admin",
    name: profile.full_name,
    totp_used: Boolean(profile.totp_enabled),
    user_agent: userAgent,
  });

  console.info(`[AUTH DIAGNOSTIC] Admin login berhasil untuk '${rawId}' dari IP ${clientIp}`);
  redirect(ROLE_HOME.admin);
}

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
    console.error("[AUTH DIAGNOSTIC] Gagal update kata sandi Supabase:", authErr);
    return { message: "Gagal memperbarui kata sandi. Coba beberapa saat lagi." };
  }

  await svc
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", session.userId);

  // Invalidate cache profil secara menyeluruh agar redirect tidak mengalami loop kembali ke /change-password
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/student", "layout");
  revalidatePath("/change-password");

  await tulisAudit(session.userId, "auth.password_changed", "user", session.userId, {
    username: session.profile.username,
    role: session.profile.role,
  });

  console.info(`[AUTH DIAGNOSTIC] Kata sandi berhasil diperbarui untuk user @${session.profile.username}. Redirecting to ${ROLE_HOME[session.profile.role]}`);
  redirect(ROLE_HOME[session.profile.role]);
}

/**
 * BUKA KUNCI IDENTIFIER (Reset Darurat Rate Limit):
 * Digunakan jika akun/IP sah terlanjur terkunci akibat percobaan berulang.
 */
export async function unlockIdentifier(rawIdentifier: string): Promise<{ ok: boolean; message: string }> {
  const rawId = rawIdentifier.toLowerCase().trim();
  resetRateLimit(`login:id:${rawId}`);
  resetRateLimit(`admin_login:id:${rawId}`);
  console.info(`[AUTH DIAGNOSTIC] Rate limit reset manual untuk identifier: ${rawId}`);
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
