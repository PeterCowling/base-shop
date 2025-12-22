import type { CurrencyCode, Product, ProductVariant } from "@/types/product";

export type CartItem = {
  variantId: string;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  updatedAt: number;
};

export type CartTotals = {
  itemCount: number;
  subtotal: number;
  currency: CurrencyCode;
};

export type CartLineItem = {
  item: CartItem;
  product: Product;
  variant: ProductVariant;
};

export type CartAction =
  | { type: "hydrate"; payload: CartItem[] }
  | { type: "add"; payload: { variantId: string; quantity: number } }
  | { type: "remove"; payload: { variantId: string } }
  | { type: "setQuantity"; payload: { variantId: string; quantity: number } }
  | { type: "clear" };
