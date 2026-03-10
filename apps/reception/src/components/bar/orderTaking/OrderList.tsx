// src/components/bar/orderTaking/OrderList.tsx

import React, { type FC, useCallback, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system";
import { Cluster } from "@acme/design-system/primitives";

import { type AggregatedOrder } from "../../../types/bar/BarTypes";

import PayModal from "./modal/PayModal";

interface OrderListProps {
  orders: AggregatedOrder[];
  onRemoveItem: (product: string) => void;
  onClearAll: () => void;
  onConfirmPayment: (
    paymentMethod: "cash" | "card",
    bleepUsage: "bleep" | "go"
  ) => void;
}

/**
 * OrderList
 * – Sticky header keeps column labels visible while scrolling
 * – Animated row removal feedback (opacity + scale)
 * – Empty-state hint when no items are present
 * – Bottom “action bar” with gradient backdrop to separate it
 */
const OrderList: FC<OrderListProps> = React.memo(
  ({ orders, onRemoveItem, onClearAll, onConfirmPayment }) => {
    const [showPayModal, setShowPayModal] = useState(false);

    /* ----------------------------- helpers ------------------------------ */
    const makeRowHandler = useCallback(
      (product: string) => () => onRemoveItem(product),
      [onRemoveItem]
    );

    const handleConfirm = useCallback(
      (method: "cash" | "card", usage: "bleep" | "go") => {
        onConfirmPayment(method, usage);
        setShowPayModal(false);
      },
      [onConfirmPayment]
    );

    /* ------------------------------ render ------------------------------ */
    return (
      <>
        <section className="flex h-full flex-col overflow-hidden rounded-lg shadow-inner">
          {/* ─────── List / table ─────── */}
          {orders.length ? (
            <Table className="w-full flex-1 border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-10 bg-primary-main/95 backdrop-blur-md">
                <TableRow className="text-sm font-semibold uppercase tracking-wider text-primary-fg">
                  <TableHead className="px-4 py-2 text-start">Product</TableHead>
                  <TableHead className="px-4 py-2 text-end">Total&nbsp;€</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-1">
                {orders.map((o) => (
                  <TableRow
                    key={o.product}
                    onClick={makeRowHandler(o.product)}
                    className="group cursor-pointer bg-surface hover:bg-primary-soft motion-safe:transition-colors"
                  >
                    <TableCell className="whitespace-pre-wrap px-4 py-2">
                      {o.count > 1 ? `${o.count}× ${o.product}` : o.product}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-end font-medium tabular-nums">
                      {(o.count * o.price).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Cluster
              asChild
              justify="center"
              wrap={false}
              className="flex-1 px-6 text-center text-sm text-muted-foreground"
            >
              <p>No items yet&nbsp;– tap a product to add it</p>
            </Cluster>
          )}

          {/* ─────── Action buttons ─────── */}
          <div className="space-y-2 border-t border-border-2 bg-surface-2 p-4">
            <button
              type="button"
              disabled={!orders.length}
              onClick={() => setShowPayModal(true)}
              className="w-full min-h-14 rounded-lg bg-primary-main/100 px-4 py-3 text-lg font-bold text-primary-fg/100 transition-all duration-150 hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Pay
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="w-full min-h-10 rounded-lg border-2 border-danger/100 px-4 py-2 text-sm font-semibold text-danger/100 transition-all duration-150 hover:bg-danger/10 active:scale-95"
            >
              Clear All
            </button>
          </div>
        </section>

        {/* ─────── Modal – Pay ─────── */}
        {showPayModal && (
          <PayModal
            onConfirm={handleConfirm}
            onCancel={() => setShowPayModal(false)}
          />
        )}
      </>
    );
  }
);

OrderList.displayName = "OrderList";
export default OrderList;
