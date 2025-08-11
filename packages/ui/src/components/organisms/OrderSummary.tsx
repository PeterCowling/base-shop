// packages/ui/components/organisms/OrderSummary.tsx
"use client";

import { useCart } from "@ui/hooks/useCart";
import type { CartLine } from "@/lib/cartCookie";
import { Price } from "../atoms/Price";
import React, { useMemo } from "react";

type Totals = {
  subtotal: number;
  deposit: number;
  total: number;
};

type Props = {
  /** Optional cart data received from the server */
  cart?: Record<string, CartLine>;
  /** Pre-computed totals validated on the server */
  totals?: Totals;
};

/**
 * Displays a breakdown of the current cart: line items, subtotal,
 * deposit, and total. When `cart` and `totals` are provided, those
 * server-validated values are rendered. Otherwise the component falls
 * back to the client-side cart context.
 */
function OrderSummary({ cart: cartProp, totals }: Props) {
  /* ------------------------------------------------------------------
   * Cart context (used as a fallback when server data isn't provided)
   * ------------------------------------------------------------------ */
  const [cartCtx] = useCart() as [Record<string, CartLine>, unknown];
  const cart = cartProp ?? cartCtx;

  /* ------------------------------------------------------------------
   * Derived values
   * ------------------------------------------------------------------ */
  const lines = useMemo<(CartLine & { id: string })[]>(
    () => Object.entries(cart).map(([id, line]) => ({ id, ...line })),
    [cart]
  );

  // When totals aren't provided, compute them from the cart lines.
  const computedSubtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.sku.price * line.qty, 0),
    [lines]
  );

  const computedDeposit = useMemo(
    () =>
      lines.reduce((sum, line) => sum + (line.sku.deposit ?? 0) * line.qty, 0),
    [lines]
  );

  const subtotal = totals?.subtotal ?? computedSubtotal;
  const deposit = totals?.deposit ?? computedDeposit;
  const total = totals?.total ?? subtotal + deposit;

  /* ------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------ */
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="py-2">Item</th>
          <th>Qty</th>
          <th className="text-right">Price</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id} className="border-b last:border-0">
            <td className="py-2">
              {line.sku.title}
              {line.size && (
                <span className="ml-1 text-xs text-muted">
                  ({line.size})
                </span>
              )}
            </td>
            <td>{line.qty}</td>
            <td className="text-right">
              <Price amount={line.sku.price * line.qty} />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td />
          <td className="py-2">Deposit</td>
          <td className="text-right">
            <Price amount={deposit} />
          </td>
        </tr>
        <tr>
          <td />
          <td className="py-2 font-semibold">Total</td>
          <td className="text-right font-semibold">
            <Price amount={total} />
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

export default React.memo(OrderSummary);
