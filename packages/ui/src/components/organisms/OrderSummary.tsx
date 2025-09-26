// packages/ui/components/organisms/OrderSummary.tsx
"use client";

import { useCart } from "../../hooks/useCart";
import type { CartLine } from "@acme/types/Cart";
import { Price } from "../atoms/Price";
import React, { useMemo } from "react";

type Totals = {
  subtotal: number;
  deposit: number;
  /** Tax amount applied to the order */
  tax?: number;
  /** Discount amount applied to the order */
  discount?: number;
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
  const computedTotals = useMemo(
    () =>
      lines.reduce(
        (sum, line) => {
          sum.subtotal += line.sku.price * line.qty;
          sum.deposit += (line.sku.deposit ?? 0) * line.qty;
          return sum;
        },
        { subtotal: 0, deposit: 0 }
      ),
    [lines]
  );

  const subtotal = totals?.subtotal ?? computedTotals.subtotal;
  const deposit = totals?.deposit ?? computedTotals.deposit;
  const tax = totals?.tax ?? 0;
  const discount = totals?.discount ?? 0;
  const total = totals?.total ?? subtotal + deposit + tax - discount;

  /* ------------------------------------------------------------------
   * Render
   * ------------------------------------------------------------------ */
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-start">
          <th className="py-2">Item</th>
          <th>Qty</th>
          <th className="text-end">Price</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line) => (
          <tr key={line.id} className="border-b last:border-0">
            <td className="py-2">
              {line.sku.title}
              {line.size && (
                <span className="ms-1 text-xs text-muted">
                  ({line.size})
                </span>
              )}
            </td>
            <td>{line.qty}</td>
            <td className="text-end">
              <Price amount={line.sku.price * line.qty} />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td />
          <td className="py-2">Subtotal</td>
          <td className="text-end">
            <Price amount={subtotal} />
          </td>
        </tr>
        <tr>
          <td />
          <td className="py-2">Deposit</td>
          <td className="text-end">
            <Price amount={deposit} />
          </td>
        </tr>
        {totals?.tax !== undefined && (
          <tr>
            <td />
            <td className="py-2">Tax</td>
            <td className="text-end">
              <Price amount={tax} />
            </td>
          </tr>
        )}
        {totals?.discount !== undefined && (
          <tr>
            <td />
            <td className="py-2">Discount</td>
            <td className="text-end">
              <Price amount={-discount} />
            </td>
          </tr>
        )}
        <tr>
          <td />
          <td className="py-2 font-semibold">Total</td>
          <td className="text-end font-semibold">
            <Price amount={total} />
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

export default React.memo(OrderSummary);
