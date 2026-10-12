"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { supabaseConfigured } from "@/lib/supabase/env";
import { ROLE_HOME } from "@/lib/types";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rate-limit";
import { tulisAudit } from "@/lib/auth";

const GAGAL = "NIS / username atau password belum sesuai. Periksa kembali lalu coba lagi.";

const LoginSchema = z.object({
  identifier: z.string().trim().min(1, "Isi NIS atau username."),
  password: z.string().min(1, "Isi password."),
});

export interface LoginState {
  message?: string;
}

/** Login dengan username ATAU email disertai proteksi brute-force server-side rate-limit dan pencatatan audit IP/lokasi. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Data masuk belum lengkap." };
  }
  if (!supabaseConfigured) {
    return { message: "Server belum terhubung ke database. Hubungi admin perpustakaan." };
  }

  // Identifikasi IP client & lokasi untuk rate limiting dan audit logging
  let clientIp = "127.0.0.1";
  let locationStr = "Jaringan Lokal / Sekolah";
  let userAgent = "";
  try {
    const h = await headers();
    userAgent = h.get("user-agent") || "";
    const xff = h.get("x-forwarded-for");
    const xReal = h.get("x-real-ip");
    const cfIp = h.get("cf-connecting-ip");
    clientIp = (xff ? xff.split(",")[0]?.trim() : null) || xReal || cfIp || "127.0.0.1";

    // Deteksi lokasi dari header proxy/CDN
    const city = h.get("x-vercel-ip-city") || h.get("cf-ipcity") || h.get("x-city");
    const country = h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || h.get("x-country");
    const region = h.get("x-vercel-ip-country-region") || h.get("x-region");

    if (city || country) {
      locationStr = [city, region, country].filter(Boolean).join(", ");
    } else if (
      clientIp === "127.0.0.1" ||
      clientIp === "::1" ||
      clientIp.startsWith("192.168.") ||
      clientIp.startsWith("10.") ||
      clientIp.startsWith("172.16.") ||
      clientIp === "localhost"
    ) {
      locationStr = "Jaringan Lokal / Sekolah";
    }
  } catch {
    // Abaikan jika headers() tidak tersedia
  }

  const rateLimitKey = `login:${clientIp}:${parsed.data.identifier.toLowerCase()}`;
  const ipRateLimitKey = `login:ip:${clientIp}`;

  // Cek batas percobaan: maks 5x gagal per identitas dan maks 20x gagal per IP (15 menit)
  const idStatus = checkRateLimit(rateLimitKey, 5);
  const ipStatus = checkRateLimit(ipRateLimitKey, 20);

  if (!idStatus.allowed || !ipStatus.allowed) {
    const waitSec = Math.max(idStatus.retryAfterSeconds, ipStatus.retryAfterSeconds);
    const waitMin = Math.ceil(waitSec / 60);
    return {
      message: `Terlalu banyak percobaan masuk yang gagal. Silakan tunggu ${waitMin} menit sebelum mencoba lagi.`,
    };
  }

  let email = parsed.data.identifier;
  if (!email.includes("@")) {
    const svc = serviceClient();
    const { data, error: lookupError } = await svc
      .from("profiles")
      .select("email")
      .eq("username", email.toLowerCase())
      .single();
    if (lookupError || !data?.email) {
      // Cegah user enumeration: jangan bedakan akun tidak ada dengan password salah
      recordFailedAttempt(rateLimitKey);
      recordFailedAttempt(ipRateLimitKey);
      return { message: GAGAL };
    }
    email = data.email;
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth
    .signInWithPassword({
      email,
      password: parsed.data.password,
    })
    .catch((e: unknown) => ({ data: { user: null }, error: e as Error }));

  if (error || !authData?.user) {
    recordFailedAttempt(rateLimitKey);
    recordFailedAttempt(ipRateLimitKey);
    return { message: GAGAL };
  }

  // Bersihkan catatan rate-limit jika berhasil masuk
  resetRateLimit(rateLimitKey);
  resetRateLimit(ipRateLimitKey);

  // Arahkan sesuai role
  const user = authData.user;
  const svc = serviceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("role, status, full_name, username")
    .eq("id", user.id)
    .single();
  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return {
      message: "Akun ini sedang tidak aktif. Silakan hubungi admin perpustakaan.",
    };
  }

  // Catat audit log setiap kali ada yang login beserta IP & lokasi
  await tulisAudit(user.id, "auth.login", "user", user.id, {
    ip: clientIp,
    location: locationStr,
    role: profile.role,
    name: profile.full_name || profile.username || parsed.data.identifier,
    identifier: parsed.data.identifier,
    user_agent: userAgent,
  }).catch((err) => {
    console.warn("Gagal menulis audit log login:", err);
  });

  redirect(ROLE_HOME[profile.role as keyof typeof ROLE_HOME]);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
