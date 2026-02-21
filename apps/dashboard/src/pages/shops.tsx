/* eslint-disable ds/container-widths-only-at, ds/no-arbitrary-tailwind -- DASH-3201 dashboard demo tables use custom widths [ttl=2026-06-30] */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { trackEvent } from "../lib/telemetry";

type ShopListItem = {
  id: string;
  name: string;
  region?: string | null;
  lastUpgrade?: string | null;
  pending?: number;
  status?: "ready" | "failed" | "up_to_date" | "unknown";
  lastResult?: "success" | "failed";
};

export default function ShopsPage() {
  const [query, setQuery] = useState("");
  const [shops, setShops] = useState<ShopListItem[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [historyMap, setHistoryMap] = useState<Record<string, { status: "success" | "failed"; timestamp: string }>>({});

  useEffect(() => {
    let cancelled = false;
    const baseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL ?? "";
    async function load() {
      setState("loading");
      setError("");
      trackEvent("shops_index_load_start");
      try {
        const res = await fetch(joinApi(baseUrl, "/api/dashboard/shops"));
        if (!res.ok) throw new Error(`status_${res.status}`);
        const data = (await res.json()) as unknown;
        const parsed = Array.isArray(data)
          ? data
              .map((item) => normalizeShop(item))
              .filter((s): s is ShopListItem => Boolean(s))
          : null;
        if (!parsed) throw new Error("invalid_payload");
        if (cancelled) return;
        setShops(parsed);
        setState("idle");
        trackEvent("shops_index_load_success", { count: parsed.length });
        // fetch latest history per shop, best-effort
        void loadHistories(parsed, baseUrl, (map) => {
          if (cancelled) return;
          setHistoryMap(map);
        });
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setError("Could not load shops. Check CMS base URL or network.");
        setShops([]);
        trackEvent("shops_index_load_fail", {
          error: err instanceof Error ? err.message : "unknown",
        });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return shops.filter((shop) => {
      const term = query.toLowerCase();
      return (
        shop.id.toLowerCase().includes(term) ||
        (shop.name ?? "").toLowerCase().includes(term) ||
        (shop.region ?? "").toLowerCase().includes(term)
      );
    });
  }, [query, shops]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-bg p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-fg">Shops</h1>
        <p className="text-sm text-fg-muted">
          Multi-shop entry point. Pulls from /api/shops; shows an empty state on failure.
        </p>
        {state === "loading" && (
          <p className="text-xs text-fg-muted">Loading shops…</p>
        )}
        {state === "error" && (
          <p className="text-xs text-danger-fg">{error}</p>
        )}
      </div>
      <div className="rounded-lg border border-border bg-bg p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, id, or region"
            className="w-full max-w-sm rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <Link
            href="/Upgrade"
            className="inline-flex w-fit items-center rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover"
          >
            Go to Upgrade
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded border border-border">
          <div className="grid grid-cols-[1.5fr,1fr,1fr,1fr,120px] bg-bg-2 px-3 py-2 text-xs font-semibold text-fg-muted">
            <span>Name</span>
            <span>Region</span>
            <span>Last upgrade</span>
            <span>Pending</span>
            <span>Status</span>
          </div>
          <ul className="divide-y divide-border-muted">
            {filtered.map((shop) => (
              <li key={shop.id} className="grid grid-cols-[1.5fr,1fr,1fr,1fr,120px] items-center gap-2 px-3 py-3 text-sm text-fg">
                <div className="space-y-0.5">
                  <p className="font-semibold">{shop.name ?? shop.id}</p>
                  <p className="text-xs text-fg-muted">{shop.id}</p>
                </div>
                <span className="text-xs text-fg-muted">{shop.region ?? "—"}</span>
                <span className="text-xs text-fg-muted">
                  {shop.lastUpgrade ? new Date(shop.lastUpgrade).toLocaleString() : "—"}
                </span>
                <span className="text-xs text-fg-muted">{shop.pending ?? 0}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={shop.status ?? "unknown"} />
                  {historyMap[shop.id] && (
                    <span className="text-xs text-fg-muted">
                      Last publish: {historyMap[shop.id].status === "failed" ? "Failed" : "Success"} @{" "}
                      {new Date(historyMap[shop.id].timestamp).toLocaleString()}
                    </span>
                  )}
                  <Link
                    href={`/shops/${shop.id}`}
                    className="text-xs font-semibold text-link hover:text-link"
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-3 text-sm text-fg-muted">No shops found.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "ready" | "failed" | "up_to_date" | "unknown";
}) {
  const map: Record<typeof status, string> = {
    ready: "bg-success-soft text-success-fg",
    failed: "bg-danger-soft text-danger-fg",
    up_to_date: "bg-info-soft text-info-fg",
    unknown: "bg-bg-4 text-fg-muted",
  };
  const label: Record<typeof status, string> = {
    ready: "Needs review",
    failed: "Failed",
    up_to_date: "Up to date",
    unknown: "Unknown",
  };
  return (
    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${map[status]}`}>
      {label[status]}
    </span>
  );
}

function normalizeShop(input: unknown): ShopListItem | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  if (typeof obj.id !== "string") return null;
  const status = obj.status;
  return {
    id: obj.id,
    name: typeof obj.name === "string" ? obj.name : obj.id,
    region: typeof obj.region === "string" ? obj.region : null,
    lastUpgrade: typeof obj.lastUpgrade === "string" ? obj.lastUpgrade : null,
    pending: typeof obj.pending === "number" ? obj.pending : 0,
    status:
      status === "failed" || status === "up_to_date" || status === "ready"
        ? status
        : "unknown",
  };
}

function joinApi(base: string, path: string) {
  if (!base) return path;
  return `${base.replace(/\/$/, "")}${path}`;
}

async function loadHistories(
  items: ShopListItem[],
  baseUrl: string,
  onComplete: (map: Record<string, { status: "success" | "failed"; timestamp: string }>) => void
) {
  const results = await Promise.allSettled(
    items.map(async (shop) => {
      const res = await fetch(joinApi(baseUrl, `/api/shop/${shop.id}/upgrade-history`));
      if (!res.ok) throw new Error(`history_${res.status}`);
      const data = (await res.json()) as unknown;
      if (!Array.isArray(data) || data.length === 0) return null;
      const entry = data[0] as Record<string, unknown>;
      const status: "success" | "failed" = entry.status === "failed" ? "failed" : "success";
      const timestamp =
        typeof entry.timestamp === "string" ? entry.timestamp : new Date().toISOString();
      return { shopId: shop.id, status, timestamp };
    })
  );

  const map: Record<string, { status: "success" | "failed"; timestamp: string }> = {};
  for (const res of results) {
    if (res.status === "fulfilled" && res.value) {
      map[res.value.shopId] = { status: res.value.status, timestamp: res.value.timestamp };
    }
  }
  onComplete(map);
}
