import { NextResponse } from "next/server";
import { PRODUCTS, type SKU } from "@acme/platform-core/products";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sku = searchParams.get("sku");
    const collectionId = searchParams.get("collectionId");
    const minItems = Number(searchParams.get("minItems") ?? 1);
    const maxItems = Number(searchParams.get("maxItems") ?? 4);

    let items: SKU[] = PRODUCTS.filter((p) => p.stock > 0);
    if (sku) {
      const base = items.find((p) => p.id === sku || p.slug === sku);
      if (base) {
        const family = base.id.split("-")[0];
        items = items.filter((p) => p.id.startsWith(family) && p.id !== base.id);
      }
    } else if (collectionId) {
      // Minimal heuristic: top sellers mock → first N items
      items = items.slice();
    }
    const count = Math.max(1, Math.min(isNaN(maxItems) ? 4 : maxItems, items.length));
    const out = items.slice(0, count);
    const res = NextResponse.json(out, { status: 200 });
    res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res;
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

