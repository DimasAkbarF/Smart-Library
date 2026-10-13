"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { serviceClient } from "@/lib/supabase/service";
import { assertRole, getSession } from "@/lib/auth";
import { normalisasiKode } from "@/lib/format";
import { kodeDariError } from "@/lib/errors";
import type { BookCopy, Loan, Policy, Student } from "@/lib/types";

export type ResolveResult =
  | { type: "STUDENT"; student: Student; activeCount: number }
  | { type: "BOOK"; copy: BookCopy; loan: ActiveLoanInfo | null };

export interface ActiveLoanInfo {
  loan_id: string;
  student_name: string;
  student_nis: string;
  due_at: string;
  late_days: number;
}

export interface StudentContext {
  student: Student;
  activeCount: number;
  maxLoans: number;
  loans: { loan_id: string; book_title: string; due_at: string }[];
}

/** Resolve QR / kode manual menjadi konteks siswa atau eksemplar. */
export async function resolveQr(rawToken: string): Promise<ResolveResult> {
  await assertRole("admin");
  const token = normalisasiKode(rawToken);
  // Hanya izinkan karakter kode (A-Z, 0-9, strip) — cegah filter PostgREST
  // dirusak oleh input seperti "a,b" atau "x).or(...)".
  if (!token || !/^[A-Z0-9-]{1,64}$/.test(token)) throw new Error("QR_INVALID");
  const svc = serviceClient();

  const { data: s } = await svc
    .from("students")
    .select("id, nis, name, class_id, qr_token, status, user_id, classes(name)")
    .eq("qr_token", token)
    .single();
  if (s) {
    const student = mapStudent(s);
    const { count } = await svc
      .from("loans")
      .select("id", { count: "exact", head: true })
      .eq("student_id", student.id)
      .in("status", ["ACTIVE", "OVERDUE"]);
    return { type: "STUDENT", student, activeCount: count ?? 0 };
  }

  const { data: c } = await svc
    .from("book_copies")
    .select("id, book_id, inventory_code, qr_token, condition, location, status, books(title)")
    .or(`qr_token.eq.${token},inventory_code.eq.${token}`)
    .single();
  if (c) {
    const copy = mapCopy(c);
    const loan = await activeLoanForCopy(copy.id);
    return { type: "BOOK", copy, loan };
  }
  throw new Error("QR_UNKNOWN");
}

export async function getStudentContext(idOrNis: string): Promise<StudentContext> {
  await assertRole("admin");
  const svc = serviceClient();
  const key = idOrNis.trim();
  if (!key || !/^[A-Za-z0-9-]{1,64}$/.test(key)) throw new Error("STUDENT_NOT_FOUND");
  const { data: s } = await svc
    .from("students")
    .select("id, nis, name, class_id, qr_token, status, user_id, classes(name)")
    .or(`id.eq.${key},nis.eq.${key.toUpperCase()}`)
    .single();
  if (!s) throw new Error("STUDENT_NOT_FOUND");
  const { data: policy } = await svc.from("library_policies").select("*").eq("id", 1).single();
  const { data: loans, count } = await svc
    .from("loans")
    .select("id, due_at, book_copies(inventory_code, books(title))", { count: "exact" })
    .eq("student_id", s.id)
    .in("status", ["ACTIVE", "OVERDUE"])
    .order("due_at");
  return {
    student: mapStudent(s),
    activeCount: count ?? 0,
    maxLoans: policy?.max_active_loans ?? 2,
    loans: (loans ?? []).map((l) => ({
      loan_id: l.id,
      book_title:
        ((l.book_copies as unknown as { books: { title: string } | null })?.books?.title) ?? "—",
      due_at: l.due_at,
    })),
  };
}

export interface Receipt {
  book_title: string;
  inventory_code: string;
  student_name: string;
  student_nis: string;
  due_at: string;
  late_days?: number;
  fine?: number;
}

export async function borrowAction(
  studentId: string,
  copyId: string,
): Promise<{ ok: true; receipt: Receipt } | { ok: false; code: string }> {
  const session = await assertRole("admin");
  const svc = serviceClient();
  try {
    const { data, error } = await svc.rpc("borrow_book", {
      p_student_id: studentId,
      p_copy_id: copyId,
      p_librarian_id: session.userId,
    });
    if (error) throw new Error(kodeDariError(error) || "UNKNOWN");
    void data;
  } catch (e) {
    return { ok: false, code: kodeDariError(e) || "UNKNOWN" };
  }
  const receipt = await buildReceipt(copyId, studentId);
  revalidatePath("/admin");
  revalidatePath("/admin/transactions");
  revalidatePath("/admin/borrow");
  revalidateTag("admin-dashboard", { expire: 0 });
  return { ok: true, receipt };
}

export async function returnAction(
  copyId: string,
): Promise<{ ok: true; receipt: Receipt } | { ok: false; code: string }> {
  const session = await assertRole("admin");
  const svc = serviceClient();
  try {
    const { data, error } = await svc.rpc("return_book", {
      p_copy_id: copyId,
      p_librarian_id: session.userId,
    });
    if (error) throw new Error(kodeDariError(error) || "UNKNOWN");
    const r = data as { loan_id: string; student_id: string; late_days: number; fine: number };
    const receipt = await buildReceipt(copyId, r.student_id, r.late_days, Number(r.fine));
    revalidatePath("/admin");
    revalidatePath("/admin/transactions");
    revalidatePath("/admin/return");
    revalidateTag("admin-dashboard", { expire: 0 });
    return { ok: true, receipt };
  } catch (e) {
    return { ok: false, code: kodeDariError(e) || "UNKNOWN" };
  }
}

export interface LoanFilters {
  q?: string;
  status?: string;
  page?: number;
}

export async function listLoans(f: LoanFilters, pageSize = 15) {
  await assertRole("admin");
  const svc = serviceClient();
  const page = Math.max(1, f.page ?? 1);
  let query = svc.from("loans").select(
    "id, borrowed_at, due_at, returned_at, status, fine_amount, students!inner(id, name, nis, classes(name)), book_copies!inner(id, inventory_code, books!inner(title))",
    { count: "exact" },
  );
  if (f.status) query = query.eq("status", f.status);
  const { data, count } = await query
    .order("borrowed_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  const q = f.q?.trim().toLowerCase();
  let rows = (data ?? []).map(mapLoan);
  if (q) {
    rows = rows.filter(
      (r) =>
        r.student_name.toLowerCase().includes(q) ||
        r.student_nis.toLowerCase().includes(q) ||
        r.book_title.toLowerCase().includes(q) ||
        r.inventory_code.toLowerCase().includes(q),
    );
  }
  return { rows, total: count ?? rows.length, page, pageCount: Math.max(1, Math.ceil((count ?? rows.length) / pageSize)) };
}

/** Pinjaman milik siswa yang sedang login. */
export async function myLoans(): Promise<{ active: Loan[]; history: Loan[] }> {
  const session = await getSession();
  if (!session || session.profile.role !== "student") throw new Error("FORBIDDEN");
  const svc = serviceClient();
  const { data: student } = await svc
    .from("students")
    .select("id")
    .eq("user_id", session.userId)
    .single();
  if (!student) return { active: [], history: [] };
  const { data } = await svc
    .from("loans")
    .select(
      "id, borrowed_at, due_at, returned_at, status, fine_amount, students!inner(id, name, nis, classes(name)), book_copies!inner(id, inventory_code, books!inner(title))",
    )
    .eq("student_id", student.id)
    .order("borrowed_at", { ascending: false })
    .limit(50);
  const all = (data ?? []).map(mapLoan);
  return {
    active: all.filter((l) => l.status === "ACTIVE" || l.status === "OVERDUE"),
    history: all.filter((l) => l.status === "RETURNED" || l.status === "CANCELLED"),
  };
}

export async function getPolicy(): Promise<Policy> {
  const svc = serviceClient();
  const { data } = await svc.from("library_policies").select("*").eq("id", 1).single();
  return (
    data ?? {
      max_active_loans: 2,
      loan_duration_days: 7,
      fine_per_day: 0,
      allow_renewal: false,
      max_renewal_count: 0,
    }
  );
}

/** Profil siswa yang sedang login + jumlah pinjaman aktif. */
export async function myProfile() {
  const session = await getSession();
  if (!session || session.profile.role !== "student") throw new Error("FORBIDDEN");
  const svc = serviceClient();
  const { data: s } = await svc
    .from("students")
    .select("id, nis, name, class_id, qr_token, status, user_id, classes(name)")
    .eq("user_id", session.userId)
    .single();
  if (!s) return null;
  const { count } = await svc
    .from("loans")
    .select("id", { count: "exact", head: true })
    .eq("student_id", s.id)
    .in("status", ["ACTIVE", "OVERDUE"]);
  return { student: mapStudent(s), activeCount: count ?? 0 };
}

let lastOverdueCheck = 0;

/** Tandai overdue sebelum menampilkan dashboard/laporan (dibatasi maks 1x per 10 menit agar hemat query ~800ms). */
export async function refreshOverdue() {
  const now = Date.now();
  if (now - lastOverdueCheck < 10 * 60 * 1000) return;
  lastOverdueCheck = now;
  try {
    await serviceClient().rpc("mark_overdue");
  } catch {
    /* abaikan */
  }
}

// ---------- helpers ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStudent(s: any): Student {
  return {
    id: s.id,
    nis: s.nis,
    name: s.name,
    class_id: s.class_id,
    class_name: s.classes?.name ?? null,
    qr_token: s.qr_token,
    status: s.status,
    user_id: s.user_id,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCopy(c: any): BookCopy {
  return {
    id: c.id,
    book_id: c.book_id,
    book_title: c.books?.title ?? "—",
    inventory_code: c.inventory_code,
    qr_token: c.qr_token,
    condition: c.condition,
    location: c.location,
    status: c.status,
  };
}

async function activeLoanForCopy(copyId: string): Promise<ActiveLoanInfo | null> {
  const svc = serviceClient();
  const { data } = await svc
    .from("loans")
    .select("id, due_at, students(name, nis)")
    .eq("book_copy_id", copyId)
    .in("status", ["ACTIVE", "OVERDUE"])
    .single();
  if (!data) return null;
  const st = data.students as unknown as { name: string; nis: string } | null;
  const late = Math.max(
    0,
    Math.round((Date.now() - new Date(data.due_at).getTime()) / 86_400_000),
  );
  return {
    loan_id: data.id,
    student_name: st?.name ?? "—",
    student_nis: st?.nis ?? "—",
    due_at: data.due_at,
    late_days: late,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLoan(l: any): Loan {
  const st = l.students as { id: string; name: string; nis: string; classes: { name: string } | null } | null | undefined;
  const cp = l.book_copies as { id: string; inventory_code: string; books: { title: string } | null } | null | undefined;
  return {
    id: l.id,
    student_id: st?.id ?? "",
    student_name: st?.name ?? "Siswa Tidak Dikenal",
    student_nis: st?.nis ?? "—",
    class_name: st?.classes?.name ?? null,
    book_copy_id: cp?.id ?? "",
    inventory_code: cp?.inventory_code ?? "—",
    book_title: cp?.books?.title ?? "Judul Tidak Diketahui",
    borrowed_at: l.borrowed_at,
    due_at: l.due_at,
    returned_at: l.returned_at,
    status: l.status,
    fine_amount: Number(l.fine_amount ?? 0),
  };
}

async function buildReceipt(
  copyId: string,
  studentId: string,
  late_days = 0,
  fine = 0,
): Promise<Receipt> {
  const svc = serviceClient();
  const { data: c } = await svc
    .from("book_copies")
    .select("inventory_code, books(title)")
    .eq("id", copyId)
    .single();
  const { data: s } = await svc.from("students").select("name, nis").eq("id", studentId).single();
  const { data: loan } = await svc
    .from("loans")
    .select("due_at")
    .eq("book_copy_id", copyId)
    .order("borrowed_at", { ascending: false })
    .limit(1)
    .single();
  return {
    book_title: (c?.books as unknown as { title: string } | null)?.title ?? "—",
    inventory_code: c?.inventory_code ?? "—",
    student_name: s?.name ?? "—",
    student_nis: s?.nis ?? "—",
    due_at: loan?.due_at ?? new Date().toISOString(),
    late_days,
    fine,
  };
}
