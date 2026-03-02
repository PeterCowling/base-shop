import type { Readable as NodeReadable } from "node:stream";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import type { CatalogProductDraftInput } from "@acme/lib/xa";
import { catalogProductDraftSchema, slugify } from "@acme/lib/xa";

import { listCatalogDrafts } from "../../../../lib/catalogCsv";
import { readCloudDraftSnapshot } from "../../../../lib/catalogDraftContractClient";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import { isLocalFsRuntimeEnabled } from "../../../../lib/localFsGuard";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import { buildSubmissionZipFromCloudDrafts, buildSubmissionZipStream } from "../../../../lib/submissionZip";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

const SUBMISSION_WINDOW_MS = 60 * 1000;
const SUBMISSION_MAX_REQUESTS = 8;
const SUBMISSION_PAYLOAD_MAX_BYTES = 32 * 1024;
const SUBMISSION_MAX_SLUGS = 20;
const DEFAULT_SUBMISSION_MAX_BYTES = 25 * 1024 * 1024;
const FREE_TIER_SUBMISSION_MAX_BYTES = 25 * 1024 * 1024;

function shouldExposeSubmissionR2Key(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.XA_UPLOADER_EXPOSE_SUBMISSION_R2_KEY === "1";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const KNOWN_SUBMISSION_INVALID_PATTERNS = [
  /^Select 1–\d+ products per submission\.$/,
  /^".+": /,
  /: add at least one image file spec\.$/,
  /: not a file: /,
  /: empty file: /,
  /: missing at least /,
  /^Missing product slug\/title\.$/,
  /Unsupported image format/,
  /image is too small/,
  /^Submission is too large\./,
  /outside allowed roots/i,
  /scan limit exceeded/i,
  /match limit exceeded/i,
  /too many images/i,
  /image exceeds max size/i,
];

function isKnownSubmissionValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return KNOWN_SUBMISSION_INVALID_PATTERNS.some((pattern) => pattern.test(error.message));
}

type SchemaDiagnostic = { slug: string; issues: string[] };

function validateSelectedProducts(products: CatalogProductDraftInput[]): {
  valid: boolean;
  diagnostics: SchemaDiagnostic[];
} {
  const diagnostics: SchemaDiagnostic[] = [];
  for (const product of products) {
    const result = catalogProductDraftSchema.safeParse(product);
    if (!result.success) {
      diagnostics.push({
        slug: typeof product.slug === "string" ? product.slug : "(unknown)",
        issues: result.error.issues.map((issue) => issue.message),
      });
    }
  }
  return { valid: diagnostics.length === 0, diagnostics };
}

function withRateHeaders(response: NextResponse, limit: ReturnType<typeof rateLimit>): NextResponse {
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

function getSubmissionMaxBytes(): number {
  const parsed = Number.parseInt(process.env.XA_UPLOADER_SUBMISSION_MAX_BYTES ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SUBMISSION_MAX_BYTES;
  return Math.min(parsed, FREE_TIER_SUBMISSION_MAX_BYTES);
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-submission:${requestIp}`,
    windowMs: SUBMISSION_WINDOW_MS,
    max: SUBMISSION_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      NextResponse.json(
        { ok: false, error: "rate_limited", reason: "submission_rate_limited" },
        { status: 429 },
      ),
      limit,
    );
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  let payload: unknown;
  try {
    payload = await readJsonBodyWithLimit(request, SUBMISSION_PAYLOAD_MAX_BYTES);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return withRateHeaders(
        NextResponse.json(
          { ok: false, error: "payload_too_large", reason: "payload_too_large" },
          { status: 413 },
        ),
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

  const slugs = isRecord(payload) && Array.isArray(payload.slugs) ? payload.slugs : [];
  if (slugs.length > SUBMISSION_MAX_SLUGS) {
    return withRateHeaders(
      NextResponse.json(
        { ok: false, error: "invalid", reason: "too_many_submission_slugs" },
        { status: 400 },
      ),
      limit,
    );
  }

  const storefront = parseStorefront(
    isRecord(payload) && typeof payload.storefront === "string" ? payload.storefront : null,
  );
  const normalizedSlugs = Array.from(
    new Set(
      slugs
        .map((value) => (typeof value === "string" ? slugify(value) : ""))
        .filter(Boolean),
    ),
  );

  const startedAt = Date.now();
  try {
    const catalog = isLocalFsRuntimeEnabled()
      ? await listCatalogDrafts(storefront)
      : await readCloudDraftSnapshot(storefront);
    const selected = catalog.products.filter((product) => {
      const slug = slugify(product.slug || product.title);
      return slug && normalizedSlugs.includes(slug);
    });

    const validation = validateSelectedProducts(selected);
    if (!validation.valid) {
      return withRateHeaders(
        NextResponse.json(
          {
            ok: false,
            error: "invalid",
            reason: "draft_schema_invalid",
            diagnostics: validation.diagnostics,
          },
          { status: 400 },
        ),
        limit,
      ); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
    }

    const { filename, manifest, stream } = isLocalFsRuntimeEnabled()
      ? await buildSubmissionZipStream({
          products: selected,
          productsCsvPath: (catalog as Awaited<ReturnType<typeof listCatalogDrafts>>).path,
          options: { maxProducts: 10, maxBytes: getSubmissionMaxBytes(), recursiveDirs: true },
        })
      : await buildSubmissionZipFromCloudDrafts({
          products: selected,
          options: { maxProducts: 10, maxBytes: getSubmissionMaxBytes() },
        });

    const response = new Response(Readable.toWeb(stream as unknown as NodeReadable), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-XA-Submission-Id": manifest.submissionId,
        ...(shouldExposeSubmissionR2Key() ? { "X-XA-Submission-R2-Key": manifest.suggestedR2Key } : {}),
      },
    });
    applyRateLimitHeaders(response.headers, limit);
    return response;
  } catch (error) {
    if (isKnownSubmissionValidationError(error)) {
      return withRateHeaders(
        NextResponse.json(
          { ok: false, error: "invalid", reason: "submission_validation_failed" },
          { status: 400 },
        ),
        limit,
      ); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
    }
    console.error({
      route: "POST /api/catalog/submission",
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startedAt,
    });
    return withRateHeaders(
      NextResponse.json(
        { ok: false, error: "internal_error", reason: "submission_export_failed" },
        { status: 500 },
      ),
      limit,
    ); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
  }
}
