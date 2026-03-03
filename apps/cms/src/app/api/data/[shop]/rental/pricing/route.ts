import { type NextRequest,NextResponse } from "next/server";
import { ensureRole } from "@cms/actions/common/auth";

import { writePricing } from "@acme/platform-core/repositories/pricing.server";
import { pricingSchema } from "@acme/types";

export async function POST(
  req: NextRequest,
  _context: { params: Promise<{ shop: string }> }
) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    const body = await req.json();
    const parsed = pricingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().formErrors.join(", ") },
        { status: 400 }
      );
    }
    await writePricing(parsed.data);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status =
      message === "Forbidden" || message === "Unauthorized" ? 403 : 400;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
