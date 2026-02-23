/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] machine-token route guards and reason codes */

import { NextResponse } from "next/server";

import {
  CatalogCsvConflictError,
  listCatalogDrafts,
  upsertCatalogDraft,
} from "../../../../lib/catalogCsv";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

type ProductsErrorCode = "invalid" | "missing_product" | "conflict" | "internal_error";

function hasValidationIssues(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("issues" in error)) return false;
  return Array.isArray((error as { issues?: unknown }).issues);
}

function isInvalidCatalogUpdateError(error: unknown): boolean {
  if (hasValidationIssues(error)) return true;
  if (!(error instanceof Error)) return false;
  if (error instanceof CatalogCsvConflictError) return false;
  return (
    error.message.startsWith('Product id "') ||
    error.message.startsWith('Duplicate product slug "')
  );
}

function buildProductsErrorResponse(error: ProductsErrorCode, status: number, reason: string) {
  return NextResponse.json({ ok: false, error, reason }, { status });
}

export async function GET(request: Request) {
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
    const { products, revisionsById } = await listCatalogDrafts(storefront);
    return NextResponse.json({ ok: true, products, revisionsById });
  } catch {
    return buildProductsErrorResponse("internal_error", 500, "products_list_failed");
  }
}

export async function POST(request: Request) {
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return buildProductsErrorResponse("invalid", 400, "invalid_json");
  }

  const product = payload.product;
  const ifMatch = typeof payload.ifMatch === "string" ? payload.ifMatch : undefined;
  if (!product || typeof product !== "object") {
    return buildProductsErrorResponse("missing_product", 400, "missing_product_payload");
  }

  try {
    const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
    const result = await upsertCatalogDraft(product as never, { ifMatch, storefront });
    return NextResponse.json({ ok: true, product: result.product, revision: result.revision });
  } catch (error) {
    if (error instanceof CatalogCsvConflictError) {
      return buildProductsErrorResponse("conflict", 409, "revision_conflict");
    }
    if (isInvalidCatalogUpdateError(error)) {
      return buildProductsErrorResponse("invalid", 400, "catalog_validation_failed");
    }
    return buildProductsErrorResponse("internal_error", 500, "products_upsert_failed");
  }
}
