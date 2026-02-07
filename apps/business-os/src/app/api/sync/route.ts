import { NextResponse } from "next/server";
/**
 * POST /api/sync
 * Hosted (D1) path: no git sync is required/possible.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: true,
      // i18n-exempt -- BOS-D1 Phase 0 API success message [ttl=2026-03-31]
      message: "Sync is not available in the D1-hosted Edge runtime.",
    },
    { status: 200 }
  );
}
