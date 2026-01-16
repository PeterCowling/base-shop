import type { CartItem, CartLineItem, CartState, CartTotals } from "@/types/cart";
import type { CurrencyCode } from "@/types/product";
import type { Product } from "@/types/product";
import { getVariantById } from "@/lib/catalog";

export function getCartTotals(state: CartState, products: Product[]): CartTotals {
  let itemCount = 0;
  let subtotal = 0;
  let currency: CurrencyCode = "USD";

  for (const item of state.items) {
    const variant = getVariantById(products, item.variantId);
    if (!variant) continue;
    itemCount += item.quantity;
    subtotal += item.quantity * variant.price;
    currency = variant.currency;
  }

  return { itemCount, subtotal, currency };
}

export function getCartLineItems(items: CartItem[], products: Product[]): CartLineItem[] {
  const variantIndex = new Map<string, { product: CartLineItem["product"]; variant: CartLineItem["variant"] }>();

  for (const product of products) {
    for (const variant of product.variants) {
      variantIndex.set(variant.id, { product, variant });
    }
  }

  return items.flatMap((item) => {
    const entry = variantIndex.get(item.variantId);
    if (!entry) return [];
    return [{ item, product: entry.product, variant: entry.variant }];
  });
}
