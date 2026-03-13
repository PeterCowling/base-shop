import { type NextRequest, NextResponse } from "next/server";

import { inventoryRepository } from "@acme/platform-core/repositories/inventory.server";
import { validateShopName } from "@acme/platform-core/shops";

import { apiError } from "../../../../lib/api-helpers";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const { shop } = await context.params;
  const safeShop = validateShopName(shop);
  try {
    const items = await inventoryRepository.read(safeShop);
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    return apiError(err);
  }
}
