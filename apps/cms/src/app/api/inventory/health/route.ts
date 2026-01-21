import { type NextRequest,NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

export const runtime = "nodejs";

/**
 * Inventory Authority Health Check
 *
 * GET /api/inventory/health
 *
 * Returns health status of the inventory system including:
 * - Database connectivity
 * - Backend status
 * - Service availability
 */
export async function GET(_req: NextRequest): Promise<NextResponse> {
  const checks = {
    service: "inventory-authority",
    timestamp: new Date().toISOString(),
    status: "healthy",
    checks: {
      database: false,
      backend: process.env.INVENTORY_BACKEND || "auto",
    },
  };

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = true;
  } catch (err) {
    checks.status = "degraded";
    console.error("[Inventory Health] Database check failed:", err);
  }

  const status = checks.status === "healthy" ? 200 : 503;

  return NextResponse.json(checks, { status });
}
