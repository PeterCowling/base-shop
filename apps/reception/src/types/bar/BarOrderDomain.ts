/**
 * Shared bar-order domain types for the in-progress (unconfirmed) order shape.
 *
 * NOTE: `BarOrder` here represents the *unconfirmed* order being built at the
 * bar terminal. It is distinct from the `BarOrder` alias in `BarTypes.ts`
 * (which aliases `UnconfirmedSalesOrder`) and from `SalesOrder` / `SalesOrderItem`
 * (the confirmed/persisted shapes). Use this file for mutation-hook typings that
 * operate on `/barOrders/unconfirmed`.
 */

export interface BarOrderItem {
  product: string;
  price: number;
  count: number;
  lineType?: "bds" | "kds";
}

export interface BarOrder {
  confirmed: boolean;
  items: BarOrderItem[];
}
