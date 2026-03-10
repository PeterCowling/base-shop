import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";
import { validateShopName } from "@acme/platform-core/shops";

import { apiError, parseSafeLimit } from "../../../../../lib/api-helpers";
import { type LedgerEvent } from "../../../../../lib/inventory-utils";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const { shop } = await context.params;
  const safeShop = validateShopName(shop);
  const { searchParams } = new URL(req.url);

  const sku = searchParams.get("sku") ?? undefined;
  const type = searchParams.get("type") as LedgerEvent["type"] | null;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = parseSafeLimit(searchParams);

  try {
    const where: Record<string, unknown> = { shopId: safeShop };
    if (sku) where.sku = sku;
    if (type && (type === "adjustment" || type === "inflow")) where.type = type;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- INV-0001 prisma client type varies by generated schema
    const rows: any[] = await (prisma as any).inventoryAuditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

    const events: LedgerEvent[] = page.map((r) => ({
      id: r.id as string,
      timestamp: (r.createdAt as Date).toISOString(),
      type: r.type as LedgerEvent["type"],
      sku: r.sku as string,
      variantKey: r.variantKey as string,
      quantityDelta: r.quantityDelta as number,
      referenceId: (r.referenceId as string | null) ?? null,
      note: (r.note as string | null) ?? null,
    }));

    return NextResponse.json({ ok: true, events, nextCursor });
  } catch (err) {
    return apiError(err);
  }
}
