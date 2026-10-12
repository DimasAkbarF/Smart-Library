"use server";

import { serviceClient } from "@/lib/supabase/service";
import { assertRole } from "@/lib/auth";
import { sanitizeSearchTerm } from "@/lib/utils";

export interface GlobalSearchResult {
  books: {
    id: string;
    title: string;
    author: string;
    isbn: string | null;
    category_name: string | null;
    available_copies: number;
    total_copies: number;
  }[];
  students: {
    id: string;
    nis: string;
    name: string;
    class_name: string | null;
    status: string;
  }[];
  transactions: {
    id: string;
    student_name: string;
    student_nis: string;
    book_title: string;
    inventory_code: string;
    status: string;
    due_at: string;
  }[];
}

export async function searchGlobal(q: string): Promise<GlobalSearchResult> {
  const session = await assertRole("student", "admin");
  const query = sanitizeSearchTerm(q);
  if (!query || query.length < 2) {
    return { books: [], students: [], transactions: [] };
  }

  const svc = serviceClient();
  const pattern = `%${query}%`;
  const isAdmin = session.profile.role === "admin";

  // Hanya admin yang berhak mencari data siswa dan transaksi peminjaman
  const [booksRes, studentsRes, loansRes] = await Promise.all([
    svc
      .from("books")
      .select("id, title, author, isbn, categories(name)")
      .or(`title.ilike.${pattern},author.ilike.${pattern},isbn.ilike.${pattern}`)
      .limit(6),
    isAdmin
      ? svc
          .from("students")
          .select("id, nis, name, status, classes(name)")
          .or(`name.ilike.${pattern},nis.ilike.${pattern}`)
          .limit(6)
      : Promise.resolve({ data: [] }),
    isAdmin
      ? svc
          .from("loans")
          .select("id, status, due_at, students!inner(name, nis), book_copies!inner(inventory_code, books!inner(title))")
          .or(`students.name.ilike.${pattern},students.nis.ilike.${pattern},book_copies.inventory_code.ilike.${pattern},book_copies.books.title.ilike.${pattern}`)
          .order("borrowed_at", { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] }),
  ]);

  // Count copies for matching books
  const bookIds = (booksRes.data ?? []).map((b) => b.id);
  const { data: copyStats } = bookIds.length
    ? await svc.from("book_copies").select("book_id, status").in("book_id", bookIds)
    : { data: [] };

  const copyCounts = new Map<string, { total: number; avail: number }>();
  for (const c of copyStats ?? []) {
    const cur = copyCounts.get(c.book_id) ?? { total: 0, avail: 0 };
    cur.total += 1;
    if (c.status === "AVAILABLE") cur.avail += 1;
    copyCounts.set(c.book_id, cur);
  }

  const books = (booksRes.data ?? []).map((b) => {
    const counts = copyCounts.get(b.id) ?? { total: 0, avail: 0 };
    return {
      id: b.id,
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      category_name: (b.categories as any)?.name ?? null,
      available_copies: counts.avail,
      total_copies: counts.total,
    };
  });

  const students = (studentsRes.data ?? []).map((s) => ({
    id: s.id,
    nis: s.nis,
    name: s.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    class_name: (s.classes as any)?.name ?? null,
    status: s.status,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions = (loansRes.data ?? []).map((l: any) => ({
    id: l.id,
    student_name: l.students?.name ?? "—",
    student_nis: l.students?.nis ?? "—",
    book_title: l.book_copies?.books?.title ?? "—",
    inventory_code: l.book_copies?.inventory_code ?? "—",
    status: l.status,
    due_at: l.due_at,
  }));

  return { books, students, transactions };
}
