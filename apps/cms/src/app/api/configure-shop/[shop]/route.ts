import { authOptions } from "@cms/auth/options";
import { updateShopInRepo } from "@platform-core/repositories/json.server";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { shop: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const patch: Record<string, unknown> = { id: params.shop };
    if (Array.isArray(body.payment)) patch.paymentProviders = body.payment;
    if (Array.isArray(body.shipping)) patch.shippingProviders = body.shipping;
    await updateShopInRepo<Record<string, unknown>>(params.shop, patch);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
