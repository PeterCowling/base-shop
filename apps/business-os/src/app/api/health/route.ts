import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "business-os",
    phase: "P0",
    runtime: "edge",
    timestamp: new Date().toISOString(),
  });
}
