"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

import { ShopSelector } from "./ShopSelector.client";
import { useInventoryConsole } from "./useInventoryConsole.client";

type InventoryConsoleProps = {
  onHeaderExtra?: (node: ReactNode) => void;
};

/**
 * Root console component. Split-pane layout with:
 * - Left panel: inventory matrix (TASK-06 mounts InventoryMatrix here)
 * - Right panel: variant editor (TASK-13 mounts InventoryEditor here)
 * - Import panel slot (TASK-14 mounts import UI here)
 * - Ledger tab slot (TASK-10 mounts stock-movement ledger here)
 */
export default function InventoryConsole({ onHeaderExtra }: InventoryConsoleProps) {
  const state = useInventoryConsole();

  useEffect(() => {
    if (!onHeaderExtra) return;
    onHeaderExtra(
      <ShopSelector
        selectedShop={state.selectedShop}
        onSelect={state.setSelectedShop}
      />,
    );
    // Re-render header extra when selectedShop changes so the select reflects current value
  }, [onHeaderExtra, state.selectedShop, state.setSelectedShop]);

  return (
    // eslint-disable-next-line ds/no-arbitrary-tailwind -- INV-0001 operator-tool layout
    <div className="grid gap-6 sm:grid-cols-[320px_1fr]">
      {/* Left panel — inventory list (TASK-06: mount InventoryMatrix here) */}
      <aside className="rounded-xl border border-gate-border bg-gate-surface p-4 shadow-elevation-2">
        {/* TASK-06: <InventoryMatrix state={state} /> */}
        <p className="text-sm text-gate-muted">
          {state.selectedShop
            ? `Shop: ${state.selectedShop}`
            : "Select a shop to view inventory."}
        </p>

        {/* Import panel slot — TASK-14 mounts import UI here */}
        <div data-slot="import-panel" />

        {/* Ledger tab slot — TASK-10 mounts stock-movement ledger tab here */}
        <div data-slot="ledger-tab" />
      </aside>

      {/* Right panel — variant editor (TASK-13: mount InventoryEditor here) */}
      <div className="space-y-6">
        {/* TASK-13: <InventoryEditor state={state} /> */}
        <p className="text-sm text-gate-muted">
          {state.selectedSku
            ? `SKU: ${state.selectedSku}`
            : "Select a SKU to view variants."}
        </p>
      </div>
    </div>
  );
}
