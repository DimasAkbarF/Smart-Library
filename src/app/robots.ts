import type { MetadataRoute } from "next";

/**
 * Robots.txt — Smart Library SMPN 17 Tangsel.
 *
 * ATURAN PENTING (robots.txt bersifat per-user-agent group):
 * Google HANYA memakai grup yang namanya cocok (mis. "Googlebot"). Jika grup
 * khusus Googlebot ada, grup "*" DIABAIKAN oleh Google. Versi lama website ini
 * menuliskan `User-Agent: Googlebot` + `Allow: /` tanpa Disallow apa pun, sehingga
 * Googlebot merayapi /admin/, /api/, dan /card/<token> (kartu anggota siswa!)
 * yang seharusnya tersembunyi. Google kini menemukan hundreds URL permukaan
 * internal, membuang crawl budget, dan melaporkan "Duplicate" untuk /login.
 *
 * Karena itu setiap grup di bawah harus LENGKAP (allow + disallow) dan konsisten.
 */
const DISALLOW = ["/admin", "/api", "/card", "/change-password"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Grup Googlebot: hanya permukaan publik yang boleh dirayapi.
        userAgent: ["Googlebot", "Googlebot-Image", "Googlebot-Favicon", "Google-Extended"],
        allow: ["/"],
        disallow: DISALLOW,
      },
      {
        // Grup umum: identik agar tidak ada perbedaan perlakuan antar bot.
        userAgent: "*",
        allow: ["/"],
        disallow: DISALLOW,
      },
      {
        // Bot AI: tidak ada kebutuhan untuk mengindeks katalog sekolah ini.
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Applebot-Extended", "CCBot", "Bytespider"],
        disallow: ["/"],
      },
    ],
    sitemap: "https://perpustakaansmp17tangsel.web.id/sitemap.xml",
    host: "https://perpustakaansmp17tangsel.web.id",
  };
}
