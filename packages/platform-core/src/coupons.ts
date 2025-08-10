import type { Coupon } from "@types";

/**
 * Calculate the discount amount for a given coupon and cart subtotal.
 */
export function discountFromCoupon(coupon: Coupon, subtotal: number): number {
  if (coupon.percentOff) {
    return Math.round((coupon.percentOff / 100) * subtotal);
  }
  if (coupon.amountOff) {
    return Math.min(coupon.amountOff, subtotal);
  }
  return 0;
}

export type { Coupon };
