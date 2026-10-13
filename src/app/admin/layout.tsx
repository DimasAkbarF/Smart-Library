import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("admin");
  return (
    <AppShell role="admin" userName={session.profile.full_name}>
      {children}
    </AppShell>
  );
}
