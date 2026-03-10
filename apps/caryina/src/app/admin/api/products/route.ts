import { NextResponse } from "next/server";

import type { InventoryItem } from "@acme/platform-core/repositories/inventory.server";
import { updateInventoryItem } from "@acme/platform-core/repositories/inventory.server";
import {
  deleteProductFromRepo,
  readRepo,
  writeRepo,
} from "@acme/platform-core/repositories/products.server";
import type { ProductPublication } from "@acme/types";

import { createProductSchema } from "@/lib/adminSchemas";
import { CARYINA_INVENTORY_BACKEND } from "@/lib/inventoryBackend";

const SHOP = "caryina";

/** Returns crypto.randomUUID; falls back to node:crypto in jsdom test environments. */
function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- CARYINA-AUTH-01: jsdom lacks crypto.randomUUID; dead path in Worker/Node 18+
  const { webcrypto } = require("node:crypto") as typeof import("node:crypto");
  return webcrypto.randomUUID();
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { sku, title, description, price, currency, status, media, forSale, initialStock } =
    parsed.data;

  if (status === "active" && initialStock <= 0) {
    return NextResponse.json({ ok: false, error: "active_requires_stock" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const product: ProductPublication = {
    id: generateId(),
    sku,
    title: { en: title, de: title, it: title },
    description: { en: description, de: description, it: description },
    price,
    currency,
    media,
    created_at: now,
    updated_at: now,
    shop: SHOP,
    status,
    row_version: 1,
    forSale,
    forRental: false,
  };

  const existing = await readRepo(SHOP);
  await writeRepo(SHOP, [...existing, product]);

  if (initialStock > 0) {
    try {
      const bootstrapped = await updateInventoryItem(
        SHOP,
        sku,
        {},
        (current) => {
          if (!current) {
            return {
              sku,
              productId: product.id,
              quantity: initialStock,
              variantAttributes: {},
            } satisfies InventoryItem;
          }

          return {
            ...current,
            productId: current.productId || product.id,
            quantity: initialStock,
          } satisfies InventoryItem;
        },
        { backend: CARYINA_INVENTORY_BACKEND },
      );

      if (!bootstrapped) {
        throw new Error(`Inventory bootstrap returned no row for ${sku}`);
      }
    } catch (error) {
      console.error("Failed to bootstrap inventory for Caryina product create", error);
      try {
        await deleteProductFromRepo(SHOP, product.id);
      } catch (rollbackError) {
        console.error("Failed to roll back Caryina product after inventory bootstrap failure", rollbackError);
      }

      return NextResponse.json(
        { ok: false, error: "inventory_bootstrap_failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, data: product }, { status: 201 });
}
