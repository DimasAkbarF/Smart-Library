"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createUser, resetUserPassword, setUserStatus } from "@/features/admin/users";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { pesanRamah, kodeDariError } from "@/lib/errors";
import { PASSWORD_POLICY } from "@/lib/password";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export function UsersSection({ users }: { users: Profile[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "danger" | "success" } | null>(null);

  async function toggle(u: Profile) {
    setMsg(null);
    try {
      await setUserStatus(u.id, u.status === "active" ? "inactive" : "active");
      router.refresh();
    } catch (e) {
      setMsg({ text: pesanRamah(kodeDariError(e), e instanceof Error ? e.message : undefined), tone: "danger" });
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {msg ? (
          <p
            role="alert"
            className={cn("text-body font-semibold", msg.tone === "success" ? "text-success" : "text-danger")}
          >
            {msg.text}
          </p>
        ) : (
          <span />
        )}
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full sm:w-auto min-h-tap-min justify-center font-semibold"
        >
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
                      "flex size-8 shrink-0 items-center justify-center rounded-btn font-display text-label font-bold border",
                      isAdmin
                        ? "bg-primary-soft text-primary border-primary/20"
                        : "bg-surface-sunken-ed text-ink-muted border-rule"
                    )}
                  >
                    {initials}
                  </span>
                  <div>
                    <span className="block font-semibold text-ink text-body">{u.full_name}</span>
                    <span className="block font-mono text-meta text-ink-muted">@{u.username}</span>
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
                  <span className="inline-flex items-center rounded-chip bg-primary-soft border border-primary/25 px-2 py-0.5 text-label font-semibold text-primary">
                    Administrator
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center rounded-chip bg-surface-sunken-ed border border-rule px-2 py-0.5 text-label font-medium text-ink">
                  Siswa
                </span>
              );
            },
          },
          {
            header: "Status Akun",
            cell: (u) =>
              u.status === "active" ? (
                <StatusChip tone="success" label="Aktif" />
              ) : (
                <StatusChip tone="muted" label="Nonaktif" />
              ),
          },
          {
            header: "Aksi",
            cell: (u) => (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggle(u)}
                  className="inline-flex min-h-[36px] items-center justify-center rounded-btn border border-rule px-3 py-1.5 text-label font-semibold text-ink hover:bg-card hover:text-primary transition-colors active:bg-surface-sunken-ed"
                >
                  {u.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <button
                  type="button"
                  onClick={() => setResetTarget(u)}
                  className="inline-flex min-h-[36px] items-center justify-center rounded-btn border border-rule px-3 py-1.5 text-label font-semibold text-ink hover:bg-card hover:text-primary transition-colors active:bg-surface-sunken-ed"
                >
                  Reset Kata Sandi
                </button>
              </div>
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

      <Dialog open={!!resetTarget} onClose={() => setResetTarget(null)} title="Reset kata sandi">
        {resetTarget && (
          <ResetPasswordForm
            user={resetTarget}
            onDone={(text) => {
              setResetTarget(null);
              setMsg({ text, tone: "success" });
              router.refresh();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function ResetPasswordForm({ user, onDone }: { user: Profile; onDone: (msg: string) => void }) {
  const [state, formAction] = useActionState(
    async (prev: { message?: string }, fd: FormData) => {
      const password = String(fd.get("new-password") ?? "");
      try {
        await resetUserPassword(user.id, password);
        onDone(
          `Kata sandi ${user.full_name} berhasil diubah. Pengguna akan diminta mengganti kata sandi saat login berikutnya.`,
        );
        return {};
      } catch (e) {
        return { message: pesanRamah(kodeDariError(e), e instanceof Error ? e.message : undefined) };
      }
    },
    {},
  );

  return (
    <form action={formAction} className="grid gap-4">
      <p className="text-body text-ink-muted">
        Kata sandi untuk <span className="font-semibold text-ink">{user.full_name}</span> (@
        {user.username}). Pengguna tetap diminta mengganti kata sandinya saat login berikutnya.
      </p>
      <Field
        label="Kata sandi baru"
        hint={`Minimal ${PASSWORD_POLICY.minLength} karakter, minimal ${PASSWORD_POLICY.minClasses} jenis karakter (huruf besar, huruf kecil, angka, simbol), bukan kata sandi umum, tidak boleh sama dengan username atau email.`}
      >
        <Input
          name="new-password"
          type="password"
          required
          minLength={PASSWORD_POLICY.minLength}
          autoComplete="new-password"
          placeholder="Kata sandi baru"
        />
      </Field>
      {state?.message && (
        <p role="alert" className="text-body font-semibold text-danger">
          {state.message}
        </p>
      )}
      <SubmitButton>Simpan Kata Sandi</SubmitButton>
    </form>
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
      <Field
        label="Kata sandi awal"
        hint={`Minimal ${PASSWORD_POLICY.minLength} karakter, minimal ${PASSWORD_POLICY.minClasses} jenis karakter. Pengguna wajib menggantinya saat login.`}
      >
        <Input
          name="password"
          type="password"
          required
          minLength={PASSWORD_POLICY.minLength}
          autoComplete="new-password"
          placeholder={`Minimal ${PASSWORD_POLICY.minLength} karakter`}
        />
      </Field>
      <Field label="Peran">
        <Select name="role" defaultValue="admin">
          <option value="admin">Administrator</option>
        </Select>
      </Field>
      {state?.message && (
        <p role="alert" className="text-body font-semibold text-danger">
          {state.message}
        </p>
      )}
      <SubmitButton>Buat akun</SubmitButton>
    </form>
  );
}
