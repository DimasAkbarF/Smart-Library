import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireRole } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  const session = await requireRole("admin");
  return (
    <AppShell role="admin" userName={session.profile.full_name}>
      {children}
    </AppShell>
  );
}
