import crypto from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";

import type { ProductPublication } from "@acme/platform-core/products";
import {
  createProductInRepo,
  readRepo,
} from "@acme/platform-core/repositories/products.server";

import { apiError } from "../../../../../lib/api-helpers";
import { createProductSchema } from "../../../../../lib/productSchemas";

export const runtime = "nodejs";

/**
 * GET /api/inventory/[shop]/products
 * Returns all products for the given shop.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const { shop } = await context.params;
  try {
    const products = await readRepo<ProductPublication>(shop);
    return NextResponse.json({ ok: true, products }, { status: 200 });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * POST /api/inventory/[shop]/products
 * Creates a new product. Returns 201 with the created product.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const { shop } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
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

  const { sku, title, description, price, currency, status, media, forSale, initialStock: _ } =
    parsed.data;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const product: ProductPublication = {
    id,
    sku,
    title: { en: title, de: title, it: title },
    description: { en: description, de: description, it: description },
    price,
    currency,
    status,
    media,
    shop,
    row_version: 1,
    forSale,
    forRental: false,
    deposit: 0,
    created_at: now,
    updated_at: now,
  };

  try {
    const created = await createProductInRepo(shop, product);
    console.info("[products] created", { shopId: shop, productId: id, sku });
    return NextResponse.json({ ok: true, product: created }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
