"use server";

import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { assertRole, tulisAudit } from "@/lib/auth";

export async function createCategory(name: string) {
  const session = await assertRole("admin");
  const clean = name.trim();
  if (!clean) throw new Error("Nama kategori wajib diisi.");
  const svc = serviceClient();
  const { error } = await svc.from("categories").insert({ name: clean });
  if (error) throw new Error("Kategori sudah ada atau gagal disimpan.");
  await tulisAudit(session.userId, "category.create", "category", clean, {});
  revalidatePath("/admin");
}

export async function deleteCategory(id: string) {
  const session = await assertRole("admin");
  const svc = serviceClient();
  const { error } = await svc.from("categories").delete().eq("id", id);
  if (error) throw new Error("Kategori dipakai buku dan tidak dapat dihapus. Kosongkan dulu bukunya.");
  await tulisAudit(session.userId, "category.delete", "category", id, {});
  revalidatePath("/admin");
}

export async function createClass(name: string) {
  const session = await assertRole("admin");
  const clean = name.trim().toUpperCase();
  if (!clean) throw new Error("Nama kelas wajib diisi.");
  const svc = serviceClient();
  const { error } = await svc.from("classes").insert({ name: clean });
  if (error) throw new Error("Kelas sudah ada atau gagal disimpan.");
  await tulisAudit(session.userId, "class.create", "class", clean, {});
  revalidatePath("/admin");
}

export async function deleteClass(id: string) {
  const session = await assertRole("admin");
  const svc = serviceClient();
  const { count } = await svc.from("students").select("id", { count: "exact", head: true }).eq("class_id", id);
  if ((count ?? 0) > 0) throw new Error("Kelas masih memiliki siswa dan tidak dapat dihapus.");
  const { error } = await svc.from("classes").delete().eq("id", id);
  if (error) throw new Error("Gagal menghapus kelas.");
  await tulisAudit(session.userId, "class.delete", "class", id, {});
  revalidatePath("/admin");
}
