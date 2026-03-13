/* eslint-disable ds/no-hardcoded-copy, ds/no-raw-tailwind-color, ds/min-tap-size -- PM-0001 internal operator tool, English-only, no public-facing i18n requirement [ttl=2027-12-31] */
"use client";

/**
 * /orders/:orderId — Payment Manager order detail
 *
 * Shows full metadata, line items, transaction IDs, and refund history.
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface Refund {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  providerRefundId: string | null;
  reason: string | null;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  shopId: string;
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
  customerEmail: string | null;
  providerOrderId: string | null;
  lineItemsJson: unknown;
  createdAt: string;
  updatedAt: string;
  refunds: Refund[];
}

interface OrderDetailResponse {
  order: OrderDetail;
}

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

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-t border-gate-border py-3 text-sm">
      <span className="w-40 shrink-0 text-gate-muted">{label}</span>
      <span className="break-all text-gate-ink">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
    resolved: "bg-blue-100 text-blue-800",
    succeeded: "bg-green-100 text-green-800",
  };
  const cls = colorMap[status] ?? "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function LineItemsSection({ lineItems, currency }: { lineItems: unknown[]; currency: string }) {
  if (lineItems.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-medium text-gate-muted">Line items</h2>
      <div className="overflow-x-auto rounded border border-gate-border">
        <table className="w-full text-sm">
          <thead className="bg-gate-surface text-gate-muted">
            <tr>
              <th className="px-4 py-2 text-start font-medium">Product</th>
              <th className="px-4 py-2 text-start font-medium">SKU</th>
              <th className="px-4 py-2 text-end font-medium">Qty</th>
              <th className="px-4 py-2 text-end font-medium">Unit price</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, i) => {
              const li = item as { productId?: string; sku?: string; qty?: number; unitCents?: number };
              return (
                <tr key={i} className="border-t border-gate-border">
                  <td className="px-4 py-2 font-mono text-xs">{li.productId ?? "—"}</td>
                  <td className="px-4 py-2 font-mono text-xs">{li.sku ?? "—"}</td>
                  <td className="px-4 py-2 text-end tabular-nums">{li.qty ?? "—"}</td>
                  <td className="px-4 py-2 text-end tabular-nums">
                    {li.unitCents !== undefined ? formatAmount(li.unitCents, currency) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RefundHistorySection({ refunds }: { refunds: Refund[] }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-medium text-gate-muted">Refund history</h2>
      {refunds.length === 0 ? (
        <p className="text-sm text-gate-muted">No refunds issued for this order.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-gate-border">
          <table className="w-full text-sm">
            <thead className="bg-gate-surface text-gate-muted">
              <tr>
                <th className="px-4 py-2 text-start font-medium">Date</th>
                <th className="px-4 py-2 text-end font-medium">Amount</th>
                <th className="px-4 py-2 text-start font-medium">Status</th>
                <th className="px-4 py-2 text-start font-medium">Refund ID</th>
                <th className="px-4 py-2 text-start font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund) => (
                <tr key={refund.id} className="border-t border-gate-border">
                  <td className="px-4 py-2 text-gate-muted">{formatDate(refund.createdAt)}</td>
                  <td className="px-4 py-2 text-end tabular-nums">
                    {formatAmount(refund.amountCents, refund.currency)}
                  </td>
                  <td className="px-4 py-2"><StatusBadge status={refund.status} /></td>
                  <td className="px-4 py-2 font-mono text-xs">{refund.providerRefundId ?? "—"}</td>
                  <td className="px-4 py-2 text-gate-muted">{refund.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnmasked, setShowUnmasked] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const url = showUnmasked ? `/api/orders/${orderId}?unmask=1` : `/api/orders/${orderId}`;
        const res = await fetch(url);
        if (res.status === 404) { setError("Order not found"); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as OrderDetailResponse;
        setOrder(data.order);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [orderId, showUnmasked]);

  if (loading) {
    return (
      <main className="min-h-dvh bg-gate-bg text-gate-ink">
        {/* eslint-disable-next-line ds/container-widths-only-at -- PM-0001 operator tool */}
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gate-surface" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-gate-surface" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-dvh bg-gate-bg text-gate-ink">
        {/* eslint-disable-next-line ds/container-widths-only-at -- PM-0001 operator tool */}
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error ?? "Order not found"}
          </div>
          <Link href="/orders" className="mt-4 inline-block text-sm text-gate-accent hover:underline">
            ← Back to orders
          </Link>
        </div>
      </main>
    );
  }

  const lineItems = Array.isArray(order.lineItemsJson) ? (order.lineItemsJson as unknown[]) : [];

  return (
    <main className="min-h-dvh bg-gate-bg text-gate-ink">
      {/* eslint-disable-next-line ds/container-widths-only-at -- PM-0001 operator tool */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/orders" className="mb-4 inline-block text-sm text-gate-accent hover:underline">
          ← Back to orders
        </Link>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Order detail</h1>
          <StatusBadge status={order.status} />
        </div>
        <div className="rounded border border-gate-border">
          <FieldRow label="Order ID" value={<span className="font-mono text-xs">{order.id}</span>} />
          <FieldRow label="Shop" value={order.shopId} />
          <FieldRow label="Provider" value={order.provider} />
          <FieldRow label="Amount"
            value={<span className="tabular-nums">{formatAmount(order.amountCents, order.currency)}</span>} />
          <FieldRow label="Customer email"
            value={
              <span className="flex items-center gap-3">
                <span className="font-mono text-xs">{order.customerEmail ?? "—"}</span>
                <button onClick={() => setShowUnmasked((v) => !v)}
                  className="text-xs text-gate-accent hover:underline">
                  {showUnmasked ? "Mask" : "Unmask"}
                </button>
              </span>
            } />
          <FieldRow label="Transaction ID"
            value={order.providerOrderId
              ? <span className="font-mono text-xs">{order.providerOrderId}</span>
              : "—"} />
          <FieldRow label="Created" value={formatDate(order.createdAt)} />
          <FieldRow label="Updated" value={formatDate(order.updatedAt)} />
        </div>
        <LineItemsSection lineItems={lineItems} currency={order.currency} />
        <RefundHistorySection refunds={order.refunds} />
      </div>
    </main>
  );
}
