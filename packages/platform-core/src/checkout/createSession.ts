import { findCoupon } from "../coupons";
import { trackEvent } from "../analytics";
import { getTaxRate } from "../tax";
import { calculateRentalDays } from "@acme/date-utils";
import { stripe } from "@acme/stripe";
import type { CartState } from "../cart";
import type Stripe from "stripe";
import { buildLineItemsForItem } from "./lineItems";
import { computeTotals } from "./totals";
import { buildCheckoutMetadata } from "./metadata";

export interface CreateCheckoutSessionOptions {
  returnDate?: string;
  coupon?: string;
  currency: string;
  taxRegion: string;
  customerId?: string;
  shipping?: Stripe.Checkout.SessionCreateParams.PaymentIntentData.Shipping;
  billing_details?: Stripe.PaymentIntentCreateParams.PaymentMethodData.BillingDetails;
  successUrl: string;
  cancelUrl: string;
  clientIp?: string;
  shopId: string;
  lineItemsExtra?: Stripe.Checkout.SessionCreateParams.LineItem[];
  metadataExtra?: Record<string, string>;
  subtotalExtra?: number;
  depositAdjustment?: number;
}

/**
 * High level helper to create a Stripe checkout session for a cart.
 * Currency and shop ID are injected via function parameters.
 */
export async function createCheckoutSession(
  cart: CartState,
  {
    returnDate,
    coupon,
    currency,
    taxRegion,
    customerId,
    shipping,
    billing_details,
    successUrl,
    cancelUrl,
    clientIp,
    shopId,
    lineItemsExtra = [],
    metadataExtra = {},
    subtotalExtra = 0,
    depositAdjustment = 0,
  }: CreateCheckoutSessionOptions
): Promise<{ sessionId: string; clientSecret?: string }> {
  const couponDef = await findCoupon(shopId, coupon);
  if (couponDef) {
    await trackEvent(shopId, { type: "discount_redeemed", code: couponDef.code });
  }
  const discountRate = couponDef ? couponDef.discountPercent / 100 : 0;
  let rentalDays: number;
  try {
    rentalDays = calculateRentalDays(returnDate);
  } catch {
    throw new Error("Invalid returnDate"); // i18n-exempt -- Internal validation error surfaced to logs/UI
  }
  if (rentalDays <= 0) {
    throw new Error("Invalid returnDate"); // i18n-exempt -- Internal validation error surfaced to logs/UI
  }

  const lineItemsNested = await Promise.all(
    Object.values(cart).map((item) =>
      buildLineItemsForItem(item, rentalDays, discountRate, currency)
    )
  );
  let line_items = lineItemsNested.flat();
  if (lineItemsExtra.length) line_items = line_items.concat(lineItemsExtra);

  const totals = await computeTotals(
    cart,
    rentalDays,
    discountRate,
    currency
  );
  let { subtotal, depositTotal } = totals;
  const { discount } = totals;
  subtotal += subtotalExtra;
  depositTotal += depositAdjustment;

  const taxRate = await getTaxRate(taxRegion);
  const taxAmountCents = Math.round(subtotal * taxRate * 100);
  const taxAmount = taxAmountCents / 100;
  if (taxAmountCents > 0) {
    line_items.push({
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: taxAmountCents,
        product_data: { name: "Tax" }, // i18n-exempt -- Stripe product label, not user copy
      },
      quantity: 1,
    });
  }

  const sizesMeta = JSON.stringify(
    Object.fromEntries(
      Object.values(cart).map((item) => [item.sku.id, item.size ?? ""])
    )
  );

  const metadata = buildCheckoutMetadata({
    subtotal,
    depositTotal,
    returnDate,
    rentalDays,
    customerId,
    discount,
    coupon: couponDef?.code,
    currency,
    taxRate,
    taxAmount,
    clientIp,
    sizes: sizesMeta,
    extra: metadataExtra,
  });

  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData & {
    payment_method_options: {
      card: { request_three_d_secure: "automatic" };
    };
    billing_details?: Stripe.PaymentIntentCreateParams.PaymentMethodData.BillingDetails;
  } = {
    ...(shipping ? { shipping } : {}),
    payment_method_options: {
      card: { request_three_d_secure: "automatic" },
    },
    metadata,
  };

  if (billing_details) {
    paymentIntentData.billing_details = billing_details;
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer: customerId,
      line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: paymentIntentData,
      metadata,
      expand: ["payment_intent"],
    },
    clientIp
      ? ({ headers: { "Stripe-Client-IP": clientIp } } as Stripe.RequestOptions)
      : undefined
  );

  const clientSecret =
    typeof session.payment_intent === "string"
      ? undefined
      : session.payment_intent?.client_secret ?? undefined;

  return { clientSecret, sessionId: session.id };
}

export type { CartState };
