import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/service";

declare global {
  var __lastCirculationTs: number | undefined;
}

const CIRCULATION_ACTIONS = [
  "loan.create",
  "loan.return",
  "copy.status",
  "copy.create_bulk",
  "book.create",
  "book.update",
  "book.delete",
];

export async function GET() {
  let dbTs = 0;
  try {
    const svc = serviceClient();
    const { data } = await svc
      .from("audit_logs")
      .select("created_at")
      .in("action", CIRCULATION_ACTIONS)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.created_at) {
      dbTs = new Date(data.created_at).getTime();
    }
  } catch {
    /* fallback ke memory jika database lambat merespons */
  }

  const memoryTs = globalThis.__lastCirculationTs || 0;
  const version = Math.max(dbTs, memoryTs);

  return NextResponse.json(
    { version },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}

export const dynamic = "force-dynamic";
