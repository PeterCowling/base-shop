import type { SKU } from "./Product";

export type CartLine = {
  sku: SKU;
  qty: number;
  /** Optional selected size for this product */
  size?: string;
};
// SKU["id"] is typed as `string | undefined` in the generated d.ts files which
// causes `Record<SKU["id"], CartLine>` to violate the key constraint. Cast the
// key to `string` to satisfy TypeScript while still documenting intent.
export type CartState = Record<NonNullable<SKU["id"]>, CartLine>;
