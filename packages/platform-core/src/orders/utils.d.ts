import "server-only";
import type { RentalOrder } from "@acme/types";
export type Order = RentalOrder;
export type OrderLineItem = {
  sku: string;
  productId?: string;
  variantAttributes: Record<string, string>;
  quantity: number;
};
export declare function normalize<T extends Order = Order>(order: T | null): T | null;
