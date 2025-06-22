import { CART_COOKIE, decodeCartCookie } from "@platform-core/cartCookie";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * POST /api/checkout-session
 *
 * Reads the cart cookie, builds Stripe line-items, returns `{ id }`
 * for the newly-created Checkout Session.
 */
export async function POST(req: NextRequest) {
  /* ------------------------------------------------------------------ */
  /*  1. Decode cart from cookie                                         */
  /* ------------------------------------------------------------------ */
  const cookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(cookie);

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  /* ------------------------------------------------------------------ */
  /*  2. Lazy-load Stripe *after* env-vars are available                 */
  /* ------------------------------------------------------------------ */
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe secret missing" },
      { status: 500 }
    );
  }

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(secret, {
    httpClient: Stripe.createFetchHttpClient(), // edge-friendly
  });

  /* ------------------------------------------------------------------ */
  /*  3. Build Stripe line-items                                         */
  /* ------------------------------------------------------------------ */
  const line_items = Object.values(cart).map(({ sku, qty }) => ({
    price_data: {
      currency: "eur",
      unit_amount: sku.price * 100,
      product_data: { name: sku.title },
    },
    quantity: qty,
  }));

  /* ------------------------------------------------------------------ */
  /*  4. Create the Checkout Session                                    */
  /* ------------------------------------------------------------------ */
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${req.nextUrl.origin}/success`,
    cancel_url: `${req.nextUrl.origin}/cancelled`,
  });

  return NextResponse.json({ id: session.id });
}
