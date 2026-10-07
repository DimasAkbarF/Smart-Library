"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { serviceClient } from "@/lib/supabase/service";
import { assertRole, tulisAudit } from "@/lib/auth";
import { normalisasiKode } from "@/lib/format";
import type { Student } from "@/lib/types";

const StudentSchema = z.object({
  nis: z.string().trim().min(1, "NIS wajib diisi."),
  name: z.string().trim().min(1, "Nama wajib diisi."),
  class_id: z.string().optional(),
});

export interface StudentFormState {
  message?: string;
  ok?: boolean;
}

function qrSiswa(nis: string) {
  return `SIS-${normalisasiKode(nis)}`;
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
  const svc = serviceClient();
  const { data, error } = await svc
    .from("students")
    .insert({
      nis,
      name: parsed.data.name,
      class_id: parsed.data.class_id || null,
      qr_token: qrSiswa(nis),
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { message: `NIS ${nis} sudah terdaftar.` };
    return { message: "Gagal menyimpan siswa." };
  }
  await tulisAudit(session.userId, "student.create", "student", data.id, { nis });
  revalidatePath("/admin");
  return { ok: true };
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
      qr_token: qrSiswa(nis),
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { message: `NIS ${nis} sudah dipakai siswa lain.` };
    return { message: "Gagal menyimpan perubahan." };
  }
  await tulisAudit(session.userId, "student.update", "student", id, { nis });
  revalidatePath("/admin");
  return { ok: true };
}

export async function setStudentStatus(id: string, status: Student["status"]) {
  const session = await assertRole("admin");
  const svc = serviceClient();
  const { error } = await svc.from("students").update({ status }).eq("id", id);
  if (error) throw new Error("Gagal mengubah status siswa.");
  await tulisAudit(session.userId, "student.status", "student", id, { status });
  revalidatePath("/admin");
}

export async function listStudents(opts: { q?: string; classId?: string; page?: number; pageSize?: number }) {
  await assertRole("librarian", "admin");
  const svc = serviceClient();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = opts.pageSize ?? 25;
  let query = svc
    .from("students")
    .select("id, nis, name, class_id, qr_token, status, user_id, classes(name)", { count: "exact" });
  if (opts.classId) query = query.eq("class_id", opts.classId);
  const q = opts.q?.trim();
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

export async function listClasses() {
  await assertRole("librarian", "admin");
  const svc = serviceClient();
  const { data } = await svc.from("classes").select("id, name").order("name");
  return data ?? [];
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
    toInsert.push({ nis, name, class_id: classId, qr_token: qrSiswa(nis) });
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
  return report;
}
