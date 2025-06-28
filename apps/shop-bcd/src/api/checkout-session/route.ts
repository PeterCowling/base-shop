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

  const rentalDays = (() => {
    if (!returnDate) return 1;
    const end = new Date(returnDate).getTime();
    const start = Date.now();
    const diff = Math.ceil((end - start) / 86_400_000);
    return diff > 0 ? diff : 1;
  })();

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // 2. Build Stripe line items
  const line_items = Object.values(cart).flatMap((l) => [
    {
      price_data: {
        currency: "eur",
        unit_amount: l.sku.price * rentalDays * 100,
        product_data: {
          name: l.size ? `${l.sku.title} (${l.size})` : l.sku.title,
        },
      },
      quantity: l.qty,
    },
    {
      price_data: {
        currency: "eur",
        unit_amount: l.sku.deposit * 100,
        product_data: {
          name: l.size
            ? `${l.sku.title} (${l.size}) deposit`
            : `${l.sku.title} deposit`,
        },
      },
      quantity: l.qty,
    },
  ]);
  const subtotal = Object.values(cart).reduce(
    (s, l) => s + l.sku.price * rentalDays * l.qty,
    0
  );
  const depositTotal = Object.values(cart).reduce(
    (s, l) => s + l.sku.deposit * l.qty,
    0
  );
  const sizesMeta = JSON.stringify(
    Object.fromEntries(Object.values(cart).map((l) => [l.sku.id, l.size ?? ""]))
  );

  // 3. Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${req.nextUrl.origin}/success`,
    cancel_url: `${req.nextUrl.origin}/cancelled`,
    payment_intent_data: {
      metadata: {
        subtotal: subtotal.toString(),
        depositTotal: depositTotal.toString(),
        returnDate: returnDate ?? "",
        rentalDays: rentalDays.toString(),
      },
    },
    metadata: {
      subtotal: subtotal.toString(),
      depositTotal: depositTotal.toString(),
      returnDate: returnDate ?? "",
      rentalDays: rentalDays.toString(),
      sizes: sizesMeta,
    },
    expand: ["payment_intent"],
  });

  const clientSecret =
    typeof session.payment_intent === "string"
      ? undefined
      : session.payment_intent?.client_secret;

  return NextResponse.json({ clientSecret, sessionId: session.id });
}
