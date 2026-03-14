/**
 * POST /api/internal/axerve-refund
 *
 * Internal endpoint for Payment Manager to proxy Axerve refund calls.
 * Authenticated by x-internal-token header matching CARYINA_INTERNAL_TOKEN.
 *
 * This route is NOT under /admin/:path* and is not gated by the admin cookie.
 * It is a service-to-service endpoint, token-protected.
 *
 * Request body (JSON):
 *   {
 *     shopTransactionId?: string   — preferred identifier (from merchant email)
 *     bankTransactionId?: string   — fallback identifier (from server logs)
 *     amountCents: number          — refund amount in minor currency units (e.g. 4500 = €45.00)
 *   }
 *
 * Response:
 *   200 { ok: true, transactionId: string, bankTransactionId: string }
 *   200 { ok: false, error: string, errorCode?: string }  — Axerve declined
 *   400 { ok: false, error: string }                       — validation error
 *   401 { ok: false, error: "unauthorized" }               — bad/missing token
 *   503 { ok: false, error: "Payment service not configured" } — missing env vars
 *   502 { ok: false, error: "Payment service unavailable" } — SOAP failure
 */

import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { AxerveError, callRefund } from "@acme/axerve";

// Requires Node.js runtime — Axerve refunds use the dynamic `soap` import.
export const runtime = "nodejs";

interface ParsedBody {
  shopTransactionId?: string;
  bankTransactionId?: string;
  amountCents: number;
}

type BodyParseResult =
  | { ok: true; data: ParsedBody }
  | { ok: false; error: string };

function parseBody(raw: unknown): BodyParseResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "invalid_body" };
  }
  const b = raw as Record<string, unknown>;

  if (typeof b.amountCents !== "number" || !Number.isInteger(b.amountCents) || b.amountCents <= 0) {
    return { ok: false, error: "amountCents must be a positive integer" };
  }
  if (b.shopTransactionId !== undefined && typeof b.shopTransactionId !== "string") {
    return { ok: false, error: "shopTransactionId must be a string" };
  }
  if (b.bankTransactionId !== undefined && typeof b.bankTransactionId !== "string") {
    return { ok: false, error: "bankTransactionId must be a string" };
  }
  if (!b.shopTransactionId && !b.bankTransactionId) {
    return { ok: false, error: "shopTransactionId or bankTransactionId required" };
  }

  return {
    ok: true,
    data: {
      shopTransactionId: b.shopTransactionId as string | undefined,
      bankTransactionId: b.bankTransactionId as string | undefined,
      amountCents: b.amountCents,
    },
  };
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: Request) {
  // Token authentication — timing-safe comparison prevents timing attacks.
  const token = request.headers.get("x-internal-token") ?? "";
  const expectedToken = process.env.CARYINA_INTERNAL_TOKEN ?? "";
  if (!expectedToken || !token || !timingSafeStringEqual(token, expectedToken)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = parseBody(rawBody);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { shopTransactionId, bankTransactionId, amountCents } = parsed.data;

  // Fail-fast misconfiguration guard
  const shopLogin = process.env.AXERVE_SHOP_LOGIN ?? "";
  const apiKey = process.env.AXERVE_API_KEY ?? "";
  if (!shopLogin || !apiKey) {
    return NextResponse.json({ ok: false, error: "Payment service not configured" }, { status: 503 });
  }

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
      uicCode: "978", // EUR
    });
  } catch (err) {
    if (err instanceof AxerveError) {
      return NextResponse.json({ ok: false, error: "Payment service unavailable" }, { status: 502 });
    }
    throw err;
  }

  if (result.success) {
    return NextResponse.json({
      ok: true,
      transactionId: result.transactionId,
      bankTransactionId: result.bankTransactionId,
    });
  }

  return NextResponse.json({
    ok: false,
    error: result.errorDescription ?? "Refund declined",
    errorCode: result.errorCode,
  });
}
