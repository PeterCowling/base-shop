// packages/template-app/src/api/checkout-session/route.ts
import { CART_COOKIE, decodeCartCookie, type CartState } from "@platform-core/src/cartCookie";
import { getCart } from "@platform-core/src/cartStore";
import { coreEnv } from "@acme/config/env/core";
import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@platform-core/checkout/session";

export const runtime = "edge";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const cartId = decodeCartCookie(rawCookie);
  const cart: CartState = cartId ? await getCart(cartId) : {};

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const {
    returnDate,
    coupon,
    currency = "EUR",
    taxRegion = "",
    customer,
    shipping,
    billing_details,
  } = (await req.json().catch(() => ({}))) as any;

  const clientIp = req.headers?.get?.("x-forwarded-for")?.split(",")[0] ?? "";
  const shop = coreEnv.NEXT_PUBLIC_DEFAULT_SHOP || "shop";

  try {
    const result = await createCheckoutSession({
      shopId: shop,
      cart,
      returnDate,
      coupon,
      currency,
      taxRegion,
      customerId: customer,
      shipping,
      billingDetails: billing_details,
      successUrl: `${req.nextUrl.origin}/success`,
      cancelUrl: `${req.nextUrl.origin}/cancelled`,
      clientIp,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Invalid returnDate") {
      return NextResponse.json({ error: "Invalid returnDate" }, { status: 400 });
    }
    console.error("Failed to create Stripe checkout session", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 502 });
  }
}
