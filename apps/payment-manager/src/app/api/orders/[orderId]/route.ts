/**
 * GET /api/orders/:orderId
 *
 * Returns full order detail including refund history.
 *
 * Query params:
 *   unmask — "1" to return unmasked customerEmail (admin-only)
 *
 * Response (200 OK):
 *   { order: OrderDetail }
 * Response (404 Not Found):
 *   { ok: false, error: "not_found" }
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../../lib/auth/pmLog";
import { hasPmSession } from "../../../../lib/auth/session";
import { maskEmail } from "../../../../lib/orders/maskEmail";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
const prismaAny = prisma as any;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "missing_order_id" }, { status: 400 });
  }

  const unmask = new URL(request.url).searchParams.get("unmask") === "1";

  try {
    const order = await prismaAny.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        shopId: true,
        provider: true,
        status: true,
        amountCents: true,
        currency: true,
        customerEmail: true,
        providerOrderId: true,
        lineItemsJson: true,
        createdAt: true,
        updatedAt: true,
        refunds: {
          select: {
            id: true,
            amountCents: true,
            status: true,
            providerRefundId: true,
            reason: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        id: order.id as string,
        shopId: order.shopId as string,
        provider: order.provider as string,
        status: order.status as string,
        amountCents: order.amountCents as number,
        currency: order.currency as string,
        customerEmail: unmask
          ? (order.customerEmail as string | null)
          : maskEmail(order.customerEmail as string | null),
        providerOrderId: order.providerOrderId as string | null,
        lineItemsJson: order.lineItemsJson ?? null,
        createdAt: (order.createdAt as Date).toISOString(),
        updatedAt: (order.updatedAt as Date).toISOString(),
        refunds: (order.refunds as unknown[]).map((r: unknown) => {
          const ref = r as {
            id: string;
            amountCents: number;
            status: string;
            providerRefundId: string | null;
            reason: string | null;
            createdAt: Date;
          };
          return {
            id: ref.id,
            amountCents: ref.amountCents,
            // Refund model has no currency column — inherit from the parent order.
            currency: order.currency as string,
            status: ref.status,
            providerRefundId: ref.providerRefundId,
            reason: ref.reason,
            createdAt: ref.createdAt.toISOString(),
          };
        }),
      },
    });
  } catch (err) {
    pmLog("error", "order_detail_failed", {
      orderId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
