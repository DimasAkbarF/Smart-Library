import type { SupabaseClient, User, AuthError } from "@supabase/supabase-js";

function isDeadTokenError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as Record<string, unknown>;
  const code = typeof e.code === "string" ? e.code : "";
  const msg = typeof e.message === "string" ? e.message : "";
  return (
    (e.__isAuthError === true || e.name === "AuthApiError") &&
    (code === "refresh_token_not_found" ||
      code === "refresh_token_already_used" ||
      code === "session_expired" ||
      code === "validation_failed" ||
      msg.includes("Invalid Refresh Token") ||
      msg.includes("Refresh Token Not Found"))
  );
}

/**
 * Memanggil supabase.auth.getUser() dengan proteksi terhadap log konsol bising
 * dari @supabase/auth-js saat refresh token pada cookie browser sudah kedaluwarsa,
 * tidak valid, atau telah di-revoke di server database.
 */
export async function safeGetUser(
  supabase: Pick<SupabaseClient, "auth">,
): Promise<{ data: { user: User | null }; error: AuthError | null }> {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args: unknown[]) => {
    if (args.some(isDeadTokenError)) return;
    originalWarn(...args);
  };
  console.error = (...args: unknown[]) => {
    if (args.some(isDeadTokenError)) return;
    originalError(...args);
  };

  try {
    const result = await supabase.auth.getUser();
    return result;
  } catch (err) {
    if (isDeadTokenError(err)) {
      return { data: { user: null }, error: err as AuthError };
    }
    throw err;
  } finally {
    console.warn = originalWarn;
    console.error = originalError;
  }
}
