import { priceForDays, convertCurrency } from "../pricing";
import type { CartLine } from "../cart";
import type Stripe from "stripe";

/**
 * Build the two Stripe line-items (rental + deposit) for a single cart item.
 */
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
 * Build Stripe line-items for a simple sale checkout.
 * Unlike rental flows this only charges the SKU price (no deposit line).
 */
export async function buildSaleLineItemsForItem(
  item: CartLine,
  discountRate: number,
  currency: string,
): Promise<Stripe.Checkout.SessionCreateParams.LineItem[]> {
  const discounted = Math.round(item.sku.price * (1 - discountRate));
  const unitConv = await convertCurrency(discounted, currency);
  const baseName = item.size ? `${item.sku.title} (${item.size})` : item.sku.title;

  return [
    {
      price_data: {
        currency: currency.toLowerCase(),
        unit_amount: Math.round(unitConv * 100),
        product_data: { name: baseName },
      },
      quantity: item.qty,
    },
  ];
}
