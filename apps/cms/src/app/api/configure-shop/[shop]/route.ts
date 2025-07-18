import { authOptions } from "@cms/auth/options";
import { updateShopInRepo } from "@platform-core/repositories/shop.server";
import type { Shop } from "@types";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { shop } = await context.params;
    const patch: Partial<Shop> & { id: string } = { id: shop };
    if (Array.isArray(body.payment)) patch.paymentProviders = body.payment;
    if (Array.isArray(body.shipping)) patch.shippingProviders = body.shipping;
    await updateShopInRepo(shop, patch);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
