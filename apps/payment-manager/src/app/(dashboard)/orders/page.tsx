/* eslint-disable ds/no-hardcoded-copy, ds/no-raw-tailwind-color, ds/min-tap-size -- PM-0001 internal operator tool, English-only, no public-facing i18n requirement [ttl=2027-12-31] */
"use client";

/**
 * /orders — Payment Manager order list
 *
 * Filterable, cursor-paginated list of orders across all shops.
 * Filters: shop, provider, status, date range, text search.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Order {
  id: string;
  shopId: string;
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
  customerEmail: string | null;
  providerOrderId: string | null;
  createdAt: string;
}

interface OrdersResponse {
  orders: Order[];
  nextCursor: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  resolved: "Resolved",
};

const PROVIDER_LABELS: Record<string, string> = {
  stripe: "Stripe",
  axerve: "Axerve",
};

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
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

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
    resolved: "bg-blue-100 text-blue-800",
  };
  const cls = colorMap[status] ?? "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

interface FiltersProps {
  qInput: string;
  shop: string;
  provider: string;
  status: string;
  from: string;
  to: string;
  onSearchInput: (v: string) => void;
  onShop: (v: string) => void;
  onProvider: (v: string) => void;
  onStatus: (v: string) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}

const inputCls =
  "rounded border border-gate-border bg-gate-input px-3 py-1.5 text-sm text-gate-ink placeholder:text-gate-muted focus:outline-none focus:ring-2 focus:ring-gate-accent";

function OrdersFilters({
  qInput, shop, provider, status, from, to,
  onSearchInput, onShop, onProvider, onStatus, onFrom, onTo,
}: FiltersProps) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <input type="text" placeholder="Search email or transaction ID" value={qInput}
        onChange={(e) => onSearchInput(e.target.value)} className={inputCls} />
      <input type="text" placeholder="Shop (e.g. caryina)" value={shop}
        onChange={(e) => onShop(e.target.value)} className={inputCls} />
      <select value={provider} onChange={(e) => onProvider(e.target.value)}
        className={inputCls}>
        <option value="">All providers</option>
        <option value="stripe">Stripe</option>
        <option value="axerve">Axerve</option>
      </select>
      <select value={status} onChange={(e) => onStatus(e.target.value)}
        className={inputCls}>
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
        <option value="resolved">Resolved</option>
      </select>
      <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className={inputCls} />
      <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className={inputCls} />
    </div>
  );
}

function OrdersTable({ orders, loading }: { orders: Order[]; loading: boolean }) {
  return (
    <div className="overflow-x-auto rounded border border-gate-border">
      <table className="w-full text-sm">
        <thead className="bg-gate-surface text-gate-muted">
          <tr>
            <th className="px-4 py-2 text-start font-medium">Date</th>
            <th className="px-4 py-2 text-start font-medium">Shop</th>
            <th className="px-4 py-2 text-start font-medium">Customer</th>
            <th className="px-4 py-2 text-end font-medium">Amount</th>
            <th className="px-4 py-2 text-start font-medium">Provider</th>
            <th className="px-4 py-2 text-start font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {loading && orders.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-gate-border">
                {Array.from({ length: 6 }).map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-gate-surface" />
                  </td>
                ))}
              </tr>
            ))
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-gate-muted">
                No orders found
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id}
                className="cursor-pointer border-t border-gate-border transition-colors hover:bg-gate-surface">
                <td className="px-4 py-3 text-gate-muted">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3">{order.shopId}</td>
                <td className="px-4 py-3 font-mono text-xs">{order.customerEmail ?? "—"}</td>
                <td className="px-4 py-3 text-end tabular-nums">
                  {formatAmount(order.amountCents, order.currency)}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gate-muted">
                    {PROVIDER_LABELS[order.provider] ?? order.provider}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/orders/${order.id}`} className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [shop, setShop] = useState("");
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrders = useCallback(
    async (cursor?: string, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (shop) params.set("shop", shop);
        if (provider) params.set("provider", provider);
        if (status) params.set("status", status);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        if (q) params.set("q", q);
        const res = await fetch(`/api/orders?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as OrdersResponse;
        setOrders((prev) => (append ? [...prev, ...data.orders] : data.orders));
        setNextCursor(data.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        setLoading(false);
      }
    },
    [shop, provider, status, from, to, q],
  );

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  function handleSearchInput(value: string) {
    setQInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setQ(value); }, 400);
  }

  return (
    <main className="min-h-dvh bg-gate-bg text-gate-ink">
      {/* eslint-disable-next-line ds/container-widths-only-at -- PM-0001 operator tool, no DS provider */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Orders</h1>
        <OrdersFilters
          qInput={qInput} shop={shop} provider={provider}
          status={status} from={from} to={to}
          onSearchInput={handleSearchInput} onShop={setShop}
          onProvider={setProvider} onStatus={setStatus}
          onFrom={setFrom} onTo={setTo}
        />
        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            Error loading orders: {error}
          </div>
        )}
        <OrdersTable orders={orders} loading={loading} />
        {nextCursor && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => { void fetchOrders(nextCursor, true); }}
              disabled={loading}
              className="rounded bg-gate-accent px-4 py-2 text-sm text-gate-on-accent hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
