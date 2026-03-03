import { NextResponse } from "next/server";

import { slugify } from "@acme/lib/xa";

import {
  deleteCatalogProduct,
  getCatalogDraftBySlug,
} from "../../../../../lib/catalogCsv";
import {
  CatalogDraftContractError,
  deleteProductFromCloudSnapshot,
  readCloudDraftSnapshot,
  writeCloudDraftSnapshot,
} from "../../../../../lib/catalogDraftContractClient";
import { parseStorefront } from "../../../../../lib/catalogStorefront.ts";
import { isLocalFsRuntimeEnabled, localFsUnavailableResponse } from "../../../../../lib/localFsGuard";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../../lib/rateLimit";
import { hasUploaderSession } from "../../../../../lib/uploaderAuth";

export const runtime = "nodejs";

const PRODUCT_GET_WINDOW_MS = 60 * 1000;
const PRODUCT_GET_MAX_REQUESTS = 120;
const PRODUCT_DELETE_WINDOW_MS = 60 * 1000;
const PRODUCT_DELETE_MAX_REQUESTS = 30;

function withRateHeaders(response: NextResponse, limit: ReturnType<typeof rateLimit>): NextResponse {
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-product-get:${requestIp}`,
    windowMs: PRODUCT_GET_WINDOW_MS,
    max: PRODUCT_GET_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      NextResponse.json(
        { ok: false, error: "rate_limited", reason: "product_get_rate_limited" },
        { status: 429 },
      ),
      limit,
    );
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  try {
    const { slug } = await context.params;
    const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
    const product = isLocalFsRuntimeEnabled()
      ? await getCatalogDraftBySlug(slug, storefront)
      : (await readCloudDraftSnapshot(storefront)).products.find(
          (entry) => slugify(entry.slug || entry.title) === slugify(slug),
        ) ?? null;
    if (!product) {
      return withRateHeaders(
        NextResponse.json(
          { ok: false, error: "not_found", reason: "product_not_found" },
          { status: 404 },
        ),
        limit,
      );
    }
    return withRateHeaders(NextResponse.json({ ok: true, product }), limit);
  } catch (error) {
    if (error instanceof CatalogDraftContractError && error.code === "unconfigured") {
      return withRateHeaders(localFsUnavailableResponse(), limit);
    }
    return withRateHeaders(
      NextResponse.json(
        { ok: false, error: "internal_error", reason: "products_get_failed" },
        { status: 500 },
      ),
      limit,
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-product-delete:${requestIp}`,
    windowMs: PRODUCT_DELETE_WINDOW_MS,
    max: PRODUCT_DELETE_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      NextResponse.json(
        { ok: false, error: "rate_limited", reason: "product_delete_rate_limited" },
        { status: 429 },
      ),
      limit,
    );
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  const { slug } = await context.params;
  try {
    const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
    if (!isLocalFsRuntimeEnabled()) {
      const snapshot = await readCloudDraftSnapshot(storefront);
      const removed = deleteProductFromCloudSnapshot({ slug, snapshot });
      if (!removed.deleted) {
        return withRateHeaders(
          NextResponse.json(
            { ok: false, error: "not_found", reason: "product_not_found" },
            { status: 404 },
          ),
          limit,
        );
      }
      await writeCloudDraftSnapshot({
        storefront,
        products: removed.products,
        revisionsById: removed.revisionsById,
        ifMatchDocRevision: snapshot.docRevision,
      });
      return withRateHeaders(NextResponse.json({ ok: true, deleted: true }), limit);
    }

    const result = await deleteCatalogProduct(slug, storefront);
    if (!result.deleted) {
      return withRateHeaders(
        NextResponse.json(
          { ok: false, error: "not_found", reason: "product_not_found" },
          { status: 404 },
        ),
        limit,
      ); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
    }
    return withRateHeaders(NextResponse.json({ ok: true, deleted: true }), limit);
  } catch (error) {
    if (error instanceof CatalogDraftContractError && error.code === "unconfigured") {
      return withRateHeaders(localFsUnavailableResponse(), limit);
    }
    if (error instanceof CatalogDraftContractError && error.code === "conflict") {
      return withRateHeaders(
        NextResponse.json(
          { ok: false, error: "conflict", reason: "revision_conflict" },
          { status: 409 },
        ),
        limit,
      );
    }
    return withRateHeaders(
      NextResponse.json(
        { ok: false, error: "internal_error", reason: "products_delete_failed" },
        { status: 500 },
      ),
      limit,
    ); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
  }
}
