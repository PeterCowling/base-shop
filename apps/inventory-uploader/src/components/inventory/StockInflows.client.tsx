/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "../../lib/api-helpers";
import {
  type AuditEntry,
  createKey,
  extractArray,
  formatAuditDate,
  HISTORY_DISPLAY_LIMIT,
  inventoryApiUrl,
  type InventoryItem,
  itemKey,
  itemLabel,
  parseIntQuantity,
  variantLabel,
} from "../../lib/inventory-utils";

type BatchInflowRow = {
  key: string;
  selectedKey: string;
  quantity: string;
};

type InflowResultItem = {
  sku: string;
  previousQuantity: number;
  nextQuantity: number;
  delta: number;
  variantAttributes: Record<string, string>;
};

type InflowResult =
  | {
      ok: true;
      duplicate: boolean;
      report: {
        dryRun: boolean;
        created: number;
        updated: number;
        items: InflowResultItem[];
      };
    }
  | { ok: false; code: string; message: string };

type PreviewItem = {
  sku: string;
  variantAttributes: Record<string, string>;
  previousQuantity: number;
  addedQty: number;
  newQty: number;
};

type PreviewState = {
  items: PreviewItem[];
} | null;

function makeBlankRow(): BatchInflowRow {
  return { key: createKey(), selectedKey: "", quantity: "" };
}

export type StockInflowsProps = {
  shop: string;
  onSaved?: () => void;
};

// eslint-disable-next-line max-lines-per-function -- INV-001 monolithic form+history component; split deferred
export function StockInflows({ shop, onSaved }: StockInflowsProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [rows, setRows] = useState<BatchInflowRow[]>([makeBlankRow()]);
  const [note, setNote] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => createKey());
  const [result, setResult] = useState<InflowResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);

  const refreshHistory = useCallback(() => {
    fetch(inventoryApiUrl(shop, "inflows"))
      .then((r) => r.json())
      .then((data: unknown) => {
        setHistory(extractArray<AuditEntry>(data, "events"));
      })
      .catch(() => {});
  }, [shop]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    void Promise.allSettled([
      fetch(inventoryApiUrl(shop), { signal }).then((r) => r.json()),
      fetch(inventoryApiUrl(shop, "inflows"), { signal }).then((r) => r.json()),
    ]).then(([invResult, histResult]) => {
      if (invResult.status === "fulfilled") {
        setInventory(extractArray<InventoryItem>(invResult.value, "items"));
      }
      if (histResult.status === "fulfilled") {
        setHistory(extractArray<AuditEntry>(histResult.value, "events"));
      }
    });
    return () => controller.abort();
  }, [shop]);

  function updateRow(rowKey: string, patch: Partial<BatchInflowRow>) {
    setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, ...patch } : r)));
    setPreview(null);
    setError(null);
  }

  function addRow() {
    setRows((prev) => [...prev, makeBlankRow()]);
    setPreview(null);
  }

  function removeRow(rowKey: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== rowKey) : prev));
    setPreview(null);
  }

  function buildItems(): Array<{
    sku: string;
    productId: string;
    quantity: number;
    variantAttributes?: Record<string, string>;
  }> | { error: string } {
    const filledRows = rows.filter((r) => r.selectedKey !== "");
    if (filledRows.length === 0) return { error: "Add at least one item." };
    const items: Array<{
      sku: string;
      productId: string;
      quantity: number;
      variantAttributes?: Record<string, string>;
    }> = [];
    for (const row of filledRows) {
      const parsed = parseIntQuantity(row.quantity, "positive");
      if (parsed.ok === false) {
        return { error: `Row "${row.selectedKey}": ${parsed.error}` };
      }
      const invItem = inventory.find((i) => itemKey(i) === row.selectedKey);
      if (!invItem) return { error: "Inventory item not found for row." };
      items.push({
        sku: invItem.sku,
        productId: invItem.productId,
        quantity: parsed.qty,
        ...(Object.keys(invItem.variantAttributes).length
          ? { variantAttributes: invItem.variantAttributes }
          : {}),
      });
    }
    return items;
  }

  const handlePreview = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const itemsOrError = buildItems();
      if ("error" in itemsOrError) {
        setError(itemsOrError.error);
        return;
      }
      const resp = await fetch(`${inventoryApiUrl(shop, "inflows")}?dryRun=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          dryRun: true,
          ...(note.trim() ? { note: note.trim() } : {}),
          items: itemsOrError,
        }),
      });
      const json = (await resp.json().catch(() => null)) as InflowResult | null;
      if (!resp.ok || !json) {
        setError("Preview request failed.");
        return;
      }
      if (!json.ok) {
        setError(getApiErrorMessage(json));
        return;
      }
      setPreview({
        items: json.report.items.map((item) => ({
          sku: item.sku,
          variantAttributes: item.variantAttributes ?? {},
          previousQuantity: item.previousQuantity,
          addedQty: item.delta,
          newQty: item.nextQuantity,
        })),
      });
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- INV-0002 buildItems uses rows/inventory/note inline; row/inventory/note/shop/idempotencyKey cover deps
  }, [rows, inventory, note, idempotencyKey, shop]);

  const submit = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const itemsOrError = buildItems();
      if ("error" in itemsOrError) {
        setError(itemsOrError.error);
        return;
      }
      const resp = await fetch(inventoryApiUrl(shop, "inflows"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          ...(note.trim() ? { note: note.trim() } : {}),
          items: itemsOrError,
        }),
      });
      const json = (await resp.json().catch(() => null)) as InflowResult | null;
      if (!resp.ok || !json) {
        setError("Request failed.");
        return;
      }
      if (!json.ok) {
        setError(getApiErrorMessage(json));
        return;
      }
      setResult(json);
      setPreview(null);
      setIdempotencyKey(createKey());
      onSaved?.();
      refreshHistory();
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- INV-0002 buildItems uses rows/inventory/note inline; row/inventory/note/shop/idempotencyKey/onSaved/refreshHistory cover deps
  }, [rows, inventory, note, idempotencyKey, shop, onSaved, refreshHistory]);

  function cancelPreview() {
    setPreview(null);
    setError(null);
  }

  function startNew() {
    setRows([makeBlankRow()]);
    setNote("");
    setIdempotencyKey(createKey());
    setResult(null);
    setPreview(null);
    setError(null);
  }

  if (!shop) {
    return <p className="text-sm text-gate-muted">Select a shop to receive stock.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gate-ink">Receive stock</h3>

      <div className="space-y-2">
        {/* Rows */}
        <div className="space-y-1.5">
          {/* eslint-disable-next-line ds/no-arbitrary-tailwind -- INV-0001 operator-tool: fixed-column grid for dense console table */}
          <div className="grid grid-cols-[1fr_100px_24px] gap-1 text-2xs text-gate-muted">
            <span>Inventory row</span>
            <span>Qty received</span>
            <span />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {rows.map((row) => (
              // eslint-disable-next-line ds/no-arbitrary-tailwind -- INV-0001 operator-tool: fixed-column grid for dense console table
              <div key={row.key} className="grid grid-cols-[1fr_100px_24px] gap-1 items-center">
                <select
                  value={row.selectedKey}
                  onChange={(e) => updateRow(row.key, { selectedKey: e.target.value })}
                  className="rounded border border-gate-border bg-gate-input-bg px-1.5 py-0.5 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
                >
                  <option value="">— select SKU —</option>
                  {inventory.map((item) => (
                    <option key={itemKey(item)} value={itemKey(item)}>
                      {itemLabel(item)} (current: {item.quantity})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                  placeholder="10"
                  className="rounded border border-gate-border bg-gate-input-bg px-1.5 py-0.5 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
                />
                {/* eslint-disable ds/enforce-layout-primitives -- INV-0001 operator-tool: compact icon button in dense console table row */}
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length === 1}
                  className="flex items-center justify-center rounded text-gate-muted hover:text-gate-status-incomplete disabled:opacity-30 focus-visible:ring-1 focus-visible:ring-gate-border"
                  aria-label="Remove row"
                >
                  ×
                </button>
                {/* eslint-enable ds/enforce-layout-primitives */}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="rounded px-2 py-0.5 text-xs text-gate-muted focus-visible:ring-1 focus-visible:ring-gate-border hover:text-gate-ink"
          >
            + Add row
          </button>
        </div>

        {/* Note */}
        <label className="block space-y-0.5">
          <span className="text-2xs text-gate-muted">Reference / note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => { setNote(e.target.value); setPreview(null); }}
            placeholder="PO-1234 or supplier name…"
            className="w-full rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
          />
        </label>

        {error && <p className="text-xs text-gate-status-incomplete">{error}</p>}

        {preview && (
          <div className="rounded border border-gate-border bg-gate-surface p-3 space-y-1.5">
            <p className="text-2xs font-medium uppercase tracking-wide text-gate-muted">
              Preview — stock levels after receiving
            </p>
            {preview.items.map((item) => {
              const label = variantLabel(item.variantAttributes);
              const rowKey = `${item.sku}:${JSON.stringify(item.variantAttributes)}`;
              return (
                <p key={rowKey} className="text-xs text-gate-muted">
                  {item.sku}{label ? ` (${label})` : ""}:{" "}
                  <span className="font-medium text-gate-ink">{item.previousQuantity}</span>
                  {" → "}
                  <span className="font-semibold text-gate-ink">{item.newQty}</span>
                  {" "}
                  <span className="text-gate-status-ready">(+{item.addedQty})</span>
                </p>
              );
            })}
            <p className="text-2xs text-gate-muted pt-0.5">Nothing has been saved yet. Confirm to apply.</p>
          </div>
        )}

        {/* eslint-disable-next-line ds/enforce-layout-primitives -- INV-0001 operator-tool: inline button row, same pattern as pre-existing button row */}
        <div className="flex items-center gap-2">
          {preview ? (
            <>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy}
                className="rounded bg-gate-accent px-3 py-1 text-xs font-medium text-gate-on-accent hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "Saving…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={cancelPreview}
                className="rounded px-2 py-1 text-xs text-gate-muted focus-visible:ring-1 focus-visible:ring-gate-border hover:text-gate-ink"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void handlePreview()}
                disabled={busy}
                className="rounded bg-gate-accent px-3 py-1 text-xs font-medium text-gate-on-accent hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "Loading…" : "Preview"}
              </button>
              <button
                type="button"
                onClick={startNew}
                className="rounded px-2 py-1 text-xs text-gate-muted focus-visible:ring-1 focus-visible:ring-gate-border hover:text-gate-ink"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {result?.ok && (
        <div className="rounded border border-gate-border bg-gate-surface p-3 space-y-1">
          <p className="text-xs font-medium text-gate-ink">
            {result.duplicate ? "Already received (duplicate ref)" : "Received"}
          </p>
          {result.report.items.map((item) => {
            const attrs = item.variantAttributes ?? {};
            const label = variantLabel(attrs);
            const rowKey = `${item.sku}:${JSON.stringify(attrs)}`;
            return (
              <p key={rowKey} className="text-xs text-gate-muted">
                {item.sku}{label ? ` (${label})` : ""}: {item.previousQuantity} →{" "}
                <span className="font-medium text-gate-ink">{item.nextQuantity}</span>
                {" "}
                <span className="text-gate-status-ready">(+{item.delta})</span>
              </p>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-2xs font-medium uppercase tracking-wide text-gate-muted">
            Recent inflows
          </h4>
          <ul className="divide-y divide-gate-border">
            {history.slice(0, HISTORY_DISPLAY_LIMIT).map((ev) => (
              <li key={ev.id} className="py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-gate-ink">{ev.sku}</p>
                    <p className="text-2xs text-gate-muted">
                      {formatAuditDate(ev.createdAt)}
                      {ev.note ? ` · ${ev.note}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold text-gate-status-ready">
                    +{ev.quantityDelta}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
