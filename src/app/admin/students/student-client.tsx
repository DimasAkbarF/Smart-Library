"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createStudent, updateStudent, setStudentStatus } from "@/features/admin/students";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { DownloadQrButton } from "@/components/library/download-qr-button";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { pesanRamah, kodeDariError } from "@/lib/errors";
import type { ClassRow, Student } from "@/lib/types";

export function StudentsSection({
  students,
  classes,
  page,
  pageCount,
  baseUrl,
  total,
  hasFilter = false,
}: {
  students: Student[];
  classes: ClassRow[];
  page: number;
  pageCount: number;
  baseUrl: string;
  total: number;
  hasFilter?: boolean;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [edit, setEdit] = useState<Student | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle(s: Student) {
    setMsg(null);
    try {
      await setStudentStatus(s.id, s.status === "active" ? "inactive" : "active");
      router.refresh();
    } catch (e) {
      setMsg(pesanRamah(kodeDariError(e), e instanceof Error ? e.message : undefined));
    }
  }

  return (
    <div className="space-y-4">
      {/* Table Toolbar: Search + Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <SearchInput placeholder="Cari NIS atau nama siswa…" />
        </div>
        <Button
          type="button"
          onClick={() => setAddOpen(true)}
          className="gap-2 shrink-0 shadow-xs"
        >
          <Plus className="size-4" />
          <span>Tambah Siswa</span>
        </Button>
      </div>

      {msg && (
        <p role="alert" className="rounded-md bg-coral-soft px-4 py-2.5 text-xs font-semibold text-coral-deep">
          {msg}
        </p>
      )}

      {students.length === 0 ? (
        <EmptyState
          title="Tidak ada data siswa"
          body={
            hasFilter
              ? "Tidak ada siswa yang cocok dengan kriteria pencarian atau filter kelas yang dipilih."
              : "Belum ada data siswa terdaftar. Tambahkan siswa baru atau impor data dari spreadsheet."
          }
          action={
            hasFilter ? (
              <Link href="/admin/students">
                <Button variant="secondary" size="sm">
                  Reset Filter & Pencarian
                </Button>
              </Link>
            ) : (
              <Button size="sm" onClick={() => setAddOpen(true)} className="gap-2">
                <Plus className="size-4" />
                <span>Tambah Siswa Pertama</span>
              </Button>
            )
          }
        />
      ) : (
        <DataTable<Student>
        columns={[
          {
            header: "NIS",
            cell: (s) => (
              <span className="font-mono text-xs font-semibold bg-surface-sunken px-2 py-0.5 rounded-sm border border-outline/70 text-ink">
                {s.nis}
              </span>
            ),
          },
          {
            header: "Nama Siswa & Kelas",
            cell: (s) => {
              const initials = s.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase() || "SW";
              return (
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-soft text-sky-deep font-display text-xs font-bold border border-sky/20"
                  >
                    {initials}
                  </span>
                  <div>
                    <span className="block font-semibold text-ink text-sm">{s.name}</span>
                    <span className="block text-xs text-ink-muted">
                      {s.class_name ? `Kelas ${s.class_name}` : "Tanpa rombel"}
                    </span>
                  </div>
                </div>
              );
            },
          },
          {
            header: "Status",
            cell: (s) =>
              s.status === "active" ? (
                <StatusChip tone="leaf" label="Aktif" />
              ) : (
                <StatusChip tone="muted" label={s.status === "graduated" ? "Lulus" : "Nonaktif"} />
              ),
          },
          {
            header: "Kartu / QR",
            cell: (s) => (
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs text-ink-muted">{s.qr_token}</span>
                <DownloadQrButton token={s.qr_token} label={s.qr_token} />
              </span>
            ),
          },
          {
            header: "Aksi",
            cell: (s) => (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEdit(s)}
                  className="rounded-md border border-outline px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface hover:text-sky-deep transition-colors"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  className="rounded-md border border-outline px-2.5 py-1 text-xs font-semibold text-ink hover:bg-surface transition-colors"
                >
                  {s.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </div>
            ),
          },
        ]}
        rows={students}
        page={page}
        pageCount={pageCount}
        baseUrl={baseUrl}
        totalLabel={`${total.toLocaleString("id-ID")} siswa · halaman ${page} dari ${pageCount}`}
      />
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Tambah siswa">
        <StudentForm
          classes={classes}
          onDone={() => {
            setAddOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
      <Dialog open={!!edit} onClose={() => setEdit(null)} title="Ubah siswa">
        {edit && (
          <StudentForm
            key={edit.id}
            classes={classes}
            student={edit}
            onDone={() => {
              setEdit(null);
              router.refresh();
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function StudentForm({
  classes,
  student,
  onDone,
}: {
  classes: ClassRow[];
  student?: Student;
  onDone: () => void;
}) {
  const bound = student ? updateStudent.bind(null, student.id) : createStudent;
  const [state, formAction] = useActionState(async (prev: { message?: string; ok?: boolean }, fd: FormData) => {
    const res = await bound(prev, fd);
    if (res.ok) onDone();
    return res;
  }, {});

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="NIS">
        <Input name="nis" required defaultValue={student?.nis ?? ""} placeholder="Nomor induk siswa" />
      </Field>
      <Field label="Nama">
        <Input name="name" required defaultValue={student?.name ?? ""} placeholder="Nama lengkap" />
      </Field>
      <Field label="Kelas">
        <Select name="class_id" defaultValue={student?.class_id ?? ""}>
          <option value="">Tanpa kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      {state?.message && (
        <p role="alert" className="text-sm font-semibold text-coral-deep">
          {state.message}
        </p>
      )}
      <SubmitButton>{student ? "Simpan perubahan" : "Tambah siswa"}</SubmitButton>
    </form>
  );
}
