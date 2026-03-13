/**
 * GET /api/shops
 *
 * Lists all shops with their active payment provider and last-updated timestamps.
 *
 * Response:
 *   200 { shops: ShopSummary[] }
 *   401 { ok: false, error: "unauthorized" }
 *   500 { ok: false, error: "internal_error" }
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../lib/auth/pmLog";
import { hasPmSession } from "../../../lib/auth/session";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
const prismaAny = prisma as any;

export async function GET(request: Request) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const configs: Array<{
      shopId: string;
      activeProvider: string;
      createdAt: Date;
      updatedAt: Date;
    }> = await prismaAny.shopPaymentConfig.findMany({
      select: {
        shopId: true,
        activeProvider: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { shopId: "asc" },
    });

    return NextResponse.json({
      shops: configs.map((c) => ({
        shopId: c.shopId,
        activeProvider: c.activeProvider,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    pmLog("error", "shops_list_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
