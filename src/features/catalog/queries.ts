"use server";

import { unstable_cache } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import type { Book, Category } from "@/lib/types";

import { sanitizeSearchTerm } from "@/lib/utils";

const PAGE_SIZE = 12;

export interface CatalogResult {
  books: Book[];
  total: number;
  page: number;
  pageCount: number;
}

async function fetchCatalogInternal(
  q: string,
  categoryId: string,
  availableOnly: boolean,
  page: number,
): Promise<CatalogResult> {
  const svc = serviceClient();

  let query = svc
    .from("books")
    .select("id, isbn, title, author, publisher, publication_year, category_id, cover_url, categories(name)", { count: "exact" });

  if (q) {
    const like = `%${q}%`;
    query = query.or(`title.ilike.${like},author.ilike.${like},isbn.ilike.${like}`);
  }
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, count, error } = await query
    .order("title")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error("Gagal memuat katalog.");

  const ids = (data ?? []).map((b) => b.id);
  const { data: copies } = ids.length
    ? await svc.from("book_copies").select("book_id, status").in("book_id", ids)
    : { data: [] };

  const byBook = new Map<string, { total: number; avail: number }>();
  for (const c of copies ?? []) {
    const cur = byBook.get(c.book_id) ?? { total: 0, avail: 0 };
    cur.total += 1;
    if (c.status === "AVAILABLE") cur.avail += 1;
    byBook.set(c.book_id, cur);
  }

  let books: Book[] = (data ?? []).map((b) => {
    const stat = byBook.get(b.id) ?? { total: 0, avail: 0 };
    return {
      id: b.id,
      isbn: b.isbn,
      title: b.title,
      author: b.author,
      publisher: b.publisher,
      publication_year: b.publication_year,
      category_id: b.category_id,
      category_name: (b.categories as unknown as { name: string } | null)?.name ?? null,
      cover_url: b.cover_url,
      total_copies: stat.total,
      available_copies: stat.avail,
    };
  });
  if (availableOnly) books = books.filter((b) => b.available_copies > 0);

  const total = count ?? books.length;
  return { books, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

const getCachedSearchBooks = unstable_cache(
  fetchCatalogInternal,
  ["catalog-search-cache"],
  {
    revalidate: 120,
    tags: ["catalog"],
  },
);

/** Katalog: cari judul/penulis/ISBN + filter kategori + hanya tersedia (publik read-only). */
export async function searchBooks(opts: {
  q?: string;
  categoryId?: string;
  availableOnly?: boolean;
  page?: number;
}): Promise<CatalogResult> {
  const q = opts.q ? sanitizeSearchTerm(opts.q) : "";
  const categoryId = opts.categoryId || "";
  const availableOnly = Boolean(opts.availableOnly);
  const page = Math.max(1, opts.page ?? 1);

  return getCachedSearchBooks(q, categoryId, availableOnly, page);
}

const getCachedBookDetail = unstable_cache(
  async (id: string): Promise<Book | null> => {
    const svc = serviceClient();
    const { data: b } = await svc
      .from("books")
      .select("id, isbn, title, author, publisher, publication_year, category_id, cover_url, categories(name)")
      .eq("id", id)
      .single();
    if (!b) return null;
    const { data: copies } = await svc.from("book_copies").select("status").eq("book_id", id);
    const total = copies?.length ?? 0;
    const avail = copies?.filter((c) => c.status === "AVAILABLE").length ?? 0;
    return {
      id: b.id,
      isbn: b.isbn,
      title: b.title,
      author: b.author,
      publisher: b.publisher,
      publication_year: b.publication_year,
      category_id: b.category_id,
      category_name: (b.categories as unknown as { name: string } | null)?.name ?? null,
      cover_url: b.cover_url,
      total_copies: total,
      available_copies: avail,
    };
  },
  ["book-detail-cache"],
  {
    revalidate: 120,
    tags: ["catalog"],
  },
);

export async function getBookDetail(id: string): Promise<Book | null> {
  return getCachedBookDetail(id);
}

const getCachedCategories = unstable_cache(
  async () => {
    const svc = serviceClient();
    const { data } = await svc.from("categories").select("id, name").order("name");
    return data ?? [];
  },
  ["categories-list-cache"],
  {
    revalidate: 3600,
    tags: ["categories"],
  },
);

export async function listCategories(): Promise<Category[]> {
  return getCachedCategories();
}
