/**
 * GET /api/internal/shop-config
 *
 * Internal endpoint for Caryina checkout to read the active payment provider
 * at runtime without requiring a session cookie.
 *
 * Exempt from session gate via middleware (/api/internal/* matcher).
 * Authenticated by PAYMENT_MANAGER_INTERNAL_TOKEN header.
 *
 * Query params:
 *   ?shopId=caryina    — required; identifies which shop's config to return.
 *
 * Response:
 *   200 { shopId: string, activeProvider: "axerve" | "stripe" | "disabled" }
 *   400 { ok: false, error: "missing_shop_id" }
 *   401 { ok: false, error: "unauthorized" }
 *   404 { ok: false, error: "not_found" }       — no config row for this shop
 *   500 { ok: false, error: "internal_error" }
 *
 * This endpoint is intentionally read-only. Provider changes must go via
 * PUT /api/shops/:shopId/config (requires operator session).
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../../lib/auth/pmLog";
import { timingSafeEqual } from "../../../../lib/auth/session";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
const prismaAny = prisma as any;

function isAuthorised(request: Request): boolean {
  const expectedToken = process.env.PAYMENT_MANAGER_INTERNAL_TOKEN?.trim();
  if (!expectedToken) return false;

  const token = request.headers.get("x-internal-token")?.trim() ?? "";
  if (!token) return false;

  return timingSafeEqual(token, expectedToken);
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId")?.trim();

  if (!shopId) {
    return NextResponse.json({ ok: false, error: "missing_shop_id" }, { status: 400 });
  }

  try {
    let config: { shopId: string; activeProvider: string } | null =
      await prismaAny.shopPaymentConfig.findUnique({
        where: { shopId },
        select: { shopId: true, activeProvider: true },
      });

    if (!config) {
      // Auto-seed: create a default config row so that new shops don't get a hard 404
      // on first access. Callers (e.g. Caryina provider.server.ts) fall back to env-var
      // on 404, but creating the row on first-access avoids the fallback on every request
      // and allows operators to change provider via the PM dashboard immediately.
      const seeded: { shopId: string; activeProvider: string } =
        await prismaAny.shopPaymentConfig.upsert({
          where: { shopId },
          create: { shopId, activeProvider: "axerve" },
          update: {},
          select: { shopId: true, activeProvider: true },
        });
      pmLog("info", "internal_shop_config_auto_seeded", { shopId, activeProvider: seeded.activeProvider });
      config = seeded;
    }

    return NextResponse.json({
      shopId: config.shopId,
      activeProvider: config.activeProvider,
    });
  } catch (err) {
    pmLog("error", "internal_shop_config_get_failed", {
      shopId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
