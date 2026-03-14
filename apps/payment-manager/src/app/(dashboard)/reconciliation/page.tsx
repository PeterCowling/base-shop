/* eslint-disable ds/no-hardcoded-copy, ds/no-raw-tailwind-color, ds/min-tap-size -- PM-0001 internal operator tool, English-only, no public-facing i18n requirement [ttl=2027-12-31] */
"use client";

/**
 * /reconciliation — Payment Manager checkout reconciliation view
 *
 * Shows stale in-progress checkouts (pending > 15 min) per shop.
 * Operator can mark individual attempts as resolved.
 */

import { useCallback, useEffect, useState } from "react";

interface StaleOrder {
  id: string;
  shopId: string;
  provider: string;
  amountCents: number;
  currency: string;
  customerEmail: string | null;
  createdAt: string;
  elapsedMinutes: number;
}

interface ReconciliationResponse {
  staleOrders: StaleOrder[];
}

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputCls =
  "rounded border border-gate-border bg-gate-input px-3 py-1.5 text-sm text-gate-ink placeholder:text-gate-muted focus:outline-none focus:ring-2 focus:ring-gate-accent";

export default function ReconciliationPage() {
  const [staleOrders, setStaleOrders] = useState<StaleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchStale = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (shop) params.set("shop", shop);
      const res = await fetch(`/api/reconciliation?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ReconciliationResponse;
      setStaleOrders(data.staleOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stale checkouts");
    } finally {
      setLoading(false);
    }
  }, [shop]);

  useEffect(() => { void fetchStale(); }, [fetchStale]);

  async function handleResolve(orderId: string) {
    setResolvingId(orderId);
    try {
      const res = await fetch("/api/reconciliation/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Remove from list on success
      setStaleOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve order");
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <main className="min-h-dvh bg-gate-bg text-gate-ink">
      {/* eslint-disable-next-line ds/container-widths-only-at -- PM-0001 operator tool, no DS provider */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Checkout reconciliation</h1>
        <p className="mb-6 text-sm text-gate-muted">
          Stale in-progress checkouts (pending for more than 15 minutes). Historical
          attempts before dual-write was deployed will not appear here.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          <input type="text" placeholder="Filter by shop" value={shop}
            onChange={(e) => setShop(e.target.value)} className={inputCls} />
          <button onClick={() => { void fetchStale(); }} disabled={loading}
            className="rounded bg-gate-accent px-4 py-2 text-sm text-gate-on-accent hover:opacity-90 disabled:opacity-50">
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded border border-gate-border">
          <table className="w-full text-sm">
            <thead className="bg-gate-surface text-gate-muted">
              <tr>
                <th className="px-4 py-2 text-start font-medium">Started</th>
                <th className="px-4 py-2 text-start font-medium">Shop</th>
                <th className="px-4 py-2 text-start font-medium">Customer</th>
                <th className="px-4 py-2 text-end font-medium">Amount</th>
                <th className="px-4 py-2 text-start font-medium">Provider</th>
                <th className="px-4 py-2 text-end font-medium">Elapsed</th>
                <th className="px-4 py-2 text-start font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && staleOrders.length === 0 ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-t border-gate-border">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-gate-surface" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : staleOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gate-muted">
                    No stale checkouts found
                  </td>
                </tr>
              ) : (
                staleOrders.map((order) => (
                  <tr key={order.id} className="border-t border-gate-border">
                    <td className="px-4 py-3 text-gate-muted">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">{order.shopId}</td>
                    <td className="px-4 py-3 font-mono text-xs">{order.customerEmail ?? "—"}</td>
                    <td className="px-4 py-3 text-end tabular-nums">
                      {formatAmount(order.amountCents, order.currency)}
                    </td>
                    <td className="px-4 py-3">{order.provider}</td>
                    <td className="px-4 py-3 text-end tabular-nums text-yellow-700">
                      {order.elapsedMinutes}m
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { void handleResolve(order.id); }}
                        disabled={resolvingId === order.id}
                        className="rounded border border-gate-border px-3 py-1 text-xs hover:bg-gate-surface disabled:opacity-50"
                      >
                        {resolvingId === order.id ? "Resolving…" : "Mark resolved"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
