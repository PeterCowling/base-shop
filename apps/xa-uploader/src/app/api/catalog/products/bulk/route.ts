import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { type CatalogProductDraftInput,catalogProductDraftSchema, slugify } from "@acme/lib/xa";

import { upsertCatalogDraft } from "../../../../../lib/catalogCsv";
import {
  CatalogDraftContractError,
  readCloudDraftSnapshot,
  upsertProductInCloudSnapshot,
  writeCloudDraftSnapshot,
} from "../../../../../lib/catalogDraftContractClient";
import { parseStorefront } from "../../../../../lib/catalogStorefront.ts";
import { isLocalFsRuntimeEnabled, localFsUnavailableResponse } from "../../../../../lib/localFsGuard";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../../lib/rateLimit";
import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../../lib/requestJson";
import { hasUploaderSession } from "../../../../../lib/uploaderAuth";

export const runtime = "nodejs";

const BULK_WINDOW_MS = 60 * 1000;
const BULK_MAX_REQUESTS = 10;
const BULK_PAYLOAD_MAX_BYTES = 768 * 1024;
const BULK_MAX_PRODUCTS = 500;

function withRateHeaders(response: NextResponse, limit: ReturnType<typeof rateLimit>): NextResponse {
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

function normalizeBulkProducts(input: unknown): CatalogProductDraftInput[] {
  if (!Array.isArray(input)) {
    throw new Error("products_array_required");
  }
  if (input.length < 1 || input.length > BULK_MAX_PRODUCTS) {
    throw new Error("products_array_size_invalid");
  }
  const seenSlugs = new Set<string>();
  const normalized: CatalogProductDraftInput[] = [];
  for (const entry of input) {
    const parsed = catalogProductDraftSchema.parse(entry);
    const nextSlug = slugify(parsed.slug || parsed.title);
    if (!nextSlug) {
      throw new Error("invalid_product_slug");
    }
    if (seenSlugs.has(nextSlug)) {
      throw new Error(`duplicate_product_slug:${nextSlug}`);
    }
    seenSlugs.add(nextSlug);
    normalized.push({
      ...parsed,
      id: (parsed.id ?? "").trim() || crypto.randomUUID(),
      slug: nextSlug,
    });
  }
  return normalized;
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-products-bulk-post:${requestIp}`,
    windowMs: BULK_WINDOW_MS,
    max: BULK_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      NextResponse.json({ ok: false, error: "rate_limited", reason: "products_bulk_rate_limited" }, { status: 429 }),
      limit,
    );
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await readJsonBodyWithLimit(request, BULK_PAYLOAD_MAX_BYTES)) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return withRateHeaders(
        NextResponse.json({ ok: false, error: "payload_too_large", reason: "payload_too_large" }, { status: 413 }),
        limit,
      );
    }
    if (error instanceof InvalidJsonError) {
      return withRateHeaders(
        NextResponse.json({ ok: false, error: "invalid", reason: "invalid_json" }, { status: 400 }),
        limit,
      );
    }
    return withRateHeaders(
      NextResponse.json({ ok: false, error: "invalid", reason: "invalid_json" }, { status: 400 }),
      limit,
    );
  }

  try {
    const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
    const products = normalizeBulkProducts(payload.products);

    if (isLocalFsRuntimeEnabled()) {
      for (const product of products) {
        await upsertCatalogDraft(product, { storefront });
      }
      return withRateHeaders(
        NextResponse.json({
          ok: true,
          mode: "local",
          upserted: products.length,
        }),
        limit,
      );
    }

    const snapshot = await readCloudDraftSnapshot(storefront);
    let nextProducts = snapshot.products;
    let nextRevisions = snapshot.revisionsById;
    for (const product of products) {
      const updated = upsertProductInCloudSnapshot({
        product,
        snapshot: {
          products: nextProducts,
          revisionsById: nextRevisions,
          docRevision: snapshot.docRevision,
        },
      });
      nextProducts = updated.products;
      nextRevisions = updated.revisionsById;
    }
    const writeResult = await writeCloudDraftSnapshot({
      storefront,
      products: nextProducts,
      revisionsById: nextRevisions,
      ifMatchDocRevision: snapshot.docRevision,
    });

    return withRateHeaders(
      NextResponse.json({
        ok: true,
        mode: "cloud",
        upserted: products.length,
        docRevision: writeResult.docRevision,
      }),
      limit,
    );
  } catch (error) {
    if (error instanceof CatalogDraftContractError && error.code === "unconfigured") {
      return withRateHeaders(localFsUnavailableResponse(), limit);
    }
    if (error instanceof Error) {
      return withRateHeaders(
        NextResponse.json({ ok: false, error: "invalid", reason: "bulk_validation_failed", details: error.message }, { status: 400 }),
        limit,
      );
    }
    return withRateHeaders(
      NextResponse.json({ ok: false, error: "internal_error", reason: "bulk_upsert_failed" }, { status: 500 }),
      limit,
    );
  }
}
