"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { InventoryEditor } from "../inventory/InventoryEditor.client";
import { InventoryImport } from "../inventory/InventoryImport.client";
import { InventoryMatrix } from "../inventory/InventoryMatrix.client";
import { StockAdjustments } from "../inventory/StockAdjustments.client";
import { StockInflows } from "../inventory/StockInflows.client";
import { StockLedger } from "../inventory/StockLedger.client";
import { ProductsView } from "../products/ProductsView.client";

import { ShopSelector } from "./ShopSelector.client";
import { useInventoryConsole } from "./useInventoryConsole.client";

type InventoryConsoleProps = {
  onHeaderExtra?: (node: ReactNode) => void;
};

type TopView = "inventory" | "products";
type RightPanelTab = "editor" | "ledger" | "adjustments" | "inflows";

const TOP_VIEW_LABELS: Record<TopView, string> = {
  inventory: "Inventory",
  products: "Products",
};

const TAB_LABELS: Record<RightPanelTab, string> = {
  editor: "Variant Editor",
  ledger: "Stock Ledger",
  adjustments: "Adjustments",
  inflows: "Receive Stock",
};

/**
 * Root console component. Top-level view switch:
 * - "Inventory": Split-pane layout with left panel (InventoryMatrix + InventoryImport)
 *   and right panel tabs (InventoryEditor, StockLedger, StockAdjustments, StockInflows)
 * - "Products": Full-width ProductsView for product catalogue management
 */
export default function InventoryConsole({ onHeaderExtra }: InventoryConsoleProps) {
  const state = useInventoryConsole();
  const [matrixRefreshKey, setMatrixRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<RightPanelTab>("editor");
  const [activeView, setActiveView] = useState<TopView>("inventory");

  useEffect(() => {
    onHeaderExtra?.(
      <ShopSelector
        selectedShop={state.selectedShop}
        onSelect={state.setSelectedShop}
      />,
    );
  }, [onHeaderExtra, state.selectedShop, state.setSelectedShop]);

  function handleSaved() {
    setMatrixRefreshKey((k) => k + 1);
  }

  return (
    <div className="space-y-4">
      {/* Top-level view switcher */}
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- INV-0001 operator-tool tab bar */}
      <div className="flex gap-1 border-b border-gate-border pb-1">
        {(Object.keys(TOP_VIEW_LABELS) as TopView[]).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setActiveView(view)}
            className={`rounded-t px-3 py-1.5 text-xs font-semibold transition ${
              activeView === view
                ? "bg-gate-accent/10 text-gate-accent"
                : "text-gate-muted hover:text-gate-ink"
            }`}
          >
            {TOP_VIEW_LABELS[view]}
          </button>
        ))}
      </div>

      {/* Products view */}
      {activeView === "products" && (
        <div className="rounded-xl border border-gate-border bg-gate-surface p-4 shadow-elevation-2">
          <ProductsView shop={state.selectedShop ?? ""} />
        </div>
      )}

      {/* Inventory split-pane */}
      {activeView === "inventory" && (
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
              {(Object.keys(TAB_LABELS) as RightPanelTab[]).map((tab) => (
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
              {activeTab === "adjustments" && (
                <StockAdjustments shop={state.selectedShop ?? ""} onSaved={handleSaved} />
              )}
              {activeTab === "inflows" && (
                <StockInflows shop={state.selectedShop ?? ""} onSaved={handleSaved} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
