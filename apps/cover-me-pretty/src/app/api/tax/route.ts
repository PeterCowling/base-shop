// apps/cover-me-pretty/src/app/api/tax/route.ts
import "@acme/zod-utils/initZod";
import { calculateTax, type TaxCalculationRequest } from "@acme/platform-core/tax";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody } from "@acme/lib/http/server";

// Tax calculations rely on platform-core functions that read from the
// filesystem, which requires Node.js APIs. Use the Node.js runtime so these
// modules are available.
export const runtime = "nodejs";

const schema = z
  .object({
    provider: z.literal("taxjar"),
    amount: z.number(),
    toCountry: z.string(),
    toPostalCode: z.string().optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody<TaxCalculationRequest>(req, schema, "1mb");
  if (parsed.success === false) {
    return parsed.response;
  }
  const body = parsed.data;

  try {
    const tax = await calculateTax(body);
    return NextResponse.json({ tax });
  } catch (err) {
    console.error("[api/tax] calculateTax error:", err); // i18n-exempt -- server log
    return NextResponse.json(
      { error: "Failed to calculate tax" }, // i18n-exempt -- generic error
      { status: 500 }
    );
  }
}
