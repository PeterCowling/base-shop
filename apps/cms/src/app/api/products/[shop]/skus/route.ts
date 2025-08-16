// apps/cms/src/app/api/products/[shop]/skus/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { readRepo } from "@platform-core/repositories/json.server";
import type { ProductPublication } from "@platform-core/src/products";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const { shop } = await context.params;
  const body = await req.json().catch(() => null);
  const skus = Array.isArray(body?.skus) ? (body.skus as string[]) : [];
  if (skus.length === 0) {
    return NextResponse.json([]);
  }

  const catalogue = await readRepo<ProductPublication>(shop);
  const wanted = new Set(skus);
  const existing: string[] = [];
  for (const p of catalogue) {
    const sku = p.sku ?? p.id;
    if (wanted.has(sku)) existing.push(sku);
  }

  return NextResponse.json(existing);
}
