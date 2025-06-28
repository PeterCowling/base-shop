import type { SKU } from "./Product";

export type CartLine = {
  sku: SKU;
  qty: number;
  /** Optional selected size for this product */
  size?: string;
};
export type CartState = Record<SKU["id"], CartLine>;
