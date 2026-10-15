import type { MetadataRoute } from "next";

/**
 * Konfigurasi Robots.txt:
 * Memblokir pengindeksan halaman autentikasi (/login, /admin, /change-password)
 * serta endpoint internal (/api, /student) untuk mencegah penemuan permukaan serangan
 * dan kebocoran URL auth ke indeks mesin pencari publik.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["Googlebot", "Googlebot-Image", "Googlebot-Favicon", "Google-Extended"],
        allow: ["/"],
      },
      {
        userAgent: "*",
        allow: [
          "/",
          "/books",
          "/books/*",
          "/login",
          "/favicon.ico",
          "/favicon-*.png",
          "/icon*.png",
          "/apple-*.png",
          "/manifest.webmanifest",
        ],
        disallow: ["/admin/", "/api/", "/change-password", "/card/"],
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Applebot-Extended", "CCBot", "Bytespider"],
        disallow: ["/"],
      },
    ],
    sitemap: "https://perpustakaansmp17tangsel.web.id/sitemap.xml",
  };
}