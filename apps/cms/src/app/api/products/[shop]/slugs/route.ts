// apps/cms/src/app/api/products/[shop]/slugs/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { readRepo } from "@platform-core/repositories/json.server";
import type { ProductPublication } from "@platform-core/src/products";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const { shop } = await context.params;
  const body = await req.json().catch(() => null);
  const slugs = Array.isArray(body?.slugs) ? (body.slugs as string[]) : [];
  if (slugs.length === 0) {
    return NextResponse.json([]);
  }

  const catalogue = await readRepo<ProductPublication>(shop);
  const wanted = new Set(slugs);
  const existing: string[] = [];
  for (const p of catalogue) {
    const slug = p.sku ?? p.id;
    if (wanted.has(slug)) existing.push(slug);
  }

  return NextResponse.json(existing);
}
