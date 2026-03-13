/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ProductPublication } from "@acme/platform-core/products";

import { ProductForm } from "./ProductForm.client";

type Props = {
  shop: string;
};

type EditState = ProductPublication | "new" | null;

const STATUS_CLS: Record<string, string> = {
  active: "bg-success-subtle text-success-fg",
  archived: "bg-gate-muted/20 text-gate-muted",
  draft: "bg-gate-accent/10 text-gate-accent",
};

export function ProductsView({ shop }: Props) {
  const [products, setProducts] = useState<ProductPublication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    fetch(`/api/inventory/${encodeURIComponent(shop)}/products`, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { ok: boolean; products?: ProductPublication[] };
        setProducts(Array.isArray(json.products) ? json.products : []);
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const res = await fetch(
      `/api/inventory/${encodeURIComponent(shop)}/products/${id}`,
      { method: "DELETE" },
    );
    if (!res.ok && res.status !== 204) {
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
        onSaved={() => {
          setEditState(null);
          setRefreshKey((k) => k + 1);
        }}
        onCancel={() => setEditState(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
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

      {loading && <p className="text-xs text-gate-muted">Loading…</p>}
      {error && <p className="text-xs text-danger-fg">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="text-xs text-gate-muted">No products yet. Create one above.</p>
      )}

      {products.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gate-border text-start text-gate-muted">
              <th className="pb-1 pr-4 font-medium">SKU</th>
              <th className="pb-1 pr-4 font-medium">Title</th>
              <th className="pb-1 pr-4 font-medium">Price</th>
              <th className="pb-1 pr-4 font-medium">Status</th>
              <th className="pb-1 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gate-border/40 last:border-0">
                <td className="py-2 pr-4 font-mono">{p.sku}</td>
                <td className="py-2 pr-4">{p.title.en}</td>
                <td className="py-2 pr-4">
                  {(p.price / 100).toFixed(2)} {p.currency}
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      (STATUS_CLS[p.status] ?? STATUS_CLS.draft)
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => setEditState(p)}
                    className="me-3 text-gate-accent hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(p.id)}
                    className="text-danger-fg hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
