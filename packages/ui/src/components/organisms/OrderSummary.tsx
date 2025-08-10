// packages/ui/components/organisms/OrderSummary.tsx
"use client";

import { useCart } from "@ui/hooks/useCart";
import type { CartLine } from "@types";
import React, { useMemo } from "react";

/**
 * Displays a breakdown of the current cart: line items, subtotal,
 * deposit, and total. Totals are memoised so they’re only recalculated
 * when the cart changes.
 */
function OrderSummary() {
  /* ------------------------------------------------------------------
   * Cart context
   * ------------------------------------------------------------------ */
  const [cart] = useCart() as [Record<string, CartLine>, unknown];

  /* ------------------------------------------------------------------
   * Derived values
   * ------------------------------------------------------------------ */
  const lines = useMemo<CartLine[]>(() => Object.values(cart), [cart]);

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.sku.price * line.qty, 0),
    [lines]
  );

  const deposit = useMemo(
    () =>
      lines.reduce((sum, line) => sum + (line.sku.deposit ?? 0) * line.qty, 0),
    [lines]
  );

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
          <tr key={line.sku.id} className="border-b last:border-0">
            <td className="py-2">
              {line.sku.title}
              {line.size && (
                <span className="ml-1 text-xs text-muted">
                  ({line.size})
                </span>
              )}
            </td>
            <td>{line.qty}</td>
            <td className="text-right">€{line.sku.price * line.qty}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td />
          <td className="py-2">Deposit</td>
          <td className="text-right">€{deposit}</td>
        </tr>
        <tr>
          <td />
          <td className="py-2 font-semibold">Total</td>
          <td className="text-right font-semibold">€{subtotal + deposit}</td>
        </tr>
      </tfoot>
    </table>
  );
}

export default React.memo(OrderSummary);
