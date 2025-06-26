// apps/shop-abc/src/app/api/checkout-session/route.ts

import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { stripe } from "@/lib/stripeServer";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  // 1. read the cookie sent by the browser
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(cookie);
  const { returnDate } = (await req.json().catch(() => ({}))) as {
    returnDate?: string;
  };

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // 2. Build Stripe line items
  const line_items = Object.values(cart).flatMap((l) => [
    {
      price_data: {
        currency: "eur",
        unit_amount: l.sku.price * 100,
        product_data: { name: l.sku.title },
      },
      quantity: l.qty,
    {
      price_data: {
        currency: "eur",
        unit_amount: l.sku.deposit * 100,
        product_data: { name: `${l.sku.title} deposit` },
      },
      quantity: l.qty,
    },
  ]);
  const depositTotal = Object.values(cart).reduce(
    (s, l) => s + l.sku.deposit * l.qty,
    0
  );

  // 3. Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${req.nextUrl.origin}/success`,
    cancel_url: `${req.nextUrl.origin}/cancelled`,
    metadata: {
      depositTotal: depositTotal.toString(),
      returnDate: returnDate ?? "",
    },
  });

  return NextResponse.json({ id: session.id });
}
