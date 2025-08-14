// apps/shop-bcd/src/app/api/checkout-session/route.ts
import "@acme/lib/initZod";

import {
  CART_COOKIE,
  decodeCartCookie,
  type CartLine,
  type CartState,
} from "@/lib/cartCookie";
import { calculateRentalDays } from "@acme/date-utils";
import { stripe } from "@acme/stripe";
import { getCustomerSession } from "@auth";
import { priceForDays, convertCurrency } from "@platform-core/pricing";
import { findCoupon } from "@platform-core/coupons";
import { trackEvent } from "@platform-core/analytics";
import shop from "../../../shop.json";
import { getTaxRate } from "@platform-core/tax";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { shippingSchema, billingSchema } from "@platform-core/schemas/address";

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

const schema = z
  .object({
    returnDate: z.string().optional(),
    coupon: z.string().optional(),
    currency: z.string().optional(),
    taxRegion: z.string().optional(),
    customer: z.string().optional(),
    shipping: shippingSchema.optional(),
    billing_details: billingSchema.optional(),
  })
  .strict();

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
  discountRate: number,
  currency: string
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
  const unitConv = await convertCurrency(discounted, currency);
  const depositConv = await convertCurrency(item.sku.deposit, currency);

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
};

/**
 * Aggregate cart totals for metadata bookkeeping.
 */
const computeTotals = async (
  cart: Cart,
  rentalDays: number,
  discountRate: number,
  currency: string
): Promise<{ subtotal: number; depositTotal: number; discount: number }> => {
  const rentalTotals = await Promise.all(
    Object.values(cart).map(async (item) => {
      const unit = await priceForDays(item.sku, rentalDays);
      const discounted = Math.round(unit * (1 - discountRate));
      return { base: unit * item.qty, discounted: discounted * item.qty };
    })
  );

  const subtotalBase = rentalTotals.reduce((sum, v) => sum + v.discounted, 0);
  const originalBase = rentalTotals.reduce((sum, v) => sum + v.base, 0);
  const discountBase = originalBase - subtotalBase;
  const depositBase = Object.values(cart).reduce(
    (sum, item) => sum + item.sku.deposit * item.qty,
    0
  );

  return {
    subtotal: await convertCurrency(subtotalBase, currency),
    depositTotal: await convertCurrency(depositBase, currency),
    discount: await convertCurrency(discountBase, currency),
  };
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
  const parsed = schema.safeParse(await req.json().catch(() => undefined));
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }
  const {
    returnDate,
    coupon,
    currency = "EUR",
    taxRegion = "",
    customer: customerId,
    shipping,
    billing_details,
  } = parsed.data;
  const couponDef = await findCoupon(shop.id, coupon);
  if (couponDef) {
    await trackEvent(shop.id, { type: "discount_redeemed", code: couponDef.code });
  }
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
      buildLineItemsFor(item, rentalDays, discountRate, currency)
    )
  );
  const line_items = nestedItems.flat();

  /* 4️⃣  Compute metadata ------------------------------------------------- */
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
    Object.fromEntries(Object.values(cart).map((i) => [i.sku.id, i.size ?? ""]))
  );

  /* 5️⃣  Create Stripe Checkout Session ---------------------------------- */
  const customerSession = await getCustomerSession();
  const customer = customerId ?? customerSession?.customerId;
  const clientIp =
    req.headers?.get?.("x-forwarded-for")?.split(",")[0] ?? "";

  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData = {
    ...(shipping ? { shipping } : {}),
    payment_method_options: {
      card: { request_three_d_secure: "automatic" },
    },
    metadata: {
      subtotal: subtotal.toString(),
      depositTotal: depositTotal.toString(),
      returnDate: returnDate ?? "",
      rentalDays: rentalDays.toString(),
      customerId: customer ?? "",
      discount: discount.toString(),
      coupon: couponDef?.code ?? "",
      currency,
      taxRate: taxRate.toString(),
      taxAmount: taxAmount.toString(),
      ...(clientIp ? { client_ip: clientIp } : {}),
    },
  } as any;

  if (billing_details) {
    (paymentIntentData as any).billing_details = billing_details;
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer,
      line_items,
      success_url: `${req.nextUrl.origin}/success`,
      cancel_url: `${req.nextUrl.origin}/cancelled`,
      payment_intent_data: paymentIntentData,
      metadata: {
        subtotal: subtotal.toString(),
        depositTotal: depositTotal.toString(),
        returnDate: returnDate ?? "",
        rentalDays: rentalDays.toString(),
        sizes: sizesMeta,
        customerId: customer ?? "",
        discount: discount.toString(),
        coupon: couponDef?.code ?? "",
        currency,
        taxRate: taxRate.toString(),
        taxAmount: taxAmount.toString(),
        ...(clientIp ? { client_ip: clientIp } : {}),
      },
      expand: ["payment_intent"],
    });
  } catch (error) {
    console.error("Failed to create Stripe checkout session", error);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 502 }
    );
  }

  /* 6️⃣  Return credentials to client ------------------------------------ */
  const clientSecret =
    typeof session.payment_intent === "string"
      ? undefined
      : session.payment_intent?.client_secret;

  return NextResponse.json({ clientSecret, sessionId: session.id });
}
