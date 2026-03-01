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
const BULK_PAYLOAD_MAX_BYTES_CEILING = 768 * 1024;
const BULK_MAX_PRODUCTS_CEILING = 500;
const BULK_MAX_DIAGNOSTICS = 25;

type BulkDiagnostic = {
  row: number;
  code: string;
  message: string;
};

function withRateHeaders(response: NextResponse, limit: ReturnType<typeof rateLimit>): NextResponse {
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

function getBulkPayloadMaxBytes(): number {
  const raw = Number.parseInt(process.env.XA_UPLOADER_BULK_PAYLOAD_MAX_BYTES ?? "", 10);
  if (!Number.isFinite(raw) || raw <= 0) return BULK_PAYLOAD_MAX_BYTES_CEILING;
  return Math.min(raw, BULK_PAYLOAD_MAX_BYTES_CEILING);
}

function getBulkMaxProducts(): number {
  const raw = Number.parseInt(process.env.XA_UPLOADER_BULK_MAX_PRODUCTS ?? "", 10);
  if (!Number.isFinite(raw) || raw <= 0) return BULK_MAX_PRODUCTS_CEILING;
  return Math.min(raw, BULK_MAX_PRODUCTS_CEILING);
}

function validateBulkProducts(input: unknown): {
  products: CatalogProductDraftInput[];
  diagnostics: BulkDiagnostic[];
} {
  const maxProducts = getBulkMaxProducts();
  if (!Array.isArray(input)) {
    throw new Error("products_array_required");
  }
  if (input.length < 1 || input.length > maxProducts) {
    throw new Error("products_array_size_invalid");
  }
  const seenSlugs = new Set<string>();
  const products: CatalogProductDraftInput[] = [];
  const diagnostics: BulkDiagnostic[] = [];
  for (const [index, entry] of input.entries()) {
    const row = index + 1;
    const parsed = catalogProductDraftSchema.safeParse(entry);
    if (!parsed.success) {
      diagnostics.push({
        row,
        code: "validation_failed",
        message: parsed.error.issues.slice(0, 3).map((issue) => issue.message).join("; "),
      });
      continue;
    }
    const parsedProduct = parsed.data;
    const nextSlug = slugify(parsedProduct.slug || parsedProduct.title);
    if (!nextSlug) {
      diagnostics.push({ row, code: "invalid_product_slug", message: "Could not derive slug." });
      continue;
    }
    if (seenSlugs.has(nextSlug)) {
      diagnostics.push({
        row,
        code: "duplicate_product_slug",
        message: `Duplicate slug "${nextSlug}" in payload.`,
      });
      continue;
    }
    seenSlugs.add(nextSlug);
    products.push({
      ...parsedProduct,
      id: (parsedProduct.id ?? "").trim() || crypto.randomUUID(),
      slug: nextSlug,
    });
  }
  return { products, diagnostics: diagnostics.slice(0, BULK_MAX_DIAGNOSTICS) };
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
    payload = (await readJsonBodyWithLimit(request, getBulkPayloadMaxBytes())) as Record<string, unknown>;
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
    const validation = validateBulkProducts(payload.products);
    if (validation.diagnostics.length > 0) {
      return withRateHeaders(
        NextResponse.json(
          {
            ok: false,
            error: "invalid",
            reason: "bulk_validation_failed",
            diagnostics: validation.diagnostics,
          },
          { status: 400 },
        ),
        limit,
      );
    }
    const products = validation.products;

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
