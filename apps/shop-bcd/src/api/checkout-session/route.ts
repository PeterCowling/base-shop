// apps/shop-bcd/src/app/api/checkout-session/route.ts

import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { calculateRentalDays } from "@/lib/date";
import { stripe } from "@lib/stripeServer.server";
import { getCustomerSession } from "@auth";
import { priceForDays } from "@platform-core/pricing";
import { findCoupon } from "@platform-core/coupons";
import type { CartLine, CartState } from "@types";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

/* ------------------------------------------------------------------ *
 *  Domain types
 * ------------------------------------------------------------------ */

/**
 * Centralise type definitions under `src/types/` in your real code-base.
 * They are declared inline here for completeness.
 */
type CartItem = CartLine;
type Cart = CartState;

/* ------------------------------------------------------------------ *
 *  Constants
 * ------------------------------------------------------------------ */

export const runtime = "edge";

/* ------------------------------------------------------------------ *
 *  Helper functions
 * ------------------------------------------------------------------ */

/**
 * Build the rental-fee line-item and the refundable deposit line-item
 * for a single cart entry.
 */
const buildLineItemsFor = async (
  item: CartItem,
  rentalDays: number,
  discountRate: number
): Promise<
  [
    Stripe.Checkout.SessionCreateParams.LineItem,
    Stripe.Checkout.SessionCreateParams.LineItem,
  ]
> => {
  const baseName = item.size
    ? `${item.sku.title} (${item.size})`
    : item.sku.title;
  const unit = await priceForDays(item.sku, rentalDays);
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
        unit_amount: item.sku.deposit * 100,
        product_data: { name: `${baseName} deposit` },
      },
      quantity: item.qty,
    },
  ];
};

/**
 * Aggregate cart totals for metadata bookkeeping.
 */
const computeTotals = async (
  cart: Cart,
  rentalDays: number,
  discountRate: number
): Promise<{ subtotal: number; depositTotal: number; discount: number }> => {
  const rentalTotals = await Promise.all(
    Object.values(cart).map(async (item) => {
      const unit = await priceForDays(item.sku, rentalDays);
      const discounted = Math.round(unit * (1 - discountRate));
      return { base: unit * item.qty, discounted: discounted * item.qty };
    })
  );

  const subtotal = rentalTotals.reduce((sum, v) => sum + v.discounted, 0);
  const original = rentalTotals.reduce((sum, v) => sum + v.base, 0);
  const discount = original - subtotal;
  const depositTotal = Object.values(cart).reduce(
    (sum, item) => sum + item.sku.deposit * item.qty,
    0
  );

  return { subtotal, depositTotal, discount };
};

/* ------------------------------------------------------------------ *
 *  POST handler
 * ------------------------------------------------------------------ */

export async function POST(req: NextRequest): Promise<NextResponse> {
  /* 1️⃣  Load and validate cart ------------------------------------------ */
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(rawCookie) as Cart;

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  /* 2️⃣  Parse request body ---------------------------------------------- */
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

  /* 3️⃣  Build Stripe line-items ----------------------------------------- */
  const nestedItems = await Promise.all(
    Object.values(cart).map((item) =>
      buildLineItemsFor(item, rentalDays, discountRate)
    )
  );
  const line_items = nestedItems.flat();

  /* 4️⃣  Compute metadata ------------------------------------------------- */
  const { subtotal, depositTotal, discount } = await computeTotals(
    cart,
    rentalDays,
    discountRate
  );

  const sizesMeta = JSON.stringify(
    Object.fromEntries(Object.values(cart).map((i) => [i.sku.id, i.size ?? ""]))
  );

  /* 5️⃣  Create Stripe Checkout Session ---------------------------------- */
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

  /* 6️⃣  Return credentials to client ------------------------------------ */
  const clientSecret =
    typeof session.payment_intent === "string"
      ? undefined
      : session.payment_intent?.client_secret;

  return NextResponse.json({ clientSecret, sessionId: session.id });
}
