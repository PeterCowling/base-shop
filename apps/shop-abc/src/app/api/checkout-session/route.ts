// apps/shop-abc/src/app/api/checkout-session/route.ts
import "@acme/lib/initZod";

import { CART_COOKIE, decodeCartCookie, type CartState } from "@platform-core/src/cartCookie";
import { getCart } from "@platform-core/src/cartStore";
import { calculateRentalDays } from "@acme/date-utils";
import { stripe } from "@acme/stripe";
import { requirePermission } from "@auth";
import { findCoupon } from "@platform-core/coupons";
import { trackEvent } from "@platform-core/analytics";
import shop from "../../../../shop.json";
import { getTaxRate } from "@platform-core/tax";
import {
  buildLineItemsForItem,
  computeTotals,
  buildCheckoutMetadata,
} from "../../../services/checkout";

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { shippingSchema, billingSchema } from "@platform-core/schemas/address";
import { parseJsonBody } from "@shared-utils";

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
    console.error("Failed to create Stripe checkout session", error);
    return NextResponse.json(
      { error: "Checkout failed" },
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
