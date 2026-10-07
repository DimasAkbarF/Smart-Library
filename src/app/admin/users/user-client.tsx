"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createUser, setUserStatus } from "@/features/admin/users";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { pesanRamah, kodeDariError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export function UsersSection({ users }: { users: Profile[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle(u: Profile) {
    setMsg(null);
    try {
      await setUserStatus(u.id, u.status === "active" ? "inactive" : "active");
      router.refresh();
    } catch (e) {
      setMsg(pesanRamah(kodeDariError(e), e instanceof Error ? e.message : undefined));
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {msg ? (
          <p role="alert" className="text-sm font-semibold text-coral-deep">
            {msg}
          </p>
        ) : (
          <span />
        )}
        <Button type="button" onClick={() => setOpen(true)}>
          Tambah Pengguna
        </Button>
      </div>

      <DataTable<Profile>
        columns={[
          {
            header: "Nama Pengguna",
            cell: (u) => {
              const initials = u.full_name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase() || "US";
              const isAdmin = u.role === "admin";
              return (
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold border",
                      isAdmin
                        ? "bg-berry-soft text-berry border-berry/30"
                        : "bg-sky-soft text-sky-deep border-sky/20"
                    )}
                  >
                    {initials}
                  </span>
                  <div>
                    <span className="block font-semibold text-ink text-sm">{u.full_name}</span>
                    <span className="block font-mono text-xs text-ink-muted">@{u.username}</span>
                  </div>
                </div>
              );
            },
          },
          {
            header: "Hak Akses / Peran",
            cell: (u) => {
              if (u.role === "admin") {
                return (
                  <span className="inline-flex items-center rounded-full bg-berry-soft border border-berry/30 px-2.5 py-0.5 text-xs font-semibold text-berry">
                    Admin Data
                  </span>
                );
              }
              if (u.role === "librarian") {
                return (
                  <span className="inline-flex items-center rounded-full bg-sky-soft border border-sky/30 px-2.5 py-0.5 text-xs font-semibold text-sky-deep">
                    Petugas Perpustakaan
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center rounded-full bg-surface-sunken border border-outline px-2.5 py-0.5 text-xs font-medium text-ink">
                  Siswa
                </span>
              );
            },
          },
          {
            header: "Status Akun",
            cell: (u) =>
              u.status === "active" ? (
                <StatusChip tone="leaf" label="Aktif" />
              ) : (
                <StatusChip tone="muted" label="Nonaktif" />
              ),
          },
          {
            header: "Aksi",
            cell: (u) => (
              <button
                type="button"
                onClick={() => toggle(u)}
                className="rounded-md border border-outline px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface hover:text-sky-deep transition-colors"
              >
                {u.status === "active" ? "Nonaktifkan" : "Aktifkan"}
              </button>
            ),
          },
        ]}
        rows={users}
        page={1}
        pageCount={1}
        baseUrl="/admin/users"
        totalLabel={`${users.length} pengguna terdaftar`}
      />

      <Dialog open={open} onClose={() => setOpen(false)} title="Tambah pengguna">
        <UserForm
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </div>
  );
}

function UserForm({ onDone }: { onDone: () => void }) {
  const [state, formAction] = useActionState(async (prev: { message?: string; ok?: boolean }, fd: FormData) => {
    const res = await createUser(prev, fd);
    if (res.ok) onDone();
    return res;
  }, {});

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="Nama lengkap">
        <Input name="full_name" required placeholder="Nama lengkap" />
      </Field>
      <Field label="Username" hint="Huruf kecil, angka, titik, strip. Minimal 3 karakter.">
        <Input name="username" required placeholder="cth. pustaka01" />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" required placeholder="nama@sekolah.sch.id" />
      </Field>
      <Field label="Kata sandi awal">
        <Input name="password" type="password" required minLength={6} placeholder="Minimal 6 karakter" />
      </Field>
      <Field label="Peran">
        <Select name="role" defaultValue="librarian">
          <option value="librarian">Penjaga</option>
          <option value="admin">Admin Data</option>
        </Select>
      </Field>
      {state?.message && (
        <p role="alert" className="text-sm font-semibold text-coral-deep">
          {state.message}
        </p>
      )}
      <SubmitButton>Buat akun</SubmitButton>
    </form>
  );
}
