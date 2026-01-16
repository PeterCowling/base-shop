// apps/cms/src/app/api/products/[shop]/[id]/route.ts
import "@acme/zod-utils/initZod";

import { getProductById } from "@acme/platform-core/repositories/json.server";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const ParamsSchema = z
  .object({ shop: z.string(), id: z.string() })
  .strict();

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string; id: string }> }
) {
  const parsed = ParamsSchema.safeParse(await context.params);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  const { shop, id } = parsed.data;
  const product = await getProductById(shop, id);
  if (!product)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}
