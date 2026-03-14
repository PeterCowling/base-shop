/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "../../lib/api-helpers";
import {
  type AuditEntry,
  createKey,
  extractArray,
  formatAuditDate,
  formatQuantityDelta,
  HISTORY_DISPLAY_LIMIT,
  inventoryApiUrl,
  type InventoryItem,
  itemKey,
  itemLabel,
  parseIntQuantity,
  variantLabel,
} from "../../lib/inventory-utils";

const REASONS = [
  { value: "correction", label: "Correction" },
  { value: "damage", label: "Damage" },
  { value: "shrinkage", label: "Shrinkage" },
  { value: "return_to_stock", label: "Return to stock" },
  { value: "manual_recount", label: "Manual recount" },
] as const;

type Reason = (typeof REASONS)[number]["value"];

type BatchAdjRow = {
  key: string;
  selectedKey: string;
  delta: string;
  reason: Reason;
};

type AdjResultItem = {
  sku: string;
  previousQuantity: number;
  nextQuantity: number;
  delta: number;
  variantAttributes: Record<string, string>;
};

type AdjResult =
  | {
      ok: true;
      duplicate: boolean;
      report: {
        dryRun: boolean;
        created: number;
        updated: number;
        items: AdjResultItem[];
      };
    }
  | { ok: false; code: string; message: string };

function makeBlankRow(): BatchAdjRow {
  return { key: createKey(), selectedKey: "", delta: "", reason: "correction" };
}

export type StockAdjustmentsProps = {
  shop: string;
  onSaved?: () => void;
};

// eslint-disable-next-line max-lines-per-function -- INV-001 monolithic form+history component; split deferred
export function StockAdjustments({ shop, onSaved }: StockAdjustmentsProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [rows, setRows] = useState<BatchAdjRow[]>([makeBlankRow()]);
  const [note, setNote] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => createKey());
  const [result, setResult] = useState<AdjResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshHistory = useCallback(() => {
    fetch(inventoryApiUrl(shop, "adjustments"))
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
      fetch(inventoryApiUrl(shop, "adjustments"), { signal }).then((r) => r.json()),
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

  function updateRow(rowKey: string, patch: Partial<BatchAdjRow>) {
    setRows((prev) => prev.map((r) => (r.key === rowKey ? { ...r, ...patch } : r)));
    setResult(null);
    setError(null);
  }

  function addRow() {
    setRows((prev) => [...prev, makeBlankRow()]);
  }

  function removeRow(rowKey: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== rowKey) : prev));
  }

  const submit = useCallback(
    async (dryRun: boolean) => {
      setError(null);
      setBusy(true);
      try {
        // Validate all rows
        const filledRows = rows.filter((r) => r.selectedKey !== "");
        if (filledRows.length === 0) {
          setError("Add at least one item.");
          return;
        }
        const items: Array<{
          sku: string;
          productId: string;
          quantity: number;
          reason: Reason;
          variantAttributes?: Record<string, string>;
        }> = [];
        for (const row of filledRows) {
          const parsed = parseIntQuantity(row.delta, "nonzero");
          if (parsed.ok === false) {
            setError(`Row "${row.selectedKey}": ${parsed.error}`);
            return;
          }
          const item = inventory.find((i) => itemKey(i) === row.selectedKey);
          if (!item) {
            setError(`Inventory item not found for row.`);
            return;
          }
          items.push({
            sku: item.sku,
            productId: item.productId,
            quantity: parsed.qty,
            reason: row.reason,
            ...(Object.keys(item.variantAttributes).length
              ? { variantAttributes: item.variantAttributes }
              : {}),
          });
        }

        const url = `${inventoryApiUrl(shop, "adjustments")}${dryRun ? "?dryRun=true" : ""}`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey,
            dryRun,
            ...(note.trim() ? { note: note.trim() } : {}),
            items,
          }),
        });
        const json = (await resp.json().catch(() => null)) as AdjResult | null;
        if (!resp.ok || !json) {
          setError("Request failed.");
          return;
        }
        if (!json.ok) {
          setError(getApiErrorMessage(json));
          return;
        }
        setResult(json);
        if (!dryRun) {
          setIdempotencyKey(createKey());
          onSaved?.();
          refreshHistory();
        }
      } finally {
        setBusy(false);
      }
    },
    [rows, inventory, note, idempotencyKey, shop, onSaved, refreshHistory],
  );

  function startNew() {
    setRows([makeBlankRow()]);
    setNote("");
    setIdempotencyKey(createKey());
    setResult(null);
    setError(null);
  }

  if (!shop) {
    return <p className="text-sm text-gate-muted">Select a shop to record adjustments.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gate-ink">Stock adjustment</h3>

      {/* Rows */}
      <div className="space-y-1.5">
        {/* eslint-disable-next-line ds/no-arbitrary-tailwind -- INV-0001 operator-tool: fixed-column grid for dense console table */}
        <div className="grid grid-cols-[1fr_80px_120px_24px] gap-1 text-2xs text-gate-muted">
          <span>Inventory row</span>
          <span>Qty delta</span>
          <span>Reason</span>
          <span />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {rows.map((row) => (
            // eslint-disable-next-line ds/no-arbitrary-tailwind -- INV-0001 operator-tool: fixed-column grid for dense console table
            <div key={row.key} className="grid grid-cols-[1fr_80px_120px_24px] gap-1 items-center">
              <select
                value={row.selectedKey}
                onChange={(e) => updateRow(row.key, { selectedKey: e.target.value })}
                className="rounded border border-gate-border bg-gate-input-bg px-1.5 py-0.5 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
              >
                <option value="">— select SKU —</option>
                {inventory.map((item) => (
                  <option key={itemKey(item)} value={itemKey(item)}>
                    {itemLabel(item)} (qty: {item.quantity})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={row.delta}
                onChange={(e) => updateRow(row.key, { delta: e.target.value })}
                placeholder="+5 or −3"
                className="rounded border border-gate-border bg-gate-input-bg px-1.5 py-0.5 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
              />
              <select
                value={row.reason}
                onChange={(e) => updateRow(row.key, { reason: e.target.value as Reason })}
                className="rounded border border-gate-border bg-gate-input-bg px-1.5 py-0.5 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
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
        <span className="text-2xs text-gate-muted">Note (optional)</span>
        <input
          type="text"
          value={note}
          onChange={(e) => { setNote(e.target.value); setResult(null); }}
          placeholder="Context or ticket…"
          className="w-full rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
        />
      </label>

      {error && <p className="text-xs text-gate-status-incomplete">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void submit(true)}
          disabled={busy}
          className="rounded px-3 py-1 text-xs text-gate-muted focus-visible:ring-1 focus-visible:ring-gate-border hover:text-gate-ink disabled:opacity-40"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => void submit(false)}
          disabled={busy}
          className="rounded bg-gate-accent px-3 py-1 text-xs font-medium text-gate-on-accent hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Saving…" : "Apply"}
        </button>
        <button
          type="button"
          onClick={startNew}
          className="ms-auto rounded px-2 py-1 text-xs text-gate-muted focus-visible:ring-1 focus-visible:ring-gate-border hover:text-gate-ink"
        >
          Reset
        </button>
      </div>

      {/* Result */}
      {result?.ok && (
        <div className="rounded border border-gate-border bg-gate-surface p-3 space-y-1">
          <p className="text-xs font-medium text-gate-ink">
            {result.report.dryRun
              ? "Preview"
              : result.duplicate
                ? "Already applied"
                : "Applied"}
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
                <span className={item.delta > 0 ? "text-gate-status-ready" : "text-gate-status-incomplete"}>
                  ({formatQuantityDelta(item.delta)})
                </span>
              </p>
            );
          })}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-2xs font-medium uppercase tracking-wide text-gate-muted">
            Recent adjustments
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
                  <span
                    className={`shrink-0 font-mono text-xs font-semibold ${ev.quantityDelta > 0 ? "text-gate-status-ready" : "text-gate-status-incomplete"}`}
                  >
                    {formatQuantityDelta(ev.quantityDelta)}
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
