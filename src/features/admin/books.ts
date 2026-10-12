"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { serviceClient } from "@/lib/supabase/service";
import { assertRole, tulisAudit } from "@/lib/auth";
import { sanitizeSearchTerm } from "@/lib/utils";
import type { Book, BookCopy } from "@/lib/types";

const BookSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi."),
  author: z.string().trim().default("Tanpa penulis"),
  publisher: z.string().trim().optional(),
  publication_year: z.coerce.number().int().min(1000).max(2100).optional(),
  isbn: z.string().trim().optional(),
  category_id: z.string().optional(),
  cover_url: z
    .string()
    .trim()
    .refine((v) => !v || /^https?:\/\//i.test(v), {
      message: "URL sampul harus diawali http:// atau https://",
    })
    .optional(),
});

export interface CreatedCopyInfo {
  id: string;
  inventory_code: string;
  qr_token: string;
  location?: string | null;
}

export interface BookFormState {
  message?: string;
  ok?: boolean;
  book?: {
    id: string;
    title: string;
    author: string;
  };
  copies?: CreatedCopyInfo[];
}

export async function createBookWithCopies(
  _prev: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const session = await assertRole("admin");
  const parsed = BookSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author") || undefined,
    publisher: formData.get("publisher") || undefined,
    publication_year: formData.get("publication_year") || undefined,
    isbn: formData.get("isbn") || undefined,
    category_id: formData.get("category_id") || undefined,
    cover_url: formData.get("cover_url") || undefined,
  });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message };

  const copies = Math.min(500, Math.max(1, Number(formData.get("copy_count") ?? 1) || 1));
  const location = String(formData.get("location") ?? "").trim() || null;
  const svc = serviceClient();

  const { data: book, error } = await svc
    .from("books")
    .insert({
      title: parsed.data.title,
      author: parsed.data.author || "Tanpa penulis",
      publisher: parsed.data.publisher || null,
      publication_year: parsed.data.publication_year ?? null,
      isbn: parsed.data.isbn?.replace(/[-\s]/g, "") || null,
      category_id: parsed.data.category_id || null,
      cover_url: parsed.data.cover_url || null,
    })
    .select("id")
    .single();
  if (error || !book) return { message: "Gagal menyimpan buku." };

  const { data: insertedCopies, error: copyErr } = await svc
    .from("book_copies")
    .insert(
      Array.from({ length: copies }, () => ({
        book_id: book.id,
        inventory_code: "",
        qr_token: "",
        location,
      })),
    )
    .select("id, inventory_code, qr_token, location");
  if (copyErr) return { message: "Buku tersimpan, tetapi eksemplar gagal dibuat." };

  const mappedCopies: CreatedCopyInfo[] = (insertedCopies ?? []).map((c, idx) => ({
    id: c.id,
    inventory_code: c.inventory_code || `BOOK-${String(idx + 1).padStart(6, "0")}`,
    qr_token: c.qr_token || c.inventory_code || `BOOK-${String(idx + 1).padStart(6, "0")}`,
    location: c.location,
  }));

  await tulisAudit(session.userId, "book.create", "book", book.id, {
    title: parsed.data.title,
    copies,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/books");
  revalidatePath("/admin/copies");
  revalidateTag("admin-dashboard", { expire: 0 });
  return {
    ok: true,
    book: {
      id: book.id,
      title: parsed.data.title,
      author: parsed.data.author || "Tanpa penulis",
    },
    copies: mappedCopies,
  };
}

export async function updateBook(
  id: string,
  _prev: BookFormState,
  formData: FormData,
): Promise<BookFormState> {
  const session = await assertRole("admin");
  const parsed = BookSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author") || undefined,
    publisher: formData.get("publisher") || undefined,
    publication_year: formData.get("publication_year") || undefined,
    isbn: formData.get("isbn") || undefined,
    category_id: formData.get("category_id") || undefined,
    cover_url: formData.get("cover_url") || undefined,
  });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message };
  const svc = serviceClient();
  const { error } = await svc
    .from("books")
    .update({
      title: parsed.data.title,
      author: parsed.data.author || "Tanpa penulis",
      publisher: parsed.data.publisher || null,
      publication_year: parsed.data.publication_year ?? null,
      isbn: parsed.data.isbn?.replace(/[-\s]/g, "") || null,
      category_id: parsed.data.category_id || null,
      cover_url: parsed.data.cover_url || null,
    })
    .eq("id", id);
  if (error) return { message: "Gagal menyimpan perubahan." };
  await tulisAudit(session.userId, "book.update", "book", id, { title: parsed.data.title });
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteBook(id: string): Promise<{ ok: boolean; message?: string }> {
  const session = await assertRole("admin");
  const svc = serviceClient();
  const { count } = await svc
    .from("loans")
    .select("id", { count: "exact", head: true })
    .in(
      "book_copy_id",
      (await svc.from("book_copies").select("id").eq("book_id", id)).data?.map((c) => c.id) ?? ["00000000-0000-0000-0000-000000000000"],
    );
  if ((count ?? 0) > 0) {
    return { ok: false, message: "Buku ini memiliki riwayat transaksi dan tidak dapat dihapus." };
  }
  const { error } = await svc.from("books").delete().eq("id", id);
  if (error) return { ok: false, message: "Gagal menghapus buku." };
  await tulisAudit(session.userId, "book.delete", "book", id, {});
  revalidatePath("/admin");
  revalidatePath("/admin/books");
  revalidateTag("admin-dashboard", { expire: 0 });
  return { ok: true };
}

export async function addCopies(bookId: string, count: number, location?: string): Promise<CreatedCopyInfo[]> {
  const session = await assertRole("admin");
  const svc = serviceClient();
  const n = Math.min(500, Math.max(1, count || 1));
  const { data, error } = await svc
    .from("book_copies")
    .insert(
      Array.from({ length: n }, () => ({
        book_id: bookId,
        inventory_code: "",
        qr_token: "",
        location: location?.trim() || null,
      })),
    )
    .select("id, inventory_code, qr_token, location");
  if (error) throw new Error("Gagal menambah eksemplar.");
  await tulisAudit(session.userId, "copy.create_bulk", "book", bookId, { count: n });
  revalidatePath("/admin");
  revalidatePath("/admin/books");
  revalidatePath("/admin/copies");
  revalidateTag("admin-dashboard", { expire: 0 });
  return (data ?? []).map((c, idx) => ({
    id: c.id,
    inventory_code: c.inventory_code || `BOOK-${String(idx + 1).padStart(6, "0")}`,
    qr_token: c.qr_token || c.inventory_code || `BOOK-${String(idx + 1).padStart(6, "0")}`,
    location: c.location,
  }));
}

export async function setCopyStatus(copyId: string, status: BookCopy["status"]) {
  const session = await assertRole("admin");
  if (status === "BORROWED") throw new Error("Status Dipinjam hanya lewat transaksi.");
  const svc = serviceClient();
  const { data: active } = await svc
    .from("loans")
    .select("id")
    .eq("book_copy_id", copyId)
    .in("status", ["ACTIVE", "OVERDUE"])
    .limit(1);
  if (active?.length) {
    throw new Error("Eksemplar masih dalam peminjaman aktif.");
  }
  const { error } = await svc.from("book_copies").update({ status }).eq("id", copyId);
  if (error) throw new Error("Gagal mengubah status.");
  await tulisAudit(session.userId, "copy.status", "book_copy", copyId, { status });
  revalidatePath("/admin");
  revalidatePath("/admin/copies");
  revalidateTag("admin-dashboard", { expire: 0 });
}

export async function listCopies(opts: {
  q?: string;
  status?: string;
  bookId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: BookCopy[]; total: number; page: number; pageCount: number }> {
  await assertRole("admin");
  const svc = serviceClient();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 25;
  let query = svc
    .from("book_copies")
    .select("id, book_id, inventory_code, qr_token, condition, location, status, books(title)", { count: "exact" });
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.bookId) query = query.eq("book_id", opts.bookId);
  const q = opts.q ? sanitizeSearchTerm(opts.q) : "";
  if (q) query = query.or(`inventory_code.ilike.%${q}%,qr_token.ilike.%${q}%`);
  const { data, count } = await query
    .order("inventory_code")
    .range((page - 1) * pageSize, page * pageSize - 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((c: any) => ({
    id: c.id,
    book_id: c.book_id,
    book_title: c.books?.title ?? "—",
    inventory_code: c.inventory_code,
    qr_token: c.qr_token,
    condition: c.condition,
    location: c.location,
    status: c.status,
  }));
  const total = count ?? rows.length;
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function adminSearchBooks(q: string, page = 1, pageSize = 25) {
  await assertRole("admin");
  const svc = serviceClient();
  let query = svc
    .from("books")
    .select("id, isbn, title, author, publisher, publication_year, category_id, cover_url, categories(name)", { count: "exact" });
  const term = sanitizeSearchTerm(q);
  if (term) {
    const like = `%${term}%`;
    query = query.or(`title.ilike.${like},author.ilike.${like},isbn.ilike.${like}`);
  }
  const { data, count } = await query
    .order("title")
    .range((page - 1) * pageSize, page * pageSize - 1);
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
  const books: Book[] = (data ?? []).map((b) => {
    const s = byBook.get(b.id) ?? { total: 0, avail: 0 };
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
      total_copies: s.total,
      available_copies: s.avail,
    };
  });
  const total = count ?? 0;
  return { books, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
