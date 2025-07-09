// apps/cms/src/app/api/products/[shop]/[id]/route.ts

import { getProductById } from "@platform-core/repositories/json.server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string; id: string }> }
) {
  const { shop, id } = await context.params;
  const product = await getProductById(shop, id);
  if (!product)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}
