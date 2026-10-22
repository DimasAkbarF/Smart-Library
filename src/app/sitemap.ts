import type { MetadataRoute } from "next";
import { serviceClient } from "@/lib/supabase/service";

/**
 * Sitemap XML — hanya berisi URL yang MAYA diindeks.
 *
 *Aturan:
 * - "/" TIDAK dicantumkan: root adalah redirect berbasis sesi (admin -> /admin,
 *   publik -> /books) sehingga bukan URL kanonik yang stabil.
 * - "/login" TIDAK dicantumkan: portal staf memakai tag noindex.
 * - "/faq" TIDAK dicantumkan: redirect permanen ke /informasi.
 * - Halaman katalog dipaginasi memakai query string (?page=N). URL halaman 1
 *   dicantumkan; URL halaman berikutnya tidak perlu karena sudah<Self>-canonical
 *   dan tertaut dari halaman sebelumnya (dirayapi lewat tautan HTML).
 * - lastmod memakai created_at buku (buku tidak memiliki updated_at), bukan
 *   `new Date()` yang membuat seluruh sitemap tampak selalu segar.
 */
const BASE_URL = "https://perpustakaansmp17tangsel.web.id";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/books`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/informasi`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  try {
    const svc = serviceClient();
    const { data: books } = await svc
      .from("books")
      .select("id, title, created_at")
      .order("title")
      .limit(5000);

    const bookRoutes: MetadataRoute.Sitemap = (books ?? []).map((b) => ({
      url: `${BASE_URL}/books/${b.id}`,
      lastModified: b.created_at ? new Date(b.created_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...bookRoutes];
  } catch {
    return staticRoutes;
  }
}

export const dynamic = "force-dynamic";
