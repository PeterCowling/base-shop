/* eslint-disable ds/no-hardcoded-copy, ds/no-raw-tailwind-color, ds/min-tap-size, ds/enforce-layout-primitives -- PM-0001 internal operator tool, English-only, no public-facing i18n requirement [ttl=2027-12-31] */
"use client";

/**
 * /analytics — Payment Manager analytics dashboard
 *
 * Shows aggregated payment metrics for the last 30 days (default).
 * Filterable by shop and date range.
 */

import { useCallback, useEffect, useState } from "react";

interface AnalyticsSummary {
  revenueCents: number;
  orderCount: number;
  completedCount: number;
  failedCount: number;
  failureRatePct: number;
  refundCount: number;
  refundAmountCents: number;
  refundRatePct: number;
  providerSplit: { stripe: number; axerve: number };
}

function formatCurrency(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

const inputCls =
  "rounded border border-gate-border bg-gate-input px-3 py-1.5 text-sm text-gate-ink placeholder:text-gate-muted focus:outline-none focus:ring-2 focus:ring-gate-accent";

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded border border-gate-border bg-gate-surface px-5 py-4">
      <p className="text-xs text-gate-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gate-muted">{sub}</p>}
    </div>
  );
}

function ProviderBar({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const widthPct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="capitalize text-gate-ink">{label}</span>
        <span className="text-gate-muted">
          {count} order{count !== 1 ? "s" : ""} ({widthPct}%)
        </span>
      </div>
      <div className="h-2 w-full rounded bg-gate-border">
        <div
          className="h-2 rounded bg-gate-accent"
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

function AnalyticsFilters({
  shop,
  from,
  to,
  loading,
  onShop,
  onFrom,
  onTo,
  onRefresh,
}: {
  shop: string;
  from: string;
  to: string;
  loading: boolean;
  onShop: (v: string) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <input
        type="text"
        placeholder="Filter by shop"
        value={shop}
        onChange={(e) => onShop(e.target.value)}
        className={inputCls}
      />
      <input
        type="date"
        value={from}
        onChange={(e) => onFrom(e.target.value)}
        className={inputCls}
      />
      <input
        type="date"
        value={to}
        onChange={(e) => onTo(e.target.value)}
        className={inputCls}
      />
      <button
        onClick={onRefresh}
        disabled={loading}
        className="rounded bg-gate-accent px-4 py-2 text-sm text-gate-on-accent hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}

function MetricsGrid({ data }: { data: AnalyticsSummary }) {
  const totalCompleted =
    (data.providerSplit.stripe ?? 0) + (data.providerSplit.axerve ?? 0);
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard
          label="Revenue (completed)"
          value={formatCurrency(data.revenueCents)}
        />
        <MetricCard
          label="Orders"
          value={String(data.orderCount)}
          sub={`${data.completedCount} completed, ${data.failedCount} failed`}
        />
        <MetricCard
          label="Failure rate"
          value={pct(data.failureRatePct)}
          sub={`${data.failedCount} failed orders`}
        />
        <MetricCard
          label="Refund rate"
          value={pct(data.refundRatePct)}
          sub={`${formatCurrency(data.refundAmountCents)} across ${data.refundCount} refund${data.refundCount !== 1 ? "s" : ""}`}
        />
      </div>

      <div className="rounded border border-gate-border bg-gate-surface px-5 py-4">
        <p className="mb-3 text-sm font-medium">Provider split (completed orders)</p>
        <div className="space-y-3">
          <ProviderBar
            label="Stripe"
            count={data.providerSplit.stripe}
            total={totalCompleted}
          />
          <ProviderBar
            label="Axerve"
            count={data.providerSplit.axerve}
            total={totalCompleted}
          />
        </div>
      </div>
    </>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (shop) params.set("shop", shop);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/analytics/summary?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AnalyticsSummary;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [shop, from, to]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  return (
    <main className="min-h-dvh bg-gate-bg text-gate-ink">
      {/* eslint-disable-next-line ds/container-widths-only-at -- PM-0001 operator tool, no DS provider */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Analytics</h1>
        <p className="mb-6 text-sm text-gate-muted">
          Aggregated payment metrics. Default view: last 30 days, all shops.
        </p>

        <AnalyticsFilters
          shop={shop}
          from={from}
          to={to}
          loading={loading}
          onShop={setShop}
          onFrom={setFrom}
          onTo={setTo}
          onRefresh={() => {
            void fetchSummary();
          }}
        />

        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded border border-gate-border bg-gate-surface px-5 py-4"
              >
                <div className="mb-2 h-3 w-24 animate-pulse rounded bg-gate-border" />
                <div className="h-7 w-32 animate-pulse rounded bg-gate-border" />
              </div>
            ))}
          </div>
        ) : data ? (
          <MetricsGrid data={data} />
        ) : null}
      </div>
    </main>
  );
}
