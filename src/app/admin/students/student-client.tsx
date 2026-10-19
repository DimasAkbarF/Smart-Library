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
import { QrQuickViewButton, QrModal } from "@/components/library/qr-modal";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { pesanRamah, kodeDariError } from "@/lib/errors";
import { cn } from "@/lib/utils";
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
  const [createdStudent, setCreatedStudent] = useState<{
    id: string;
    nis: string;
    name: string;
    qr_token: string;
    class_name?: string | null;
  } | null>(null);
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
          className="gap-2 shrink-0 min-h-[44px] sm:min-h-0 justify-center font-semibold"
        >
          <Plus className="size-4" />
          <span>Tambah Siswa</span>
        </Button>
      </div>

      {msg && (
        <p role="alert" className="rounded-btn bg-danger-bg px-4 py-2.5 text-meta font-semibold text-danger border border-danger/25">
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
              <span className="font-mono text-label font-semibold bg-surface-sunken-ed px-2 py-0.5 rounded-chip border border-rule text-ink">
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
                    className="flex size-8 shrink-0 items-center justify-center rounded-btn bg-primary-soft text-primary font-display text-label font-bold border border-primary/20"
                  >
                    {initials}
                  </span>
                  <div>
                    <span className="block font-semibold text-ink text-body">{s.name}</span>
                    <span className="block text-meta text-ink-muted">
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
                <StatusChip tone="success" label="Aktif" />
              ) : (
                <StatusChip tone="muted" label={s.status === "graduated" ? "Lulus" : "Nonaktif"} />
              ),
          },
          {
            header: "Kartu Pelajar & QR",
            cell: (s) => (
              <span className="flex items-center gap-2">
                <span className="font-mono text-meta text-ink-muted">{s.qr_token}</span>
                <QrQuickViewButton
                  title={s.name}
                  subtitle={`NIS: ${s.nis}`}
                  code={s.nis}
                  token={s.qr_token}
                  meta={s.class_name ? `Kelas ${s.class_name}` : undefined}
                  type="student"
                  label="Kartu Siswa"
                />
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
                  className="rounded-md border border-outline px-2.5 py-1 text-label font-semibold text-ink hover:bg-surface hover:text-primary transition-colors"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  className="rounded-md border border-outline px-2.5 py-1 text-label font-semibold text-ink hover:bg-surface transition-colors"
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
        renderMobileCard={(s) => (
          <div className="rounded-card border border-rule bg-card p-4 flex flex-col gap-3 min-w-0">
            {/* Header: Nama, NIS, Kelas, Status */}
            <div className="flex items-start justify-between gap-3 min-w-0">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  // eslint-disable-next-line local/no-banned-utilities -- avatar inisial siswa: bulat memang disengaja (design.md §3)
                  className="size-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm font-plex-sans"
                  aria-hidden="true"
                >
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink text-sm sm:text-base truncate">{s.name}</p>
                  <p className="text-xs font-plex-sans text-ink-subtle">
                    NIS: <span className="font-mono text-ink">{s.nis}</span> ·{" "}
                    <span>{s.class_name ? `Kelas ${s.class_name}` : "Tanpa kelas"}</span>
                  </p>
                </div>
              </div>
              <StatusChip
                tone={s.status === "active" ? "success" : "muted"}
                label={s.status === "active" ? "Aktif" : "Nonaktif"}
              />
            </div>

            {/* Token & QR Quick View */}
            <div className="flex items-center justify-between gap-2 rounded-btn bg-surface-sunken-ed/60 px-3 py-2 border border-rule/50 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium uppercase tracking-[0.04em] text-ink-subtle">
                  Token Kartu
                </span>
                <code className="block text-xs font-mono text-ink truncate">
                  {s.qr_token}
                </code>
              </div>
              <QrQuickViewButton
                title={s.name}
                subtitle={`NIS: ${s.nis}`}
                code={s.nis}
                token={s.qr_token}
                meta={s.class_name ? `Kelas ${s.class_name}` : undefined}
                type="student"
              />
            </div>

            {/* Aksi Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rule/40">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEdit(s)}
                className="w-full min-h-[38px] text-xs font-semibold justify-center"
              >
                Ubah Data
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => toggle(s)}
                className={cn(
                  "w-full min-h-[38px] text-xs font-semibold justify-center",
                  s.status === "active" ? "text-danger hover:bg-danger/10" : "text-primary hover:bg-primary/10"
                )}
              >
                {s.status === "active" ? "Nonaktifkan" : "Aktifkan"}
              </Button>
            </div>
          </div>
        )}
      />
      )}

      {/* Dialog Form Tambah Siswa */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Tambah Siswa Baru">
        <StudentForm
          classes={classes}
          onSuccess={(newStudent) => {
            setAddOpen(false);
            setCreatedStudent(newStudent);
            router.refresh();
          }}
          onDone={() => {
            setAddOpen(false);
            router.refresh();
          }}
        />
      </Dialog>

      {/* Dialog Konfirmasi QR Siswa Baru yang dibuat otomatis */}
      {createdStudent && (
        <QrModal
          open={!!createdStudent}
          onClose={() => setCreatedStudent(null)}
          title={createdStudent.name}
          subtitle={`NIS: ${createdStudent.nis}`}
          code={createdStudent.nis}
          token={createdStudent.qr_token}
          meta={createdStudent.class_name ? `Kelas ${createdStudent.class_name}` : undefined}
          type="student"
        />
      )}

      {/* Dialog Form Ubah Siswa */}
      <Dialog open={!!edit} onClose={() => setEdit(null)} title="Ubah Siswa">
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
  onSuccess,
  onDone,
}: {
  classes: ClassRow[];
  student?: Student;
  onSuccess?: (student: {
    id: string;
    nis: string;
    name: string;
    qr_token: string;
    class_name?: string | null;
  }) => void;
  onDone: () => void;
}) {
  const bound = student ? updateStudent.bind(null, student.id) : createStudent;
  const [state, formAction] = useActionState(async (prev: { message?: string; ok?: boolean }, fd: FormData) => {
    const res = await bound(prev, fd);
    if (res.ok) {
      if (res.student && onSuccess) {
        onSuccess(res.student);
      } else {
        onDone();
      }
    }
    return res;
  }, {});

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="NIS (Nomor Induk Siswa)">
        <Input
          name="nis"
          required
          defaultValue={student?.nis ?? ""}
          placeholder="Contoh: 20260012"
          className="h-11 sm:h-10 text-base sm:text-sm"
        />
        <span className="text-meta text-ink-subtle">
          Kode QR kartu sirkulasi akan otomatis dibuat berbasis NIS ({student?.nis ? `SIS-${student.nis}` : "SIS-[NIS]"}).
        </span>
      </Field>
      <Field label="Nama Lengkap">
        <Input
          name="name"
          required
          defaultValue={student?.name ?? ""}
          placeholder="Nama lengkap siswa"
          className="h-11 sm:h-10 text-base sm:text-sm"
        />
      </Field>
      <Field label="Rombel Kelas">
        <Select
          name="class_id"
          defaultValue={student?.class_id ?? ""}
          className="h-11 sm:h-10 text-base sm:text-sm"
        >
          <option value="">Tanpa kelas / Belum ditentukan</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      {state?.message && (
        <p role="alert" className="text-body font-semibold text-danger">
          {state.message}
        </p>
      )}
      <SubmitButton className="min-h-tap-min h-11 sm:h-10 text-body font-semibold justify-center w-full">
        {student ? "Simpan perubahan" : "Daftarkan Siswa & Buat QR"}
      </SubmitButton>
    </form>
  );
}
