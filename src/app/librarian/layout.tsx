import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function LibrarianLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("librarian", "admin");
  return (
    <AppShell role={session.profile.role} userName={session.profile.full_name}>
      {children}
    </AppShell>
  );
}
