// apps/shop-bcd/src/app/api/shipping-rate/route.ts
import "@acme/lib/initZod";
import { getShippingRate } from "@acme/platform-core/shipping";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";

export const runtime = "edge";

const schema = z
  .object({
    provider: z.enum(["ups", "dhl"]),
    fromPostalCode: z.string(),
    toPostalCode: z.string(),
    weight: z.number(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, schema, "1mb");
  if (!parsed.success) return parsed.response;

  try {
    const rate = await getShippingRate(parsed.data);
    return NextResponse.json({ rate });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
