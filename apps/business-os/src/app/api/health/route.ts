import { NextResponse } from "next/server";

// Node runtime required for future git operations
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "business-os",
    phase: "P0",
    runtime: "nodejs",
    timestamp: new Date().toISOString(),
  });
}
