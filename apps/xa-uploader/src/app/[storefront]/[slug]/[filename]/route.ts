import { NextResponse } from "next/server";

import { parseStorefront } from "../../../../lib/catalogStorefront";
import { getMediaBucket } from "../../../../lib/r2Media";

export const runtime = "nodejs";

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storefront: string; slug: string; filename: string }> },
) {
  const { storefront: rawStorefront, slug, filename } = await params;

  // Validate storefront is a known value
  const storefront = parseStorefront(rawStorefront);
  if (storefront !== rawStorefront) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  // Validate file extension is an image type
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  // Reject path traversal attempts
  if (slug.includes("..") || slug.includes("/") || filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const bucket = await getMediaBucket();
  if (!bucket) {
    // R2 not available — local dev uses public/images/ instead
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const key = `${storefront}/${slug}/${filename}`;
  const object = await bucket.get(key);
  if (!object) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] HTTP cache-control header value, not user-facing copy
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
