/* eslint-disable ds/no-hardcoded-copy -- PM-0001 internal operator tool API, English-only error messages [ttl=2027-12-31] */
/**
 * POST /api/refunds
 *
 * Issues a refund for a completed order.
 * Resolves the payment provider from the Order record and routes accordingly:
 *   - Stripe: calls Stripe Refunds API directly from this Worker
 *   - Axerve: proxies to Caryina's internal /api/internal/axerve-refund route
 *
 * Request body (JSON):
 *   {
 *     orderId:    string   — PM order ID
 *     amountCents: number  — refund amount in minor units (e.g. 4500 = €45.00)
 *     reason?:    string   — optional operator note
 *   }
 *
 * Response:
 *   200 { ok: true, refundId: string }         — Stripe
 *   200 { ok: true }                            — Axerve (provider returns txn ID but not a "refundId")
 *   400 { ok: false, error: string }            — validation / amount-exceeds / bad order status
 *   401 { ok: false, error: "unauthorized" }
 *   404 { ok: false, error: "not_found" }
 *   503 { ok: false, error: "Payment service unavailable" }
 *   500 { ok: false, error: "internal_error" }
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";
import { stripe } from "@acme/stripe";

import { pmLog } from "../../../lib/auth/pmLog";
import { hasPmSession } from "../../../lib/auth/session";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
const prismaAny = prisma as any;

const CARYINA_BASE_URL = process.env.CARYINA_BASE_URL ?? "http://localhost:3001";
const CARYINA_INTERNAL_TOKEN = process.env.CARYINA_INTERNAL_TOKEN ?? "";

interface RefundBody {
  orderId: string;
  amountCents: number;
  reason?: string;
}

function validateBody(body: unknown): RefundBody | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.orderId !== "string" || !b.orderId.trim()) return null;
  if (typeof b.amountCents !== "number" || !Number.isInteger(b.amountCents) || b.amountCents <= 0) return null;
  return {
    orderId: b.orderId.trim(),
    amountCents: b.amountCents,
    reason: typeof b.reason === "string" ? b.reason.trim() || undefined : undefined,
  };
}

async function getTotalRefunded(orderId: string): Promise<number> {
  const existing: Array<{ amountCents: number }> = await prismaAny.refund.findMany({
    where: { orderId, status: { in: ["succeeded", "pending"] } },
    select: { amountCents: true },
  });
  return existing.reduce((s, r) => s + r.amountCents, 0);
}

export async function POST(request: Request) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const body = validateBody(rawBody);
  if (!body) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { orderId, amountCents, reason } = body;

  try {
    // Look up the order
    const order: {
      id: string;
      shopId: string;
      provider: string;
      status: string;
      amountCents: number;
      currency: string;
      providerOrderId: string | null;
    } | null = await prismaAny.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        shopId: true,
        provider: true,
        status: true,
        amountCents: true,
        currency: true,
        providerOrderId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    // Only completed orders can be refunded
    if (order.status !== "completed") {
      return NextResponse.json(
        { ok: false, error: `Cannot refund order with status: ${order.status}` },
        { status: 400 },
      );
    }

    // Amount cap: existing refunds + this refund must not exceed original charge
    const alreadyRefunded = await getTotalRefunded(orderId);
    if (alreadyRefunded + amountCents > order.amountCents) {
      return NextResponse.json(
        { ok: false, error: "Refund exceeds available amount" },
        { status: 400 },
      );
    }

    if (order.provider === "stripe") {
      return await handleStripeRefund({ order, amountCents, reason, prismaAny });
    }

    if (order.provider === "axerve") {
      return await handleAxerveRefund({ order, amountCents, reason, prismaAny });
    }

    return NextResponse.json(
      { ok: false, error: `Unsupported provider: ${order.provider}` },
      { status: 400 },
    );
  } catch (err) {
    pmLog("error", "refund_failed", {
      orderId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

interface OrderRecord {
  id: string;
  shopId: string;
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
  providerOrderId: string | null;
}

async function handleStripeRefund(params: {
  order: OrderRecord;
  amountCents: number;
  reason?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
  prismaAny: any;
}): Promise<NextResponse> {
  const { order, amountCents, reason, prismaAny: db } = params;

  if (!order.providerOrderId) {
    return NextResponse.json({ ok: false, error: "Stripe payment_intent ID not found on order" }, { status: 400 });
  }

  let stripeRefund;
  try {
    stripeRefund = await stripe.refunds.create({
      payment_intent: order.providerOrderId,
      amount: amountCents,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0005 Stripe Reason type version mismatch; reason field is optional operator note only
      ...(reason ? { metadata: { operator_reason: reason } } as any : {}),
    });
  } catch (err) {
    pmLog("error", "stripe_refund_failed", {
      orderId: order.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "Payment service unavailable" }, { status: 503 });
  }

  // Write Refund record
  const refundStatus = stripeRefund.status === "succeeded" ? "succeeded" : "pending";
  await db.refund.create({
    data: {
      orderId: order.id,
      shopId: order.shopId,
      provider: "stripe",
      amountCents,
      status: refundStatus,
      issuedBy: "operator",
      providerRefundId: stripeRefund.id,
      errorMessage: null,
    },
  });

  pmLog("info", "stripe_refund_ok", { orderId: order.id, refundId: stripeRefund.id });
  return NextResponse.json({ ok: true, refundId: stripeRefund.id });
}

async function handleAxerveRefund(params: {
  order: OrderRecord;
  amountCents: number;
  reason?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
  prismaAny: any;
}): Promise<NextResponse> {
  const { order, amountCents, prismaAny: db } = params;

  // Proxy to Caryina internal route
  let caryinaRes: Response;
  try {
    caryinaRes = await fetch(`${CARYINA_BASE_URL}/api/internal/axerve-refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": CARYINA_INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        shopTransactionId: order.providerOrderId ?? undefined,
        amountCents,
      }),
    });
  } catch {
    pmLog("error", "axerve_proxy_unreachable", { orderId: order.id });
    return NextResponse.json({ ok: false, error: "Payment service unavailable" }, { status: 503 });
  }

  if (!caryinaRes.ok && caryinaRes.status >= 500) {
    pmLog("error", "axerve_proxy_error", { orderId: order.id, status: caryinaRes.status });

    // Write failed refund record
    await db.refund.create({
      data: {
        orderId: order.id,
        shopId: order.shopId,
        provider: "axerve",
        amountCents,
        status: "failed",
        issuedBy: "operator",
        providerRefundId: null,
        errorMessage: `Caryina proxy error: HTTP ${caryinaRes.status}`,
      },
    });

    return NextResponse.json({ ok: false, error: "Payment service unavailable" }, { status: 503 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 proxy response type varies
  const caryinaBody = (await caryinaRes.json()) as any;

  if (!caryinaBody.ok) {
    pmLog("error", "axerve_refund_declined", { orderId: order.id, error: caryinaBody.error });

    await db.refund.create({
      data: {
        orderId: order.id,
        shopId: order.shopId,
        provider: "axerve",
        amountCents,
        status: "failed",
        issuedBy: "operator",
        providerRefundId: null,
        errorMessage: String(caryinaBody.error ?? "Refund declined"),
      },
    });

    return NextResponse.json({ ok: false, error: caryinaBody.error ?? "Refund declined" });
  }

  await db.refund.create({
    data: {
      orderId: order.id,
      shopId: order.shopId,
      provider: "axerve",
      amountCents,
      status: "succeeded",
      issuedBy: "operator",
      providerRefundId: caryinaBody.transactionId ?? null,
      errorMessage: null,
    },
  });

  pmLog("info", "axerve_refund_ok", { orderId: order.id, transactionId: caryinaBody.transactionId });
  return NextResponse.json({ ok: true });
}
