import { NextResponse } from "next/server";

import type { InventoryItem } from "@acme/platform-core/repositories/inventory.server";
import { updateInventoryItem } from "@acme/platform-core/repositories/inventory.server";
import { readRepo } from "@acme/platform-core/repositories/products.server";

import { updateInventorySchema } from "@/lib/adminSchemas";

const SHOP = "caryina";

type RouteContext = { params: Promise<{ sku: string }> };

type ProductLookup = { id: string; sku: string };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { sku } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const parsed = updateInventorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { quantity, variantAttributes } = parsed.data;
  const products = await readRepo<ProductLookup>(SHOP);
  const matchingProduct = products.find((product) => product.sku === sku);

  const updated = await updateInventoryItem(SHOP, sku, variantAttributes, (current) => {
    if (!current) {
      if (!matchingProduct) return undefined;
      return {
        sku,
        productId: matchingProduct.id,
        quantity,
        variantAttributes,
      } satisfies InventoryItem;
    }

    return { ...current, quantity } satisfies InventoryItem;
  });

  if (!updated) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: updated });
}
