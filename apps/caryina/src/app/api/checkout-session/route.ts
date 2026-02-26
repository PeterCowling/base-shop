import { type NextRequest, NextResponse } from "next/server";

import { CART_COOKIE, decodeCartCookie } from "@acme/platform-core/cartCookie";
import { getCart } from "@acme/platform-core/cartStore";
import { stripe } from "@acme/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const decodedCartId = decodeCartCookie(rawCookie);
  const cartId = typeof decodedCartId === "string" ? decodedCartId : undefined;
  const cart = cartId ? await getCart(cartId) : {};

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 }); // i18n-exempt -- machine-readable API error
  }

  const body = (await req.json().catch(() => ({}))) as { lang?: string };
  const lang = body.lang ?? "en";
  const origin = req.nextUrl.origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: Object.values(cart).map((line) => ({
        price_data: {
          currency: "eur",
          unit_amount: line.sku.price,
          product_data: { name: String(line.sku.title) },
        },
        quantity: line.qty,
      })),
      success_url: `${origin}/${lang}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${lang}/cancelled`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Failed to create Stripe checkout session", err); // i18n-exempt -- developer log
    return NextResponse.json({ error: "Checkout failed" }, { status: 502 }); // i18n-exempt -- machine-readable API error
  }
}
