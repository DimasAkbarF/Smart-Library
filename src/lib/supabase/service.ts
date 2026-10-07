import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. HANYA di server (actions / route handlers).
 * Melewati RLS — setiap pemanggil wajib validasi role via requireRole()
 * sebelum menyentuh client ini. Jangan pernah return mentahannya ke browser.
 */
export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
