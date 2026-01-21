import type { CartState } from "../cart";
import { convertCurrency,priceForDays } from "../pricing";

/**
 * Aggregate rental and deposit totals for later bookkeeping.
 */
export async function computeTotals(
  cart: CartState,
  rentalDays: number,
  discountRate: number,
  currency: string,
): Promise<{ subtotal: number; depositTotal: number; discount: number }> {
  const subtotals = await Promise.all(
    Object.values(cart).map(async (item) => {
      const unit = await priceForDays(item.sku, rentalDays);
      const discounted = Math.round(unit * (1 - discountRate));
      return { base: unit * item.qty, discounted: discounted * item.qty };
    }),
  );

  const subtotalBase = subtotals.reduce((sum, v) => sum + v.discounted, 0);
  const originalBase = subtotals.reduce((sum, v) => sum + v.base, 0);
  const discountBase = originalBase - subtotalBase;
  const depositBase = Object.values(cart).reduce(
    (sum, item) => sum + item.sku.deposit * item.qty,
    0,
  );

  return {
    subtotal: await convertCurrency(subtotalBase, currency),
    depositTotal: await convertCurrency(depositBase, currency),
    discount: await convertCurrency(discountBase, currency),
  };
}

/**
 * Aggregate totals for a simple sale checkout.
 * Deposit totals are always zero in this flow; deposits are
 * specific to rental flows and returns logistics.
 */
export async function computeSaleTotals(
  cart: CartState,
  discountRate: number,
  currency: string,
): Promise<{ subtotal: number; depositTotal: number; discount: number }> {
  const subtotals = Object.values(cart).map((item) => {
    const unit = item.sku.price;
    const discounted = Math.round(unit * (1 - discountRate));
    return { base: unit * item.qty, discounted: discounted * item.qty };
  });

  const subtotalBase = subtotals.reduce((sum, v) => sum + v.discounted, 0);
  const originalBase = subtotals.reduce((sum, v) => sum + v.base, 0);
  const discountBase = originalBase - subtotalBase;

  return {
    subtotal: await convertCurrency(subtotalBase, currency),
    depositTotal: 0,
    discount: await convertCurrency(discountBase, currency),
  };
}
