import { Readable } from "node:stream";
import type { Readable as NodeReadable } from "node:stream";

/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] API responses pending i18n */
import { NextResponse } from "next/server";

import { hasUploaderSession } from "../../../../lib/uploaderAuth";
import { listCatalogDrafts } from "../../../../lib/catalogCsv";
import { slugify } from "../../../../lib/catalogAdminSchema";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import { buildSubmissionZipStream } from "../../../../lib/submissionZip";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 }); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
  }
}
