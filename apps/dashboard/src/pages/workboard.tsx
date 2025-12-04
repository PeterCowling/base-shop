/* eslint-disable ds/enforce-layout-primitives -- DASH-3202 dashboard cards use custom grid layout [ttl=2026-06-30] */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "../lib/telemetry";

type ShopSummary = {
  id: string;
  name: string;
  pending?: number;
  status?: "ready" | "failed" | "up_to_date" | "unknown";
  lastResult?: "success" | "failed";
};

type WorkboardShop = {
  id: string;
  name: string;
  pending: number;
  status: "needs_review" | "publishing" | "failed" | "done";
  lastResult?: "success" | "failed";
  lastTimestamp?: string;
};

export default function WorkboardPage() {
  const [shops, setShops] = useState<WorkboardShop[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [historyMap, setHistoryMap] = useState<
    Record<string, { status: "success" | "failed"; timestamp: string }>
  >({});

  useEffect(() => {
    let cancelled = false;
    const baseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL ?? "";
    async function load() {
      setState("loading");
      setError("");
      trackEvent("workboard_load_start");
      try {
        const res = await fetch(joinApi(baseUrl, "/api/dashboard/shops"));
        if (!res.ok) throw new Error(`status_${res.status}`);
        const data = (await res.json()) as unknown;
        const parsed = Array.isArray(data)
          ? data
              .map((item) => normalizeShop(item))
              .filter((s): s is ShopSummary => Boolean(s))
              .map(toWorkboardShop)
          : null;
        if (!parsed) throw new Error("invalid_payload");
        if (cancelled) return;
        setShops(parsed);
        setState("idle");
        trackEvent("workboard_load_success", { count: parsed.length });
        void loadHistories(parsed, baseUrl, (map) => {
          if (cancelled) return;
          setHistoryMap(map);
          setShops((prev) =>
            prev.map((shop) => ({
              ...shop,
              lastResult: map[shop.id]?.status,
              lastTimestamp: map[shop.id]?.timestamp,
              status:
                map[shop.id]?.status === "failed"
                  ? "failed"
                  : map[shop.id]?.status === "success"
                    ? "done"
                    : shop.status,
            }))
          );
        });
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setError("Could not load shops. Check CMS base URL or network.");
        setShops([]);
        trackEvent("workboard_load_fail", {
          error: err instanceof Error ? err.message : "unknown",
        });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const lanes = useMemo(
    () => [
      {
        title: "Needs review",
        key: "needs_review",
        shops: shops.filter((s) => s.status === "needs_review"),
      },
      {
        title: "Publishing",
        key: "publishing",
        shops: shops.filter((s) => s.status === "publishing"),
      },
      {
        title: "Failed",
        key: "failed",
        shops: shops.filter((s) => s.status === "failed"),
      },
      {
        title: "Done",
        key: "done",
        shops: shops.filter((s) => s.status === "done"),
      },
    ],
    [shops]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Workboard</h1>
        <p className="text-sm text-slate-700">
          Lightweight lanes to see where shops sit. Click a card to open its diff. (Drag/drop and bulk actions to come later.)
        </p>
        {state === "loading" && <p className="text-xs text-slate-600">Loading shops…</p>}
        {state === "error" && <p className="text-xs text-red-700">{error}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {lanes.map((lane) => (
          <div key={lane.key} className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">{lane.title}</h2>
              <span className="text-xs text-slate-600">{lane.shops.length}</span>
            </div>
            <div className="space-y-2">
              {lane.shops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/shops/${shop.id}`}
                  className="block rounded border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-blue-200 hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">{shop.name}</span>
                    <Badge status={shop.status} />
                  </div>
                  <p className="text-xs text-slate-600">{shop.id}</p>
                  <p className="text-xs text-slate-600">{shop.pending} pending</p>
                  {historyMap[shop.id] && (
                    <p className="text-xs text-slate-600">
                      Last publish:{" "}
                      {historyMap[shop.id].status === "failed" ? "Failed" : "Success"} @{" "}
                      {new Date(historyMap[shop.id].timestamp).toLocaleString()}
                    </p>
                  )}
                </Link>
              ))}
              {lane.shops.length === 0 && (
                <p className="text-xs text-slate-600">Nothing here yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ status }: { status: WorkboardShop["status"] }) {
  const map: Record<WorkboardShop["status"], string> = {
    needs_review: "bg-emerald-100 text-emerald-800",
    publishing: "bg-blue-100 text-blue-800",
    failed: "bg-red-100 text-red-700",
    done: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

function normalizeShop(input: unknown): ShopSummary | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  if (typeof obj.id !== "string") return null;
  const status = obj.status;
  return {
    id: obj.id,
    name: typeof obj.name === "string" ? obj.name : obj.id,
    pending: typeof obj.pending === "number" ? obj.pending : 0,
    status:
      status === "failed" || status === "up_to_date" || status === "ready"
        ? status
        : "unknown",
  };
}

function toWorkboardShop(shop: ShopSummary): WorkboardShop {
  const lane =
    shop.status === "failed"
      ? "failed"
      : shop.status === "up_to_date"
        ? "done"
        : "needs_review";
  return {
    id: shop.id,
    name: shop.name,
    pending: shop.pending ?? 0,
    status: lane,
  };
}

function joinApi(base: string, path: string) {
  if (!base) return path;
  return `${base.replace(/\/$/, "")}${path}`;
}

async function loadHistories(
  items: WorkboardShop[],
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
      const status = entry.status === "failed" ? "failed" : "success";
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
