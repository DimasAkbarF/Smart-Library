import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (!session || session.profile.role !== "admin") {
    redirect("/login");
  }
  redirect("/admin");
}

export const dynamic = "force-dynamic";
