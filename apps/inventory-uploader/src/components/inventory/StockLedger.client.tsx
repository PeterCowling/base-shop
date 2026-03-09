/* eslint-disable ds/min-tap-size -- INV-0001 operator-tool: compact buttons intentional in dense console UI */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { extractArray, formatAuditDate, formatQuantityDelta, inventoryApiUrl, type LedgerEvent } from "../../lib/inventory-utils";

type StockLedgerProps = {
  shop: string | null;
};

const EVENT_TYPE_CONFIG: Record<LedgerEvent["type"], { label: string; color: string }> = {
  adjustment: { label: "Adjustment", color: "text-gate-status-draft" },
  inflow: { label: "Inflow", color: "text-gate-status-ready" },
  sale: { label: "Sale", color: "text-gate-muted" },
};

export function StockLedger({ shop }: StockLedgerProps) {
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skuFilter, setSkuFilter] = useState("");
  const [debouncedSkuFilter, setDebouncedSkuFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<LedgerEvent["type"] | "">("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreControllerRef = useRef<AbortController | null>(null);

  // Abort any in-flight loadMore when the component unmounts
  useEffect(() => () => { loadMoreControllerRef.current?.abort(); }, []);

  // Debounce SKU filter to avoid a fetch on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSkuFilter(skuFilter), 300);
    return () => clearTimeout(timer);
  }, [skuFilter]);

  const buildLedgerParams = useCallback((limit: number, cursor?: string): URLSearchParams => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (debouncedSkuFilter) params.set("sku", debouncedSkuFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (cursor) params.set("cursor", cursor);
    return params;
  }, [debouncedSkuFilter, typeFilter]);

  useEffect(() => {
    if (!shop) {
      setEvents([]);
      setNextCursor(null);
      return;
    }
    loadMoreControllerRef.current?.abort();
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setNextCursor(null);

    fetch(`${inventoryApiUrl(shop, "ledger")}?${buildLedgerParams(50).toString()}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data: unknown) => {
        const d = data as { nextCursor?: string | null };
        setEvents(extractArray<LedgerEvent>(data, "events"));
        setNextCursor(d.nextCursor ?? null);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load ledger.");
      })
      .finally(() => {
        setLoading(false);
      });
    return () => controller.abort();
  }, [shop, buildLedgerParams]);

  async function loadMore() {
    if (!shop || !nextCursor) return;
    loadMoreControllerRef.current?.abort();
    const controller = new AbortController();
    loadMoreControllerRef.current = controller;
    setLoadingMore(true);
    try {
      const resp = await fetch(
        `${inventoryApiUrl(shop, "ledger")}?${buildLedgerParams(50, nextCursor).toString()}`,
        { signal: controller.signal },
      );
      const data = (await resp.json()) as { nextCursor?: string | null };
      setEvents((prev) => [...prev, ...extractArray<LedgerEvent>(data, "events")]);
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      // silently ignore other pagination errors
    } finally {
      setLoadingMore(false);
    }
  }

  if (!shop) {
    return <p className="text-sm text-gate-muted">Select a shop to view the stock ledger.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Filter by SKU…"
          value={skuFilter}
          onChange={(e) => setSkuFilter(e.target.value)}

          className="min-w-0 flex-1 rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink placeholder:text-gate-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as LedgerEvent["type"] | "")}

          className="rounded border border-gate-border bg-gate-input-bg px-2 py-1 text-xs text-gate-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-gate-accent"
        >
          <option value="">All types</option>
          <option value="adjustment">Adjustments</option>
          <option value="inflow">Inflows</option>
        </select>
      </div>

      {/* Event list */}
      {loading && <p className="text-xs text-gate-muted">Loading ledger…</p>}
      {error && <p className="text-xs text-gate-status-incomplete">{error}</p>}

      {!loading && events.length === 0 && (
        <p className="text-xs text-gate-muted">No stock events found.</p>
      )}

      {events.length > 0 && (
        <ul className="divide-y divide-gate-border">
          {events.map((ev) => {
            const delta = formatQuantityDelta(ev.quantityDelta);
            const isPositive = ev.quantityDelta > 0;
            return (
              <li key={ev.id} className="py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-medium text-gate-ink truncate">
                      {ev.sku}
                      {ev.variantKey && ev.variantKey !== ev.sku ? (
                        <span className="ms-1 text-gate-muted font-normal">{ev.variantKey}</span>
                      ) : null}
                    </p>
                    <div className="flex items-center gap-1.5 text-2xs">
                      <span className={EVENT_TYPE_CONFIG[ev.type]?.color ?? "text-gate-muted"}>
                        {EVENT_TYPE_CONFIG[ev.type]?.label ?? ev.type}
                      </span>
                      <span className="text-gate-muted">{formatAuditDate(ev.timestamp)}</span>
                    </div>
                    {(ev.note ?? ev.referenceId) && (
                      <p className="text-2xs text-gate-muted truncate">
                        {ev.note ?? ev.referenceId}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-xs font-mono font-semibold ${isPositive ? "text-gate-status-ready" : "text-gate-status-incomplete"}`}
                  >
                    {delta}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {nextCursor && (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => void loadMore()}

          className="w-full rounded py-1.5 text-xs text-gate-muted focus-visible:ring-1 focus-visible:ring-gate-border hover:text-gate-ink disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
