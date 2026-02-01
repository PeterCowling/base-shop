/**
 * Health Check Endpoint
 * MVP-A2: Detailed health information for monitoring
 *
 * D1-hosted path: Verifies D1 connectivity in Edge runtime.
 */

import { NextResponse } from "next/server";

import { getDb } from "@/lib/d1.server";

export const runtime = "edge";

export async function GET() {
  try {
    const db = getDb();
    await db.prepare("SELECT 1 as ok").first();

    return NextResponse.json({
      status: "ok",
      d1: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        d1: "error",
        timestamp: new Date().toISOString(),
        // i18n-exempt -- BOS-04 Phase 0 API error message [ttl=2026-03-31]
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}
