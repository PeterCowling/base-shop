"use client";

import { useEffect, useId, useState } from "react";

import { extractArray, SHOP_STORAGE_KEY } from "../../lib/inventory-utils";

type ShopSelectorProps = {
  selectedShop: string | null;
  onSelect: (shop: string | null) => void;
};

export function ShopSelector({ selectedShop, onSelect }: ShopSelectorProps) {
  const selectId = useId();
  const [shops, setShops] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/inventory/shops", { signal: controller.signal })
      .then((r) => r.json())
      .then((data: unknown) => {
        const list = extractArray<string>(data, "shops");
        setShops(list);

        // Restore persisted shop if still valid
        const persisted = localStorage.getItem(SHOP_STORAGE_KEY);
        if (persisted && list.includes(persisted) && !selectedShop) {
          onSelect(persisted);
        } else if (list.length === 1 && !selectedShop) {
          // Auto-select when only one shop
          onSelect(list[0] ?? null);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setShops([]);
      })
      .finally(() => {
        setLoading(false);
      });
    return () => controller.abort();
    // onSelect is stable (state setter); selectedShop intentionally excluded to run once
    // eslint-disable-next-line react-hooks/exhaustive-deps -- INV-001 mount-only effect, deps stable by design
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value || null;
    if (value) {
      localStorage.setItem(SHOP_STORAGE_KEY, value);
    } else {
      localStorage.removeItem(SHOP_STORAGE_KEY);
    }
    onSelect(value);
  }

  if (loading) {
    return (
      <span className="text-xs text-gate-muted">Loading shops…</span>
    );
  }

  if (shops.length === 0) {
    return (
      <span className="text-xs text-gate-muted">No shops found</span>
    );
  }

  return (
    <label htmlFor={selectId} className="flex items-center gap-2 text-xs text-gate-muted">
      Shop
      <select
        id={selectId}
        value={selectedShop ?? ""}
        onChange={handleChange}
        className="rounded-md border border-gate-border bg-gate-input px-2 py-1 text-xs text-gate-ink focus:border-gate-accent focus:outline-none"
      >
        <option value="">— select —</option>
        {shops.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  );
}
