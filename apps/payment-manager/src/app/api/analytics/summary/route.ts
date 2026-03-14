/**
 * GET /api/analytics/summary
 *
 * Returns aggregated payment metrics for operator analytics dashboard.
 * All metrics filterable by shop and date range.
 *
 * Query params:
 *   shop   — filter by shopId
 *   from   — ISO date string (inclusive lower bound, defaults to 30 days ago)
 *   to     — ISO date string (inclusive upper bound, defaults to now)
 *
 * Response (200 OK):
 *   {
 *     revenueCents:       number,   // sum of completed orders in range
 *     orderCount:         number,   // total orders (all statuses) in range
 *     completedCount:     number,
 *     failedCount:        number,
 *     failureRatePct:     number,   // failed / total * 100 (0 when total = 0)
 *     refundCount:        number,
 *     refundAmountCents:  number,
 *     refundRatePct:      number,   // refundCount / completedCount * 100 (0 when completedCount = 0)
 *     providerSplit:      { stripe: number, axerve: number },  // completed order counts by provider
 *   }
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../../lib/auth/pmLog";
import { hasPmSession } from "../../../../lib/auth/session";

export const runtime = "nodejs";

const DEFAULT_RANGE_DAYS = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
const prismaAny = prisma as any;

function parseDateParam(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return isNaN(d.getTime()) ? fallback : d;
}

interface OrderWhere {
  shopId?: string;
  createdAt: { gte: Date; lte: Date };
}

interface RefundWhere {
  shopId?: string;
  createdAt: { gte: Date; lte: Date };
}

function buildOrderWhere(shopParam: string | null, from: Date, to: Date): OrderWhere {
  const where: OrderWhere = { createdAt: { gte: from, lte: to } };
  if (shopParam) where.shopId = shopParam;
  return where;
}

function buildRefundWhere(shopParam: string | null, from: Date, to: Date): RefundWhere {
  const where: RefundWhere = { createdAt: { gte: from, lte: to } };
  if (shopParam) where.shopId = shopParam;
  return where;
}

export async function GET(request: Request) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop");
  const toDate = parseDateParam(url.searchParams.get("to"), new Date());
  const fromDate = parseDateParam(
    url.searchParams.get("from"),
    new Date(toDate.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000),
  );

  try {
    const orderWhere = buildOrderWhere(shopParam, fromDate, toDate);
    const refundWhere = buildRefundWhere(shopParam, fromDate, toDate);

    // All orders in range (for counts and failure rate)
    const allOrders: Array<{ status: string; amountCents: number; provider: string }> =
      await prismaAny.order.findMany({
        where: orderWhere,
        select: { status: true, amountCents: true, provider: true },
      });

    // Refunds in range
    const allRefunds: Array<{ amountCents: number; status: string }> =
      await prismaAny.refund.findMany({
        where: refundWhere,
        select: { amountCents: true, status: true },
      });

    // Compute metrics
    const orderCount = allOrders.length;
    const completedOrders = allOrders.filter((o) => o.status === "completed");
    const failedOrders = allOrders.filter((o) => o.status === "failed");
    const completedCount = completedOrders.length;
    const failedCount = failedOrders.length;

    const revenueCents = completedOrders.reduce((sum, o) => sum + o.amountCents, 0);
    const failureRatePct = orderCount > 0 ? Math.round((failedCount / orderCount) * 100 * 10) / 10 : 0;

    const succeededRefunds = allRefunds.filter((r) => r.status === "succeeded");
    const refundCount = succeededRefunds.length;
    const refundAmountCents = succeededRefunds.reduce((sum, r) => sum + r.amountCents, 0);
    const refundRatePct =
      completedCount > 0 ? Math.round((refundCount / completedCount) * 100 * 10) / 10 : 0;

    const stripeCompleted = completedOrders.filter((o) => o.provider === "stripe").length;
    const axerveCompleted = completedOrders.filter((o) => o.provider === "axerve").length;

    pmLog("info", "analytics_summary", {
      shop: shopParam,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
      orderCount,
    });

    return NextResponse.json({
      revenueCents,
      orderCount,
      completedCount,
      failedCount,
      failureRatePct,
      refundCount,
      refundAmountCents,
      refundRatePct,
      providerSplit: { stripe: stripeCompleted, axerve: axerveCompleted },
    });
  } catch (err) {
    pmLog("error", "analytics_summary_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
