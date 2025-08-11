// packages/template-app/src/api/checkout-session/route.ts
import { stripe } from "@/lib/stripeServer";
import { calculateRentalDays } from "@/lib/date";
import {
  CART_COOKIE,
  decodeCartCookie,
  type CartLine,
  type CartState,
} from "@platform-core/src/cartCookie";
import { getCart } from "@platform-core/src/cartStore";
import { priceForDays, convertCurrency } from "@platform-core/src/pricing";
import { getProductById } from "@platform-core/src/products";
import { findCoupon } from "@platform-core/src/coupons";
import { getTaxRate } from "@platform-core/src/tax";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

/* ------------------------------------------------------------------
 * Types held in the cart cookie
 * ------------------------------------------------------------------ */
type Cart = CartState;

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

/** Build Stripe line-items for one cart entry */
async function buildLineItemsForItem(
  item: CartLine,
  rentalDays: number,
  discountRate: number,
  currency: string
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
  const unitConv = await convertCurrency(discounted, currency);
  const depositConv = await convertCurrency(sku.deposit, currency);

  return [
    {
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: unitConv * 100,
        product_data: { name: baseName },
      },
      quantity: item.qty,
    },
    {
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: depositConv * 100,
        product_data: { name: `${baseName} deposit` },
      },
      quantity: item.qty,
    },
  ];
}

/** Cart-wide subtotals */
async function computeTotals(
  cart: CartState,
  rentalDays: number,
  discountRate: number,
  currency: string
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

  const subtotalBase = lineTotals.reduce((s, n) => s + n.discounted, 0);
  const originalBase = lineTotals.reduce((s, n) => s + n.base, 0);
  const discountBase = originalBase - subtotalBase;
  const depositBase = Object.values(cart).reduce(
    (s, item) => s + item.sku.deposit * item.qty,
    0
  );

  return {
    subtotal: await convertCurrency(subtotalBase, currency),
    depositTotal: await convertCurrency(depositBase, currency),
    discount: await convertCurrency(discountBase, currency),
  };
}

/* ------------------------------------------------------------------
 *  Route handler
 * ------------------------------------------------------------------ */
export const runtime = "edge";

export async function POST(req: NextRequest): Promise<NextResponse> {
  /* 1  Decode cart -------------------------------------------------- */
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const cartId = decodeCartCookie(rawCookie);
  const cart = cartId ? ((await getCart(cartId)) as CartState) : {};

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  /* 2  Rental days -------------------------------------------------- */
  const { returnDate, coupon, currency = "EUR", taxRegion = "" } =
    (await req.json().catch(() => ({}))) as {
      returnDate?: string;
      coupon?: string;
      currency?: string;
      taxRegion?: string;
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
      buildLineItemsForItem(item, rentalDays, discountRate, currency)
    )
  );
  const line_items = nested.flat();

  /* 4  Totals / metadata ------------------------------------------- */
  const { subtotal, depositTotal, discount } = await computeTotals(
    cart,
    rentalDays,
    discountRate,
    currency
  );

  const taxRate = await getTaxRate(taxRegion);
  const taxAmount = Math.round(subtotal * taxRate);
  if (taxAmount > 0) {
    line_items.push({
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: taxAmount * 100,
        product_data: { name: "Tax" },
      },
      quantity: 1,
    });
  }

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
        currency,
        taxRate: String(taxRate),
        taxAmount: String(taxAmount),
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
      currency,
      taxRate: String(taxRate),
      taxAmount: String(taxAmount),
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
