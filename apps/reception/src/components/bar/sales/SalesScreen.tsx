/* File: src/components/bar/sales/SalesScreen.tsx */
import React, { type FC, useCallback, useMemo, useState } from "react";
import { ref, remove, set } from "firebase/database";

import { Button } from "@acme/design-system/atoms";
import { Stack } from "@acme/design-system/primitives";

import { useSalesOrders } from "../../../hooks/data/bar/useSalesOrders";
import { useBleeperMutations } from "../../../hooks/mutations/useBleeperMutations";
import { useOrderActions } from "../../../hooks/orchestrations/bar/actions/mutations/useOrderActions";
import { useFirebaseDatabase } from "../../../services/useFirebase";
import { type SalesOrder } from "../../../types/bar/BarTypes";

import TicketList from "./TicketList";

/** Converts "HH:mm" ➜ minutes since 00‑00 for easy sorting */
const parseTimeString = (time: string): number =>
  time
    .split(":")
    .reduce((acc, v, i) => acc + Number(v) * (i === 0 ? 60 : 1), 0);

const FILTER_BUTTONS = ["ALL", "BDS", "KDS"] as const;

/** Screen that shows all confirmed orders (BDS / KDS filters) */
const SalesScreen: FC = React.memo(() => {
  /* ----- Data ----- */
  const { orders, loading } = useSalesOrders();
  const { removeItems, removeSingleItem } = useOrderActions();
  const { setBleeperAvailability } = useBleeperMutations();
  const database = useFirebaseDatabase();

  /* ----- UI state ----- */
  const [lastRemovedOrder, setLastRemovedOrder] = useState<SalesOrder | null>(
    null
  );
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "BDS" | "KDS">(
    "ALL"
  );

  /* ----- Derived orders ----- */
  const filteredOrders = useMemo<SalesOrder[]>(() => {
    const withFilter =
      selectedFilter === "ALL"
        ? orders
        : (orders
            .map((o) => {
              const items = o.items.filter(
                (it) => it.lineType === selectedFilter.toLowerCase()
              );
              return items.length ? { ...o, items } : null;
            })
            .filter(Boolean) as SalesOrder[]);

    return [...withFilter].sort(
      (a, b) => parseTimeString(a.time) - parseTimeString(b.time)
    );
  }, [orders, selectedFilter]);

  /** Frees the bleeper slot if the whole order was removed. */
  const freeBleeper = useCallback(
    (order: SalesOrder) => {
      if (order.bleepNumber !== "go") {
        const num = Number(order.bleepNumber);
        if (!Number.isNaN(num)) setBleeperAvailability(num, true);
      }
    },
    [setBleeperAvailability]
  );

  /** Removes items & frees bleeper if whole order disappears */
  const handleRemoveItems = useCallback(
    (order: SalesOrder, filterVal: "ALL" | "BDS" | "KDS") => {
      removeItems(order, filterVal).then((removedEntireOrder) => {
        if (!removedEntireOrder) return;
        setLastRemovedOrder(order);
        freeBleeper(order);
      });
    },
    [removeItems, freeBleeper]
  );

  /** Removes a single line; same bleeper logic if order is emptied */
  const handleRemoveSingleItem = useCallback(
    (order: SalesOrder, i: number) => {
      removeSingleItem(order, i).then((removedEntireOrder) => {
        if (!removedEntireOrder) return;
        setLastRemovedOrder(order);
        freeBleeper(order);
      });
    },
    [removeSingleItem, freeBleeper]
  );

  const handleRecallLastOrder = useCallback(() => {
    if (!database || !lastRemovedOrder) return;
    const { orderKey } = lastRemovedOrder;
    const salesRef = ref(database, `barOrders/sales/${orderKey}`);
    const completedRef = ref(database, `barOrders/completed/${orderKey}`);

    set(salesRef, lastRemovedOrder)
      .then(() => remove(completedRef))
      .then(() => setLastRemovedOrder(null))
      .catch((e) => console.error("Error recalling order", e));
  }, [database, lastRemovedOrder]);

  /* ----- Render ----- */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-medium text-muted-foreground">Loading orders…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-surface-2 font-body">
      {/* --- Top control bar --- */}
      <div className="sticky top-0 z-10 flex items-center justify-end gap-2 bg-primary-main/95 px-4 py-2 backdrop-blur-md shadow-lg">
        <Button
          onClick={handleRecallLastOrder}
          disabled={!lastRemovedOrder}
          compatibilityMode="passthrough"
          className="min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors bg-surface-3 text-primary-fg hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Recall
        </Button>
        {FILTER_BUTTONS.map((btn) => {
          const isActive = selectedFilter === btn;
          return (
            <Button
              key={btn}
              onClick={() => setSelectedFilter(btn)}
              compatibilityMode="passthrough"
              aria-pressed={isActive}
              className={
                "min-h-11 rounded-lg px-3 py-2 text-sm font-semibold transition-colors " +
                (isActive
                  ? "bg-surface-2 text-primary-main shadow-sm"
                  : "border border-border-1 text-primary-fg hover:bg-surface-3/50")
              }
            >
              {btn}
            </Button>
          );
        })}
      </div>

      {/* --- Tickets --- */}
      <main className="mx-auto max-w-7xl p-4">
        {filteredOrders.length ? (
          <TicketList
            orders={filteredOrders}
            filter={selectedFilter}
            removeItems={handleRemoveItems}
            removeSingleItem={handleRemoveSingleItem}
          />
        ) : (
          <Stack align="center" gap={0} className="h-60vh justify-center">
            <p className="text-4xl font-semibold text-muted-foreground text-shadow-sm">
              No orders
            </p>
          </Stack>
        )}
      </main>
    </div>
  );
});
SalesScreen.displayName = "SalesScreen";
export default SalesScreen;
