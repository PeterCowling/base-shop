// apps/shop-abc/src/app/api/checkout-session/route.ts
import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { stripe } from "@/lib/stripeServer";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  /* ------------------------------------------------------------------ */
  /*  1. Read and parse cart cookie + optional return date from body    */
  /* ------------------------------------------------------------------ */
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(cookie);
  const { returnDate } = (await req.json().catch(() => ({}))) as {
    returnDate?: string;
  };

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  /* ------------------------------------------------------------------ */
  /*  2. Build Stripe line items                                        */
  /*      We split each cart line into two Stripe items: one for the    */
  /*      product price and one for its refundable deposit.             */
  /* ------------------------------------------------------------------ */
  const line_items = Object.values(cart).flatMap((l) => [
    {
      price_data: {
        currency: "eur",
        unit_amount: l.sku.price * 100, // euros → cents
        product_data: { name: l.sku.title },
      },
      quantity: l.qty,
    },
    {
      price_data: {
        currency: "eur",
        unit_amount: l.sku.deposit * 100, // euros → cents
        product_data: { name: `${l.sku.title} deposit` },
      },
      quantity: l.qty,
    },
  ]);

  /*  Calculate the total deposit for metadata (handy for later refunds) */
  const depositTotal = Object.values(cart).reduce(
    (total, l) => total + l.sku.deposit * l.qty,
    0
  );

  /* ------------------------------------------------------------------ */
  /*  3. Create the Stripe Checkout Session                             */
  /* ------------------------------------------------------------------ */
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${req.nextUrl.origin}/success`,
    cancel_url: `${req.nextUrl.origin}/cancelled`,
    metadata: {
      depositTotal: depositTotal.toString(), // keep as string per Stripe docs
      returnDate: returnDate ?? "",
    },
  });

  return NextResponse.json({ id: session.id });
}
