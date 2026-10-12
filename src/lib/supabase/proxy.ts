import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseConfigured } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  if (!supabaseConfigured) return NextResponse.next({ request });

  // 1. Sanitasi header internal agar tidak bisa di-spoof dari client luar
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-email");

  // 2. Periksa apakah ada cookie auth Supabase sebelum memanggil network
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"),
  );

  // Jika tidak ada cookie auth sama sekali, teruskan tanpa network roundtrip
  if (!hasAuthCookie) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 3. Validasi sesi secara kriptografis menggunakan supabase.auth.getUser()
  // JANGAN PERNAH percaya JSON mentah dari cookie tanpa verifikasi tanda tangan token!
  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    requestHeaders.set("x-user-id", user.id);
    if (user.email) requestHeaders.set("x-user-email", user.email);
  }

  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Salin cookie yang diperbarui (refresh token) oleh Supabase SSR
  supabaseResponse.cookies.getAll().forEach((c) => {
    finalResponse.cookies.set(c);
  });

  return finalResponse;
}
