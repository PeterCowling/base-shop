import { NextRequest, NextResponse } from "next/server";
import { validateShopName } from "@acme/lib";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";
import { readRepo } from "@acme/platform-core/repositories/products.server";
import { getProductById, PRODUCTS } from "@acme/platform-core/products";
import type { ProductPublication, SKU } from "@acme/types";

const DEFAULT_FIELDS = ["id", "title", "description", "price", "media"] as const;
type Field = (typeof DEFAULT_FIELDS)[number];

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const shop = validateShopName(searchParams.get("shop") ?? "default");
  const limit = parsePositiveInt(searchParams.get("limit"), 5);

  const settings = await getShopSettings(shop);
  const ai = settings.seo?.aiCatalog;
  if (!ai?.enabled) {
    return NextResponse.json({ error: "AI catalog disabled" }, { status: 400 });
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

  const items = all.slice(0, limit).map((p) => {
    const sku: SKU | null = getProductById(p.sku);
    const item: Record<string, unknown> = {};
    if (fields.includes("id")) item.id = p.id;
    if (fields.includes("title")) item.title = p.title;
    if (fields.includes("description")) item.description = p.description;
    if (fields.includes("price")) item.price = p.price ?? sku?.price ?? null;
    if (fields.includes("media")) item.media = p.media?.length ? p.media : sku?.media ?? [];
    return item;
  });

  return NextResponse.json({ items, total: all.length });
}
