/**
 * POST /api/reconciliation/resolve
 *
 * Marks a stale pending order as "resolved".
 * Idempotent: already-resolved orders return 200 without re-writing.
 *
 * Request body (JSON):
 *   { orderId: string }
 *
 * Response (200 OK):
 *   { ok: true }
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../../lib/auth/pmLog";
import { hasPmSession } from "../../../../lib/auth/session";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
const prismaAny = prisma as any;

export async function POST(request: Request) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { orderId } = body as Record<string, unknown>;
  if (typeof orderId !== "string" || !orderId.trim()) {
    return NextResponse.json({ ok: false, error: "missing_order_id" }, { status: 400 });
  }

  try {
    const order = await prismaAny.order.findUnique({
      where: { id: orderId.trim() },
      select: { id: true, status: true, shopId: true },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    // Idempotent: already resolved → no-op
    if ((order.status as string) === "resolved") {
      pmLog("info", "reconciliation_resolve_noop", { orderId: order.id });
      return NextResponse.json({ ok: true });
    }

    await prismaAny.order.update({
      where: { id: order.id },
      data: { status: "resolved" },
    });

    pmLog("info", "reconciliation_resolve", { orderId: order.id, shopId: order.shopId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    pmLog("error", "reconciliation_resolve_failed", {
      orderId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
