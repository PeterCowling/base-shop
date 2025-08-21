// apps/shop-bcd/src/app/api/tax/route.ts
import "@acme/zod-utils/initZod";
import { calculateTax } from "@platform-core/tax";
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
  const parsed = await parseJsonBody(req, schema, "1mb");
  if (!parsed.success) return parsed.response;

  try {
    const tax = await calculateTax(parsed.data);
    return NextResponse.json({ tax });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
