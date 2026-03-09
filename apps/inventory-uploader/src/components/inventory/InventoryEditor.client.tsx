/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useEffect, useRef, useState } from "react";

import { extractArray, type InventoryItem, variantLabel } from "../../lib/inventory-utils";

type InventoryEditorProps = {
  shop: string | null;
  sku: string | null;
  onSaved?: () => void;
};

type EditState = {
  quantity: number;
  lowStockThreshold: number | "";
  saving: boolean;
  saved: boolean;
  error: string | null;
};

function VariantRow({
  item,
  onSaved,
  shop,
}: {
  item: InventoryItem;
  onSaved: () => void;
  shop: string;
}) {
  const [edit, setEdit] = useState<EditState>({
    quantity: item.quantity,
    lowStockThreshold: item.lowStockThreshold ?? "",
    saving: false,
    saved: false,
    error: null,
  });

  async function save() {
    setEdit((s) => ({ ...s, saving: true, saved: false, error: null }));
    try {
      const resp = await fetch(
        `/api/inventory/${encodeURIComponent(shop)}/${encodeURIComponent(item.sku)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantAttributes: item.variantAttributes,
            quantity: edit.quantity,
            ...(edit.lowStockThreshold !== "" ? { lowStockThreshold: edit.lowStockThreshold } : {}),
          }),
        },
      );
      if (!resp.ok) {
        const data = (await resp.json()) as { error?: string };
        setEdit((s) => ({ ...s, saving: false, error: data.error ?? "Save failed" }));
        return;
      }
      setEdit((s) => ({ ...s, saving: false, saved: true }));
      onSaved();
      setTimeout(() => setEdit((s) => ({ ...s, saved: false })), 2000);
    } catch {
      setEdit((s) => ({ ...s, saving: false, error: "Network error" }));
    }
  }

  const dirty = edit.quantity !== item.quantity || edit.lowStockThreshold !== (item.lowStockThreshold ?? "");

  return (
    <div className="rounded-lg border border-gate-border bg-gate-surface p-3 space-y-2">
      <p className="text-xs font-medium text-gate-ink">{variantLabel(item.variantAttributes, "(default)")}</p>

      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-0.5">
          <span className="text-2xs text-gate-muted">Quantity</span>
          <input
            type="number"
            min={0}
            value={edit.quantity}
            onChange={(e) => setEdit((s) => ({ ...s, quantity: Math.max(0, Number(e.target.value)) }))}

            className="w-full rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
          />
        </label>
        <label className="block space-y-0.5">
          <span className="text-2xs text-gate-muted">Low-stock alert</span>
          <input
            type="number"
            min={0}
            placeholder="–"
            value={edit.lowStockThreshold}
            onChange={(e) =>
              setEdit((s) => ({
                ...s,
                lowStockThreshold: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)),
              }))
            }

            className="w-full rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!dirty || edit.saving}
          onClick={() => void save()}

          className="rounded bg-gate-accent px-3 py-1 text-xs font-medium text-gate-on-accent hover:opacity-90 disabled:opacity-40"
        >
          {edit.saving ? "Saving…" : "Save"}
        </button>
        {edit.saved && <span className="text-xs text-gate-status-ready">Saved</span>}
        {edit.error && <span className="text-xs text-gate-status-incomplete">{edit.error}</span>}
      </div>
    </div>
  );
}

export function InventoryEditor({ shop, sku, onSaved }: InventoryEditorProps) {
  const [variants, setVariants] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const exportAnchorRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!shop || !sku) {
      setVariants([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/inventory/${encodeURIComponent(shop)}/${encodeURIComponent(sku)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: unknown) => {
        const list = extractArray<InventoryItem>(data, "variants");
        setVariants(list);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load SKU variants.");
      })
      .finally(() => {
        setLoading(false);
      });
    return () => controller.abort();
  }, [shop, sku]);

  if (!shop || !sku) {
    return <p className="text-sm text-gate-muted">Select a SKU to edit variants.</p>;
  }

  if (loading) return <p className="text-sm text-gate-muted">Loading variants…</p>;
  if (error) return <p className="text-sm text-gate-status-incomplete">{error}</p>;
  if (variants.length === 0) return <p className="text-sm text-gate-muted">No variants found for {sku}.</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gate-ink">{sku}</h2>
        {/* Hidden anchor used for CSV export — avoids DOM create/destroy per click */}
        <a ref={exportAnchorRef} className="sr-only" aria-hidden="true" />
        <button
          type="button"
          onClick={() => {
            const a = exportAnchorRef.current;
            if (!a) return;
            a.href = `/api/inventory/${encodeURIComponent(shop)}/export?format=csv`;
            a.download = "";
            a.click();
          }}

          className="rounded px-2 py-1 text-xs text-gate-muted focus-visible:ring-1 focus-visible:ring-gate-border hover:text-gate-ink focus-visible:hover:ring-gate-accent"
        >
          Export CSV
        </button>
      </div>
      <div className="space-y-2">
        {variants.map((item) => (
          <VariantRow
            key={`${item.sku}#${variantLabel(item.variantAttributes)}`}
            item={item}
            shop={shop}
            onSaved={() => onSaved?.()}
          />
        ))}
      </div>
    </div>
  );
}
