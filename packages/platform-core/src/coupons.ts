// packages/platform-core/src/coupons.ts
import type { Coupon } from "@types";

/** Sample coupons available on the storefront */
export const COUPONS: readonly Coupon[] = [
  {
    code: "SUMMER20",
    description: "Summer promotion – 20% off",
    discountPercent: 20,
  },
];

/** Lookup a coupon by code (case-insensitive). */
export function findCoupon(code: string | undefined | null): Coupon | undefined {
  if (!code) return undefined;
  return COUPONS.find((c) => c.code.toLowerCase() === code.toLowerCase());
}
