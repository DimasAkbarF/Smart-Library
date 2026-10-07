import { listCategories } from "@/features/catalog/queries";
import { BookCreateForm } from "./form";

export default async function NewBookPage() {
  const categories = await listCategories();
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-bold">Tambah buku</h1>
        <p className="text-ink-muted">Isi data buku dan jumlah eksemplar awal.</p>
      </div>
      <BookCreateForm categories={categories} />
    </div>
  );
}

export const dynamic = "force-dynamic";
