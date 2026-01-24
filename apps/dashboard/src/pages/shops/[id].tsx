import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@acme/design-system/primitives";

import Upgrade from "../Upgrade";

type ShopSummary = {
  id: string;
  name: string;
  region?: string | null;
  lastUpgrade?: string | null;
  status?: "ready" | "failed" | "up_to_date" | "unknown";
};

type HistoryEntry = {
  id: string;
  shopId: string;
  status: "success" | "failed";
  timestamp: string;
  components?: string[];
  user?: string;
  duration?: string;
  error?: string;
};

export default function ShopDetail() {
  const router = useRouter();
  const { id } = router.query;
  const shopId = Array.isArray(id) ? id[0] : id ?? "unknown";
  const [meta, setMeta] = useState<ShopSummary | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("loading");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"diff" | "history" | "metrics">("diff");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyState, setHistoryState] = useState<"idle" | "loading" | "error">("idle");
  const [historyError, setHistoryError] = useState("");
  const [retryTarget, setRetryTarget] = useState<HistoryEntry | null>(null);
  const [retryStatus, setRetryStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [retryMessage, setRetryMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const baseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL ?? "";
    async function load() {
      setState("loading");
      setError("");
      try {
        const res = await fetch(joinApi(baseUrl, "/api/dashboard/shops"));
        if (!res.ok) throw new Error(`status_${res.status}`);
        const data = (await res.json()) as unknown;
        if (!Array.isArray(data)) throw new Error("invalid_payload");
        const found = data
          .map((item) => normalizeShop(item))
          .find((s) => s?.id === shopId);
        if (cancelled) return;
        setMeta(found ?? null);
        setState("idle");
      } catch {
        if (cancelled) return;
        setState("error");
        setError("Could not load shop metadata.");
      }
    }
    if (shopId && shopId !== "unknown") {
      void load();
    } else {
      setState("idle");
    }
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  useEffect(() => {
    if (activeTab !== "history") return;
    let cancelled = false;
    const baseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL ?? "";
    async function loadHistory() {
      setHistoryState("loading");
      setHistoryError("");
      try {
        const res = await fetch(
          joinApi(baseUrl, `/api/dashboard/shop/${shopId}/upgrade-history`)
        );
        if (!res.ok) throw new Error(`status_${res.status}`);
        const data = (await res.json()) as unknown;
        const parsed = Array.isArray(data)
          ? data
              .map((item) => normalizeHistory(item, shopId))
              .filter((h): h is HistoryEntry => Boolean(h))
          : [];
        if (cancelled) return;
        setHistory(parsed);
        setHistoryState("idle");
      } catch {
        if (cancelled) return;
        setHistoryState("error");
        setHistoryError("Could not load history.");
      }
    }
    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [activeTab, shopId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-slate-900">
            Shop {meta?.name ?? shopId}
          </h1>
          <p className="text-sm text-slate-700">
            Diff, history, and metrics tabs. Diff uses the existing Upgrade experience.
          </p>
          {state === "loading" && (
            <p className="text-xs text-slate-600">Loading shop context…</p>
          )}
          {state === "error" && (
            <p className="text-xs text-danger">{error}</p>
          )}
          {state === "idle" && meta && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
              <StatusBadge status={meta.status ?? "unknown"} />
              {meta.region && <span>Region: {meta.region}</span>}
              {meta.lastUpgrade && (
                <span>
                  Last upgrade: {new Date(meta.lastUpgrade).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
        <Link
          href="/shops"
          className="rounded border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300"
        >
          Back to shops
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
        <TabButton label="Diff" active={activeTab === "diff"} onClick={() => setActiveTab("diff")} />
        <TabButton label="History" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
        <TabButton label="Metrics (coming soon)" active={activeTab === "metrics"} onClick={() => setActiveTab("metrics")} />
      </div>
      {activeTab === "diff" && <Upgrade />}
      {activeTab === "history" && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">History</h2>
          {retryStatus !== "idle" && (
            <p
              className={`text-xs ${
                retryStatus === "success" ? "text-success" : "text-danger"
              }`}
            >
              {retryMessage}
            </p>
          )}
          {historyState === "loading" && (
            <p className="text-xs text-slate-600">Loading history…</p>
          )}
          {historyState === "error" && (
            <p className="text-xs text-danger">{historyError}</p>
          )}
          {historyState === "idle" && history.length === 0 && (
            <p className="text-sm text-slate-700">No history yet.</p>
          )}
          {historyState === "error" && (
            <p className="text-xs text-amber-700">
              If the CMS base URL is missing or unreachable, history and retry may fail.
            </p>
          )}
          <ul className="divide-y divide-slate-200">
            {history.map((job) => (
              <li key={job.id} className="space-y-1 py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">{job.id}</span>
                  <StatusBadge status={job.status === "failed" ? "failed" : "up_to_date"} />
                  <span>{new Date(job.timestamp).toLocaleString()}</span>
                  {job.user && <span>User: {job.user}</span>}
                  {job.duration && <span>Duration: {job.duration}</span>}
                </div>
                <p className="text-sm text-slate-800">
                  Components: {(job.components ?? []).join(", ") || "—"}
                </p>
                {job.error && <p className="text-sm text-danger">Error: {job.error}</p>}
                <div className="flex flex-wrap gap-2 text-xs">
                  <Link
                    className="rounded border border-blue-200 px-2 py-1 font-semibold text-blue-700 hover:border-blue-300 hover:text-blue-900"
                    href={`/Upgrade?id=${encodeURIComponent(shopId)}${
                      job.components && job.components.length
                        ? `&components=${encodeURIComponent(job.components.join(","))}`
                        : ""
                    }`}
                  >
                    Retry in Diff
                  </Link>
                  <button
                    type="button"
                    className="min-h-11 min-w-11 rounded border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-900"
                    onClick={() => {
                      setRetryTarget(job);
                      setRetryStatus("idle");
                      setRetryMessage("");
                    }}
                  >
                    Retry publish
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {activeTab === "metrics" && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-700">
          Metrics coming soon.
        </div>
      )}
      {retryTarget && (
        <RetryModal
          entry={retryTarget}
          shopId={shopId}
          onCancel={() => setRetryTarget(null)}
          onConfirm={async () => {
            const baseUrl = process.env.NEXT_PUBLIC_CMS_BASE_URL ?? "";
            setRetryStatus("loading");
            setRetryMessage("");
            try {
              const res = await fetch(
                joinApi(baseUrl, `/api/dashboard/shop/${shopId}/publish-upgrade`),
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    components: retryTarget.components ?? [],
                  }),
                }
              );
              if (!res.ok) {
                throw new Error(`status_${res.status}`);
              }
              setRetryStatus("success");
              setRetryMessage("Publish triggered successfully.");
              setRetryTarget(null);
            } catch (err) {
              setRetryStatus("error");
              setRetryMessage(
                err instanceof Error ? err.message : "Publish failed."
              );
            }
          }}
        />
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-3 py-1 ${
        active
          ? "bg-blue-50 text-blue-800"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: "ready" | "failed" | "up_to_date" | "unknown";
}) {
  const map: Record<typeof status, string> = {
    ready: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-danger",
    up_to_date: "bg-blue-100 text-blue-800",
    unknown: "bg-slate-100 text-slate-700",
  };
  const label: Record<typeof status, string> = {
    ready: "Needs review",
    failed: "Failed",
    up_to_date: "Up to date",
    unknown: "Unknown",
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${map[status]}`}>
      {label[status]}
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
    region: typeof obj.region === "string" ? obj.region : null,
    lastUpgrade: typeof obj.lastUpgrade === "string" ? obj.lastUpgrade : null,
    status:
      status === "failed" || status === "up_to_date" || status === "ready"
        ? status
        : "unknown",
  };
}

function normalizeHistory(entry: unknown, shopId: string): HistoryEntry | null {
  if (!entry || typeof entry !== "object") return null;
  const obj = entry as Record<string, unknown>;
  if (typeof obj.id !== "string") return null;
  if (typeof obj.timestamp !== "string") return null;
  const status = obj.status === "failed" ? "failed" : "success";
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

function RetryModal({
  entry,
  shopId,
  onCancel,
  onConfirm,
}: {
  entry: HistoryEntry;
  shopId: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader className="text-start">
          <DialogTitle className="text-lg font-semibold text-slate-900">
            Retry publish
          </DialogTitle>
          <p className="text-sm text-slate-700">
            You are retrying job {entry.id} for shop {shopId}. Selected components:
          </p>
        </DialogHeader>
        <ul className="list-disc space-y-1 rounded bg-slate-50 px-3 py-2 text-sm text-slate-800">
          {(entry.components ?? []).length === 0 && <li>None specified</li>}
          {(entry.components ?? []).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {entry.error && (
          <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Last error: {entry.error}
          </p>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 min-w-11 rounded border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className="min-h-11 min-w-11 rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Retry publish
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
