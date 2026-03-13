/* eslint-disable ds/no-hardcoded-copy, ds/no-raw-tailwind-color, ds/container-widths-only-at -- PM-0001 internal operator tool, English-only, no public-facing i18n requirement [ttl=2027-12-31] */
"use client";

/**
 * /shops — Payment Manager shop list
 *
 * Shows all shops with their active payment provider and a link to per-shop config.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

interface ShopSummary {
  shopId: string;
  activeProvider: string;
  updatedAt: string;
}

interface ShopsResponse {
  shops: ShopSummary[];
}

function ProviderBadge({ provider }: { provider: string }) {
  const colorMap: Record<string, string> = {
    stripe: "bg-blue-100 text-blue-800",
    axerve: "bg-purple-100 text-purple-800",
    disabled: "bg-gray-100 text-gray-600",
  };
  const cls = colorMap[provider] ?? "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {provider}
    </span>
  );
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

export default function ShopsPage() {
  const [shops, setShops] = useState<ShopSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/shops");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ShopsResponse;
        setShops(data.shops);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load shops");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <main className="min-h-dvh bg-gate-bg text-gate-ink">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold">Shop configuration</h1>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded border border-gate-border bg-gate-surface" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : shops.length === 0 ? (
          <p className="text-sm text-gate-muted">No shops configured.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-gate-border">
            <table className="w-full text-sm">
              <thead className="bg-gate-surface text-gate-muted">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">Shop</th>
                  <th className="px-4 py-3 text-start font-medium">Active provider</th>
                  <th className="px-4 py-3 text-start font-medium">Last updated</th>
                  <th className="px-4 py-3 text-end font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => (
                  <tr key={shop.shopId} className="border-t border-gate-border">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{shop.shopId}</td>
                    <td className="px-4 py-3">
                      <ProviderBadge provider={shop.activeProvider} />
                    </td>
                    <td className="px-4 py-3 text-gate-muted">{formatDate(shop.updatedAt)}</td>
                    <td className="px-4 py-3 text-end">
                      <Link
                        href={`/shops/${shop.shopId}`}
                        className="text-xs text-gate-accent hover:underline"
                      >
                        Configure →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
