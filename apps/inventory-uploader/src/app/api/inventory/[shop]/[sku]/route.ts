import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  inventoryRepository,
  updateInventoryItem,
  variantKey,
} from "@acme/platform-core/repositories/inventory.server";
import { validateShopName } from "@acme/platform-core/shops";
import { inventoryItemSchema } from "@acme/platform-core/types/inventory";

import { apiError } from "../../../../../lib/api-helpers";

export const runtime = "nodejs";

const patchBodySchema = z.object({
  variantAttributes: z.record(z.string()).optional().default({}),
  quantity: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string; sku: string }> },
) {
  const { shop, sku } = await context.params;
  const safeShop = validateShopName(shop);

  try {
    const items = await inventoryRepository.read(safeShop);
    const variants = items.filter((i) => i.sku === sku);
    if (variants.length === 0) {
      return NextResponse.json({ ok: false, error: "SKU not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, sku, variants });
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string; sku: string }> },
) {
  const { shop, sku } = await context.params;
  const safeShop = validateShopName(shop);

  try {
    const body = await req.json().catch(() => null);
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const { variantAttributes, quantity, lowStockThreshold } = parsed.data;

    const updated = await updateInventoryItem(
      safeShop,
      sku,
      variantAttributes,
      (current) => {
        if (!current) return undefined;
        return inventoryItemSchema.parse({
          ...current,
          quantity,
          ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
        });
      },
    );

    if (!updated) {
      return NextResponse.json({ ok: false, error: "SKU/variant not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      item: updated,
      variantKey: variantKey(updated.sku, updated.variantAttributes),
    });
  } catch (err) {
    return apiError(err);
  }
}
