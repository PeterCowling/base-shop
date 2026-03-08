"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { InventoryEditor } from "../inventory/InventoryEditor.client";
import { InventoryImport } from "../inventory/InventoryImport.client";
import { InventoryMatrix } from "../inventory/InventoryMatrix.client";
import { StockAdjustments } from "../inventory/StockAdjustments.client";
import { StockInflows } from "../inventory/StockInflows.client";
import { StockLedger } from "../inventory/StockLedger.client";

import { ShopSelector } from "./ShopSelector.client";
import { useInventoryConsole } from "./useInventoryConsole.client";

type InventoryConsoleProps = {
  onHeaderExtra?: (node: ReactNode) => void;
};

type RightPanelTab = "editor" | "ledger" | "adjustments" | "inflows";

const TAB_LABELS: Record<RightPanelTab, string> = {
  editor: "Variant Editor",
  ledger: "Stock Ledger",
  adjustments: "Adjustments",
  inflows: "Receive Stock",
};

/**
 * Root console component. Split-pane layout with:
 * - Left panel: InventoryMatrix (TASK-06) + InventoryImport (TASK-14)
 * - Right panel: tabs — InventoryEditor (TASK-13), StockLedger (TASK-10),
 *                StockAdjustments (TASK-16), StockInflows (TASK-17)
 */
export default function InventoryConsole({ onHeaderExtra }: InventoryConsoleProps) {
  const state = useInventoryConsole();
  const [matrixRefreshKey, setMatrixRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<RightPanelTab>("editor");

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

  function handleSaved() {
    setMatrixRefreshKey((k) => k + 1);
  }

  return (
    // eslint-disable-next-line ds/no-arbitrary-tailwind -- INV-0001 operator-tool layout
    <div className="grid gap-6 sm:grid-cols-[320px_1fr]">
      {/* Left panel — inventory list + import */}
      <aside className="rounded-xl border border-gate-border bg-gate-surface p-4 shadow-elevation-2">
        <InventoryMatrix
          shop={state.selectedShop}
          selectedSku={state.selectedSku}
          onSelectSku={(sku) => {
            state.setSelectedSku(sku);
            if (sku) setActiveTab("editor");
          }}
          onAdjust={() => setActiveTab("adjustments")}
          onInflow={() => setActiveTab("inflows")}
          refreshKey={matrixRefreshKey}
        />

        <InventoryImport
          shop={state.selectedShop}
          onImportComplete={() => {
            state.setSelectedSku(null);
            setMatrixRefreshKey((k) => k + 1);
          }}
        />
      </aside>

      {/* Right panel — tabs */}
      <div className="space-y-4">
        {/* Tab bar */}
        {/* eslint-disable-next-line ds/enforce-layout-primitives -- INV-0001 operator-tool tab bar */}
        <div className="flex gap-1 border-b border-gate-border pb-1">
          {(["editor", "ledger", "adjustments", "inflows"] as RightPanelTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
               
              className={`rounded-t px-3 py-1 text-xs font-medium transition ${
                activeTab === tab
                  ? "bg-gate-accent/10 text-gate-accent"
                  : "text-gate-muted hover:text-gate-ink"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="rounded-xl border border-gate-border bg-gate-surface p-4 shadow-elevation-2">
          {activeTab === "editor" && (
            <InventoryEditor
              shop={state.selectedShop}
              sku={state.selectedSku}
              onSaved={handleSaved}
            />
          )}
          {activeTab === "ledger" && <StockLedger shop={state.selectedShop} />}
          {activeTab === "adjustments" && state.selectedShop && (
            <StockAdjustments shop={state.selectedShop} onSaved={handleSaved} />
          )}
          {activeTab === "adjustments" && !state.selectedShop && (
            <p className="text-sm text-gate-muted">Select a shop to record adjustments.</p>
          )}
          {activeTab === "inflows" && state.selectedShop && (
            <StockInflows shop={state.selectedShop} onSaved={handleSaved} />
          )}
          {activeTab === "inflows" && !state.selectedShop && (
            <p className="text-sm text-gate-muted">Select a shop to receive stock.</p>
          )}
        </div>
      </div>
    </div>
  );
}
