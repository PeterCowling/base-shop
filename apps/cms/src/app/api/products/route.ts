import "@acme/lib/initZod";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  readRepo,
  readInventory,
} from "@platform-core/repositories/json.server";
import type {
  ProductPublication,
} from "@platform-core/products";

const searchSchema = z
  .object({
    q: z.string().optional(),
    slug: z.string().optional(),
    shop: z.string().default("abc"),
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
      (p) => p.sku === slug || p.id === slug,
    );
    if (!product)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toSku(product));
  }

  let matches = catalogue;
  if (query) {
    matches = matches.filter((p) => {
      const title = p.title?.en ?? Object.values(p.title ?? {})[0] ?? "";
      return title.toLowerCase().includes(query);
    });
  }
  return NextResponse.json(matches.slice(0, 5).map(toSku));
}
