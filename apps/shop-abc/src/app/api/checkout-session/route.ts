// apps/shop-abc/src/app/api/checkout-session/route.ts
import "@acme/lib/initZod";

import {
  CART_COOKIE,
  decodeCartCookie,
  type CartLine,
  type CartState,
} from "@platform-core/src/cartCookie";
import { getCart } from "@platform-core/src/cartStore";
import { calculateRentalDays } from "@acme/date-utils";
import { stripe } from "@acme/stripe";
import { requirePermission } from "@auth";
import { priceForDays, convertCurrency } from "@platform-core/pricing";
import { findCoupon } from "@platform-core/coupons";
import { trackEvent } from "@platform-core/analytics";
import shop from "../../../../shop.json";
import { getTaxRate } from "@platform-core/tax";

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { shippingSchema, billingSchema } from "@platform-core/schemas/address";
import { parseJsonBody } from "@shared-utils";

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
  discountRate: number,
  currency: string
): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> => {
  const unitPrice = await priceForDays(item.sku, rentalDays);
  const discounted = Math.round(unitPrice * (1 - discountRate));
  const unitConv = await convertCurrency(discounted, currency);
  const depositConv = await convertCurrency(item.sku.deposit, currency);
  const baseName = item.size
    ? `${item.sku.title} (${item.size})`
    : item.sku.title;

  const lines: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: Math.round(unitConv * 100),
        product_data: { name: baseName },
      },
      quantity: item.qty,
    },
  ];

  if (item.sku.deposit > 0) {
    lines.push({
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: Math.round(depositConv * 100),
        product_data: { name: `${baseName} deposit` },
      },
      quantity: item.qty,
    });
  }

  return lines;
};

/**
 * Aggregate rental and deposit totals for later bookkeeping.
 */
const computeTotals = async (
  cart: Cart,
  rentalDays: number,
  discountRate: number,
  currency: string
): Promise<{ subtotal: number; depositTotal: number; discount: number }> => {
  const subtotals = await Promise.all(
    Object.values(cart).map(async (item) => {
      const unit = await priceForDays(item.sku, rentalDays);
      const discounted = Math.round(unit * (1 - discountRate));
      return { base: unit * item.qty, discounted: discounted * item.qty };
    })
  );

  const subtotalBase = subtotals.reduce((sum, v) => sum + v.discounted, 0);
  const originalBase = subtotals.reduce((sum, v) => sum + v.base, 0);
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

/**
 * Build the shared metadata object for both the checkout session and
 * payment intent.
 */
const buildCheckoutMetadata = ({
  subtotal,
  depositTotal,
  returnDate,
  rentalDays,
  customerId,
  discount,
  coupon,
  currency,
  taxRate,
  taxAmount,
  clientIp,
  sizes,
}: {
  subtotal: number;
  depositTotal: number;
  returnDate?: string;
  rentalDays: number;
  customerId?: string;
  discount: number;
  coupon?: string;
  currency: string;
  taxRate: number;
  taxAmount: number;
  clientIp?: string;
  sizes?: string;
}) => ({
  subtotal: subtotal.toString(),
  depositTotal: depositTotal.toString(),
  returnDate: returnDate ?? "",
  rentalDays: rentalDays.toString(),
  ...(sizes ? { sizes } : {}),
  customerId: customerId ?? "",
  discount: discount.toString(),
  coupon: coupon ?? "",
  currency,
  taxRate: taxRate.toString(),
  taxAmount: taxAmount.toString(),
  ...(clientIp ? { client_ip: clientIp } : {}),
});

/* ------------------------------------------------------------------ *
 *  Route handler
 * ------------------------------------------------------------------ */

export const runtime = "edge";

const schema = z
  .object({
    returnDate: z.string().optional(),
    coupon: z.string().optional(),
    currency: z.enum(["EUR", "USD", "GBP"]).default("EUR"),
    taxRegion: z.enum(["", "EU", "US"]).default(""),
    customer: z.string().optional(),
    shipping: shippingSchema.optional(),
    billing_details: billingSchema.optional(),
  })
  .strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  /* 1️⃣ Decode cart cookie -------------------------------------------------- */
  const rawCookie = req.cookies.get(CART_COOKIE)?.value;
  const cartId = decodeCartCookie(rawCookie);
  const cart: CartState = cartId ? await getCart(cartId) : {};

  if (!Object.keys(cart).length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  let session;
  try {
    session = await requirePermission("checkout");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* 2️⃣ Parse optional body ------------------------------------------------- */
  const parsed = await parseJsonBody(req, schema, "1mb");
  if (!parsed.success) return parsed.response;

  const {
    returnDate,
    coupon,
    currency,
    taxRegion,
    customer: customerId,
    shipping,
    billing_details,
  } = parsed.data;
  const couponDef = await findCoupon(shop.id, coupon);
  if (couponDef) {
    await trackEvent(shop.id, {
      type: "discount_redeemed",
      code: couponDef.code,
    });
  }
  const discountRate = couponDef ? couponDef.discountPercent / 100 : 0;
  let rentalDays: number;
  try {
    rentalDays = calculateRentalDays(returnDate);
  } catch {
    return NextResponse.json({ error: "Invalid returnDate" }, { status: 400 });
  }
  if (rentalDays <= 0) {
    return NextResponse.json({ error: "Invalid returnDate" }, { status: 400 });
  }

  /* 3️⃣ Build Stripe line-items & totals ------------------------------------ */
  const lineItemsNested = await Promise.all(
    Object.values(cart).map((item) =>
      buildLineItemsForItem(item, rentalDays, discountRate, currency)
    )
  );
  const line_items = lineItemsNested.flat();

  const { subtotal, depositTotal, discount } = await computeTotals(
    cart,
    rentalDays,
    discountRate,
    currency
  );

  const taxRate = await getTaxRate(taxRegion);
  const taxAmountCents = Math.round(subtotal * taxRate * 100);
  const taxAmount = taxAmountCents / 100;
  if (taxAmountCents > 0) {
    line_items.push({
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: taxAmountCents,
        product_data: { name: "Tax" },
      },
      quantity: 1,
    });
  }

  /* 4️⃣ Serialize sizes for metadata --------------------------------------- */
  const sizesMeta = JSON.stringify(
    Object.fromEntries(
      Object.values(cart).map((item) => [item.sku.id, item.size ?? ""])
    )
  );

  /* 5️⃣ Create Checkout Session -------------------------------------------- */
  const customer = customerId ?? session.customerId;
  const clientIp = req.headers?.get?.("x-forwarded-for")?.split(",")[0] ?? "";

  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData =
    {
      ...(shipping ? { shipping } : {}),
      payment_method_options: {
        card: { request_three_d_secure: "automatic" },
      },
      metadata: buildCheckoutMetadata({
        subtotal,
        depositTotal,
        returnDate,
        rentalDays,
        customerId: customer,
        discount,
        coupon: couponDef?.code,
        currency,
        taxRate,
        taxAmount,
        clientIp,
      }),
    } as any;

  if (billing_details) {
    (paymentIntentData as any).billing_details = billing_details;
  }

  let stripeSession: Stripe.Checkout.Session;
  try {
    stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer,
      line_items,
      success_url: `${req.nextUrl.origin}/success`,
      cancel_url: `${req.nextUrl.origin}/cancelled`,
      payment_intent_data: paymentIntentData,
      metadata: buildCheckoutMetadata({
        subtotal,
        depositTotal,
        returnDate,
        rentalDays,
        sizes: sizesMeta,
        customerId: customer,
        discount,
        coupon: couponDef?.code,
        currency,
        taxRate,
        taxAmount,
        clientIp,
      }),
      expand: ["payment_intent"],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Checkout session failed" },
      { status: 502 }
    );
  }

  /* 6️⃣ Return client credentials ------------------------------------------ */
  const clientSecret =
    typeof stripeSession.payment_intent === "string"
      ? undefined
      : stripeSession.payment_intent?.client_secret;

  return NextResponse.json({
    clientSecret,
    sessionId: stripeSession.id,
  });
}
