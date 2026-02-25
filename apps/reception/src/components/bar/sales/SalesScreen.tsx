/* File: src/components/bar/sales/SalesScreen.tsx */
import React, { type FC, useCallback, useMemo, useState } from "react";
import { ref, remove, set } from "firebase/database";

import { Button } from "@acme/design-system/atoms";

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

  const filterButtons = useMemo(() => ["ALL", "BDS", "KDS"] as const, []);

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

  /* ----- Handlers ----- */
  const handleFilterChange = useCallback(
    (filter: "ALL" | "BDS" | "KDS") => setSelectedFilter(filter),
    []
  );

  /** Removes items & frees bleeper if whole order disappears */
  const handleRemoveItems = useCallback(
    (order: SalesOrder, filterVal: "ALL" | "BDS" | "KDS") => {
      removeItems(order, filterVal).then((removedEntireOrder) => {
        if (!removedEntireOrder) return;
        setLastRemovedOrder(order);
        if (order.bleepNumber !== "go") {
          const num = Number(order.bleepNumber);
          if (!Number.isNaN(num)) setBleeperAvailability(num, true);
        }
      });
    },
    [removeItems, setBleeperAvailability]
  );

  /** Removes a single line; same bleeper logic if order is emptied */
  const handleRemoveSingleItem = useCallback(
    (order: SalesOrder, i: number) => {
      removeSingleItem(order, i).then((removedEntireOrder) => {
        if (!removedEntireOrder) return;
        setLastRemovedOrder(order);
        if (order.bleepNumber !== "go") {
          const num = Number(order.bleepNumber);
          if (!Number.isNaN(num)) setBleeperAvailability(num, true);
        }
      });
    },
    [removeSingleItem, setBleeperAvailability]
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
    <div className="min-h-screen bg-gradient-to-b from-surface-2 via-surface-3 to-surface-3 font-body">
      {/* --- Top control bar --- */}
      <div className="sticky top-0 z-10 flex items-center justify-end gap-2 bg-surface/60 px-4 py-2 backdrop-blur shadow-md">
        <Button
          onClick={handleRecallLastOrder}
          disabled={!lastRemovedOrder}
          compatibilityMode="passthrough"
          className="min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors bg-primary-main text-primary-fg hover:bg-primary-main/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Recall
        </Button>
        {filterButtons.map((btn) => {
          const isActive = selectedFilter === btn;
          return (
            <Button
              key={btn}
              onClick={() => handleFilterChange(btn)}
              compatibilityMode="passthrough"
              aria-pressed={isActive}
              className={
                "min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                (isActive
                  ? "bg-primary-main text-primary-fg ring-2 ring-primary-main ring-offset-1 ring-offset-surface"
                  : "bg-surface-2 text-foreground hover:bg-surface-3")
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
          <div className="flex h-60vh flex-col items-center justify-center">
            <p className="text-4xl font-semibold text-foreground/70 text-shadow-sm">
              No orders
            </p>
          </div>
        )}
      </main>
    </div>
  );
});
SalesScreen.displayName = "SalesScreen";
export default SalesScreen;
