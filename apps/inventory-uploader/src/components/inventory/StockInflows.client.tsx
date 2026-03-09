/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useCallback, useEffect, useState } from "react";

import {
  type AuditEntry,
  createKey,
  formatAuditDate,
  type InventoryItem,
  itemKey,
  itemLabel,
} from "../../lib/inventory-utils";

type InflowResult =
  | {
      ok: true;
      duplicate: boolean;
      report: {
        dryRun: boolean;
        created: number;
        updated: number;
        items: Array<{ sku: string; previousQuantity: number; nextQuantity: number; delta: number }>;
      };
    }
  | { ok: false; code: string; message: string };

export type StockInflowsProps = {
  shop: string;
  onSaved?: () => void;
};

// eslint-disable-next-line max-lines-per-function -- INV-001 monolithic form+history component; split deferred
export function StockInflows({ shop, onSaved }: StockInflowsProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => createKey());
  const [result, setResult] = useState<InflowResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function refreshHistory() {
    fetch(`/api/inventory/${encodeURIComponent(shop)}/inflows`)
      .then((r) => r.json())
      .then((data: unknown) => {
        setHistory(((data as { events?: AuditEntry[] }).events) ?? []);
      })
      .catch(() => {});
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/inventory/${encodeURIComponent(shop)}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        setInventory(((data as { items?: InventoryItem[] }).items) ?? []);
      })
      .catch(() => {});
    fetch(`/api/inventory/${encodeURIComponent(shop)}/inflows`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        setHistory(((data as { events?: AuditEntry[] }).events) ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [shop]);

  const selectedItem = inventory.find((item) => itemKey(item) === selectedKey);

  const submit = useCallback(
    async () => {
      setError(null);
      setBusy(true);
      try {
        if (!selectedItem) {
          setError("Select an inventory row.");
          return;
        }
        const qty = Number(quantity);
        if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0) {
          setError("Quantity must be a positive integer.");
          return;
        }
        const resp = await fetch(`/api/inventory/${encodeURIComponent(shop)}/inflows`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey,
            ...(note.trim() ? { note: note.trim() } : {}),
            items: [
              {
                sku: selectedItem.sku,
                productId: selectedItem.productId,
                quantity: qty,
                ...(Object.keys(selectedItem.variantAttributes).length
                  ? { variantAttributes: selectedItem.variantAttributes }
                  : {}),
              },
            ],
          }),
        });
        const json = (await resp.json().catch(() => null)) as InflowResult | null;
        if (!resp.ok || !json) {
          setError("Request failed.");
          return;
        }
        if (!json.ok) {
          setError("message" in json && json.message ? json.message : "Request failed.");
          return;
        }
        setResult(json);
        setIdempotencyKey(createKey());
        onSaved?.();
        refreshHistory();
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- INV-001 refreshHistory stable, shop via closure
    [selectedItem, quantity, note, idempotencyKey, shop, onSaved],
  );

  function startNew() {
    setSelectedKey("");
    setQuantity("");
    setNote("");
    setIdempotencyKey(createKey());
    setResult(null);
    setError(null);
  }

  if (!shop) {
    return <p className="text-sm text-gate-muted">Select a shop to receive stock.</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gate-ink">Receive stock</h3>

      <div className="space-y-2">
        <label className="block space-y-0.5">
          <span className="text-2xs text-gate-muted">Inventory row</span>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}

            className="w-full rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
          >
            <option value="">— select SKU —</option>
            {inventory.map((item) => (
              <option key={itemKey(item)} value={itemKey(item)}>
                {itemLabel(item)} (current: {item.quantity})
              </option>
            ))}
          </select>
        </label>

        {selectedItem && (
          <p className="text-2xs text-gate-muted">
            Current stock: <span className="font-medium text-gate-ink">{selectedItem.quantity}</span>
            {quantity && Number.isInteger(Number(quantity)) && Number(quantity) > 0
              ? ` → ${selectedItem.quantity + Number(quantity)}`
              : null}
          </p>
        )}

        <label className="block space-y-0.5">
          <span className="text-2xs text-gate-muted">Quantity received</span>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="10"

            className="w-full rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
          />
        </label>

        <label className="block space-y-0.5">
          <span className="text-2xs text-gate-muted">Reference / note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="PO-1234 or supplier name…"

            className="w-full rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
          />
        </label>

        {error && <p className="text-xs text-gate-status-incomplete">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}

            className="rounded bg-gate-accent px-3 py-1 text-xs font-medium text-gate-on-accent hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Saving…" : "Receive"}
          </button>
          <button
            type="button"
            onClick={startNew}

            className="rounded px-2 py-1 text-xs text-gate-muted focus-visible:ring-1 focus-visible:ring-gate-border hover:text-gate-ink"
          >
            Reset
          </button>
        </div>
      </div>

      {result?.ok && (
        <div className="rounded border border-gate-border bg-gate-surface p-3 space-y-1">
          <p className="text-xs font-medium text-gate-ink">
            {result.duplicate ? "Already received (duplicate ref)" : "Received"}
          </p>
          {result.report.items.map((item, i) => (
            <p key={i} className="text-xs text-gate-muted">
              {item.sku}: {item.previousQuantity} →{" "}
              <span className="font-medium text-gate-ink">{item.nextQuantity}</span>
              {" "}
              <span className="text-gate-status-ready">(+{item.delta})</span>
            </p>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-2xs font-medium uppercase tracking-wide text-gate-muted">
            Recent inflows
          </h4>
          <ul className="divide-y divide-gate-border">
            {history.slice(0, 10).map((ev) => (
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
