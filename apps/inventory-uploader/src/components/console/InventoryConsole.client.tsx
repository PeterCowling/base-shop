"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { InventoryEditor } from "../inventory/InventoryEditor.client";
import { InventoryImport } from "../inventory/InventoryImport.client";
import { InventoryMatrix } from "../inventory/InventoryMatrix.client";
import { StockLedger } from "../inventory/StockLedger.client";

import { ShopSelector } from "./ShopSelector.client";
import { useInventoryConsole } from "./useInventoryConsole.client";

type InventoryConsoleProps = {
  onHeaderExtra?: (node: ReactNode) => void;
};

type RightPanelTab = "editor" | "ledger";

/**
 * Root console component. Split-pane layout with:
 * - Left panel: InventoryMatrix (TASK-06) + InventoryImport (TASK-14)
 * - Right panel: InventoryEditor (TASK-13) + StockLedger tab (TASK-10)
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

      {/* Right panel — tabs: editor and ledger */}
      <div className="space-y-4">
        {/* Tab bar */}
        {/* eslint-disable-next-line ds/enforce-layout-primitives -- INV-0001 operator-tool tab bar */}
        <div className="flex gap-1 border-b border-gate-border pb-1">
          {(["editor", "ledger"] as RightPanelTab[]).map((tab) => (
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
              {tab === "editor" ? "Variant Editor" : "Stock Ledger"}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="rounded-xl border border-gate-border bg-gate-surface p-4 shadow-elevation-2">
          {activeTab === "editor" && (
            <InventoryEditor
              shop={state.selectedShop}
              sku={state.selectedSku}
              onSaved={() => setMatrixRefreshKey((k) => k + 1)}
            />
          )}
          {activeTab === "ledger" && (
            <StockLedger shop={state.selectedShop} />
          )}
        </div>
      </div>
    </div>
  );
}
