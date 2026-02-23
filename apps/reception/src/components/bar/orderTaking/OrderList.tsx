// src/components/bar/orderTaking/OrderList.tsx

import React, { type FC, useCallback, useState } from "react";

import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

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
        <section className="flex h-full flex-col overflow-hidden rounded-lg shadow-inner dark:bg-darkSurface dark:text-darkAccentGreen">
          {/* ─────── List / table ─────── */}
          {orders.length ? (
            <Table className="w-full flex-1 border-separate border-spacing-0">
              <TableHeader className="sticky top-0 z-10 bg-primary-main/95 backdrop-blur-md dark:bg-darkAccentGreen dark:text-darkBg">
                <TableRow className="text-sm font-semibold uppercase tracking-wider text-white">
                  <TableHead className="px-4 py-2 text-start">Product</TableHead>
                  <TableHead className="px-4 py-2 text-end">Total&nbsp;€</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-stone-200 dark:divide-darkBg">
                {orders.map((o) => (
                  <TableRow
                    key={o.product}
                    onClick={makeRowHandler(o.product)}
                    className="group cursor-pointer bg-white hover:bg-info-main/10 motion-safe:transition-colors dark:bg-darkSurface"
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
            <p className="flex flex-1 items-center justify-center px-6 text-center text-sm text-stone-400">
              No items yet&nbsp;– tap a product to add it
            </p>
          )}

          {/* ─────── Action buttons ─────── */}
          <div className="space-y-3 bg-gradient-to-t from-stone-50 via-white/90 to-transparent p-4 dark:from-darkBg dark:via-darkSurface">
            <Button
              type="button"
              disabled={!orders.length}
              onClick={() => setShowPayModal(true)}
              className={[
                "w-full rounded-lg py-2 text-center text-sm font-semibold shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-light",
                !orders.length
                  ? "cursor-not-allowed bg-stone-300 text-stone-600 dark:bg-darkSurface"
                  : "bg-success-main text-success-foreground hover:bg-success-hover active:scale-97 motion-safe:transition-transform dark:bg-darkAccentGreen dark:text-darkBg",
              ].join(" ")}
            >
              Pay
            </Button>

            <Button
              type="button"
              onClick={onClearAll}
              className="w-full rounded-lg bg-destructive-main py-2 text-sm font-semibold text-destructive-foreground shadow hover:bg-destructive-hover active:scale-97 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-destructive-main motion-safe:transition-transform dark:bg-darkAccentOrange dark:text-darkBg"
            >
              Clear&nbsp;All
            </Button>
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
