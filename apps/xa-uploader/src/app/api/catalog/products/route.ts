/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] machine-token route guards and reason codes */

import { NextResponse } from "next/server";

import type { CatalogProductDraftInput } from "@acme/lib/xa";
import { getCatalogDraftWorkflowReadiness, splitList } from "@acme/lib/xa";

import {
  CatalogCsvConflictError,
  CatalogCsvStorageBusyError,
  listCatalogDrafts,
  upsertCatalogDraft,
} from "../../../../lib/catalogCsv";
import {
  CatalogDraftConflictError,
  CatalogDraftContractError,
  readCloudDraftSnapshot,
  upsertProductInCloudSnapshot,
  writeCloudDraftSnapshot,
} from "../../../../lib/catalogDraftContractClient";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import { isLocalFsRuntimeEnabled, localFsUnavailableResponse } from "../../../../lib/localFsGuard";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

type ProductsErrorCode =
  | "invalid"
  | "missing_product"
  | "conflict"
  | "would_unpublish"
  | "internal_error"
  | "rate_limited"
  | "payload_too_large"
  | "service_unavailable"
  | "storage_busy";

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

function normalizeCatalogPath(pathValue: string): string {
  const trimmed = pathValue.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.replace(/^\/+/, "");
}

function normalizePipePaths(rawValue: string | undefined): string {
  const values = splitList(rawValue ?? "");
  if (values.length === 0) return "";
  return values.map((value) => normalizeCatalogPath(value)).filter(Boolean).join("|");
}

function wouldUnpublish(product: CatalogProductDraftInput): boolean {
  return product.publishState === "live" && !getCatalogDraftWorkflowReadiness(product).isPublishReady;
}

function derivePublishState(product: CatalogProductDraftInput): "draft" | "ready" | "live" {
  const readiness = getCatalogDraftWorkflowReadiness(product);
  if (!readiness.isPublishReady) return "draft";
  if (product.publishState === "live") return "live";
  return "ready";
}

function withRateHeaders(response: NextResponse, limit: ReturnType<typeof rateLimit>): NextResponse {
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

type ParsedProductsUpsertPayload =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; response: NextResponse };

async function parseProductsUpsertPayload(
  request: Request,
  limit: ReturnType<typeof rateLimit>,
): Promise<ParsedProductsUpsertPayload> {
  try {
    const payload = (await readJsonBodyWithLimit(
      request,
      PRODUCTS_UPSERT_MAX_BYTES,
    )) as Record<string, unknown>;
    return { ok: true, payload };
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return {
        ok: false,
        response: withRateHeaders(
          buildProductsErrorResponse("payload_too_large", 413, "payload_too_large"),
          limit,
        ),
      };
    }
    if (error instanceof InvalidJsonError) {
      return {
        ok: false,
        response: withRateHeaders(buildProductsErrorResponse("invalid", 400, "invalid_json"), limit),
      };
    }
    return {
      ok: false,
      response: withRateHeaders(buildProductsErrorResponse("invalid", 400, "invalid_json"), limit),
    };
  }
}

function buildProductsUpsertErrorResponse(
  error: unknown,
  limit: ReturnType<typeof rateLimit>,
): NextResponse {
  if (error instanceof CatalogCsvStorageBusyError) {
    return withRateHeaders(
      buildProductsErrorResponse("storage_busy", 503, "products_csv_locked"),
      limit,
    );
  }
  if (error instanceof CatalogCsvConflictError || error instanceof CatalogDraftConflictError) {
    return withRateHeaders(
      buildProductsErrorResponse("conflict", 409, "revision_conflict"),
      limit,
    );
  }
  if (error instanceof CatalogDraftContractError) {
    if (error.code === "unconfigured") {
      return withRateHeaders(localFsUnavailableResponse(), limit);
    }
    if (error.code === "conflict") {
      return withRateHeaders(
        buildProductsErrorResponse("conflict", 409, "revision_conflict"),
        limit,
      );
    }
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
    const { products, revisionsById } = isLocalFsRuntimeEnabled()
      ? await listCatalogDrafts(storefront)
      : await readCloudDraftSnapshot(storefront);
    return withRateHeaders(NextResponse.json({ ok: true, products, revisionsById }), limit);
  } catch (error) {
    if (error instanceof CatalogDraftContractError && error.code === "unconfigured") {
      return withRateHeaders(localFsUnavailableResponse(), limit);
    }
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
  const payloadResult = await parseProductsUpsertPayload(request, limit);
  if ("response" in payloadResult) return payloadResult.response;
  const payload = payloadResult.payload;

  const product = payload.product;
  const ifMatch = typeof payload.ifMatch === "string" ? payload.ifMatch : undefined;
  const confirmUnpublish = payload.confirmUnpublish === true;
  if (!product || typeof product !== "object") {
    return withRateHeaders(
      buildProductsErrorResponse("missing_product", 400, "missing_product_payload"),
      limit,
    );
  }

  if (!confirmUnpublish && wouldUnpublish(product as CatalogProductDraftInput)) {
    return withRateHeaders(
      NextResponse.json(
        { ok: false, error: "would_unpublish", requiresConfirmation: true, currentState: "live" },
        { status: 409 },
      ),
      limit,
    );
  }

  try {
    const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
    const productInput = product as CatalogProductDraftInput;
    const productForSave = {
      ...productInput,
      imageFiles: normalizePipePaths(productInput.imageFiles),
      publishState: derivePublishState(productInput),
    };
    if (isLocalFsRuntimeEnabled()) {
      const result = await upsertCatalogDraft(productForSave as never, { ifMatch, storefront });
      return withRateHeaders(
        NextResponse.json({ ok: true, product: result.product, revision: result.revision }),
        limit,
      );
    }

    const snapshot = await readCloudDraftSnapshot(storefront);
    const result = upsertProductInCloudSnapshot({
      product: productForSave,
      ifMatch,
      snapshot,
    });
    const writeResult = await writeCloudDraftSnapshot({
      storefront,
      products: result.products,
      revisionsById: result.revisionsById,
      ifMatchDocRevision: snapshot.docRevision,
    });
    return withRateHeaders(
      NextResponse.json({
        ok: true,
        product: result.product,
        revision: result.revision,
        docRevision: writeResult.docRevision,
      }),
      limit,
    );
  } catch (error) {
    return buildProductsUpsertErrorResponse(error, limit);
  }
}
