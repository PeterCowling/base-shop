import { priceForDays, convertCurrency } from "../pricing.ts";
import { findCoupon } from "../coupons";
import { trackEvent } from "../analytics";
import { getTaxRate } from "../tax";
import { calculateRentalDays } from "@acme/date-utils";
import { stripe } from "@acme/stripe";
import type { CartLine, CartState } from "../cartCookie";
import type Stripe from "stripe";

/** Build the two Stripe line-items (rental + deposit) for a single cart item. */
export async function buildLineItemsForItem(
  item: CartLine,
  rentalDays: number,
  discountRate: number,
  currency: string
): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> {
  const unitPrice = await priceForDays(item.sku, rentalDays);
  const discounted = Math.round(unitPrice * (1 - discountRate));
  const unitConv = await convertCurrency(discounted, currency);
  const depositConv = await convertCurrency(item.sku.deposit, currency);
  const baseName = item.size ? `${item.sku.title} (${item.size})` : item.sku.title;

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
}

/**
 * Aggregate rental and deposit totals for later bookkeeping.
 */
export async function computeTotals(
  cart: CartState,
  rentalDays: number,
  discountRate: number,
  currency: string
): Promise<{ subtotal: number; depositTotal: number; discount: number }> {
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
}

/**
 * Build the shared metadata object for both the checkout session and
 * payment intent.
 */
export const buildCheckoutMetadata = ({
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
  extra,
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
  extra?: Record<string, string>;
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
  ...(extra ?? {}),
});

export interface CreateCheckoutSessionOptions {
  returnDate?: string;
  coupon?: string;
  currency: string;
  taxRegion: string;
  customerId?: string;
  shipping?: Stripe.Checkout.SessionCreateParams.ShippingAddress;
  billing_details?: Stripe.Checkout.SessionCreateParams.PaymentIntentData.BillingDetails;
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
    throw new Error("Invalid returnDate");
  }
  if (rentalDays <= 0) {
    throw new Error("Invalid returnDate");
  }

  const lineItemsNested = await Promise.all(
    Object.values(cart).map((item) =>
      buildLineItemsForItem(item, rentalDays, discountRate, currency)
    )
  );
  let line_items = lineItemsNested.flat();
  if (lineItemsExtra.length) line_items = line_items.concat(lineItemsExtra);

  let { subtotal, depositTotal, discount } = await computeTotals(
    cart,
    rentalDays,
    discountRate,
    currency
  );
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
    billing_details?: Stripe.Checkout.SessionCreateParams.PaymentIntentData.BillingDetails;
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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items,
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_intent_data: paymentIntentData,
    metadata,
    expand: ["payment_intent"],
  }, clientIp ? { headers: { "Stripe-Client-IP": clientIp } } : undefined);

  const clientSecret =
    typeof session.payment_intent === "string"
      ? undefined
      : session.payment_intent?.client_secret;

  return { clientSecret, sessionId: session.id };
}

export type { CartState };
