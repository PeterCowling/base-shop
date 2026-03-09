/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type AuditEntry,
  createKey,
  formatAuditDate,
  formatQuantityDelta,
  HISTORY_DISPLAY_LIMIT,
  inventoryApiUrl,
  type InventoryItem,
  itemKey,
  itemLabel,
  parseIntQuantity,
} from "../../lib/inventory-utils";

const REASONS = [
  { value: "correction", label: "Correction" },
  { value: "damage", label: "Damage" },
  { value: "shrinkage", label: "Shrinkage" },
  { value: "return_to_stock", label: "Return to stock" },
  { value: "manual_recount", label: "Manual recount" },
] as const;

type Reason = (typeof REASONS)[number]["value"];

type AdjResult =
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

export type StockAdjustmentsProps = {
  shop: string;
  onSaved?: () => void;
};

// eslint-disable-next-line max-lines-per-function -- INV-001 monolithic form+history component; split deferred
export function StockAdjustments({ shop, onSaved }: StockAdjustmentsProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState<Reason>("correction");
  const [note, setNote] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState(() => createKey());
  const [result, setResult] = useState<AdjResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshHistory = useCallback(() => {
    fetch(inventoryApiUrl(shop, "adjustments"))
      .then((r) => r.json())
      .then((data: unknown) => {
        setHistory(((data as { events?: AuditEntry[] }).events) ?? []);
      })
      .catch(() => {});
  }, [shop]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      fetch(inventoryApiUrl(shop), { signal }).then((r) => r.json()),
      fetch(inventoryApiUrl(shop, "adjustments"), { signal }).then((r) => r.json()),
    ])
      .then(([invData, histData]: [unknown, unknown]) => {
        setInventory(((invData as { items?: InventoryItem[] }).items) ?? []);
        setHistory(((histData as { events?: AuditEntry[] }).events) ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
      });
    return () => controller.abort();
  }, [shop]);

  const selectedItem = useMemo(
    () => inventory.find((item) => itemKey(item) === selectedKey),
    [inventory, selectedKey],
  );

  const submit = useCallback(
    async (dryRun: boolean) => {
      setError(null);
      setBusy(true);
      try {
        if (!selectedItem) {
          setError("Select an inventory row.");
          return;
        }
        const parsed = parseIntQuantity(delta, "nonzero");
        if (parsed.ok === false) {
          setError(parsed.error);
          return;
        }
        const d = parsed.qty;
        const url = `${inventoryApiUrl(shop, "adjustments")}${dryRun ? "?dryRun=true" : ""}`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idempotencyKey,
            dryRun,
            ...(note.trim() ? { note: note.trim() } : {}),
            items: [
              {
                sku: selectedItem.sku,
                productId: selectedItem.productId,
                quantity: d,
                reason,
                ...(Object.keys(selectedItem.variantAttributes).length
                  ? { variantAttributes: selectedItem.variantAttributes }
                  : {}),
              },
            ],
          }),
        });
        const json = (await resp.json().catch(() => null)) as AdjResult | null;
        if (!resp.ok || !json) {
          setError("Request failed.");
          return;
        }
        if (!json.ok) {
          setError("message" in json && json.message ? json.message : "Request failed.");
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
    [selectedItem, delta, reason, note, idempotencyKey, shop, onSaved, refreshHistory],
  );

  function startNew() {
    setSelectedKey("");
    setDelta("");
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

      {/* Form */}
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
                {itemLabel(item)} (qty: {item.quantity})
              </option>
            ))}
          </select>
        </label>

        {selectedItem && (
          <p className="text-2xs text-gate-muted">
            Current stock: <span className="font-medium text-gate-ink">{selectedItem.quantity}</span>
            {delta && Number.isInteger(Number(delta)) && Number(delta) !== 0
              ? ` → ${selectedItem.quantity + Number(delta)}`
              : null}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-0.5">
            <span className="text-2xs text-gate-muted">Qty delta (+/−)</span>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="+5 or −3"

              className="w-full rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
            />
          </label>
          <label className="block space-y-0.5">
            <span className="text-2xs text-gate-muted">Reason</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as Reason)}

              className="w-full rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-0.5">
          <span className="text-2xs text-gate-muted">Note (optional)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
          {result.report.items.map((item) => (
            <p key={item.sku} className="text-xs text-gate-muted">
              {item.sku}: {item.previousQuantity} →{" "}
              <span className="font-medium text-gate-ink">{item.nextQuantity}</span>
              {" "}
              <span className={item.delta > 0 ? "text-gate-status-ready" : "text-gate-status-incomplete"}>
                ({formatQuantityDelta(item.delta)})
              </span>
            </p>
          ))}
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
