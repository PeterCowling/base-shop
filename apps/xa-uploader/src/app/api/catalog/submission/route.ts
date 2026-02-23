import type { Readable as NodeReadable } from "node:stream";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { slugify } from "../../../../lib/catalogAdminSchema";
import { listCatalogDrafts } from "../../../../lib/catalogCsv";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import { buildSubmissionZipStream } from "../../../../lib/submissionZip";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

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
];

function isKnownSubmissionValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return KNOWN_SUBMISSION_INVALID_PATTERNS.some((pattern) => pattern.test(error.message));
}

export async function POST(request: Request) {
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const slugs = isRecord(payload) && Array.isArray(payload.slugs) ? payload.slugs : [];
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

  try {
    const catalog = await listCatalogDrafts(storefront);
    const selected = catalog.products.filter((product) => {
      const slug = slugify(product.slug || product.title);
      return slug && normalizedSlugs.includes(slug);
    });

    const { filename, manifest, stream } = await buildSubmissionZipStream({
      products: selected,
      productsCsvPath: catalog.path,
      options: { maxProducts: 10, maxBytes: 250 * 1024 * 1024, recursiveDirs: true },
    });

    return new Response(Readable.toWeb(stream as unknown as NodeReadable), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-XA-Submission-Id": manifest.submissionId,
        "X-XA-Submission-R2-Key": manifest.suggestedR2Key,
      },
    });
  } catch (error) {
    if (isKnownSubmissionValidationError(error)) {
      return NextResponse.json(
        { ok: false, error: "invalid", reason: "submission_validation_failed" },
        { status: 400 },
      ); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
    }
    return NextResponse.json(
      { ok: false, error: "internal_error", reason: "submission_export_failed" },
      { status: 500 },
    ); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
  }
}
