import "server-only";
import type { RentalOrder } from "@acme/types";

export type Order = RentalOrder;
export type OrderLineItem = {
  sku: string;
  productId?: string;
  variantAttributes: Record<string, string>;
  quantity: number;
};

// Normalize Prisma results by replacing `null` fields with `undefined`.
// When given a falsy value (e.g. `null`), return it directly so callers can
// surface "not found" conditions instead of an empty object.
export function normalize<T extends Order>(order: T): T;
export function normalize(order: null): null;
export function normalize<T extends Order>(order: T | null): T | null {
  if (!order) return order;
  const o: T = { ...order };
  (Object.keys(o) as Array<keyof T>).forEach((k) => {
    if (o[k] === null) {
      o[k] = undefined!;
    }
  });
  return o;
}
