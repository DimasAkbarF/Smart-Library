import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { serviceClient } from "@/lib/supabase/service";
import { ROLE_HOME, type Profile, type Role } from "@/lib/types";

export interface Session {
  userId: string;
  profile: Profile;
}

/**
 * Data Access Layer: satu-satunya jalan membaca sesi + profil.
 * Di-cache per request. Melempar UNAUTHENTICATED bila tidak ada sesi.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!supabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const svc = serviceClient();
  const { data: profile } = await svc
    .from("profiles")
    .select("id, username, email, full_name, role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.status !== "active") return null;
  return { userId: user.id, profile: profile as Profile };
});

/** Halaman: wajib login; role di luar daftar dialihkan ke beranda role-nya. */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.profile.role)) redirect(ROLE_HOME[session.profile.role]);
  return session;
}

/** Server action / query: wajib login + role, tanpa redirect (lempar kode). */
export async function assertRole(...roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.profile.role)) redirect(ROLE_HOME[session.profile.role] || "/login");
  if (session.profile.status !== "active") redirect("/login");
  return session;
}

export async function tulisAudit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  const svc = serviceClient();
  await svc.from("audit_logs").insert({
    actor_user_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}
