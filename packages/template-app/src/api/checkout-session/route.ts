// packages/template-app/src/api/checkout-session/route.ts

import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { stripe } from "@/lib/stripeServer";
import { priceForDays } from "@platform-core/pricing";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

/* ------------------------------------------------------------------ *
 *  Types
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

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;

/**
 * Calculate the number of chargeable rental days.
 * – If `returnDate` is absent or in the past, defaults to 1 day.
 */
const calculateRentalDays = (returnDate?: string): number => {
  if (!returnDate) return 1;

  const end = new Date(returnDate).getTime();
  const diffDays = Math.ceil((end - Date.now()) / DAY_MS);

  return diffDays > 0 ? diffDays : 1;
};

/**
 * Produce the rental-fee and deposit Stripe line-items for one cart entry.
 */
const buildLineItemsForItem = async (
  item: CartItem,
  rentalDays: number
): Promise<
  [
    Stripe.Checkout.SessionCreateParams.LineItem,
    Stripe.Checkout.SessionCreateParams.LineItem,
  ]
> => {
  const baseName = item.size
    ? `${item.sku.title} (${item.size})`
    : item.sku.title;

  return [
    {
      price_data: {
        currency: "eur",
        unit_amount: (await priceForDays(item.sku, rentalDays)) * 100,
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
 * Compute subtotal (rental) and deposit totals for the whole cart.
 */
const computeTotals = async (
  cart: Cart,
  rentalDays: number
): Promise<{ subtotal: number; depositTotal: number }> => {
  const subtotals = await Promise.all(
    Object.values(cart).map(
      async (item) => (await priceForDays(item.sku, rentalDays)) * item.qty
    )
  );

  const subtotal = subtotals.reduce((sum, v) => sum + v, 0);
  const depositTotal = Object.values(cart).reduce(
    (sum, item) => sum + item.sku.deposit * item.qty,
    0
  );

  return { subtotal, depositTotal };
};

/* ------------------------------------------------------------------ *
 *  Route handler
 * ------------------------------------------------------------------ */

export const runtime = "edge";

export async function POST(req: NextRequest): Promise<NextResponse> {
  /* 1️⃣  Decode the cart sent via cookie ----------------------------------- */
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const cart = decodeCartCookie(rawCookie) as Cart;

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  /* 2️⃣  Read optional returnDate from request body ----------------------- */
  const { returnDate } = (await req.json().catch(() => ({}))) as {
    returnDate?: string;
  };
  const rentalDays = calculateRentalDays(returnDate);

  /* 3️⃣  Build Stripe line-items ------------------------------------------ */
  const lineItemsNested = await Promise.all(
    Object.values(cart).map((item) => buildLineItemsForItem(item, rentalDays))
  );
  const line_items = lineItemsNested.flat();

  /* 4️⃣  Totals and metadata ---------------------------------------------- */
  const { subtotal, depositTotal } = await computeTotals(cart, rentalDays);

  const sizesMeta = JSON.stringify(
    Object.fromEntries(
      Object.values(cart).map((item) => [item.sku.id, item.size ?? ""])
    )
  );

  /* 5️⃣  Create Checkout Session ------------------------------------------ */
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

  /* 6️⃣  Return client credentials ---------------------------------------- */
  const clientSecret =
    typeof session.payment_intent === "string"
      ? undefined
      : session.payment_intent?.client_secret;

  return NextResponse.json({ clientSecret, sessionId: session.id });
}
