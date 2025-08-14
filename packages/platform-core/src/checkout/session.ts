import { calculateRentalDays } from "@acme/date-utils";
import { stripe } from "@acme/stripe";
import { priceForDays, convertCurrency } from "../pricing.ts";
import { findCoupon } from "../coupons.ts";
import { trackEvent } from "../analytics.ts";
import { getTaxRate } from "../tax/index.ts";
import type { CartLine, CartState } from "../cartCookie.ts";
import type Stripe from "stripe";

/** Build the Stripe line-items (rental + deposit) for a cart item. */
const buildLineItemsForItem = async (
  item: CartLine,
  rentalDays: number,
  discountRate: number,
  currency: string
): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> => {
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
};

/** Aggregate subtotal/discount/deposit totals for cart metadata. */
const computeTotals = async (
  cart: CartState,
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

/** Shared metadata for checkout session and payment intent. */
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

export interface CreateCheckoutSessionOptions {
  shopId: string;
  cart: CartState;
  returnDate?: string;
  coupon?: string;
  currency: string;
  taxRegion?: string;
  customerId?: string;
  shipping?: Stripe.Checkout.SessionCreateParams.ShippingAddress;
  billingDetails?: Stripe.Checkout.SessionCreateParams.BillingDetails;
  successUrl: string;
  cancelUrl: string;
  clientIp?: string;
}

export async function createCheckoutSession({
  shopId,
  cart,
  returnDate,
  coupon,
  currency,
  taxRegion,
  customerId,
  shipping,
  billingDetails,
  successUrl,
  cancelUrl,
  clientIp,
}: CreateCheckoutSessionOptions): Promise<{ clientSecret?: string; sessionId: string }> {
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
  if (rentalDays <= 0) throw new Error("Invalid returnDate");

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

  const sizesMeta = JSON.stringify(
    Object.fromEntries(
      Object.values(cart).map((item) => [item.sku.id, item.size ?? ""])
    )
  );

  const paymentIntentData: Stripe.Checkout.SessionCreateParams.PaymentIntentData = {
    ...(shipping ? { shipping } : {}),
    payment_method_options: { card: { request_three_d_secure: "automatic" } },
    metadata: buildCheckoutMetadata({
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
    }),
  } as any;

  if (billingDetails) {
    (paymentIntentData as any).billing_details = billingDetails;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items,
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_intent_data: paymentIntentData,
    metadata: buildCheckoutMetadata({
      subtotal,
      depositTotal,
      returnDate,
      rentalDays,
      sizes: sizesMeta,
      customerId,
      discount,
      coupon: couponDef?.code,
      currency,
      taxRate,
      taxAmount,
      clientIp,
    }),
    expand: ["payment_intent"],
  });

  const clientSecret =
    typeof session.payment_intent === "string"
      ? undefined
      : session.payment_intent?.client_secret;
  return { clientSecret, sessionId: session.id };
}

export type { CartState };
