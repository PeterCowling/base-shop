/**
 * POST /admin/api/refunds
 *
 * Phase 2: Unified refund proxy — delegates all refund requests (Stripe and Axerve)
 * to Payment Manager's /api/refunds endpoint.
 *
 * The /admin/* path is protected by an admin cookie check in Caryina's middleware.
 * This route does NOT perform its own auth check — it relies on that middleware gate.
 *
 * Payment Manager auth: CARYINA_PM_TOKEN is sent as "Authorization: Bearer <token>"
 * so the PM middleware's hasCaryinaPmBearerToken check allows the forwarded request
 * through without requiring a PM session cookie.
 *
 * Request body: forwarded verbatim to Payment Manager.
 *
 * Response:
 *   200 { ok: true, refundId?: string }   — success
 *   400 { ok: false, error: string }      — validation error from PM
 *   401 { ok: false, error: string }      — PM auth failure (misconfigured token)
 *   404 { ok: false, error: string }      — order not found in PM
 *   502 { ok: false, error: string }      — PM unreachable
 *   503 { ok: false, error: string }      — payment provider unavailable
 *   500 { ok: false, error: string }      — internal error
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PM_BASE_URL = process.env.PAYMENT_MANAGER_URL ?? "";
const CARYINA_PM_TOKEN = process.env.CARYINA_PM_TOKEN ?? "";

export async function POST(request: Request) {
  if (!PM_BASE_URL || !CARYINA_PM_TOKEN) {
    return NextResponse.json(
      { ok: false, error: "Payment Manager integration not configured" },
      { status: 503 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  let pmRes: Response;
  try {
    pmRes = await fetch(`${PM_BASE_URL}/api/refunds`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CARYINA_PM_TOKEN}`,
      },
      body: JSON.stringify(rawBody),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Payment Manager unavailable" },
      { status: 502 },
    );
  }

  // Forward PM's status code and body verbatim so the caller gets the exact
  // error message from PM (validation errors, order not found, etc.)
  const responseBody = await pmRes.json().catch(() => ({ ok: false, error: "invalid_response" }));
  return NextResponse.json(responseBody, { status: pmRes.status });
}
