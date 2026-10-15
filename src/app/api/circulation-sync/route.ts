import { NextResponse } from "next/server";

declare global {
  var __lastCirculationTs: number | undefined;
}

export async function GET() {
  const version = globalThis.__lastCirculationTs || 0;
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
