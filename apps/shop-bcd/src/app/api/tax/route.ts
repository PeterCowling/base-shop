// apps/shop-bcd/src/app/api/tax/route.ts
import { calculateTax } from "@acme/platform-core/tax";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import "@acme/lib/initZod";

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
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

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
