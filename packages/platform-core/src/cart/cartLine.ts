import type { SKU, RentalLineItem } from "@acme/types";

export interface CartLine {
  sku: SKU;
  qty: number;
  size?: string;
  rental?: RentalLineItem;
}
