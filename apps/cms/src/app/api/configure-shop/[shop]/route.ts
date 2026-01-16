import { authOptions } from "@cms/auth/options";
import { updateShopInRepo } from "@acme/platform-core/repositories/shop.server";
import type { Shop } from "@acme/types";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const schema = z
  .object({
    payment: z.array(z.string()).optional(),
    billingProvider: z.string().optional(),
    shipping: z.array(z.string()).optional(),
  })
  .strict();

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const { payment, billingProvider, shipping } = parsed.data;
    const { shop } = await context.params;
    const patch: Partial<Shop> & { id: string } = { id: shop };
    if (Array.isArray(payment)) patch.paymentProviders = payment;
    if (billingProvider) patch.billingProvider = billingProvider;
    if (Array.isArray(shipping)) patch.shippingProviders = shipping;
    await updateShopInRepo(shop, patch);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
