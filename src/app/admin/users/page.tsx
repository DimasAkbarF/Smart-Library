import { listUsers } from "@/features/admin/users";
import { UsersSection } from "./user-client";

export default async function UsersPage() {
  const users = await listUsers();
  return (
    <div className="space-y-6 animate-rise">
      <header className="border-b border-outline/70 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-deep font-mono tracking-wider uppercase">
          <span className="size-2 rounded-full bg-sky" />
          <span>Manajemen Akses & Staf · SMP Negeri 17 Tangerang Selatan</span>
        </div>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          Akun Pengguna Sistem
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Kelola kredensial dan hak akses untuk petugas sirkulasi (librarian) dan administrator data perpustakaan.
        </p>
      </header>
      <UsersSection users={users} />
    </div>
  );
}

export const dynamic = "force-dynamic";
