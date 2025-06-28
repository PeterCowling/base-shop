import type { SKU } from "./Product";
export type CartLine = {
    sku: SKU;
    qty: number;
};
export type CartState = Record<SKU["id"], CartLine>;
