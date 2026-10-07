"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serviceClient } from "@/lib/supabase/service";
import { assertRole, tulisAudit } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export async function listUsers(): Promise<Profile[]> {
  await assertRole("admin");
  const svc = serviceClient();
  const { data } = await svc
    .from("profiles")
    .select("id, username, email, full_name, role, status")
    .order("full_name");
  return (data ?? []) as Profile[];
}

const UserSchema = z.object({
  username: z.string().trim().min(3, "Username minimal 3 karakter.").regex(/^[a-z0-9._-]+$/, "Username hanya huruf kecil, angka, titik, strip."),
  full_name: z.string().trim().min(1, "Nama wajib diisi."),
  email: z.string().trim().email("Email tidak valid."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
  role: z.enum(["librarian", "admin"]),
});

export async function createUser(
  _prev: { message?: string; ok?: boolean },
  formData: FormData,
): Promise<{ message?: string; ok?: boolean }> {
  const session = await assertRole("admin");
  const parsed = UserSchema.safeParse({
    username: formData.get("username"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message };
  const svc = serviceClient();

  const { data: created, error } = await svc.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (error || !created.user) {
    return { message: "Gagal membuat akun. Email mungkin sudah dipakai." };
  }
  const { error: pErr } = await svc.from("profiles").insert({
    id: created.user.id,
    username: parsed.data.username.toLowerCase(),
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    role: parsed.data.role,
  });
  if (pErr) {
    await svc.auth.admin.deleteUser(created.user.id);
    return { message: "Username sudah dipakai." };
  }
  await tulisAudit(session.userId, "user.create", "user", created.user.id, {
    username: parsed.data.username,
    role: parsed.data.role,
  });
  revalidatePath("/admin");
  return { ok: true };
}

export async function setUserStatus(id: string, status: "active" | "inactive") {
  const session = await assertRole("admin");
  if (session.userId === id) throw new Error("Tidak dapat menonaktifkan akun sendiri.");
  const svc = serviceClient();
  const { error } = await svc.from("profiles").update({ status }).eq("id", id);
  if (error) throw new Error("Gagal mengubah status pengguna.");
  await tulisAudit(session.userId, "user.status", "user", id, { status });
  revalidatePath("/admin");
}
