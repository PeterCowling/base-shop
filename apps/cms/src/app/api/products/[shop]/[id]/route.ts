// apps/cms/src/app/api/products/[shop]/[id]/route.ts
import "@acme/zod-utils/initZod";

import { getProductById } from "@platform-core/repositories/json.server";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { validateResponse, ResponseSchemas } from "@/lib/server/queryValidation";

const ParamsSchema = z
  .object({ shop: z.string(), id: z.string() })
  .strict();

const productSchema = z.record(z.unknown());
const productErrorSchema = ResponseSchemas.error;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string; id: string }> }
) {
  const parsed = ParamsSchema.safeParse(await context.params);
  if (!parsed.success)
    return validateResponse(
      { error: "Invalid params" },
      productErrorSchema,
      { status: 400 }
    );
  const { shop, id } = parsed.data;
  const product = await getProductById(shop, id);
  if (!product)
    return validateResponse(
      { error: "Not found" },
      productErrorSchema,
      { status: 404 }
    );
  return validateResponse(product, productSchema);
}
