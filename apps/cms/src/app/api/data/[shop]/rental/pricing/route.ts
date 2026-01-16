import { ensureRole } from "@cms/actions/common/auth";
import { NextResponse, type NextRequest } from "next/server";
import { pricingSchema } from "@acme/types";
import { writePricing } from "@platform-core/repositories/pricing.server";

export async function POST(
  req: NextRequest,
  _context: { params: { shop: string } }
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
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
