/**
 * POST /api/internal/orders
 *
 * Internal endpoint for Caryina to fire-and-forget upsert an order row.
 * Authenticated by CARYINA_INTERNAL_TOKEN header (not session cookie).
 * Exempt from session gate via middleware (/api/internal/* matcher).
 *
 * Request body (JSON):
 *   {
 *     id: string           — Order ID (idempotencyKey from Caryina checkout)
 *     shopId: string
 *     provider: string     — "stripe" | "axerve"
 *     status?: string      — "pending" (default)
 *     amountCents: number
 *     currency?: string    — "EUR" (default)
 *     customerEmail?: string
 *     providerOrderId?: string
 *     lineItemsJson?: unknown
 *   }
 *
 * Response (200 OK):
 *   { ok: true }
 *
 * TC-04-02: If this endpoint throws, the Caryina caller catches via .catch() and logs.
 * The Caryina checkout must continue normally regardless of this write's outcome.
 */

import { NextResponse } from "next/server";

import { pmLog } from "../../../../lib/auth/pmLog";
import { timingSafeEqual } from "../../../../lib/auth/session";
import { createOrUpdateOrder } from "../../../../lib/orders/createOrUpdateOrder";

export const runtime = "nodejs";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optStr(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

interface ValidatedOrderFields {
  id: string;
  shopId: string;
  provider: string;
  amountCents: number;
}

function validateRequiredFields(
  body: Record<string, unknown>,
): ValidatedOrderFields | null {
  const { id, shopId, provider, amountCents } = body;
  if (
    typeof id !== "string" || !id.trim() ||
    typeof shopId !== "string" || !shopId.trim() ||
    typeof provider !== "string" || !provider.trim() ||
    typeof amountCents !== "number" || !Number.isFinite(amountCents)
  ) {
    return null;
  }
  return {
    id: id.trim(),
    shopId: shopId.trim(),
    provider: provider.trim(),
    amountCents,
  };
}

export async function POST(request: Request) {
  // Token auth — CARYINA_INTERNAL_TOKEN must be present in both PM and Caryina.
  let internalToken: string;
  try {
    internalToken = requireEnv("CARYINA_INTERNAL_TOKEN");
  } catch {
    pmLog("error", "internal_orders_no_token_config", {
      message: "CARYINA_INTERNAL_TOKEN not set — internal orders endpoint unavailable", // i18n-exempt -- PM-0004 server error [ttl=2027-12-31]
    });
    return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (
    !bearerToken ||
    bearerToken.length !== internalToken.length ||
    !timingSafeEqual(bearerToken, internalToken)
  ) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const fields = validateRequiredFields(body);
  if (!fields) {
    return NextResponse.json({ ok: false, error: "missing_required_fields" }, { status: 400 });
  }

  try {
    await createOrUpdateOrder({
      id: fields.id,
      shopId: fields.shopId,
      provider: fields.provider,
      amountCents: fields.amountCents,
      status: optStr(body.status) ?? "pending",
      currency: optStr(body.currency) ?? "EUR",
      customerEmail: optStr(body.customerEmail) ?? undefined,
      providerOrderId: optStr(body.providerOrderId) ?? undefined,
      lineItemsJson: body.lineItemsJson,
    });
    pmLog("info", "internal_order_upsert", {
      id: fields.id,
      shopId: fields.shopId,
      provider: fields.provider,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    pmLog("error", "internal_order_upsert_failed", {
      id: fields.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "upsert_failed" }, { status: 500 });
  }
}
