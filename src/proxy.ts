import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. HTTP to HTTPS redirect di environment produksi
  // Periksa cf-visitor dan x-forwarded-proto untuk mencegah redirect loop di balik Cloudflare proxy
  const proto = request.headers.get("x-forwarded-proto");
  const cfVisitor = request.headers.get("cf-visitor");
  const isCloudflareHttps = cfVisitor?.includes('"scheme":"https"');

  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const isLocalhost = hostHeader.includes("localhost") || hostHeader.includes("127.0.0.1");

  if (
    process.env.NODE_ENV === "production" &&
    !isLocalhost &&
    proto === "http" &&
    !isCloudflareHttps &&
    request.nextUrl.protocol !== "https:"
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Redirect Rute Lama & Rute Siswa (301 Permanent)
  if (pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/login", request.url), 301);
  }

  if (pathname === "/student/books") {
    return NextResponse.redirect(new URL("/books", request.url), 301);
  }

  if (pathname.startsWith("/student/books/")) {
    const bookId = pathname.replace("/student/books/", "");
    return NextResponse.redirect(new URL(`/books/${bookId}`, request.url), 301);
  }

  if (pathname === "/student" || pathname.startsWith("/student/")) {
    return NextResponse.redirect(new URL("/login", request.url), 301);
  }

  // 3. Proteksi CSRF: Validasi Header Origin vs Host untuk metode mutasi
  const method = request.method;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");

    if (origin && host) {
      try {
        const originHost = new URL(origin).host.toLowerCase();
        const expectedHost = host.toLowerCase().split(":")[0];
        const appUrlHost = process.env.NEXT_PUBLIC_APP_URL
          ? new URL(process.env.NEXT_PUBLIC_APP_URL).host.toLowerCase()
          : "";

        const isAllowed =
          originHost === expectedHost ||
          originHost.split(":")[0] === expectedHost ||
          originHost === "perpustakaansmp17tangsel.web.id" ||
          (appUrlHost && originHost === appUrlHost) ||
          (process.env.NODE_ENV !== "production" &&
            (originHost === "localhost" ||
              originHost.startsWith("localhost:") ||
              originHost === "127.0.0.1" ||
              originHost.startsWith("127.0.0.1:")));

        if (!isAllowed) {
          console.warn(`[CSRF VIOLATION BLOCKED] Origin "${originHost}" not allowed against host "${expectedHost}"`);
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

  // 4. Update dan validasi sesi Supabase serta proteksi rute admin
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
