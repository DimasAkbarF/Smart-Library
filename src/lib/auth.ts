import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { serviceClient } from "@/lib/supabase/service";
import type { Profile, Role } from "@/lib/types";

import { headers } from "next/headers";
import { unstable_cache } from "next/cache";

export interface Session {
  userId: string;
  profile: Profile;
}

export const getCachedProfile = unstable_cache(
  async (userId: string): Promise<Profile | null> => {
    const svc = serviceClient();
    const { data: profile } = await svc
      .from("profiles")
      .select("id, username, email, full_name, role, status, must_change_password, totp_enabled, totp_secret")
      .eq("id", userId)
      .single();
    return (profile as Profile) || null;
  },
  ["user-profile-cache"],
  {
    revalidate: 300,
    tags: ["profiles"],
  },
);

/**
 * Data Access Layer: satu-satunya jalan membaca sesi + profil.
 * Di-cache per request & global profile cache untuk performa < 1ms.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!supabaseConfigured) return null;

  let userId: string | null = null;
  try {
    const headerList = await headers();
    userId = headerList.get("x-user-id");
  } catch {
    // Server action atau context tanpa headers
  }

  if (!userId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    userId = user.id;
  }

  const profile = await getCachedProfile(userId);
  if (!profile || profile.status !== "active") return null;
  return { userId, profile };
});

/** Halaman: wajib login; role di luar daftar dialihkan ke /login. */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.profile.role)) redirect("/login");
  return session;
}

/** Server action / query: wajib login + role, tanpa redirect (lempar kode). */
export async function assertRole(...roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.profile.role)) redirect("/login");
  if (session.profile.status !== "active") redirect("/login");
  return session;
}

/**
 * Handler khusus API Route untuk memvalidasi sesi dan otorisasi role
 * tanpa melempar pengecualian redirect Next.js.
 */
export async function requireApiRole(...roles: Role[]): Promise<
  { ok: true; session: Session } | { ok: false; status: 401 | 403; message: string }
> {
  const session = await getSession();
  if (!session) {
    return { ok: false, status: 401, message: "Autentikasi diperlukan. Sesi tidak valid atau telah berakhir." };
  }
  if (!roles.includes(session.profile.role)) {
    return { ok: false, status: 403, message: "Akses ditolak: role Anda tidak memiliki izin untuk sumber daya ini." };
  }
  if (session.profile.status !== "active") {
    return { ok: false, status: 403, message: "Akun ini dalam status nonaktif." };
  }
  return { ok: true, session };
}

export async function tulisAudit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    const svc = serviceClient();
    await svc.from("audit_logs").insert({
      actor_user_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch (err) {
    console.warn(`[AUDIT LOG WARNING] Gagal menulis audit "${action}":`, err);
  }
}
