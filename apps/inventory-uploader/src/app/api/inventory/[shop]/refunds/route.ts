// Operator-only endpoint to issue refunds through the shop's payment provider.
// Protected by middleware (INVENTORY_SESSION_SECRET + INVENTORY_ADMIN_TOKEN).
// Requires Node.js runtime — Axerve uses the dynamic `soap` import.
//
// Unlike caryina's admin refunds route, this implementation is fully portable:
// - Provider is resolved from env (no filesystem-backed checkout idempotency lookup).
// - Stripe payment intent ID is accepted directly in the request body.

import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { AxerveError, callRefund } from "@acme/axerve";

import { apiError } from "../../../../../lib/api-helpers";
import { refundRequestSchema } from "../../../../../lib/productSchemas";

export const runtime = "nodejs";

function resolveProvider(shop: string): "axerve" | "stripe" {
  // PAYMENTS_PROVIDER is set per-shop via wrangler env vars or process.env.
  // Defaults to "axerve" when not set (caryina production default).
  const provider = process.env[`PAYMENTS_PROVIDER_${shop.toUpperCase()}`]
    ?? process.env.PAYMENTS_PROVIDER
    ?? "axerve";
  return provider === "stripe" ? "stripe" : "axerve";
}

/**
 * POST /api/inventory/[shop]/refunds
 *
 * Initiates a full or partial refund for a completed order.
 *
 * Body:
 *   shopTransactionId?: string    — Axerve transaction ID from merchant email (preferred for Axerve)
 *   bankTransactionId?: string    — Bank-side transaction ID (Axerve fallback)
 *   amountCents: number           — Positive integer in minor units (e.g. 4500 = €45.00)
 *   stripePaymentIntentId?: string — Required when provider is "stripe"
 *
 * At least one of shopTransactionId or bankTransactionId must be provided.
 *
 * Responses:
 *   200 { ok: true, data: { transactionId, bankTransactionId } }
 *   400 { ok: false, error: "validation_error", details: ... }
 *   402 { ok: false, error: string, errorCode?: string }  — provider declined
 *   502 { ok: false, error: "Payment service unavailable" }  — provider error
 *   503 { ok: false, error: "Payment service not configured" }  — missing env vars
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const { shop } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const parsed = refundRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { shopTransactionId, bankTransactionId, amountCents, stripePaymentIntentId } =
    parsed.data;
  const provider = resolveProvider(shop);

  if (provider === "stripe") {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
    if (!stripeSecretKey) {
      console.error("[refunds] Missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { ok: false, error: "Payment service not configured" },
        { status: 503 },
      );
    }
    if (!stripePaymentIntentId) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_error",
          details: { formErrors: ["stripePaymentIntentId is required for Stripe refunds"] },
        },
        { status: 400 },
      );
    }
    try {
      const stripe = new Stripe(stripeSecretKey);
      const refund = await stripe.refunds.create({
        payment_intent: stripePaymentIntentId,
        amount: amountCents,
      });
      console.info("[refunds] Stripe refund OK", {
        id: refund.id,
        status: refund.status,
      });
      return NextResponse.json(
        { ok: true, data: { transactionId: refund.id, bankTransactionId: null } },
        { status: 200 },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe refund failed";
      console.error("[refunds] Stripe refund error", message);
      return NextResponse.json(
        { ok: false, error: "Payment service unavailable" },
        { status: 502 },
      );
    }
  }

  // Axerve path
  const shopLogin = process.env.AXERVE_SHOP_LOGIN ?? "";
  const apiKey = process.env.AXERVE_API_KEY ?? "";
  if (!shopLogin || !apiKey) {
    console.error("[refunds] Missing AXERVE_SHOP_LOGIN or AXERVE_API_KEY");
    return NextResponse.json(
      { ok: false, error: "Payment service not configured" },
      { status: 503 },
    );
  }

  const amount = (amountCents / 100).toFixed(2);

  let result;
  try {
    result = await callRefund({
      shopLogin,
      apiKey,
      shopTransactionId,
      bankTransactionId,
      amount,
      uicCode: "978",
    });
  } catch (err) {
    if (err instanceof AxerveError) {
      console.error("[refunds] Axerve SOAP error", err.message);
      return NextResponse.json(
        { ok: false, error: "Payment service unavailable" },
        { status: 502 },
      );
    }
    return apiError(err);
  }

  if (result.success) {
    console.info("[refunds] Axerve refund OK", {
      shopTransactionId: result.transactionId,
      bankTransactionId: result.bankTransactionId,
    });
    return NextResponse.json(
      {
        ok: true,
        data: {
          transactionId: result.transactionId,
          bankTransactionId: result.bankTransactionId,
        },
      },
      { status: 200 },
    );
  }

  console.error("[refunds] Axerve refund KO", {
    errorCode: result.errorCode,
    errorDescription: result.errorDescription,
  });
  return NextResponse.json(
    {
      ok: false,
      error: result.errorDescription ?? "Refund declined",
      errorCode: result.errorCode,
    },
    { status: 402 },
  );
}
