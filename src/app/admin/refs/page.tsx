import { listCategories } from "@/features/catalog/queries";
import { listClasses } from "@/features/admin/students";
import { CategoryPanel, ClassPanel } from "./refs-client";

export default async function RefsPage() {
  const [categories, classes] = await Promise.all([listCategories(), listClasses()]);
  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-display-sm font-bold">Referensi</h1>
        <p className="text-ink-muted">Kelola kategori buku dan kelas.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryPanel categories={categories} />
        <ClassPanel classes={classes} />
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
