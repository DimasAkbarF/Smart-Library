"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { serviceClient } from "@/lib/supabase/service";
import { assertRole, tulisAudit } from "@/lib/auth";
import { generateTemporaryPassword, validatePassword } from "@/lib/password";
import { generateOtpAuthUri, generateTotpSecret, verifyTotpToken } from "@/lib/totp";
import type { Profile } from "@/lib/types";

export async function listUsers(): Promise<Profile[]> {
  await assertRole("admin");
  const svc = serviceClient();
  const { data } = await svc
    .from("profiles")
    .select("id, username, email, full_name, role, status, must_change_password, totp_enabled")
    .order("full_name");
  return (data ?? []) as Profile[];
}

const UserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .regex(/^[a-z0-9._-]+$/, "Username hanya huruf kecil, angka, titik, strip."),
  full_name: z.string().trim().min(1, "Nama wajib diisi."),
  email: z.string().trim().email("Email tidak valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
  role: z.enum(["admin"]),
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

  // Validasi kekuatan kata sandi
  const pwdCheck = validatePassword(parsed.data.password, {
    username: parsed.data.username,
    email: parsed.data.email,
    fullName: parsed.data.full_name,
  });
  if (!pwdCheck.valid) return { message: pwdCheck.message };

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
    must_change_password: true, // Wajib ganti di login pertama
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
  revalidatePath("/admin/users");
  revalidateTag("profiles", { expire: 0 });
  revalidateTag("admin-dashboard", { expire: 0 });
  return { ok: true };
}

/**
 * Reset kata sandi pengguna oleh admin:
 * Menghasilkan password sementara acak dan mewajibkan ganti password saat login.
 */
export async function resetUserPassword(userId: string): Promise<{ ok: boolean; tempPassword?: string }> {
  const session = await assertRole("admin");
  const tempPassword = generateTemporaryPassword();
  const svc = serviceClient();

  const { error: authErr } = await svc.auth.admin.updateUserById(userId, {
    password: tempPassword,
  });
  if (authErr) throw new Error("Gagal mereset kata sandi pengguna di auth server.");

  await svc.from("profiles").update({ must_change_password: true }).eq("id", userId);

  await tulisAudit(session.userId, "user.reset_password_by_admin", "user", userId, {});
  revalidatePath("/admin/users");
  return { ok: true, tempPassword };
}

/**
 * Inisiasi setup 2FA TOTP untuk akun admin
 */
export async function initiateTotpSetup(userId: string): Promise<{ secret: string; otpauthUri: string }> {
  const session = await assertRole("admin");
  if (session.userId !== userId && session.profile.role !== "admin") {
    throw new Error("Tidak memiliki wewenang untuk mengatur 2FA pengguna ini.");
  }
  const svc = serviceClient();
  const { data: user } = await svc.from("profiles").select("username").eq("id", userId).single();
  if (!user) throw new Error("Pengguna tidak ditemukan.");

  const secret = generateTotpSecret();
  const otpauthUri = generateOtpAuthUri(user.username, secret);

  // Simpan secret sementara
  await svc.from("profiles").update({ totp_secret: secret }).eq("id", userId);

  return { secret, otpauthUri };
}

/**
 * Konfirmasi dan aktifkan 2FA dengan kode token 6 digit
 */
export async function confirmAndEnableTotp(userId: string, token: string): Promise<{ ok: boolean }> {
  const session = await assertRole("admin");
  if (session.userId !== userId && session.profile.role !== "admin") {
    throw new Error("Tidak memiliki wewenang.");
  }
  const svc = serviceClient();
  const { data: user } = await svc.from("profiles").select("totp_secret").eq("id", userId).single();
  if (!user?.totp_secret) throw new Error("Setup 2FA belum diinisiasi.");

  const isValid = verifyTotpToken(user.totp_secret, token);
  if (!isValid) throw new Error("Kode verifikasi 2FA tidak valid.");

  await svc.from("profiles").update({ totp_enabled: true }).eq("id", userId);
  await tulisAudit(session.userId, "user.totp_enabled", "user", userId, {});
  revalidatePath("/admin/users");
  return { ok: true };
}

/**
 * Menonaktifkan 2FA untuk pengguna tertentu
 */
export async function disableTotp(userId: string): Promise<{ ok: boolean }> {
  const session = await assertRole("admin");
  const svc = serviceClient();
  await svc.from("profiles").update({ totp_enabled: false, totp_secret: null }).eq("id", userId);
  await tulisAudit(session.userId, "user.totp_disabled", "user", userId, {});
  revalidatePath("/admin/users");
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
  revalidatePath("/admin/users");
  revalidateTag("profiles", { expire: 0 });
  revalidateTag("admin-dashboard", { expire: 0 });
}
