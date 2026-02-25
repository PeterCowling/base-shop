/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] machine-token route guards and reason codes */

import { NextResponse } from "next/server";

import {
  CatalogCsvConflictError,
  listCatalogDrafts,
  upsertCatalogDraft,
} from "../../../../lib/catalogCsv";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

type ProductsErrorCode =
  | "invalid"
  | "missing_product"
  | "conflict"
  | "internal_error"
  | "rate_limited"
  | "payload_too_large";

const PRODUCTS_LIST_WINDOW_MS = 60 * 1000;
const PRODUCTS_LIST_MAX_REQUESTS = 120;
const PRODUCTS_UPSERT_WINDOW_MS = 60 * 1000;
const PRODUCTS_UPSERT_MAX_REQUESTS = 30;
const PRODUCTS_UPSERT_MAX_BYTES = 256 * 1024;

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

function withRateHeaders(response: NextResponse, limit: ReturnType<typeof rateLimit>): NextResponse {
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

export async function GET(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-products-get:${requestIp}`,
    windowMs: PRODUCTS_LIST_WINDOW_MS,
    max: PRODUCTS_LIST_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      buildProductsErrorResponse("rate_limited", 429, "products_list_rate_limited"),
      limit,
    );
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  try {
    const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
    const { products, revisionsById } = await listCatalogDrafts(storefront);
    return withRateHeaders(NextResponse.json({ ok: true, products, revisionsById }), limit);
  } catch {
    return withRateHeaders(
      buildProductsErrorResponse("internal_error", 500, "products_list_failed"),
      limit,
    );
  }
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-products-post:${requestIp}`,
    windowMs: PRODUCTS_UPSERT_WINDOW_MS,
    max: PRODUCTS_UPSERT_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      buildProductsErrorResponse("rate_limited", 429, "products_upsert_rate_limited"),
      limit,
    );
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await readJsonBodyWithLimit(request, PRODUCTS_UPSERT_MAX_BYTES)) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return withRateHeaders(
        buildProductsErrorResponse("payload_too_large", 413, "payload_too_large"),
        limit,
      );
    }
    if (error instanceof InvalidJsonError) {
      return withRateHeaders(
        buildProductsErrorResponse("invalid", 400, "invalid_json"),
        limit,
      );
    }
    return withRateHeaders(buildProductsErrorResponse("invalid", 400, "invalid_json"), limit);
  }

  const product = payload.product;
  const ifMatch = typeof payload.ifMatch === "string" ? payload.ifMatch : undefined;
  if (!product || typeof product !== "object") {
    return withRateHeaders(
      buildProductsErrorResponse("missing_product", 400, "missing_product_payload"),
      limit,
    );
  }

  try {
    const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
    const result = await upsertCatalogDraft(product as never, { ifMatch, storefront });
    return withRateHeaders(
      NextResponse.json({ ok: true, product: result.product, revision: result.revision }),
      limit,
    );
  } catch (error) {
    if (error instanceof CatalogCsvConflictError) {
      return withRateHeaders(
        buildProductsErrorResponse("conflict", 409, "revision_conflict"),
        limit,
      );
    }
    if (isInvalidCatalogUpdateError(error)) {
      return withRateHeaders(
        buildProductsErrorResponse("invalid", 400, "catalog_validation_failed"),
        limit,
      );
    }
    return withRateHeaders(
      buildProductsErrorResponse("internal_error", 500, "products_upsert_failed"),
      limit,
    );
  }
}
