"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import { serviceClient } from "@/lib/supabase/service";
import { assertRole, tulisAudit } from "@/lib/auth";
import { normalisasiKode } from "@/lib/format";
import { sanitizeSearchTerm } from "@/lib/utils";
import { generateStudentQrToken } from "@/lib/qr";
import type { Student } from "@/lib/types";

const StudentSchema = z.object({
  nis: z.string().trim().min(1, "NIS wajib diisi."),
  name: z.string().trim().min(1, "Nama wajib diisi."),
  class_id: z.string().optional(),
});

export interface StudentFormState {
  message?: string;
  ok?: boolean;
  student?: {
    id: string;
    nis: string;
    name: string;
    qr_token: string;
    class_name?: string | null;
  };
}

export async function createStudent(
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const session = await assertRole("admin");
  const parsed = StudentSchema.safeParse({
    nis: formData.get("nis"),
    name: formData.get("name"),
    class_id: formData.get("class_id") || undefined,
  });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message };
  const nis = normalisasiKode(parsed.data.nis);
  const token = generateStudentQrToken();
  const svc = serviceClient();
  const { data, error } = await svc
    .from("students")
    .insert({
      nis,
      name: parsed.data.name,
      class_id: parsed.data.class_id || null,
      qr_token: token,
    })
    .select("id, nis, name, qr_token, classes(name)")
    .single();
  if (error) {
    if (error.code === "23505") return { message: `NIS ${nis} sudah terdaftar.` };
    return { message: "Gagal menyimpan siswa." };
  }
  await tulisAudit(session.userId, "student.create", "student", data.id, { nis });
  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidateTag("admin-dashboard", { expire: 0 });
  return {
    ok: true,
    student: {
      id: data.id,
      nis: data.nis,
      name: data.name,
      qr_token: data.qr_token,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      class_name: (data.classes as any)?.name ?? null,
    },
  };
}

export async function updateStudent(
  id: string,
  _prev: StudentFormState,
  formData: FormData,
): Promise<StudentFormState> {
  const session = await assertRole("admin");
  const parsed = StudentSchema.safeParse({
    nis: formData.get("nis"),
    name: formData.get("name"),
    class_id: formData.get("class_id") || undefined,
  });
  if (!parsed.success) return { message: parsed.error.issues[0]?.message };
  const nis = normalisasiKode(parsed.data.nis);
  const svc = serviceClient();
  const { error } = await svc
    .from("students")
    .update({
      nis,
      name: parsed.data.name,
      class_id: parsed.data.class_id || null,
      // Tidak menimpa qr_token lama saat update identitas biasa agar kartu fisik tidak mendadak hangus
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { message: `NIS ${nis} sudah dipakai siswa lain.` };
    return { message: "Gagal menyimpan perubahan." };
  }
  await tulisAudit(session.userId, "student.update", "student", id, { nis });
  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidateTag("admin-dashboard", { expire: 0 });
  return { ok: true };
}

/**
 * Cabut dan Terbitkan Ulang Token QR Siswa:
 * Digunakan jika kartu fisik hilang, rusak, atau diduga disalahgunakan pihak lain.
 */
export async function revokeAndRegenerateStudentQr(id: string): Promise<{ ok: boolean; qr_token?: string }> {
  const session = await assertRole("admin");
  const newToken = generateStudentQrToken();
  const svc = serviceClient();
  const { error } = await svc
    .from("students")
    .update({ qr_token: newToken })
    .eq("id", id);
  if (error) throw new Error("Gagal menerbitkan ulang token QR.");
  await tulisAudit(session.userId, "student.qr_revoked_and_reissued", "student", id, { new_token: newToken });
  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidatePath("/admin/qr");
  return { ok: true, qr_token: newToken };
}

export async function setStudentStatus(id: string, status: Student["status"]) {
  const session = await assertRole("admin");
  const svc = serviceClient();
  const { error } = await svc.from("students").update({ status }).eq("id", id);
  if (error) throw new Error("Gagal mengubah status siswa.");
  await tulisAudit(session.userId, "student.status", "student", id, { status });
  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidateTag("admin-dashboard", { expire: 0 });
}

export async function listStudents(opts: { q?: string; classId?: string; page?: number; pageSize?: number }) {
  await assertRole("admin");
  const svc = serviceClient();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 25;
  let query = svc
    .from("students")
    .select("id, nis, name, class_id, qr_token, status, user_id, classes(name)", { count: "exact" });
  if (opts.classId) query = query.eq("class_id", opts.classId);
  const q = opts.q ? sanitizeSearchTerm(opts.q) : "";
  if (q) {
    const like = `%${q}%`;
    query = query.or(`nis.ilike.${like},name.ilike.${like}`);
  }
  const { data, count } = await query
    .order("name")
    .range((page - 1) * pageSize, page * pageSize - 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: Student[] = (data ?? []).map((s: any) => ({
    id: s.id,
    nis: s.nis,
    name: s.name,
    class_id: s.class_id,
    class_name: s.classes?.name ?? null,
    qr_token: s.qr_token,
    status: s.status,
    user_id: s.user_id,
  }));
  const total = count ?? 0;
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export const getCachedClasses = unstable_cache(
  async () => {
    const svc = serviceClient();
    const { data } = await svc.from("classes").select("id, name").order("name");
    return data ?? [];
  },
  ["classes-list-cache"],
  {
    revalidate: 3600,
    tags: ["classes"],
  },
);

export async function listClasses() {
  await assertRole("admin");
  return getCachedClasses();
}

// ---------- Import siswa (baris valid dari client, validasi ulang di server) ----------

export interface ImportStudentRow {
  nis: string;
  name: string;
  class: string;
}

export interface ImportReport {
  inserted: number;
  failed: { row: number; nis: string; reason: string }[];
}

export async function importStudents(rows: ImportStudentRow[]): Promise<ImportReport> {
  const session = await assertRole("admin");
  if (!Array.isArray(rows)) throw new Error("Format data impor tidak valid.");
  if (rows.length > 2000) throw new Error("Batas impor maksimal 2.000 baris per file.");
  const svc = serviceClient();
  const report: ImportReport = { inserted: 0, failed: [] };

  const { data: classes } = await svc.from("classes").select("id, name");
  const classByName = new Map((classes ?? []).map((c) => [c.name.toLowerCase(), c.id]));

  const { data: existing } = await svc.from("students").select("nis");
  const seenNis = new Set((existing ?? []).map((s) => s.nis.toUpperCase()));
  const inFile = new Set<string>();

  const toInsert: { nis: string; name: string; class_id: string | null; qr_token: string }[] = [];
  rows.forEach((r, i) => {
    const rowNo = i + 2; // baris 1 = header
    const nis = normalisasiKode(r.nis ?? "");
    const name = (r.name ?? "").trim();
    if (!nis || !name) {
      report.failed.push({ row: rowNo, nis: r.nis ?? "", reason: "NIS dan nama wajib diisi." });
      return;
    }
    if (inFile.has(nis)) {
      report.failed.push({ row: rowNo, nis, reason: "Duplikat dalam file." });
      return;
    }
    inFile.add(nis);
    if (seenNis.has(nis)) {
      report.failed.push({ row: rowNo, nis, reason: "NIS sudah terdaftar di database." });
      return;
    }
    const classId = r.class?.trim()
      ? (classByName.get(r.class.trim().toLowerCase()) ?? null)
      : null;
    toInsert.push({ nis, name, class_id: classId, qr_token: generateStudentQrToken() });
  });

  // Batch 200 baris
  for (let i = 0; i < toInsert.length; i += 200) {
    const batch = toInsert.slice(i, i + 200);
    const { error } = await svc.from("students").insert(batch);
    if (error) {
      batch.forEach((b) =>
        report.failed.push({ row: 0, nis: b.nis, reason: "Gagal disimpan ke database." }),
      );
    } else {
      report.inserted += batch.length;
    }
  }

  await tulisAudit(session.userId, "import.students", "student", "batch", {
    inserted: report.inserted,
    failed: report.failed.length,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/students");
  revalidateTag("admin-dashboard", { expire: 0 });
  revalidateTag("classes", { expire: 0 });
  return report;
}
