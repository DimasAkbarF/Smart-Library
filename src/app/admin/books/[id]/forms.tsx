"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateBook, deleteBook, addCopies, type CreatedCopyInfo } from "@/features/admin/books";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { QrQuickViewButton } from "@/components/library/qr-modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { CheckCircle2 } from "lucide-react";
import { pesanRamah, kodeDariError } from "@/lib/errors";
import type { Book, Category } from "@/lib/types";

export function BookEditForm({ book, categories }: { book: Book; categories: Category[] }) {
  const action = updateBook.bind(null, book.id);
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="Judul">
        <Input name="title" required defaultValue={book.title} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Penulis">
          <Input name="author" defaultValue={book.author} />
        </Field>
        <Field label="Penerbit">
          <Input name="publisher" defaultValue={book.publisher ?? ""} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tahun terbit">
          <Input name="publication_year" inputMode="numeric" defaultValue={book.publication_year ?? ""} />
        </Field>
        <Field label="ISBN">
          <Input name="isbn" defaultValue={book.isbn ?? ""} />
        </Field>
      </div>
      <Field label="Kategori">
        <Select name="category_id" defaultValue={book.category_id ?? ""}>
          <option value="">Tanpa kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="URL sampul">
        <Input name="cover_url" defaultValue={book.cover_url ?? ""} />
      </Field>
      {state?.message && (
        <p role="alert" className="text-body font-semibold text-danger">
          {state.message}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-body font-semibold text-success">
          Perubahan berhasil disimpan.
        </p>
      )}
      <div>
        <SubmitButton>Simpan perubahan</SubmitButton>
      </div>
    </form>
  );
}

export function AddCopiesForm({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recentCopies, setRecentCopies] = useState<CreatedCopyInfo[]>([]);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setMsg(null);
    try {
      const copies = await addCopies(bookId, Number(formData.get("count") ?? 1) || 1, String(formData.get("location") ?? ""));
      setRecentCopies(copies);
      router.refresh();
    } catch (e) {
      setMsg(pesanRamah(kodeDariError(e), e instanceof Error ? e.message : undefined));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Jumlah">
          <Input name="count" inputMode="numeric" defaultValue="1" required />
        </Field>
        <Field label="Lokasi">
          <Input name="location" placeholder="cth. RAK-A1" />
        </Field>
      </div>
      {msg && (
        <p role="alert" className="text-body font-semibold text-danger">
          {msg}
        </p>
      )}

      {recentCopies.length > 0 && (
        <div className="rounded-lg border border-success-line/40 bg-success-bg/40 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-success font-semibold text-meta">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{recentCopies.length} Eksemplar baru berhasil ditambahkan beserta QR Code:</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {recentCopies.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1.5 rounded bg-white px-2.5 py-1 border border-outline text-label"
              >
                <span className="font-mono font-bold text-ink">{c.inventory_code}</span>
                <QrQuickViewButton
                  title="Eksemplar Buku"
                  code={c.inventory_code}
                  token={c.qr_token}
                  meta={c.location ? `Rak: ${c.location}` : undefined}
                  type="book"
                  label="QR"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Button type="submit" variant="secondary" size="sm" disabled={busy}>
          {busy ? "Memproses…" : "Tambah eksemplar & buat QR"}
        </Button>
      </div>
    </form>
  );
}

export function DeleteBookButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [msg, setMsg] = useState<string | null>(null);

  async function onDelete() {
    const ok = await confirm({
      title: "Hapus Buku & Seluruh Eksemplar",
      message: "Hapus buku ini beserta seluruh eksemplar fisiknya dari sistem perpustakaan? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.",
      confirmText: "Ya, Hapus Buku",
      cancelText: "Batal",
      tone: "danger",
    });
    if (!ok) return;
    const res = await deleteBook(bookId);
    if (res.ok) {
      router.push("/admin/books");
    } else {
      setMsg(res.message ?? "Gagal menghapus buku.");
    }
  }

  return (
    <div>
      <Button type="button" variant="danger" size="sm" onClick={onDelete}>
        Hapus buku
      </Button>
      {msg && (
        <p role="alert" className="mt-2 text-body font-semibold text-danger">
          {msg}
        </p>
      )}
      <p className="mt-2 text-body text-ink-subtle">
        <Link href="/admin/books" className="underline">
          Kembali ke daftar
        </Link>
      </p>
    </div>
  );
}
