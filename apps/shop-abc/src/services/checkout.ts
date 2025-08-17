// apps/shop-abc/src/services/checkout.ts
import { priceForDays, convertCurrency } from "@platform-core/pricing";
import type { CartLine, CartState } from "@platform-core/cartCookie";
import type Stripe from "stripe";

export async function buildLineItemsForItem(
  item: CartLine,
  rentalDays: number,
  discountRate: number,
  currency: string,
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

export async function computeTotals(
  cart: CartState,
  rentalDays: number,
  discountRate: number,
  currency: string,
): Promise<{ subtotal: number; depositTotal: number; discount: number }> {
  const subtotals = await Promise.all(
    Object.values(cart).map(async (item) => {
      const unit = await priceForDays(item.sku, rentalDays);
      const discounted = Math.round(unit * (1 - discountRate));
      return { base: unit * item.qty, discounted: discounted * item.qty };
    }),
  );

  const subtotalBase = subtotals.reduce((sum, v) => sum + v.discounted, 0);
  const originalBase = subtotals.reduce((sum, v) => sum + v.base, 0);
  const discountBase = originalBase - subtotalBase;
  const depositBase = Object.values(cart).reduce(
    (sum, item) => sum + item.sku.deposit * item.qty,
    0,
  );

  return {
    subtotal: await convertCurrency(subtotalBase, currency),
    depositTotal: await convertCurrency(depositBase, currency),
    discount: await convertCurrency(discountBase, currency),
  };
}

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

export async function createCheckoutSession(
  cart: CartState,
  options: CreateCheckoutSessionOptions,
): Promise<{ sessionId: string; clientSecret?: string }> {
  const mod = await import("@platform-core/checkout/session");
  return mod.createCheckoutSession(cart, options);
}

export type { CartState, CartLine };
