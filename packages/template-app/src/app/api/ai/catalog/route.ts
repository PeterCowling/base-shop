import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductById } from "@platform-core/src/products";
import { readRepo } from "@platform-core/repositories/products.server";
import type { ProductPublication } from "@acme/types";
import { getShopSettings } from "@platform-core/src/repositories/settings.server";
import { DATA_ROOT } from "@platform-core/src/dataRoot";
import { validateShopName } from "@platform-core/src/shops";
import { promises as fs } from "node:fs";
import * as path from "node:path";

export const runtime = "nodejs";

function parseIntOr(val: string | null, def: number): number {
  const n = Number.parseInt(val ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function GET(req: NextRequest) {
  const shop = process.env.NEXT_PUBLIC_SHOP_ID || "default";
  const settings = await getShopSettings(shop);
  const ai = settings.seo?.aiCatalog;
  const fields = ai?.fields ?? ["id", "title", "description", "price", "images"];
  const defaultPageSize = ai?.pageSize ?? 50;
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
  const limit = parseIntOr(searchParams.get("limit"), defaultPageSize);
  const start = (page - 1) * limit;
  const paged = all.slice(start, start + limit);

  const items = paged.map((p) => {
    const sku = getProductById(p.sku) || {};
    const base: Record<string, unknown> = {
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price ?? (sku as any).price ?? null,
      images: p.images?.length ? p.images : (sku as any).image ? [(sku as any).image] : [],
    };
    const filtered: Record<string, unknown> = {};
    for (const f of fields) {
      if (f in base) filtered[f] = base[f];
    }
    return filtered;
  });

  try {
    const logPath = path.join(
      DATA_ROOT,
      validateShopName(shop),
      "analytics.jsonl",
    );
    const entry = JSON.stringify({
      type: "ai_catalog_crawl",
      timestamp: new Date().toISOString(),
    });
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.appendFile(logPath, entry + "\n", "utf8");
  } catch {
    // ignore logging errors
  }

  return NextResponse.json(
    { items, page, total: all.length },
    { headers: { "Last-Modified": lastModified.toUTCString() } }
  );
}

