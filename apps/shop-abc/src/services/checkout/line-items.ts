import { priceForDays, convertCurrency } from "@platform-core/pricing";
import { type CartLine } from "@platform-core/src/cartCookie";
import type Stripe from "stripe";

/**
 * Produce the Stripe line-items (rental + deposit) for a single cart item.
 */
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
}
