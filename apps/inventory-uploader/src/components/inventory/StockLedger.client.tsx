"use client";

import { useEffect, useState } from "react";

type LedgerEvent = {
  id: string;
  timestamp: string;
  type: "adjustment" | "inflow" | "sale";
  sku: string;
  variantKey: string;
  quantityDelta: number;
  referenceId: string | null;
  note: string | null;
};

type StockLedgerProps = {
  shop: string | null;
};

const TYPE_LABELS: Record<LedgerEvent["type"], string> = {
  adjustment: "Adjustment",
  inflow: "Inflow",
  sale: "Sale",
};

const TYPE_COLORS: Record<LedgerEvent["type"], string> = {
  adjustment: "text-gate-status-draft",
  inflow: "text-gate-status-ready",
  sale: "text-gate-muted",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function StockLedger({ shop }: StockLedgerProps) {
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skuFilter, setSkuFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<LedgerEvent["type"] | "">("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!shop) {
      setEvents([]);
      setNextCursor(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setNextCursor(null);

    const params = new URLSearchParams({ limit: "50" });
    if (skuFilter) params.set("sku", skuFilter);
    if (typeFilter) params.set("type", typeFilter);

    fetch(`/api/inventory/${encodeURIComponent(shop)}/ledger?${params.toString()}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        const d = data as { events?: LedgerEvent[]; nextCursor?: string | null };
        setEvents(d.events ?? []);
        setNextCursor(d.nextCursor ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load ledger.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [shop, skuFilter, typeFilter]);

  async function loadMore() {
    if (!shop || !nextCursor) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: "50", cursor: nextCursor });
      if (skuFilter) params.set("sku", skuFilter);
      if (typeFilter) params.set("type", typeFilter);
      const resp = await fetch(`/api/inventory/${encodeURIComponent(shop)}/ledger?${params.toString()}`);
      const data = (await resp.json()) as { events?: LedgerEvent[]; nextCursor?: string | null };
      setEvents((prev) => [...prev, ...(data.events ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } catch {
      // silently ignore pagination errors
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
      { }
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
            const delta = ev.quantityDelta > 0 ? `+${ev.quantityDelta}` : String(ev.quantityDelta);
            const isPositive = ev.quantityDelta > 0;
            return (
              <li key={ev.id} className="py-2">
                { }
                <div className="flex items-start justify-between gap-2">
                  { }
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-medium text-gate-ink truncate">
                      {ev.sku}
                      {ev.variantKey && ev.variantKey !== ev.sku ? (
                        <span className="ms-1 text-gate-muted font-normal">{ev.variantKey}</span>
                      ) : null}
                    </p>
                    { }
                    <div className="flex items-center gap-1.5 text-2xs">
                      <span className={TYPE_COLORS[ev.type] ?? "text-gate-muted"}>
                        {TYPE_LABELS[ev.type] ?? ev.type}
                      </span>
                      <span className="text-gate-muted">{formatDate(ev.timestamp)}</span>
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
