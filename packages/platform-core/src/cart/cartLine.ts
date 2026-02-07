import type { RentalLineItem,SKU } from "@acme/types";

export interface CartLine {
  sku: SKU;
  qty: number;
  size?: string;
  meta?: {
    source?: string;
    tryOn?: { idempotencyKey?: string; transform?: Record<string, unknown> };
  };
  rental?: RentalLineItem;
}
