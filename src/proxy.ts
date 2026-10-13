import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // 1. HTTP to HTTPS redirect di environment produksi
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Proteksi CSRF: Validasi Header Origin vs Host untuk metode mutasi
  const method = request.method;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          console.warn(`[CSRF VIOLATION BLOCKED] Origin "${originHost}" !== Host "${host}"`);
          return new NextResponse(
            JSON.stringify({ error: "Permintaan lintas domain tidak diizinkan (CSRF Protection)." }),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      } catch {
        return new NextResponse(
          JSON.stringify({ error: "Origin header tidak valid." }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }
  }

  // 3. Update dan validasi sesi Supabase
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
