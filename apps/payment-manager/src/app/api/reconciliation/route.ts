/**
 * GET /api/reconciliation
 *
 * Returns orders with status="pending" created more than 15 minutes ago (stale checkouts).
 * Filterable by shop. Sorted by createdAt asc (oldest stale first).
 *
 * Query params:
 *   shop — filter by shopId
 *
 * POST /api/reconciliation/resolve
 * Body: { orderId: string }
 * Marks an order as "resolved" and writes a PaymentConfigAudit entry.
 * (Handled in sub-route at /api/reconciliation/[action]/route.ts — this file is GET only.)
 *
 * Response (200 OK):
 *   { staleOrders: StaleOrder[] }
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../lib/auth/pmLog";
import { hasPmSession } from "../../../lib/auth/session";
import { maskEmail } from "../../../lib/orders/maskEmail";

export const runtime = "nodejs";

const STALE_THRESHOLD_MINUTES = 15;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
const prismaAny = prisma as any;

export async function GET(request: Request) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop");

  const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma where type varies
  const where: any = {
    status: "pending",
    createdAt: { lt: staleThreshold },
  };

  if (shopParam) {
    where.shopId = shopParam;
  }

  try {
    const rows = await prismaAny.order.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        shopId: true,
        provider: true,
        amountCents: true,
        currency: true,
        customerEmail: true,
        createdAt: true,
      },
    });

    pmLog("info", "reconciliation_list", { count: rows.length, shop: shopParam });

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
      staleOrders: rows.map((row: any) => ({
        id: row.id as string,
        shopId: row.shopId as string,
        provider: row.provider as string,
        amountCents: row.amountCents as number,
        currency: row.currency as string,
        customerEmail: maskEmail(row.customerEmail as string | null),
        createdAt: (row.createdAt as Date).toISOString(),
        elapsedMinutes: Math.floor(
          (Date.now() - (row.createdAt as Date).getTime()) / 60000,
        ),
      })),
    });
  } catch (err) {
    pmLog("error", "reconciliation_list_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
