import "server-only";
import type { RentalOrder } from "@acme/types";

export type Order = RentalOrder;

// Normalize Prisma results by replacing `null` fields with `undefined`.
// When given a falsy value (e.g. `null`), return it directly so callers can
// surface "not found" conditions instead of an empty object.
export function normalize<T extends Order>(order: T): T {
  if (!order) return order;
  const o = { ...order } as Record<keyof T, T[keyof T]>;
  (Object.keys(o) as Array<keyof T>).forEach((k) => {
    if (o[k] === null) {
      o[k] = undefined as T[keyof T];
    }
  });
  return o as T;
}

