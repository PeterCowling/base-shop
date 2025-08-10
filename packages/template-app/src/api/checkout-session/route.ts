// packages/template-app/src/api/checkout-session/route.ts
import { stripe } from "@/lib/stripeServer";
import { calculateRentalDays } from "@/lib/date";
import { CART_COOKIE, decodeCartCookie } from "@platform-core/src/cartCookie";
import { priceForDays } from "@platform-core/src/pricing";
import { getProductById } from "@platform-core/src/products";
import { findCoupon } from "@platform-core/src/coupons";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

/* ------------------------------------------------------------------
 * Types held in the cart cookie
 * ------------------------------------------------------------------ */
interface CartSku {
  id: string;
  title: string;
  deposit: number;
}

interface CartItem {
  sku: CartSku;
  qty: number;
  size?: string;
}

type Cart = Record<string, CartItem>;

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

/** Build Stripe line-items for one cart entry */
async function buildLineItemsForItem(
  item: CartItem,
  rentalDays: number,
  discountRate: number
): Promise<
  [
    Stripe.Checkout.SessionCreateParams.LineItem,
    Stripe.Checkout.SessionCreateParams.LineItem,
  ]
> {
  const sku = getProductById(item.sku.id); // ← full SKU

  const baseName = item.size ? `${sku.title} (${item.size})` : sku.title;
  const unit = await priceForDays(sku, rentalDays);
  const discounted = Math.round(unit * (1 - discountRate));

  return [
    {
      price_data: {
        currency: "eur",
        unit_amount: discounted * 100,
        product_data: { name: baseName },
      },
      quantity: item.qty,
    },
    {
      price_data: {
        currency: "eur",
        unit_amount: sku.deposit * 100,
        product_data: { name: `${baseName} deposit` },
      },
      quantity: item.qty,
    },
  ];
}

/** Cart-wide subtotals */
async function computeTotals(
  cart: Cart,
  rentalDays: number,
  discountRate: number
) {
  const lineTotals = await Promise.all(
    Object.values(cart).map(async (item) => {
      const sku = getProductById(item.sku.id);
      const unit = await priceForDays(sku, rentalDays);
      const discounted = Math.round(unit * (1 - discountRate));
      return {
        base: unit * item.qty,
        discounted: discounted * item.qty,
      };
    })
  );

  const subtotal = lineTotals.reduce((s, n) => s + n.discounted, 0);
  const original = lineTotals.reduce((s, n) => s + n.base, 0);
  const discount = original - subtotal;
  const depositTotal = Object.values(cart).reduce(
    (s, item) => s + item.sku.deposit * item.qty,
    0
  );

  return { subtotal, depositTotal, discount };
}

/* ------------------------------------------------------------------
 *  Route handler
 * ------------------------------------------------------------------ */
export const runtime = "edge";

export async function POST(req: NextRequest): Promise<NextResponse> {
  /* 1  Decode cart -------------------------------------------------- */
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(rawCookie) as Cart;

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  /* 2  Rental days -------------------------------------------------- */
  const { returnDate, coupon } = (await req.json().catch(() => ({}))) as {
    returnDate?: string;
    coupon?: string;
  };
  const couponDef = findCoupon(coupon);
  const discountRate = couponDef ? couponDef.discountPercent / 100 : 0;
  let rentalDays: number;
  try {
    rentalDays = calculateRentalDays(returnDate);
  } catch {
    return NextResponse.json({ error: "Invalid returnDate" }, { status: 400 });
  }

  /* 3  Stripe line-items ------------------------------------------- */
  const nested = await Promise.all(
    Object.values(cart).map((item) =>
      buildLineItemsForItem(item, rentalDays, discountRate)
    )
  );
  const line_items = nested.flat();

  /* 4  Totals / metadata ------------------------------------------- */
  const { subtotal, depositTotal, discount } = await computeTotals(
    cart,
    rentalDays,
    discountRate
  );

  const sizesMeta = JSON.stringify(
    Object.fromEntries(
      Object.values(cart).map((item) => [item.sku.id, item.size ?? ""])
    )
  );

  /* 5  Create checkout session ------------------------------------- */
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${req.nextUrl.origin}/success`,
    cancel_url: `${req.nextUrl.origin}/cancelled`,
    payment_intent_data: {
      metadata: {
        subtotal: String(subtotal),
        depositTotal: String(depositTotal),
        returnDate: returnDate ?? "",
        rentalDays: String(rentalDays),
        discount: String(discount),
        coupon: couponDef?.code ?? "",
      },
    },
    metadata: {
      subtotal: String(subtotal),
      depositTotal: String(depositTotal),
      returnDate: returnDate ?? "",
      rentalDays: String(rentalDays),
      sizes: sizesMeta,
      discount: String(discount),
      coupon: couponDef?.code ?? "",
    },
    expand: ["payment_intent"],
  });

  /* 6  Return client credentials ----------------------------------- */
  const clientSecret =
    typeof session.payment_intent === "string"
      ? undefined
      : session.payment_intent?.client_secret;

  return NextResponse.json({ clientSecret, sessionId: session.id });
}
