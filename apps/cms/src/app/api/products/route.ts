import { NextResponse, type NextRequest } from "next/server";
import {
  readRepo,
  readInventory,
} from "@platform-core/repositories/json.server";
import type {
  ProductPublication,
} from "@platform-core/src/products";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() ?? "";
  const slug = searchParams.get("slug");
  const shop = searchParams.get("shop") ?? "abc";

  const [catalogue, inventory] = await Promise.all([
    readRepo<ProductPublication>(shop),
    readInventory(shop),
  ]);

  const stock = new Map<string, number>();
  for (const item of inventory) {
    stock.set(
      item.productId,
      (stock.get(item.productId) ?? 0) + item.quantity,
    );
  }

  const toSku = (p: ProductPublication) => ({
    slug: p.sku ?? p.id,
    title: p.title?.en ?? Object.values(p.title ?? {})[0] ?? "",
    price: p.price ?? 0,
    image: p.media?.[0]?.url ?? "",
    stock: stock.get(p.id) ?? 0,
    availability: p.availability ?? [],
  });

  if (slug) {
    const product = catalogue.find(
      (p) => p.sku === slug || p.id === slug,
    );
    if (!product)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toSku(product));
  }

  let matches = catalogue;
  if (q) {
    matches = matches.filter((p) => {
      const title = p.title?.en ?? Object.values(p.title ?? {})[0] ?? "";
      return title.toLowerCase().includes(q);
    });
  }
  return NextResponse.json(matches.slice(0, 5).map(toSku));
}
