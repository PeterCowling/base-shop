import { type NextRequest, NextResponse } from "next/server";

import type { ProductPublication } from "@acme/platform-core/products";
import {
  deleteProductFromRepo,
  duplicateProductInRepo,
  getProductById,
  updateProductInRepo,
} from "@acme/platform-core/repositories/products.server";

import { apiError } from "../../../../../../lib/api-helpers";
import { updateProductSchema } from "../../../../../../lib/productSchemas";

export const runtime = "nodejs";

/**
 * GET /api/inventory/[shop]/products/[id]
 * Returns a single product by ID.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string; id: string }> },
) {
  const { shop, id } = await context.params;
  try {
    const product = await getProductById<ProductPublication>(shop, id);
    if (!product) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product }, { status: 200 });
  } catch (err) {
    return apiError(err);
  }
}

/**
 * PATCH /api/inventory/[shop]/products/[id]
 * Applies a partial update to a product. Returns updated product with incremented row_version.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string; id: string }> },
) {
  const { shop, id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { title, description, ...rest } = parsed.data;

  // Map title/description from string to all-locale object when provided.
  const patch: Partial<ProductPublication> & { id: string } = { id, ...rest };
  if (title !== undefined) {
    patch.title = { en: title, de: title, it: title };
  }
  if (description !== undefined) {
    patch.description = { en: description, de: description, it: description };
  }

  try {
    const updated = await updateProductInRepo<ProductPublication>(shop, patch);
    console.info("[products] updated", { shopId: shop, productId: id });
    return NextResponse.json({ ok: true, product: updated }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("not found")) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return apiError(err);
  }
}

/**
 * DELETE /api/inventory/[shop]/products/[id]
 * Deletes a product. Returns 204 on success.
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ shop: string; id: string }> },
) {
  const { shop, id } = await context.params;
  try {
    await deleteProductFromRepo(shop, id);
    console.info("[products] deleted", { shopId: shop, productId: id });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("not found")) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return apiError(err);
  }
}

/**
 * POST /api/inventory/[shop]/products/[id]
 * Duplicates a product. Returns 201 with the new product copy.
 */
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ shop: string; id: string }> },
) {
  const { shop, id } = await context.params;
  try {
    const copy = await duplicateProductInRepo<ProductPublication>(shop, id);
    console.info("[products] duplicated", { shopId: shop, sourceId: id, copyId: copy.id });
    return NextResponse.json({ ok: true, product: copy }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("not found")) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return apiError(err);
  }
}
