import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session?.profile.role === "admin") {
    redirect("/admin");
  }
  redirect("/books");
}

export const dynamic = "force-dynamic";
