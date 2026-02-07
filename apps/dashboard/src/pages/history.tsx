import { useEffect, useState } from "react";

import { trackEvent } from "../lib/telemetry";

type ShopSummary = { id: string; name: string };

type HistoryEntry = {
  id: string;
  shopId: string;
  user?: string;
  status: "success" | "failed";
  duration?: string;
  timestamp: string;
  components?: string[];
  error?: string;
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadHistory();
    return () => {
      cancelled = true;
    };

    async function loadHistory() {
      const baseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL ?? "";
      setState("loading");
      setError("");
      trackEvent("history_load_start");
      try {
        const shops = await loadShops();
        const histories = await Promise.allSettled(
          shops.map(async (shop) => {
            const res = await fetch(
              joinApi(baseUrl, `/api/shop/${shop.id}/upgrade-history`)
            );
            if (!res.ok) {
              throw new Error(`history_${res.status}`);
            }
            const data = (await res.json()) as unknown;
            if (!Array.isArray(data)) return [];
            return data
              .map((item) => normalizeEntry(item, shop.id))
              .filter((e): e is HistoryEntry => Boolean(e));
          })
        );
        if (cancelled) return;
        const flattened = histories
          .flatMap((result) =>
            result.status === "fulfilled" ? result.value : []
          );
        if (flattened.length === 0 && histories.some((h) => h.status === "rejected")) {
          setError("Some histories could not be loaded.");
        }
        setEntries(flattened);
        setState("idle");
        trackEvent("history_load_success", { count: flattened.length });
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setError("Could not load history. Check CMS base URL or network.");
        trackEvent("history_load_fail", {
          error: err instanceof Error ? err.message : "unknown",
        });
      }
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Release history</h1>
        <p className="text-sm text-slate-700">
          Cross-shop publish history. Uses available shop list until a history endpoint is provided.
        </p>
        {state === "loading" && <p className="text-xs text-slate-600">Loading…</p>}
        {state === "error" && <p className="text-xs text-red-700">{error}</p>}
      </div>
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ul className="divide-y divide-slate-200">
          {entries.map((job) => (
            <li key={job.id} className="space-y-1 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                  {job.shopId}
                </span>
                <span className="text-xs text-slate-600">Job: {job.id}</span>
                <StatusBadge status={job.status} />
                <span className="text-xs text-slate-600">User: {job.user ?? "—"}</span>
                <span className="text-xs text-slate-600">Duration: {job.duration ?? "—"}</span>
                <span className="text-xs text-slate-600">
                  {new Date(job.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-800">
                Components: {(job.components ?? []).join(", ")}
              </p>
              {job.error && (
                <p className="text-sm text-red-700">Error: {job.error}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "success" | "failed" }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        status === "success"
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-700"
      }`}
    >
      {status === "success" ? "Success" : "Failed"}
    </span>
  );
}

async function loadShops(): Promise<ShopSummary[]> {
  const baseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL ?? "";
  const res = await fetch(joinApi(baseUrl, "/api/dashboard/shops"));
  if (!res.ok) throw new Error(`status_${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error("invalid_shops_payload");
  const shops = data
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      if (typeof obj.id !== "string") return null;
      return { id: obj.id, name: typeof obj.name === "string" ? obj.name : obj.id };
    })
    .filter((s): s is ShopSummary => Boolean(s));
  return shops;
}

function normalizeEntry(entry: unknown, shopId: string): HistoryEntry | null {
  if (!entry || typeof entry !== "object") return null;
  const obj = entry as Record<string, unknown>;
  if (typeof obj.id !== "string") return null;
  if (typeof obj.timestamp !== "string") return null;
  const status =
    obj.status === "failed" ? "failed" : "success";
  const components = Array.isArray(obj.components)
    ? obj.components.filter((c): c is string => typeof c === "string")
    : [];
  return {
    id: obj.id,
    shopId,
    status,
    timestamp: obj.timestamp,
    components,
    user: typeof obj.user === "string" ? obj.user : undefined,
    duration: typeof obj.duration === "string" ? obj.duration : undefined,
    error: typeof obj.error === "string" ? obj.error : undefined,
  };
}

function joinApi(base: string, path: string) {
  if (!base) return path;
  return `${base.replace(/\/$/, "")}${path}`;
}
