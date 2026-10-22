import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const proto = request.headers.get("x-forwarded-proto");
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const isLocalhost =
    hostHeader.includes("localhost") ||
    hostHeader.includes("127.0.0.1") ||
    hostHeader.includes("[::1]") ||
    hostHeader.includes("0.0.0.0");

  // 1. Host kanonik: www -> non-www (301) agar hanya satu versi domain terindeks.
  if (
    process.env.NODE_ENV === "production" &&
    !isLocalhost &&
    hostHeader.toLowerCase().startsWith("www.")
  ) {
    const apex = new URL(request.nextUrl.toString());
    apex.host = apex.host.replace(/^www\./i, "");
    apex.protocol = "https:";
    return NextResponse.redirect(apex, 301);
  }

  // 2. HTTP to HTTPS redirect di environment produksi
  if (
    process.env.NODE_ENV === "production" &&
    !isLocalhost &&
    proto === "http" &&
    request.nextUrl.protocol !== "https:"
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 3. Redirect Rute Lama & Rute Siswa (301 Permanent)
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

  // 4. Proteksi CSRF: Validasi Header Origin vs Host untuk metode mutasi
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

  // 5. Update dan validasi sesi Supabase serta proteksi rute admin
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
