export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://perpustakaansmp17tangsel.web.id";

/** False bila konfigurasi Supabase dasar belum diisi. */
export const supabaseConfigured =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;

/**
 * Validasi fail-closed variabel lingkungan server produksi.
 * Mencatat peringatan jelas pada log server jika ada variabel wajib yang kosong.
 */
export function validateProductionEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  if (process.env.NODE_ENV === "production") {
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) missing.push("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    if (!process.env.TURNSTILE_SECRET_KEY) missing.push("TURNSTILE_SECRET_KEY");
  }

  if (missing.length > 0 && process.env.NODE_ENV === "production") {
    console.error(
      `[SECURITY CRITICAL - ENV MISSING] Variabel lingkungan wajib belum diisi di production: ${missing.join(", ")}. Layanan beroperasi dalam status fail-closed.`,
    );
  }

  return { valid: missing.length === 0, missing };
}
