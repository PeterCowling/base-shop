/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] API responses pending i18n */
import { NextResponse } from "next/server";

import { hasUploaderSession } from "../../../../../lib/uploaderAuth";
import {
  deleteCatalogProduct,
  getCatalogDraftBySlug,
} from "../../../../../lib/catalogCsv";
import { parseStorefront } from "../../../../../lib/catalogStorefront.ts";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { slug } = await context.params;
  const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
  const product = await getCatalogDraftBySlug(slug, storefront);
  if (!product) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, product });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { slug } = await context.params;
  try {
    const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
    const result = await deleteCatalogProduct(slug, storefront);
    if (!result.deleted) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 }); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
    }
    return NextResponse.json({ ok: true, deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 }); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
  }
}
