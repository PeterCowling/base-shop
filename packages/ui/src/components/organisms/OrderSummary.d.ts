import type { CartLine } from "@acme/types/Cart";
import React from "react";
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
declare function OrderSummary({ cart: cartProp, totals }: Props): import("react/jsx-runtime").JSX.Element;
declare const _default: React.MemoExoticComponent<typeof OrderSummary>;
export default _default;
//# sourceMappingURL=OrderSummary.d.ts.map