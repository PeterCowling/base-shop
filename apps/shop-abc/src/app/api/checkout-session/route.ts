// apps/shop-abc/src/app/api/checkout-session/route.ts

import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { calculateRentalDays } from "@/lib/date";
import { stripe } from "@lib/stripeServer";
import { getCustomerSession } from "@auth";
import { priceForDays } from "@platform-core/pricing";
import { findCoupon } from "@platform-core/coupons";

import type { CartLine, CartState } from "@types";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

/* ------------------------------------------------------------------ *
 *  Types
 * ------------------------------------------------------------------ */

type CartItem = CartLine;
type Cart = CartState;

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

/**
 * Produce the two Stripe line-items (rental + deposit) for a single cart item.
 */
const buildLineItemsForItem = async (
  item: CartItem,
  rentalDays: number,
  discountRate: number
): Promise<
  [
    Stripe.Checkout.SessionCreateParams.LineItem,
    Stripe.Checkout.SessionCreateParams.LineItem,
  ]
> => {
  const unitPrice = await priceForDays(item.sku, rentalDays);
  const discounted = Math.round(unitPrice * (1 - discountRate));
  const baseName = item.size
    ? `${item.sku.title} (${item.size})`
    : item.sku.title;

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
        unit_amount: item.sku.deposit * 100,
        product_data: { name: `${baseName} deposit` },
      },
      quantity: item.qty,
    },
  ];
};

/**
 * Aggregate rental and deposit totals for later bookkeeping.
 */
const computeTotals = async (
  cart: Cart,
  rentalDays: number,
  discountRate: number
): Promise<{ subtotal: number; depositTotal: number; discount: number }> => {
  const subtotals = await Promise.all(
    Object.values(cart).map(async (item) => {
      const unit = await priceForDays(item.sku, rentalDays);
      const discounted = Math.round(unit * (1 - discountRate));
      return { base: unit * item.qty, discounted: discounted * item.qty };
    })
  );

  const subtotal = subtotals.reduce((sum, v) => sum + v.discounted, 0);
  const original = subtotals.reduce((sum, v) => sum + v.base, 0);
  const discount = original - subtotal;
  const depositTotal = Object.values(cart).reduce(
    (sum, item) => sum + item.sku.deposit * item.qty,
    0
  );

  return { subtotal, depositTotal, discount };
};

/* ------------------------------------------------------------------ *
 *  Route handler
 * ------------------------------------------------------------------ */

export const runtime = "edge";

export async function POST(req: NextRequest): Promise<NextResponse> {
  /* 1️⃣ Decode cart cookie -------------------------------------------------- */
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(rawCookie);

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  /* 2️⃣ Parse optional body ------------------------------------------------- */
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

  /* 3️⃣ Build Stripe line-items & totals ------------------------------------ */
  const lineItemsNested = await Promise.all(
    Object.values(cart).map((item) =>
      buildLineItemsForItem(item, rentalDays, discountRate)
    )
  );
  const line_items = lineItemsNested.flat();

  const { subtotal, depositTotal, discount } = await computeTotals(
    cart,
    rentalDays,
    discountRate
  );

  /* 4️⃣ Serialize sizes for metadata --------------------------------------- */
  const sizesMeta = JSON.stringify(
    Object.fromEntries(
      Object.values(cart).map((item) => [item.sku.id, item.size ?? ""])
    )
  );

  /* 5️⃣ Create Checkout Session -------------------------------------------- */
  const customer = await getCustomerSession();
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
        customerId: customer?.customerId ?? "",
        discount: discount.toString(),
        coupon: couponDef?.code ?? "",
      },
    },
    metadata: {
      subtotal: subtotal.toString(),
      depositTotal: depositTotal.toString(),
      returnDate: returnDate ?? "",
      rentalDays: rentalDays.toString(),
      sizes: sizesMeta,
      customerId: customer?.customerId ?? "",
      discount: discount.toString(),
      coupon: couponDef?.code ?? "",
    },
    expand: ["payment_intent"],
  });

  /* 6️⃣ Return client credentials ------------------------------------------ */
  const clientSecret =
    typeof session.payment_intent === "string"
      ? undefined
      : session.payment_intent?.client_secret;

  return NextResponse.json({ clientSecret, sessionId: session.id });
}
