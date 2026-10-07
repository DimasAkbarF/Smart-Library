import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("student");
  return (
    <AppShell role="student" userName={session.profile.full_name}>
      {children}
    </AppShell>
  );
}
