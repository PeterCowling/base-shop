import { NextResponse } from "next/server";

import {
  CatalogCsvConflictError,
  listCatalogDrafts,
  upsertCatalogDraft,
} from "../../../../lib/catalogCsv";
import { parseStorefront } from "../../../../lib/catalogStorefront.ts";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
  const { products, revisionsById } = await listCatalogDrafts(storefront);
  return NextResponse.json({ ok: true, products, revisionsById });
}

export async function POST(request: Request) {
  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const product = payload.product;
  const ifMatch = typeof payload.ifMatch === "string" ? payload.ifMatch : undefined;
  if (!product || typeof product !== "object") {
    return NextResponse.json({ ok: false, error: "missing_product" }, { status: 400 });
  }

  try {
    const storefront = parseStorefront(new URL(request.url).searchParams.get("storefront"));
    const result = await upsertCatalogDraft(product as never, { ifMatch, storefront });
    return NextResponse.json({ ok: true, product: result.product, revision: result.revision });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    const status = err instanceof CatalogCsvConflictError ? 409 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
