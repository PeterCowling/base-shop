// apps/caryina/src/app/admin/api/refunds/route.ts
// Admin-only endpoint to issue an Axerve refund for a completed order.
// Protected by middleware.ts matcher: /admin/:path*
// Requires Node.js runtime — callRefund uses the dynamic `soap` import.

import { NextResponse } from "next/server";

import { AxerveError, callRefund } from "@acme/axerve";

import { refundRequestSchema } from "@/lib/adminSchemas";

export const runtime = "nodejs";

/**
 * POST /admin/api/refunds
 *
 * Initiates a full or partial Axerve refund for a completed order.
 * Requires admin session (enforced by middleware — no additional auth in this handler).
 *
 * Body: { shopTransactionId?: string; bankTransactionId?: string; amountCents: number }
 *   At least one of shopTransactionId (preferred, from merchant email) or bankTransactionId
 *   (from server logs) must be provided. When both are present, Axerve uses bankTransactionId.
 *   amountCents must be a positive integer (e.g. 4500 = €45.00).
 *
 * Responses:
 *   200 { ok: true, data: { transactionId, bankTransactionId } }
 *   400 { ok: false, error: "validation_error", details: ... }
 *   402 { ok: false, error: string, errorCode?: string }  — Axerve declined
 *   502 { ok: false, error: "Payment service unavailable" }  — SOAP failure
 *   503 { ok: false, error: "Payment service not configured" }  — missing env vars
 */
export async function POST(request: Request) {
  // Fail-fast misconfiguration guard — check env vars before touching Axerve.
  const shopLogin = process.env.AXERVE_SHOP_LOGIN ?? "";
  const apiKey = process.env.AXERVE_API_KEY ?? "";
  if (!shopLogin || !apiKey) {
    console.error("[refunds] Missing AXERVE_SHOP_LOGIN or AXERVE_API_KEY");
    return NextResponse.json(
      { ok: false, error: "Payment service not configured" },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
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

  const { shopTransactionId, bankTransactionId, amountCents } = parsed.data;
  // Convert minor units to Axerve decimal string (e.g. 4500 → "45.00")
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
    throw err;
  }

  if (result.success) {
    console.info("[refunds] Axerve refund OK", {
      shopTransactionId: result.transactionId,
      bankTransactionId: result.bankTransactionId,
    });
    return NextResponse.json(
      { ok: true, data: { transactionId: result.transactionId, bankTransactionId: result.bankTransactionId } },
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
