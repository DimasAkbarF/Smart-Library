import { notFound } from "next/navigation";
import { CopyStatusChip } from "@/components/ui/status-chip";
import { getBookDetail } from "@/features/catalog/queries";
import { listCopies } from "@/features/admin/books";

export default async function LibrarianBookDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBookDetail(id);
  if (!book) notFound();
  const copies = await listCopies({ bookId: id, pageSize: 50 });

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-2xl font-bold">{book.title}</h1>
        <p className="mt-1 text-ink-muted">
          {book.author}
          {book.category_name ? ` · ${book.category_name}` : ""}
          {book.publication_year ? ` · ${book.publication_year}` : ""}
        </p>
        <p className="mt-1 font-mono text-sm text-ink-subtle">
          {book.available_copies}/{book.total_copies} tersedia
          {book.isbn ? ` · ISBN ${book.isbn}` : ""}
        </p>
      </div>

      <section aria-label="Daftar eksemplar" className="grid gap-2">
        <h2 className="font-display text-lg font-bold">Eksemplar ({copies.total})</h2>
        {copies.rows.length === 0 ? (
          <p className="rounded-card border border-outline px-5 py-4 text-ink-muted">
            Belum ada eksemplar untuk buku ini.
          </p>
        ) : (
          <ul className="grid gap-2">
            {copies.rows.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-outline px-4 py-3"
              >
                <span className="font-mono font-semibold">{c.inventory_code}</span>
                <span className="flex items-center gap-2">
                  {c.location && <span className="text-sm text-ink-muted">{c.location}</span>}
                  <CopyStatusChip status={c.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
