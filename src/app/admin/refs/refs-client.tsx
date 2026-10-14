"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory, deleteCategory, createClass, deleteClass } from "@/features/admin/refs";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { pesanRamah, kodeDariError } from "@/lib/errors";
import type { Category, ClassRow } from "@/lib/types";

function useRefOp() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setMsg(pesanRamah(kodeDariError(e), e instanceof Error ? e.message : undefined));
    } finally {
      setBusy(false);
    }
  }
  return { msg, busy, run };
}

export function CategoryPanel({ categories }: { categories: Category[] }) {
  const { msg, busy, run } = useRefOp();

  return (
    <section className="rounded-card border border-rule bg-card p-5 shadow-card">
      <h2 className="font-bold">Kategori</h2>
      <form
        action={(fd) => run(() => createCategory(String(fd.get("name") ?? "")))}
        className="mt-3 flex gap-2"
      >
        <Field label="Nama kategori baru" className="flex-1">
          <Input name="name" required placeholder="cth. Fiksi" />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="secondary" disabled={busy} className="h-11 sm:h-10 min-h-10">
            {busy ? "…" : "Tambah"}
          </Button>
        </div>
      </form>
      {msg && (
        <p role="alert" className="mt-2 text-body font-semibold text-danger">
          {msg}
        </p>
      )}
      <ul className="mt-3 divide-y divide-rule">
        {categories.length === 0 && <li className="py-2 text-ink-muted">Belum ada kategori.</li>}
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 py-2">
            <span>{c.name}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Hapus kategori "${c.name}"?`)) run(() => deleteCategory(c.id));
              }}
              className="inline-flex min-h-[36px] items-center justify-center rounded-btn border border-rule px-3 py-1 text-label font-semibold text-danger hover:bg-danger-bg disabled:opacity-50 active:bg-danger/10"
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ClassPanel({ classes }: { classes: ClassRow[] }) {
  const { msg, busy, run } = useRefOp();

  return (
    <section className="rounded-card border border-rule bg-card p-5 shadow-card">
      <h2 className="font-bold">Kelas</h2>
      <form
        action={(fd) => run(() => createClass(String(fd.get("name") ?? "")))}
        className="mt-3 flex gap-2"
      >
        <Field label="Nama kelas baru" className="flex-1">
          <Input name="name" required placeholder="cth. 8A" />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="secondary" disabled={busy} className="h-11 sm:h-10 min-h-10">
            {busy ? "…" : "Tambah"}
          </Button>
        </div>
      </form>
      {msg && (
        <p role="alert" className="mt-2 text-body font-semibold text-danger">
          {msg}
        </p>
      )}
      <ul className="mt-3 divide-y divide-rule">
        {classes.length === 0 && <li className="py-2 text-ink-muted">Belum ada kelas.</li>}
        {classes.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 py-2">
            <span className="font-mono font-semibold">{c.name}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Hapus kelas "${c.name}"?`)) run(() => deleteClass(c.id));
              }}
              className="inline-flex min-h-[36px] items-center justify-center rounded-btn border border-rule px-3 py-1 text-label font-semibold text-danger hover:bg-danger-bg disabled:opacity-50 active:bg-danger/10"
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
