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
        product_data: {
          name: l.size ? `${l.sku.title} (${l.size})` : l.sku.title,
        },
      },
      quantity: l.qty,
    },
    {
      price_data: {
        currency: "eur",
        unit_amount: l.sku.deposit * 100, // euros → cents
        product_data: {
          name: l.size
            ? `${l.sku.title} (${l.size}) deposit`
            : `${l.sku.title} deposit`,
        },
      },
      quantity: l.qty,
    },
  ]);

  /*  Calculate totals for metadata */
  const subtotal = Object.values(cart).reduce(
    (total, l) => total + l.sku.price * l.qty,
    0
  );
  /*  Calculate the total deposit for metadata (handy for later refunds) */
  const depositTotal = Object.values(cart).reduce(
    (total, l) => total + l.sku.deposit * l.qty,
    0
  );
  const sizesMeta = JSON.stringify(
    Object.fromEntries(Object.values(cart).map((l) => [l.sku.id, l.size ?? ""]))
  );

  /* ------------------------------------------------------------------ */
  /*  3. Create the Stripe Checkout Session                             */
  /* ------------------------------------------------------------------ */
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
      },
    },
    metadata: {
      subtotal: subtotal.toString(),
      depositTotal: depositTotal.toString(),
      returnDate: returnDate ?? "",
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
