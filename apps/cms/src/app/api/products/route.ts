import "@acme/zod-utils/initZod";

import { type NextRequest,NextResponse } from "next/server";
import { z } from "zod";

import type {
  ProductPublication,
} from "@acme/platform-core/products";
import {
  readInventory,
  readRepo,
} from "@acme/platform-core/repositories/json.server";

const searchSchema = z
  .object({
    q: z.string().optional(),
    slug: z.string().optional(),
    shop: z.string().default("bcd"),
  })
  .strict();

const paramsToObject = (params: URLSearchParams) =>
  Object.fromEntries(params.entries());

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = searchSchema.safeParse(paramsToObject(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search parameters" }, { status: 400 });
  }

  const { q, slug, shop } = parsed.data;
  const query = q?.toLowerCase() ?? "";

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
    media: p.media ?? [],
    stock: stock.get(p.id) ?? 0,
    availability: p.availability ?? [],
  });

  if (slug) {
    const product = catalogue.find(
      (p: ProductPublication) => p.sku === slug || p.id === slug,
    );
    if (!product)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toSku(product));
  }

  let matches: ProductPublication[] = catalogue;
  if (query) {
    matches = matches.filter((p: ProductPublication) => {
      const title = p.title?.en ?? Object.values(p.title ?? {})[0] ?? "";
      return title.toLowerCase().includes(query);
    });
  }
  return NextResponse.json(matches.slice(0, 5).map(toSku));
}
