import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductById } from "@platform-core/src/products";
import { readRepo } from "@platform-core/repositories/products.server";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import { trackEvent } from "@platform-core/src/analytics";
import type { ProductPublication } from "@acme/types";
import { coreEnv } from "@acme/config/env/core";

const DEFAULT_FIELDS = ["id", "title", "description", "price", "images"] as const;
type Field = (typeof DEFAULT_FIELDS)[number];

export const runtime = "nodejs";

function parseIntOr(val: string | null, def: number): number {
  const n = Number.parseInt(val ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function GET(req: NextRequest) {
  const shop = coreEnv.NEXT_PUBLIC_SHOP_ID || "default";
  const settings = await getShopSettings(shop);
  if (!settings.aiCatalog?.enabled) {
    return new NextResponse(null, { status: 404 });
  }
  const fields = (settings.aiCatalog.fields?.length
    ? settings.aiCatalog.fields
    : DEFAULT_FIELDS) as Field[];
  const all = await readRepo<ProductPublication>(shop);

  const lastModifiedDate = all.reduce((max, p) => {
    const d = p.updated_at ? new Date(p.updated_at) : new Date(0);
    return d > max ? d : max;
  }, new Date(0));
  const lastModified = new Date(lastModifiedDate.toUTCString());

  await trackEvent(shop, { type: "ai_catalog" });

  const ims = req.headers.get("if-modified-since");
  if (ims) {
    const imsDate = new Date(ims);
    if (!Number.isNaN(imsDate.getTime()) && lastModified <= imsDate) {
      return new NextResponse(null, {
        status: 304,
        headers: { "Last-Modified": lastModified.toUTCString() },
      });
    }
  }

  const { searchParams } = req.nextUrl;
  const page = parseIntOr(searchParams.get("page"), 1);
  const limit = parseIntOr(searchParams.get("limit"), 50);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  const items = paged.map((p) => {
    const sku = getProductById(p.sku) || {};
    const item: Record<string, unknown> = {};
    if (fields.includes("id")) item.id = p.id;
    if (fields.includes("title")) item.title = p.title;
    if (fields.includes("description")) item.description = p.description;
    if (fields.includes("price"))
      item.price = p.price ?? (sku as any).price ?? null;
    if (fields.includes("images")) {
      item.images = p.images?.length
        ? p.images
        : (sku as any).image
          ? [(sku as any).image]
          : [];
    }
    return item;
  });

  return NextResponse.json(
    { items, page, total: all.length },
    { headers: { "Last-Modified": lastModified.toUTCString() } }
  );
}

