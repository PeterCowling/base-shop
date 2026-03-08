"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { InventoryImport } from "../inventory/InventoryImport.client";
import { InventoryMatrix } from "../inventory/InventoryMatrix.client";

import { ShopSelector } from "./ShopSelector.client";
import { useInventoryConsole } from "./useInventoryConsole.client";

type InventoryConsoleProps = {
  onHeaderExtra?: (node: ReactNode) => void;
};

/**
 * Root console component. Split-pane layout with:
 * - Left panel: inventory matrix (TASK-06) + import panel (TASK-14)
 * - Right panel: variant editor (TASK-13 mounts InventoryEditor here)
 * - Ledger tab slot (TASK-10 mounts stock-movement ledger here)
 */
export default function InventoryConsole({ onHeaderExtra }: InventoryConsoleProps) {
  const state = useInventoryConsole();
  const [matrixRefreshKey, setMatrixRefreshKey] = useState(0);

  // Stable callback reference to avoid remounting header extra on every render
  const renderHeaderExtra = useCallback(() => {
    onHeaderExtra?.(
      <ShopSelector
        selectedShop={state.selectedShop}
        onSelect={state.setSelectedShop}
      />,
    );
  }, [onHeaderExtra, state.selectedShop, state.setSelectedShop]);

  useEffect(() => {
    renderHeaderExtra();
  }, [renderHeaderExtra]);

  return (
    // eslint-disable-next-line ds/no-arbitrary-tailwind -- INV-0001 operator-tool layout
    <div className="grid gap-6 sm:grid-cols-[320px_1fr]">
      {/* Left panel — inventory list + import */}
      <aside className="rounded-xl border border-gate-border bg-gate-surface p-4 shadow-elevation-2">
        <InventoryMatrix
          shop={state.selectedShop}
          selectedSku={state.selectedSku}
          onSelectSku={state.setSelectedSku}
          refreshKey={matrixRefreshKey}
        />

        <InventoryImport
          shop={state.selectedShop}
          onImportComplete={() => {
            state.setSelectedSku(null);
            setMatrixRefreshKey((k) => k + 1);
          }}
        />

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
