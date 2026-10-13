import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  let isSecure = process.env.NODE_ENV === "production";
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "";
    const proto = h.get("x-forwarded-proto");
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    if (isLocal) {
      isSecure = false;
    } else {
      isSecure = proto === "https" || process.env.NODE_ENV === "production";
    }
  } catch {
    // Abaikan jika headers() tidak tersedia
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                path: options?.path ?? "/",
                sameSite: "lax",
                secure: isSecure,
              }),
            );
          } catch {
            // Dipanggil dari Server Component: cookies read-only, abaikan.
          }
        },
      },
    },
  );
}
