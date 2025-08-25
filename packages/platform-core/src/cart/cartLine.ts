import type { SKU } from "@acme/types";

export interface CartLine {
  sku: SKU;
  qty: number;
  size?: string;
}
