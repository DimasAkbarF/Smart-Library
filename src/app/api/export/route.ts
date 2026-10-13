import { requireApiRole } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";

function csvCell(v: unknown): string {
  let s = String(v ?? "");
  // Netralkan potensi CSV Formula Injection (Excel / LibreOffice Calc)
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: (unknown[] | Record<string, unknown>)[]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const r of rows) {
    const vals = Array.isArray(r) ? r : headers.map((h) => (r as Record<string, unknown>)[h]);
    lines.push(vals.map(csvCell).join(","));
  }
  return "\ufeff" + lines.join("\n"); // UTF-8 BOM
}

export async function GET(req: Request) {
  // Verifikasi Otorisasi: Hanya role 'admin' yang diizinkan mengunduh data perpustakaan
  const auth = await requireApiRole("admin");
  if (!auth.ok) {
    return new Response(
      JSON.stringify({
        error: auth.message,
        statusCode: auth.status,
      }),
      {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const type = new URL(req.url).searchParams.get("type");
  const status = new URL(req.url).searchParams.get("status") ?? "";
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().toLowerCase();
  const svc = serviceClient();

  if (type === "loans") {
    let query = svc
      .from("loans")
      .select("borrowed_at, due_at, returned_at, status, fine_amount, students(name, nis), book_copies(inventory_code, books(title))")
      .order("borrowed_at", { ascending: false })
      .limit(5000);
    if (status) query = query.eq("status", status);
    const { data } = await query;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rows = (data ?? []).map((l: any) => ({
      dipinjam: l.borrowed_at,
      jatuh_tempo: l.due_at,
      dikembalikan: l.returned_at ?? "",
      status: l.status,
      denda: l.fine_amount,
      siswa: l.students?.name ?? "",
      nis: l.students?.nis ?? "",
      kode_buku: l.book_copies?.inventory_code ?? "",
      judul: l.book_copies?.books?.title ?? "",
    }));
    if (q) {
      rows = rows.filter((r) =>
        [r.siswa, r.nis, r.judul, r.kode_buku].some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    const headers = ["dipinjam", "jatuh_tempo", "dikembalikan", "status", "denda", "siswa", "nis", "kode_buku", "judul"];
    return csvResponse(toCsv(headers, rows), "transaksi.csv");
  }

  if (type === "books") {
    const { data } = await svc
      .from("books")
      .select("isbn, title, author, publisher, publication_year, categories(name)")
      .order("title")
      .limit(5000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []).map((b: any) => ({
      isbn: b.isbn ?? "",
      judul: b.title,
      penulis: b.author,
      penerbit: b.publisher ?? "",
      tahun: b.publication_year ?? "",
      kategori: b.categories?.name ?? "",
    }));
    return csvResponse(toCsv(["isbn", "judul", "penulis", "penerbit", "tahun", "kategori"], rows), "buku.csv");
  }

  if (type === "students") {
    const { data } = await svc
      .from("students")
      .select("nis, name, status, qr_token, classes(name)")
      .order("name")
      .limit(5000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (data ?? []).map((s: any) => ({
      nis: s.nis,
      nama: s.name,
      kelas: s.classes?.name ?? "",
      status: s.status,
      qr: s.qr_token,
    }));
    return csvResponse(toCsv(["nis", "nama", "kelas", "status", "qr"], rows), "siswa.csv");
  }

  return new Response(JSON.stringify({ error: "Tipe ekspor tidak dikenal." }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
