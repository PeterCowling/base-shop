import type { CartState } from "@acme/platform-core/cartCookie";

export default function OrderSummary({
  cart: _cart,
  totals: _totals,
}: {
  cart: CartState;
  totals: { subtotal: number; deposit: number; total: number };
}) {
  return <div>OrderSummary</div>;
}
