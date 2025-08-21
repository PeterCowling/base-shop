// apps/shop-bcd/src/app/api/tax/route.ts
import "@acme/zod-utils/initZod";
import { calculateTax, type TaxCalculationRequest } from "@platform-core/tax";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

export const runtime = "edge";

const schema = z
  .object({
    provider: z.enum(["taxjar"]).default("taxjar"),
    amount: z.number(),
    toCountry: z.string(),
    toPostalCode: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody<z.infer<typeof schema>>(req, schema, "1mb");
  if ("response" in parsed) {
    return parsed.response;
  }

  const body = parsed.data as TaxCalculationRequest;

  try {
    const tax = await calculateTax(body);
    return NextResponse.json({ tax });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
