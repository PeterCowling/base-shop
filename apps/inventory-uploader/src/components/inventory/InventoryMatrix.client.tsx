/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { type InventoryItem, variantLabel } from "../../lib/inventory-utils";

type SortKey = "sku" | "quantity";

type InventoryMatrixProps = {
  shop: string | null;
  selectedSku: string | null;
  onSelectSku: (sku: string | null) => void;
  onAdjust?: () => void;
  onInflow?: () => void;
  refreshKey?: number;
};

export function InventoryMatrix({ shop, selectedSku, onSelectSku, onAdjust, onInflow, refreshKey = 0 }: InventoryMatrixProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("sku");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    if (!shop) {
      setItems([]);
      return;
    }
    // refreshKey dependency forces re-fetch after import
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/inventory/${encodeURIComponent(shop)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: unknown) => {
        const list =
          data && typeof data === "object" && "items" in data && Array.isArray((data as { items: unknown }).items)
            ? ((data as { items: InventoryItem[] }).items)
            : [];
        setItems(list);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load inventory.");
      })
      .finally(() => {
        setLoading(false);
      });
    return () => controller.abort();
  }, [shop, refreshKey]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }, [sortKey]);

  const sorted = useMemo(() => [...items].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "sku") cmp = a.sku.localeCompare(b.sku);
    else if (sortKey === "quantity") cmp = a.quantity - b.quantity;
    return sortAsc ? cmp : -cmp;
  }), [items, sortKey, sortAsc]);

  if (!shop) {
    return (
      <p className="text-sm text-gate-muted">Select a shop to view inventory.</p>
    );
  }

  if (loading) {
    return (
      <p className="text-sm text-gate-muted">Loading inventory…</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-danger-fg" role="alert">{error}</p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gate-muted">No inventory found. Import a CSV to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Sort controls */}
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- INV-0001 operator-tool sort row has text+buttons; not a pure layout context */}
      <div className="flex items-center gap-2 text-2xs text-gate-muted">
        Sort:
        {(["sku", "quantity"] as SortKey[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => handleSort(k)}

            className={`rounded px-1.5 py-0.5 transition ${sortKey === k ? "bg-gate-accent/10 text-gate-accent" : "hover:text-gate-ink"}`}
          >
            {k}{sortKey === k ? (sortAsc ? " ↑" : " ↓") : ""}
          </button>
        ))}
      </div>

      {/* Item list */}
      <ul className="divide-y divide-gate-border">
        {sorted.map((item) => {
          const vLabel = variantLabel(item.variantAttributes);
          const vk = `${item.sku}#${vLabel}`;
          const isLowStock =
            typeof item.lowStockThreshold === "number" &&
            item.quantity <= item.lowStockThreshold;
          const isSelected = selectedSku === item.sku;

          return (
            <li key={vk}>
              <button
                type="button"
                onClick={() => onSelectSku(isSelected ? null : item.sku)}

                className={`w-full px-2 py-1.5 text-left transition ${isSelected ? "bg-gate-accent/10" : "hover:bg-gate-surface"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-gate-ink truncate">{item.sku}</span>
                  <span
                    className={`shrink-0 text-xs font-mono ${isLowStock ? "text-danger-fg font-semibold" : "text-gate-muted"}`}
                    title={isLowStock ? `Low stock (threshold: ${item.lowStockThreshold})` : undefined}
                  >
                    {item.quantity}
                    {isLowStock ? " ⚠" : ""}
                  </span>
                </div>
                {vLabel && (
                  <p className="text-2xs text-gate-muted truncate">{vLabel}</p>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Stock action buttons */}
      {(onAdjust ?? onInflow) && (
        // eslint-disable-next-line ds/enforce-layout-primitives -- INV-0001 operator-tool stock action row
        <div className="flex gap-1.5 pt-2 border-t border-gate-border">
          {onAdjust && (
            <button
              type="button"
              onClick={onAdjust}

              className="flex-1 rounded py-1 text-xs text-gate-muted focus-visible:ring-1 focus-visible:ring-gate-border hover:text-gate-ink focus-visible:hover:ring-gate-accent"
            >
              Adjust stock
            </button>
          )}
          {onInflow && (
            <button
              type="button"
              onClick={onInflow}

              className="flex-1 rounded py-1 text-xs text-gate-muted focus-visible:ring-1 focus-visible:ring-gate-border hover:text-gate-ink focus-visible:hover:ring-gate-accent"
            >
              Receive stock
            </button>
          )}
        </div>
      )}
    </div>
  );
}
