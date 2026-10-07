"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { assertRole, tulisAudit } from "@/lib/auth";
import { normalisasiKode } from "@/lib/format";
import type { ImportReport } from "@/features/admin/students";

export interface ImportBookRow {
  title: string;
  author?: string;
  publisher?: string;
  year?: string;
  isbn?: string;
  category?: string;
  quantity?: string;
  location?: string;
}

/**
 * Import buku: judul yang sudah ada (cocok judul+penulis) hanya ditambah
 * eksemplarnya; judul baru dibuat beserta eksemplarnya.
 */
export async function importBooks(
  rows: ImportBookRow[],
): Promise<ImportReport & { addedCopies: number; newTitles: number }> {
  const session = await assertRole("admin");
  const svc = serviceClient();
  const failed: ImportReport["failed"] = [];
  let newTitles = 0;
  let addedCopies = 0;

  const { data: categories } = await svc.from("categories").select("id, name");
  const catByName = new Map((categories ?? []).map((c) => [c.name.toLowerCase(), c.id]));

  const { data: existingBooks } = await svc.from("books").select("id, title, author");
  const bookByKey = new Map(
    (existingBooks ?? []).map((b) => [`${b.title.toLowerCase()}|${b.author.toLowerCase()}`, b.id]),
  );
  const inFile = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNo = i + 2;
    const title = (r.title ?? "").trim();
    if (!title) {
      failed.push({ row: rowNo, nis: "", reason: "Judul wajib diisi." });
      continue;
    }
    const author = (r.author ?? "").trim() || "Tanpa penulis";
    const key = `${title.toLowerCase()}|${author.toLowerCase()}`;
    const qty = Math.min(500, Math.max(1, parseInt(r.quantity ?? "1", 10) || 1));
    const year = r.year ? parseInt(r.year, 10) : NaN;

    let bookId = bookByKey.get(key) ?? null;
    if (!bookId && inFile.has(key)) {
      // judul baru yang sama dalam file: samakan ke insert sebelumnya
      bookId = bookByKey.get(key) ?? null;
    }

    let categoryId: string | null = null;
    const catName = (r.category ?? "").trim().toLowerCase();
    if (catName) {
      categoryId = catByName.get(catName) ?? null;
      if (!categoryId) {
        const { data: nc } = await svc
          .from("categories")
          .insert({ name: (r.category ?? "").trim() })
          .select("id")
          .single();
        if (nc) {
          categoryId = nc.id;
          catByName.set(catName, nc.id);
        }
      }
    }

    if (!bookId) {
      const { data: nb, error } = await svc
        .from("books")
        .insert({
          title,
          author,
          publisher: (r.publisher ?? "").trim() || null,
          publication_year: Number.isNaN(year) ? null : year,
          isbn: (r.isbn ?? "").replace(/[-\s]/g, "") || null,
          category_id: categoryId,
        })
        .select("id")
        .single();
      if (error || !nb) {
        failed.push({ row: rowNo, nis: title, reason: "Gagal menyimpan judul." });
        continue;
      }
      bookId = nb.id;
      bookByKey.set(key, bookId);
      inFile.add(key);
      newTitles += 1;
    }

    const { error: copyErr } = await svc.from("book_copies").insert(
      Array.from({ length: qty }, () => ({
        book_id: bookId,
        inventory_code: "",
        qr_token: "",
        location: (r.location ?? "").trim() || null,
      })),
    );
    if (copyErr) {
      failed.push({ row: rowNo, nis: title, reason: "Judul tersimpan, eksemplar gagal dibuat." });
    } else {
      addedCopies += qty;
    }
    void normalisasiKode;
  }

  await tulisAudit(session.userId, "import.books", "book", "batch", {
    newTitles,
    addedCopies,
    failed: failed.length,
  });
  revalidatePath("/admin");
  return { inserted: newTitles, failed, addedCopies, newTitles };
}
