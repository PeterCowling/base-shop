/**
 * GET /api/shops/:shopId/config
 * PUT /api/shops/:shopId/config
 *
 * GET: Returns the active provider for the shop.
 * PUT: Updates activeProvider and writes an immutable PaymentConfigAudit record.
 *
 * PUT request body (JSON):
 *   { activeProvider: "stripe" | "axerve" | "disabled" }
 *
 * Response:
 *   200 { shopId, activeProvider }
 *   400 { ok: false, error: string }
 *   401 { ok: false, error: "unauthorized" }
 *   404 { ok: false, error: "not_found" }
 *   500 { ok: false, error: "internal_error" }
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../../../lib/auth/pmLog";
import { hasPmSession } from "../../../../../lib/auth/session";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
const prismaAny = prisma as any;

const VALID_PROVIDERS = ["stripe", "axerve", "disabled"] as const;
type Provider = typeof VALID_PROVIDERS[number];

function isValidProvider(v: unknown): v is Provider {
  return typeof v === "string" && VALID_PROVIDERS.includes(v as Provider);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> },
) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { shopId } = await params;

  try {
    const config: { shopId: string; activeProvider: string; updatedAt: Date } | null =
      await prismaAny.shopPaymentConfig.findUnique({
        where: { shopId },
        select: { shopId: true, activeProvider: true, updatedAt: true },
      });

    if (!config) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({
      shopId: config.shopId,
      activeProvider: config.activeProvider,
      updatedAt: config.updatedAt.toISOString(),
    });
  } catch (err) {
    pmLog("error", "shop_config_get_failed", {
      shopId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> },
) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { shopId } = await params;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { activeProvider } = rawBody as Record<string, unknown>;
  if (!isValidProvider(activeProvider)) {
    return NextResponse.json(
      { ok: false, error: `activeProvider must be one of: ${VALID_PROVIDERS.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const existing: { activeProvider: string } | null =
      await prismaAny.shopPaymentConfig.findUnique({
        where: { shopId },
        select: { activeProvider: true },
      });

    const oldValue = existing?.activeProvider ?? null;

    const updated = await prismaAny.shopPaymentConfig.upsert({
      where: { shopId },
      create: { shopId, activeProvider },
      update: { activeProvider },
      select: { shopId: true, activeProvider: true, updatedAt: true },
    });

    // Immutable audit log — write even if value didn't change (operator confirmation)
    await prismaAny.paymentConfigAudit.create({
      data: {
        shopId,
        changedBy: "operator",
        field: "activeProvider",
        oldValue,
        newValue: activeProvider,
      },
    });

    pmLog("info", "shop_provider_switched", {
      shopId,
      oldValue,
      newValue: activeProvider,
    });

    return NextResponse.json({
      shopId: updated.shopId,
      activeProvider: updated.activeProvider,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    pmLog("error", "shop_config_put_failed", {
      shopId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
