import type { MetadataRoute } from "next";
import { serviceClient } from "@/lib/supabase/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://perpustakaansmp17tangsel.web.id";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/informasi`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const svc = serviceClient();
    const { data: books } = await svc
      .from("books")
      .select("id, created_at")
      .order("title")
      .limit(500);

    const bookRoutes: MetadataRoute.Sitemap = (books ?? []).map((b) => ({
      url: `${baseUrl}/books/${b.id}`,
      lastModified: b.created_at ? new Date(b.created_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...bookRoutes];
  } catch {
    return staticRoutes;
  }
}

export const dynamic = "force-dynamic";
