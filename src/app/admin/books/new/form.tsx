"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createBookWithCopies } from "@/features/admin/books";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Category } from "@/lib/types";

export function BookCreateForm({ categories }: { categories: Category[] }) {
  const [state, action] = useActionState(createBookWithCopies, {});

  return (
    <form action={action} className="grid max-w-2xl gap-4">
      <Field label="Judul">
        <Input name="title" required placeholder="Judul buku" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Penulis">
          <Input name="author" placeholder="Nama penulis" />
        </Field>
        <Field label="Penerbit">
          <Input name="publisher" placeholder="Penerbit" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tahun terbit">
          <Input name="publication_year" inputMode="numeric" placeholder="2024" />
        </Field>
        <Field label="ISBN">
          <Input name="isbn" placeholder="ISBN" />
        </Field>
      </div>
      <Field label="Kategori">
        <Select name="category_id" defaultValue="">
          <option value="">Tanpa kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="URL sampul (opsional)">
        <Input name="cover_url" type="url" placeholder="https://…" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jumlah eksemplar">
          <Input name="copy_count" inputMode="numeric" defaultValue="1" required />
        </Field>
        <Field label="Lokasi rak">
          <Input name="location" placeholder="cth. RAK-A1" />
        </Field>
      </div>

      {state?.message && (
        <p role="alert" className="text-sm font-semibold text-coral-deep">
          {state.message}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="rounded-md bg-leaf-soft px-4 py-3 text-sm font-semibold text-leaf-deep">
          Buku berhasil disimpan.{" "}
          <Link href="/admin/books" className="underline">
            Kembali ke daftar buku
          </Link>
          .
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton>Simpan buku</SubmitButton>
        <Link
          href="/admin/books"
          className="inline-flex min-h-12 items-center rounded-md border border-outline px-5 font-display font-semibold hover:bg-surface"
        >
          Batal
        </Link>
      </div>
    </form>
  );
}
