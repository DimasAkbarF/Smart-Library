"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { supabaseConfigured } from "@/lib/supabase/env";
import { ROLE_HOME } from "@/lib/types";

const GAGAL = "NIS / username atau password belum sesuai. Periksa kembali lalu coba lagi.";

const LoginSchema = z.object({
  identifier: z.string().trim().min(1, "Isi NIS atau username."),
  password: z.string().min(1, "Isi password."),
});

export interface LoginState {
  message?: string;
}

/** Login dengan username ATAU email. Rate-limit dasar: jeda progresif di UI. */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Data masuk belum lengkap." };
  }
  if (!supabaseConfigured) {
    return { message: "Server belum terhubung ke database. Hubungi admin perpustakaan." };
  }

  let email = parsed.data.identifier;
  if (!email.includes("@")) {
    const svc = serviceClient();
    const { data, error: lookupError } = await svc
      .from("profiles")
      .select("email")
      .eq("username", email.toLowerCase())
      .single();
    if (lookupError) {
      console.error("login: lookup username gagal", lookupError.message);
      return { message: "Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi." };
    }
    if (!data?.email) return { message: GAGAL };
    email = data.email;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  }).catch((e: unknown) => ({ error: e as Error }));
  if (error) {
    // Jangan bocorkan apakah akun ada — pesan sama untuk semua kegagalan.
    console.error("login gagal:", error.message);
    return { message: GAGAL };
  }

  // Arahkan sesuai role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const svc = serviceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("role, status")
    .eq("id", user!.id)
    .single();
  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return {
      message: "Akun ini sedang tidak aktif. Silakan hubungi admin perpustakaan.",
    };
  }
  redirect(ROLE_HOME[profile.role as keyof typeof ROLE_HOME]);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
