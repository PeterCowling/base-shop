import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductById } from "@platform-core/src/products";
import { readRepo } from "@platform-core/repositories/products.server";
import { trackEvent } from "@platform-core/analytics";
import type { ProductPublication } from "@acme/types";
import { env } from "@acme/config";

export const runtime = "nodejs";

function parseIntOr(val: string | null, def: number): number {
  const n = Number.parseInt(val ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function GET(req: NextRequest) {
  const shop = env.NEXT_PUBLIC_SHOP_ID || "default";
  const all = await readRepo<ProductPublication>(shop);

  const lastModifiedDate = all.reduce((max, p) => {
    const d = p.updated_at ? new Date(p.updated_at) : new Date(0);
    return d > max ? d : max;
  }, new Date(0));
  const lastModified = new Date(lastModifiedDate.toUTCString());

  const ims = req.headers.get("if-modified-since");
  if (ims) {
    const imsDate = new Date(ims);
    if (!Number.isNaN(imsDate.getTime()) && lastModified <= imsDate) {
      return new NextResponse(null, { status: 304 });
    }
  }

  const { searchParams } = req.nextUrl;
  const page = parseIntOr(searchParams.get("page"), 1);
  const limit = parseIntOr(searchParams.get("limit"), 50);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  const items = paged.map((p) => {
    const sku = getProductById(p.sku) || {};
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price ?? (sku as any).price ?? null,
      images: p.images?.length ? p.images : (sku as any).image ? [(sku as any).image] : [],
    };
  });

  await trackEvent(shop, { type: "ai_crawl", page, items: items.length });

  return NextResponse.json(
    { items, page, total: all.length },
    { headers: { "Last-Modified": lastModified.toUTCString() } }
  );
}

