import type { MetadataRoute } from "next";

/**
 * Hanya / dan /login yang boleh di-crawl. Area admin/librarian/student
 * selalu berakhir di redirect ke login — memblokirnya menghemat kuota crawl
 * dan menjaga URL auth tidak pernah bocor lewat result pencarian.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
        disallow: ["/admin", "/student", "/api"],
      },
      {
        userAgent: ["GPTBot", "CCBot", "ClaudeBot", "Applebot-Extended", "Bytespider", "PerplexityBot"],
        disallow: ["/"],
      },
    ],
    sitemap: "http://perpustakaansmp17tangsel.web.id/sitemap.xml",
  };
}