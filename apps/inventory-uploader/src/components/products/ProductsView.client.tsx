/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ProductPublication } from "@acme/platform-core/products";
import type { InventoryItem } from "@acme/platform-core/types/inventory";

import { ProductForm } from "./ProductForm.client";

type Props = {
  shop: string;
};

type EditState = ProductPublication | "new" | null;

const LOW_STOCK_THRESHOLD = 5;

const STATUS_CLS: Record<string, string> = {
  active: "bg-success-subtle text-success-fg",
  archived: "bg-gate-muted/20 text-gate-muted",
  draft: "bg-gate-accent/10 text-gate-accent",
};

// ---------------------------------------------------------------------------
// ProductRow — extracted to keep ProductsView under the line-count limit
// ---------------------------------------------------------------------------

type ProductRowProps = {
  product: ProductPublication;
  qty: number | undefined;
  onEdit: (p: ProductPublication) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

function ProductRow({ product: p, qty, onEdit, onDuplicate, onDelete }: ProductRowProps) {
  const isLowStock = qty !== undefined && qty <= LOW_STOCK_THRESHOLD;
  return (
    <tr className="border-b border-gate-border/40 last:border-0">
      <td className="py-2 pr-4 font-mono">{p.sku}</td>
      <td className="py-2 pr-4">{p.title.en}</td>
      <td className="py-2 pr-4">
        {(p.price / 100).toFixed(2)} {p.currency}
      </td>
      <td className="py-2 pr-4">
        <span className="tabular-nums">{qty !== undefined ? qty : "—"}</span>
        {isLowStock && (
          <span className="ms-1.5 rounded px-1 py-0.5 text-2xs font-medium bg-gate-warning-subtle text-gate-warning-fg">
            Low
          </span>
        )}
      </td>
      <td className="py-2 pr-4">
        <span
          className={`rounded px-1.5 py-0.5 text-2xs font-medium ${STATUS_CLS[p.status] ?? STATUS_CLS.draft}`}
        >
          {p.status}
        </span>
      </td>
      <td className="py-2">
        <button
          type="button"
          onClick={() => onEdit(p)}
          className="me-3 text-gate-accent hover:underline"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(p.id)}
          className="me-3 text-gate-muted hover:text-gate-ink hover:underline"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => onDelete(p.id)}
          className="text-danger-fg hover:underline"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// ProductsView
// ---------------------------------------------------------------------------

export function ProductsView({ shop }: Props) {
  const [products, setProducts] = useState<ProductPublication[]>([]);
  const [stockMap, setStockMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const visibleProducts = products
    .filter((p) => !showLowStockOnly || (stockMap.get(p.sku) ?? Infinity) <= LOW_STOCK_THRESHOLD)
    .filter(
      (p) =>
        !searchQuery.trim() ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title.en.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const load = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/inventory/${encodeURIComponent(shop)}/products`, { signal: ctrl.signal }).then(
        async (res) => {
          if (!res.ok) {
            if (res.status === 401) return { expired: true } as const;
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json() as Promise<{ ok: boolean; products?: ProductPublication[] }>;
        },
      ),
      fetch(`/api/inventory/${encodeURIComponent(shop)}`, { signal: ctrl.signal }).then(
        async (res) => {
          if (!res.ok) return { ok: false, items: [] } as { ok: boolean; items: InventoryItem[] };
          return res.json() as Promise<{ ok: boolean; items?: InventoryItem[] }>;
        },
      ),
    ])
      .then(([productsResult, inventoryResult]) => {
        if ("expired" in productsResult) {
          setError("session-expired");
          return;
        }
        setProducts(Array.isArray(productsResult.products) ? productsResult.products : []);
        const map = new Map<string, number>();
        const items = Array.isArray(inventoryResult.items) ? inventoryResult.items : [];
        for (const item of items) {
          map.set(item.sku, (map.get(item.sku) ?? 0) + item.quantity);
        }
        setStockMap(map);
      })
      .catch((err: unknown) => {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message ?? "Load failed");
        }
      })
      .finally(() => setLoading(false));
  }, [shop]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load, refreshKey]);

  async function handleDuplicate(id: string) {
    const res = await fetch(`/api/inventory/${encodeURIComponent(shop)}/products/${id}`, {
      method: "POST",
    });
    if (!res.ok) {
      if (res.status === 401) { setError("session-expired"); return; }
      alert(`Duplicate failed (HTTP ${res.status})`);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const res = await fetch(`/api/inventory/${encodeURIComponent(shop)}/products/${id}`, {
      method: "DELETE",
    });
    if (!res.ok && res.status !== 204) {
      if (res.status === 401) { setError("session-expired"); return; }
      alert(`Delete failed (HTTP ${res.status})`);
      return;
    }
    setRefreshKey((k) => k + 1);
  }

  if (editState !== null) {
    return (
      <ProductForm
        shop={shop}
        product={editState === "new" ? null : editState}
        onSaved={() => { setEditState(null); setRefreshKey((k) => k + 1); }}
        onCancel={() => setEditState(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gate-ink">Products</h2>
        <button
          type="button"
          onClick={() => setEditState("new")}
          className="rounded bg-gate-accent px-3 py-1 text-xs font-medium text-gate-on-accent hover:opacity-90"
        >
          + New Product
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="search"
          className="min-w-0 flex-1 rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink placeholder:text-gate-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
          placeholder="Search by SKU or title…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowLowStockOnly((v) => !v)}
          className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${
            showLowStockOnly
              ? "bg-gate-warning-subtle text-gate-warning-fg"
              : "border border-gate-border text-gate-muted hover:text-gate-ink"
          }`}
        >
          Low stock
        </button>
      </div>

      {loading && <p className="text-xs text-gate-muted">Loading…</p>}
      {error && (
        <p className="text-xs text-danger-fg">
          {error === "session-expired" ? (
            <>Your session has expired.{" "}<a href="/login" className="underline">Log in again</a></>
          ) : error}
        </p>
      )}
      {!loading && !error && products.length === 0 && (
        <p className="text-xs text-gate-muted">No products yet. Create one above.</p>
      )}
      {(searchQuery || showLowStockOnly) && visibleProducts.length === 0 && products.length > 0 && (
        <p className="text-xs text-gate-muted">
          {showLowStockOnly && !searchQuery ? "No low-stock products." : "No products match the current filters."}
        </p>
      )}

      {visibleProducts.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gate-border text-start text-gate-muted">
              <th className="pb-1 pr-4 font-medium">SKU</th>
              <th className="pb-1 pr-4 font-medium">Title</th>
              <th className="pb-1 pr-4 font-medium">Price</th>
              <th className="pb-1 pr-4 font-medium">Stock</th>
              <th className="pb-1 pr-4 font-medium">Status</th>
              <th className="pb-1 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                qty={stockMap.get(p.sku)}
                onEdit={setEditState}
                onDuplicate={(id) => void handleDuplicate(id)}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
