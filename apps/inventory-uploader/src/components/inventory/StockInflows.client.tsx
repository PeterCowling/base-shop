/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

type PreviewState = {
  items: Array<{ sku: string; previousQuantity: number; addedQty: number; newQty: number }>;
} | null;

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

  const selectedItem = useMemo(
    () => inventory.find((item) => itemKey(item) === selectedKey),
    [inventory, selectedKey],
  );

  function buildBody(dryRun: boolean) {
    if (!selectedItem) return null;
    const parsed = parseIntQuantity(quantity, "positive");
    if (parsed.ok === false) return null;
    const qty = parsed.qty;
    return JSON.stringify({
      idempotencyKey,
      dryRun,
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
    });
  }

  const handlePreview = useCallback(
    async () => {
      setError(null);
      setBusy(true);
      try {
        if (!selectedItem) {
          setError("Select an inventory row.");
          return;
        }
        const parsed = parseIntQuantity(quantity, "positive");
        if (parsed.ok === false) {
          setError(parsed.error);
          return;
        }
        const body = buildBody(true);
        if (!body) {
          setError("Unable to build request.");
          return;
        }
        const resp = await fetch(`${inventoryApiUrl(shop, "inflows")}?dryRun=true`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
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
            previousQuantity: item.previousQuantity,
            addedQty: item.delta,
            newQty: item.nextQuantity,
          })),
        });
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- INV-0002 buildBody is inline; selectedItem/quantity/note/shop cover deps
    [selectedItem, quantity, note, idempotencyKey, shop],
  );

  const submit = useCallback(
    async () => {
      setError(null);
      setBusy(true);
      try {
        if (!selectedItem) {
          setError("Select an inventory row.");
          return;
        }
        const parsed = parseIntQuantity(quantity, "positive");
        if (parsed.ok === false) {
          setError(parsed.error);
          return;
        }
        const qty = parsed.qty;
        const resp = await fetch(inventoryApiUrl(shop, "inflows"), {
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
    },
    [selectedItem, quantity, note, idempotencyKey, shop, onSaved, refreshHistory],
  );

  function cancelPreview() {
    setPreview(null);
    setError(null);
  }

  function startNew() {
    setSelectedKey("");
    setQuantity("");
    setNote("");
    setIdempotencyKey(createKey());
    setResult(null);
    setPreview(null);
    setError(null);
  }

  function handleFieldChange<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPreview(null);
    };
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
            onChange={(e) => handleFieldChange(setSelectedKey)(e.target.value)}

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
            onChange={(e) => handleFieldChange(setQuantity)(e.target.value)}
            placeholder="10"

            className="w-full rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
          />
        </label>

        <label className="block space-y-0.5">
          <span className="text-2xs text-gate-muted">Reference / note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => handleFieldChange(setNote)(e.target.value)}
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
            {preview.items.map((item) => (
              <p key={item.sku} className="text-xs text-gate-muted">
                {item.sku}:{" "}
                <span className="font-medium text-gate-ink">{item.previousQuantity}</span>
                {" → "}
                <span className="font-semibold text-gate-ink">{item.newQty}</span>
                {" "}
                <span className="text-gate-status-ready">(+{item.addedQty})</span>
              </p>
            ))}
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
          {result.report.items.map((item) => (
            <p key={item.sku} className="text-xs text-gate-muted">
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
