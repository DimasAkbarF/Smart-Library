"use server";

import { serviceClient } from "@/lib/supabase/service";
import { assertRole } from "@/lib/auth";
import { refreshOverdue } from "@/features/loans/actions";
import { sanitizeSearchTerm } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";

export async function librarianDashboard() {
  await assertRole("admin");
  await refreshOverdue();
  const svc = serviceClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ count: borrowedToday }, { count: returnedToday }, { count: active }, { count: overdue }] =
    await Promise.all([
      svc.from("loans").select("id", { count: "exact", head: true }).gte("borrowed_at", today.toISOString()),
      svc.from("loans").select("id", { count: "exact", head: true }).gte("returned_at", today.toISOString()),
      svc.from("loans").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
      svc.from("loans").select("id", { count: "exact", head: true }).eq("status", "OVERDUE"),
    ]);

  const { data: overdueRows } = await svc
    .from("loans")
    .select("id, due_at, students!inner(name, nis, classes(name)), book_copies!inner(inventory_code, books!inner(title))")
    .eq("status", "OVERDUE")
    .order("due_at")
    .limit(8);

  return {
    borrowedToday: borrowedToday ?? 0,
    returnedToday: returnedToday ?? 0,
    active: active ?? 0,
    overdue: overdue ?? 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overdueRows: (overdueRows ?? []).map((l: any) => ({
      id: l.id as string,
      due_at: l.due_at as string,
      student_name: l.students.name as string,
      student_nis: l.students.nis as string,
      class_name: (l.students.classes?.name ?? null) as string | null,
      book_title: l.book_copies.books.title as string,
      inventory_code: l.book_copies.inventory_code as string,
    })),
  };
}

import { unstable_cache } from "next/cache";

export interface ReportData {
  perDay: { date: string; pinjam: number; kembali: number }[];
  topBooks: { title: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

/** Pengambilan data ringkasan sirkulasi 14 hari tanpa duplikasi query. */
async function fetchReportSummaryData(): Promise<ReportData> {
  const svc = serviceClient();
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const { data: loans } = await svc
    .from("loans")
    .select("borrowed_at, returned_at, status, book_copies(books(title))")
    .gte("borrowed_at", since.toISOString())
    .limit(2000);

  const days: ReportData["perDay"] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      pinjam: 0,
      kembali: 0,
    });
  }
  const key = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const bookCount = new Map<string, number>();
  const byStatus = new Map<string, number>();

  for (const l of loans ?? []) {
    const day = days.find((d) => d.date === key(l.borrowed_at));
    if (day) day.pinjam += 1;
    if (l.returned_at) {
      const rd = days.find((d) => d.date === key(l.returned_at!));
      if (rd) rd.kembali += 1;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (l.book_copies as any)?.books?.title ?? "—";
    bookCount.set(t, (bookCount.get(t) ?? 0) + 1);

    // Hitung status langsung dari data yang sama (hemat 1 query remote ~150ms)
    byStatus.set(l.status, (byStatus.get(l.status) ?? 0) + 1);
  }

  const topBooks = [...bookCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([title, count]) => ({ title, count }));

  return {
    perDay: days,
    topBooks,
    byStatus: [...byStatus.entries()].map(([status, count]) => ({ status, count })),
  };
}

/** Ringkasan 14 hari terakhir untuk laporan. */
export async function reportSummary(): Promise<ReportData> {
  await assertRole("admin");
  return fetchReportSummaryData();
}

/** Ringkasan 14 hari khusus chart dashboard (hanya tanggal pinjam & kembali, hemat join ~1000ms). */
async function fetchDashboardChartData(): Promise<{ date: string; pinjam: number; kembali: number }[]> {
  const svc = serviceClient();
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const { data: loans } = await svc
    .from("loans")
    .select("borrowed_at, returned_at")
    .gte("borrowed_at", since.toISOString())
    .limit(2000);

  const days: { date: string; pinjam: number; kembali: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      pinjam: 0,
      kembali: 0,
    });
  }
  const key = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

  for (const l of loans ?? []) {
    const day = days.find((d) => d.date === key(l.borrowed_at));
    if (day) day.pinjam += 1;
    if (l.returned_at) {
      const rd = days.find((d) => d.date === key(l.returned_at!));
      if (rd) rd.kembali += 1;
    }
  }

  return days;
}

/** Cached dashboard data (stale-while-revalidate 30s) untuk akses secepat kilat < 5ms. */
const getCachedAdminDashboard = unstable_cache(
  async () => {
    const svc = serviceClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: titles },
      { count: copies },
      { count: borrowed },
      { count: overdue },
      { count: students },
      { count: damagedCopies },
      { count: studentsWithoutClass },
      { count: borrowedToday },
      { count: returnedToday },
      audit,
      chartData,
    ] = await Promise.all([
      svc.from("books").select("id", { count: "exact", head: true }),
      svc.from("book_copies").select("id", { count: "exact", head: true }),
      svc.from("loans").select("id", { count: "exact", head: true }).in("status", ["ACTIVE", "OVERDUE"]),
      svc.from("loans").select("id", { count: "exact", head: true }).eq("status", "OVERDUE"),
      svc.from("students").select("id", { count: "exact", head: true }).eq("status", "active"),
      svc.from("book_copies").select("id", { count: "exact", head: true }).in("status", ["DAMAGED", "LOST"]),
      svc.from("students").select("id", { count: "exact", head: true }).is("class_id", null).eq("status", "active"),
      svc.from("loans").select("id", { count: "exact", head: true }).gte("borrowed_at", today.toISOString()),
      svc.from("loans").select("id", { count: "exact", head: true }).gte("returned_at", today.toISOString()),
      svc.from("audit_logs").select("id, action, entity_type, entity_id, metadata, created_at, profiles(full_name)").order("created_at", { ascending: false }).limit(8),
      fetchDashboardChartData(),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activity: AuditLog[] = (audit.data ?? []).map((a: any) => ({
      id: a.id,
      actor_name: a.profiles?.full_name ?? null,
      action: a.action,
      entity_type: a.entity_type,
      entity_id: a.entity_id,
      metadata: a.metadata ?? {},
      created_at: a.created_at,
    }));
    const lastImport = activity.find((a) => a.action.startsWith("import.")) ?? null;

    return {
      titles: titles ?? 0,
      copies: copies ?? 0,
      borrowed: borrowed ?? 0,
      borrowedToday: borrowedToday ?? 0,
      returnedToday: returnedToday ?? 0,
      overdue: overdue ?? 0,
      students: students ?? 0,
      damagedCopies: damagedCopies ?? 0,
      studentsWithoutClass: studentsWithoutClass ?? 0,
      chartData,
      activity,
      lastImport,
    };
  },
  ["admin-dashboard-summary"],
  {
    revalidate: 30,
    tags: ["admin-dashboard"],
  },
);

export async function adminDashboard() {
  await assertRole("admin");
  void refreshOverdue();
  return getCachedAdminDashboard();
}

export async function listAudit(opts: { page?: number; q?: string }): Promise<{
  rows: AuditLog[];
  page: number;
  pageCount: number;
}> {
  await assertRole("admin");
  const svc = serviceClient();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = 25;
  let query = svc
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, metadata, created_at, profiles(full_name)", { count: "exact" });
  const q = opts.q ? sanitizeSearchTerm(opts.q) : "";
  if (q) {
    const like = `%${q}%`;
    query = query.or(`action.ilike.${like},entity_type.ilike.${like},entity_id.ilike.${like}`);
  }
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: AuditLog[] = (data ?? []).map((a: any) => ({
    id: a.id,
    actor_name: a.profiles?.full_name ?? null,
    action: a.action,
    entity_type: a.entity_type,
    entity_id: a.entity_id,
    metadata: a.metadata ?? {},
    created_at: a.created_at,
  }));
  const total = count ?? 0;
  return { rows, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}
