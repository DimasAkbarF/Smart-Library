export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** False bila .env.local belum diisi — UI tetap render, aksi data menolak halus. */
export const supabaseConfigured =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;
