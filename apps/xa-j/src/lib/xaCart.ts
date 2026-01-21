import type { XaProduct } from "./demoData";

export type XaCartLine = {
  sku: XaProduct;
  qty: number;
  size?: string;
};

export type XaCartState = Record<string, XaCartLine>;

export function cartLineId(skuId: string, size?: string) {
  return size ? `${skuId}:${size}` : skuId;
}

export function cartReservedQtyForSku(cart: XaCartState, skuId: string) {
  return Object.values(cart).reduce(
    (sum, line) => sum + (line.sku.id === skuId ? line.qty : 0),
    0,
  );
}

export function cartReservedQtyForSkuExcluding(
  cart: XaCartState,
  skuId: string,
  excludeLineId: string,
) {
  return Object.entries(cart).reduce((sum, [id, line]) => {
    if (id === excludeLineId) return sum;
    return sum + (line.sku.id === skuId ? line.qty : 0);
  }, 0);
}

