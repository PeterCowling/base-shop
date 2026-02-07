import { type NextRequest,NextResponse } from "next/server";

import { releaseExpiredHoldsForAllShops } from "@acme/platform-core/jobs/releaseExpiredHolds";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // Verify cron secret for security
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    console.error("[Reaper] Unauthorized cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Reaper] Starting scheduled release of expired inventory holds");
    const result = await releaseExpiredHoldsForAllShops();

    return NextResponse.json({
      ok: true,
      processedShops: result.processedShops,
      failedShops: result.failedShops,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Reaper] Critical error in cron job:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
