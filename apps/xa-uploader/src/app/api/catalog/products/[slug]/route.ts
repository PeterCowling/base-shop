import { NextResponse } from "next/server";

import {
  deleteCatalogProduct,
  getCatalogDraftBySlug,
} from "../../../../../lib/catalogCsv";
import { parseStorefront } from "../../../../../lib/catalogStorefront.ts";
import { hasUploaderSession } from "../../../../../lib/uploaderAuth";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  try {
    const { slug } = await context.params;
    const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
    const product = await getCatalogDraftBySlug(slug, storefront);
    if (!product) {
      return NextResponse.json({ ok: false, error: "not_found", reason: "product_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product });
  } catch {
    return NextResponse.json(
      { ok: false, error: "internal_error", reason: "products_get_failed" },
      { status: 500 },
    );
  }
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
      return NextResponse.json(
        { ok: false, error: "not_found", reason: "product_not_found" },
        { status: 404 },
      ); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
    }
    return NextResponse.json({ ok: true, deleted: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "internal_error", reason: "products_delete_failed" },
      { status: 500 },
    ); // i18n-exempt -- XAUP-0001 [ttl=2026-12-31] machine response
  }
}
