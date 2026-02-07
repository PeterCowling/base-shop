import { roundDownToIncrement } from "@acme/lib/math/financial";

/**
 * Round a value down to the nearest 50 cents.
 * @see roundDownToIncrement from @acme/lib/math/financial
 */
export function roundDownTo50Cents(value: number): number {
  return roundDownToIncrement(value, 0.5);
}
