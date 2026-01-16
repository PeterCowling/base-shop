import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductById, PRODUCTS } from "@acme/platform-core/products";
import { readRepo } from "@acme/platform-core/repositories/products.server";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import { trackEvent } from "@acme/platform-core/analytics";
import type { ProductPublication, SKU } from "@acme/types";

const DEFAULT_FIELDS = ["id", "title", "description", "price", "media"] as const;
type Field = (typeof DEFAULT_FIELDS)[number];

export const runtime = "nodejs";

function parseIntOr(val: string | null, def: number): number {
  const n = Number.parseInt(val ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function GET(req: NextRequest) {
  const shop = process.env.NEXT_PUBLIC_SHOP_ID || "default";
  const settings = await getShopSettings(shop);
  const ai = settings.seo?.aiCatalog;
  if (!ai?.enabled) {
    return new NextResponse(null, { status: 404 });
  }
  const fields = (ai.fields?.length ? ai.fields : DEFAULT_FIELDS) as Field[];
  const publications = await readRepo<ProductPublication>(shop);
  const all =
    publications.length > 0
      ? publications
      : PRODUCTS.map(
          (p) =>
            ({
              id: p.id,
              sku: p.id,
              title: p.title,
              description: p.description,
              price: p.price,
              media: p.media,
              updated_at: new Date(0).toISOString(),
            }) as unknown as ProductPublication
        );

  const lastModifiedDate = all.reduce((max, p) => {
    const d = p.updated_at ? new Date(p.updated_at) : new Date(0);
    return d > max ? d : max;
  }, new Date(0));
  const lastModified = new Date(lastModifiedDate.toUTCString());

  const { searchParams } = req.nextUrl;
  const page = parseIntOr(searchParams.get("page"), 1);
  const limit = parseIntOr(searchParams.get("limit"), ai.pageSize ?? 50);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  let status = 200;
  const ims = req.headers.get("if-modified-since");
  if (ims) {
    const imsDate = new Date(ims);
    if (!Number.isNaN(imsDate.getTime()) && lastModified <= imsDate) {
      status = 304;
      await trackEvent(shop, { type: "ai_crawl", page: String(page), status });
      return new NextResponse(null, {
        status,
        headers: { "Last-Modified": lastModified.toUTCString() },
      });
    }
  }

  const items = paged.map((p) => {
    const sku: SKU | null = getProductById(p.sku);
    const item: Record<string, unknown> = {};
    if (fields.includes("id")) item.id = p.id;
    if (fields.includes("title")) item.title = p.title;
    if (fields.includes("description")) item.description = p.description;
    if (fields.includes("price"))
      item.price = p.price ?? sku?.price ?? null;
    if (fields.includes("media")) {
      item.media = p.media?.length ? p.media : sku?.media ?? [];
    }
    return item;
  });

  await trackEvent(shop, {
    type: "ai_crawl",
    page: String(page),
    status,
    items: items.length,
  });

  return NextResponse.json(
    { items, page, total: all.length },
    { headers: { "Last-Modified": lastModified.toUTCString() } }
  );
}

