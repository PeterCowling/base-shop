/* eslint-disable ds/no-hardcoded-copy, ds/no-raw-tailwind-color, ds/min-tap-size -- PM-0001 internal operator tool, English-only, no public-facing i18n requirement [ttl=2027-12-31] */
"use client";

/**
 * /webhooks — Payment Manager webhook event log
 *
 * Filterable, cursor-paginated list of Stripe webhook events.
 * Filters: shop, event type, status, date range.
 */

import { useCallback, useEffect, useState } from "react";

interface WebhookEvent {
  id: string;
  shop: string;
  type: string;
  status: string;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WebhookEventsResponse {
  events: WebhookEvent[];
  nextCursor: string | null;
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
  const cls =
    status === "processed"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status === "processed" ? "Processed" : "Failed"}
    </span>
  );
}

const inputCls =
  "rounded border border-gate-border bg-gate-input px-3 py-1.5 text-sm text-gate-ink placeholder:text-gate-muted focus:outline-none focus:ring-2 focus:ring-gate-accent";

function WebhookFilters({
  shop, type, status, from, to,
  onShop, onType, onStatus, onFrom, onTo,
}: {
  shop: string; type: string; status: string; from: string; to: string;
  onShop: (v: string) => void; onType: (v: string) => void;
  onStatus: (v: string) => void; onFrom: (v: string) => void; onTo: (v: string) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <input type="text" placeholder="Shop (e.g. caryina)" value={shop}
        onChange={(e) => onShop(e.target.value)} className={inputCls} />
      <input type="text" placeholder="Event type (e.g. checkout.session)" value={type}
        onChange={(e) => onType(e.target.value)} className={inputCls} />
      <select value={status} onChange={(e) => onStatus(e.target.value)} className={inputCls}>
        <option value="">All statuses</option>
        <option value="processed">Processed</option>
        <option value="failed">Failed</option>
      </select>
      <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className={inputCls} />
      <input type="date" value={to} onChange={(e) => onTo(e.target.value)} className={inputCls} />
    </div>
  );
}

function WebhookTable({ events, loading }: { events: WebhookEvent[]; loading: boolean }) {
  return (
    <div className="overflow-x-auto rounded border border-gate-border">
      <table className="w-full text-sm">
        <thead className="bg-gate-surface text-gate-muted">
          <tr>
            <th className="px-4 py-2 text-start font-medium">Received</th>
            <th className="px-4 py-2 text-start font-medium">Shop</th>
            <th className="px-4 py-2 text-start font-medium">Event type</th>
            <th className="px-4 py-2 text-start font-medium">Status</th>
            <th className="px-4 py-2 text-start font-medium">Error</th>
          </tr>
        </thead>
        <tbody>
          {loading && events.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-gate-border">
                {Array.from({ length: 5 }).map((__, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-gate-surface" />
                  </td>
                ))}
              </tr>
            ))
          ) : events.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-gate-muted">
                No webhook events found
              </td>
            </tr>
          ) : (
            events.map((ev) => (
              <tr key={ev.id} className="border-t border-gate-border">
                <td className="px-4 py-3 text-gate-muted">{formatDate(ev.updatedAt)}</td>
                <td className="px-4 py-3">{ev.shop}</td>
                <td className="px-4 py-3 font-mono text-xs">{ev.type}</td>
                <td className="px-4 py-3"><StatusBadge status={ev.status} /></td>
                <td className="px-4 py-3 font-mono text-xs text-red-700">
                  {ev.lastError ?? ""}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function WebhooksPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [shop, setShop] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchEvents = useCallback(
    async (cursor?: string, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (shop) params.set("shop", shop);
        if (type) params.set("type", type);
        if (status) params.set("status", status);
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const res = await fetch(`/api/webhook-events?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as WebhookEventsResponse;
        setEvents((prev) => (append ? [...prev, ...data.events] : data.events));
        setNextCursor(data.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load webhook events");
      } finally {
        setLoading(false);
      }
    },
    [shop, type, status, from, to],
  );

  useEffect(() => { void fetchEvents(); }, [fetchEvents]);

  return (
    <main className="min-h-dvh bg-gate-bg text-gate-ink">
      {/* eslint-disable-next-line ds/container-widths-only-at -- PM-0001 operator tool, no DS provider */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Webhook events</h1>
        <WebhookFilters
          shop={shop} type={type} status={status} from={from} to={to}
          onShop={setShop} onType={setType} onStatus={setStatus}
          onFrom={setFrom} onTo={setTo}
        />
        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            Error loading webhook events: {error}
          </div>
        )}
        <WebhookTable events={events} loading={loading} />
        {nextCursor && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => { void fetchEvents(nextCursor, true); }}
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
