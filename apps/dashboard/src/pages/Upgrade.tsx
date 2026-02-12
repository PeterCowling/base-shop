"use client";
/* eslint-disable ds/enforce-layout-primitives, ds/no-arbitrary-tailwind, ds/absolute-parent-guard, ds/no-nonlayered-zindex, ds/container-widths-only-at, ds/min-tap-size, react-hooks/exhaustive-deps -- DASH-3200 legacy upgrade dashboard layout uses bespoke sizing/z-index [ttl=2026-06-30] */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

import { useTranslations } from "@acme/i18n";
import {
  type UpgradeComponent,
  upgradeComponentSchema,
} from "@acme/types/upgrade";

import { trackEvent } from "../lib/telemetry";

interface ComponentGroups {
  [group: string]: UpgradeComponent[];
}

export default function Upgrade() {
  const router = useRouter();
  const t = useTranslations();
  const shopId = useMemo(() => {
    const raw = router.query?.id;
    if (Array.isArray(raw)) return raw[0];
    return raw ? String(raw) : undefined;
  }, [router.query?.id]);
  const [groups, setGroups] = useState<ComponentGroups>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">(
    "idle"
  );
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastResponseStatus, setLastResponseStatus] = useState<number | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [prefillAppliedShop, setPrefillAppliedShop] = useState<string | null>(null);
  const [autoConfirmShown, setAutoConfirmShown] = useState(false);
  const loadAbortRef = useRef<AbortController | null>(null);

  const loadDiff = useCallback(
    async (id?: string) => {
      if (!id) return;
      loadAbortRef.current?.abort();
      const controller = new AbortController();
      loadAbortRef.current = controller;
      setLoadState("loading");
      setLoadError("");
      setIsForbidden(false);
      setStatus("idle");
      setMessage("");
      setGroups({});
      setSelected(new Set());
      trackEvent("upgrade_diff_load_start", { shopId: id });
      try {
        const res = await fetch(
          `/api/shop/${encodeURIComponent(id)}/component-diff`,
          { signal: controller.signal }
        );
        setLastResponseStatus(res.status);
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setIsForbidden(true);
          }
          const text = await res.text().catch(() => "");
          throw new Error(
            res.status === 401 || res.status === 403
              ? "forbidden"
              : text || "load_failed"
          );
        }
        const data = await res.json();
        if (!isValidUpgradeGroups(data)) throw new Error("invalid_payload");
        setGroups(data);
        setLoadState("idle");
        setLastRefreshed(new Date().toISOString());
        trackEvent("upgrade_diff_load_success", {
          shopId: id,
          componentCount: Object.values(data).reduce(
            (sum, comps) => sum + comps.length,
            0
          ),
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(t("cms.upgrade.loadError"), err);
        setLoadState("error");
        const message =
          err instanceof Error && err.message === "forbidden"
            ? "You do not have access to this shop."
            : String(t("cms.upgrade.loadError"));
        setLoadError(message);
        trackEvent("upgrade_diff_load_fail", {
          shopId: id,
          error: err instanceof Error ? err.message : "unknown",
        });
      }
    },
    [t]
  );

  useEffect(() => {
    if (!shopId) {
      setGroups({});
      setSelected(new Set());
      setLoadState("idle");
      setLoadError("");
      setStatus("idle");
      setMessage("");
      setLastRefreshed(null);
      setIsForbidden(false);
      setPrefillAppliedShop(null);
      return;
    }

    void loadDiff(shopId);
    return () => {
      loadAbortRef.current?.abort();
    };
    // loadDiff intentionally omitted to avoid effect churn if its identity changes;
    // it already closes over the latest translator.
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return;
    if (prefillAppliedShop === shopId) return;
    const desired = parsePrefill(router.query.components);
    if (!desired.size) return;
    const available = new Map<string, string>(); // lower -> file
    for (const comps of Object.values(groups)) {
      for (const comp of comps) {
        available.set(comp.file.toLowerCase(), comp.file);
        if (comp.componentName) {
          available.set(comp.componentName.toLowerCase(), comp.file);
        }
      }
    }
    const next = new Set<string>();
    desired.forEach((token) => {
      const match = available.get(token.toLowerCase());
      if (match) next.add(match);
    });
    if (next.size > 0) {
      setSelected(next);
      setPrefillAppliedShop(shopId);
    }
  }, [groups, router.query.components, prefillAppliedShop, shopId]);

  useEffect(() => {
    const autoConfirm =
      router.query.confirm === "true" ||
      router.query.confirm === "1" ||
      router.query.confirm === "yes";
    if (!autoConfirm) return;
    if (autoConfirmShown) return;
    if (selected.size === 0) return;
    setShowConfirm(true);
    setAutoConfirmShown(true);
  }, [router.query.confirm, selected.size, autoConfirmShown]);

  function toggle(file: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(file)) {
        next.delete(file);
      } else {
        next.add(file);
      }
      return next;
    });
  }

  async function publish() {
    if (!shopId) return;
    setShowConfirm(false);
    setStatus("loading");
    setMessage("");
    const startedAt = performance.now();
    trackEvent("upgrade_publish_start", {
      shopId,
      selectionSize: selected.size,
    });
    try {
      const res = await fetch(`/api/shop/${encodeURIComponent(shopId)}/publish-upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ components: Array.from(selected) }),
      });
      setLastResponseStatus(res.status);
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error("Upgrade publish failed", {
          status: res.status,
          body: errorText,
        });
        trackEvent("upgrade_publish_fail", {
          shopId,
          selectionSize: selected.size,
          status: res.status,
          durationMs: performance.now() - startedAt,
        });
        throw new Error(res.status >= 400 && res.status < 500 ? "publish_failed_client" : "publish_failed_server");
      }
      setStatus("success");
      setMessage(String(t("upgrade.publishSuccess")));
      trackEvent("upgrade_publish_success", {
        shopId,
        selectionSize: selected.size,
        status: res.status,
        durationMs: performance.now() - startedAt,
      });
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error && err.message === "publish_failed_client"
          ? "Publish failed. Check access or payload and try again."
          : String(t("upgrade.publishFailed"))
      );
    }
  }

  const totalComponents = useMemo(
    () =>
      Object.values(groups).reduce(
        (sum, comps) => sum + (Array.isArray(comps) ? comps.length : 0),
        0
      ),
    [groups]
  );
  const showEmptyState =
    loadState === "idle" && !loadError && totalComponents === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-fg-muted">Shop</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded bg-fg px-3 py-1 text-sm font-semibold text-bg">
              {shopId ?? "Unknown"}
            </span>
            <span className="rounded-full bg-bg-4 px-3 py-1 text-xs font-semibold text-fg-muted">
              {totalComponents} pending
            </span>
            <StatusPill
              status={
                loadState === "loading"
                  ? "loading"
                  : isForbidden
                    ? "forbidden"
                    : loadError
                      ? "error"
                      : status === "loading"
                        ? "publishing"
                        : status === "error"
                          ? "publish_error"
                          : status === "success"
                            ? "success"
                            : "idle"
              }
            />
          </div>
          <p className="text-xs text-fg-muted">
            Last updated:{" "}
            {lastRefreshed ? new Date(lastRefreshed).toLocaleString() : "Not yet"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadDiff(shopId)}
            disabled={loadState === "loading"}
            className="inline-flex items-center gap-2 rounded border border-border bg-bg px-3 py-2 text-sm font-semibold text-fg shadow-sm transition hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="h-2 w-2 rounded-full bg-fg-muted" />
            Refresh
          </button>
          {status === "success" && (
            <span className="text-xs font-medium text-success-fg">
              Published successfully.
            </span>
          )}
        </div>
      </header>

      <div className="space-y-4 rounded-lg border border-border bg-bg/70 p-4 shadow-sm">
        {loadState === "loading" && (
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <p>{t("cms.upgrade.preparing")}</p>
          </div>
        )}
        {isForbidden && (
          <div className="rounded border border-warning bg-warning-soft p-3 text-warning-fg">
            <p className="font-semibold">You don&apos;t have access to this shop.</p>
            <p className="text-sm">Sign in again or request access to continue.</p>
          </div>
        )}
        {loadError && !isForbidden && (
          <div className="rounded border border-danger bg-danger-soft p-3 text-danger-fg">
            <p>{loadError}</p>
            <button
              onClick={() => loadDiff(shopId)}
              className="mt-2 inline-flex items-center gap-2 rounded border border-danger bg-bg px-3 py-1 text-sm font-semibold text-danger-fg transition hover:border-danger"
            >
              Retry
            </button>
          </div>
        )}
        {showEmptyState && (
          <div className="flex items-center gap-3 rounded-md border border-border bg-bg-2 px-3 py-4">
            <div className="h-10 w-10 rounded-full bg-bg/80 shadow-inner" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium text-fg">
                {t("cms.upgrade.noUpdates")}
              </p>
              <p className="text-sm text-fg-muted">
                {t("cms.upgrade.stepsBackground")}
              </p>
            </div>
          </div>
        )}
        {totalComponents > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(groups).map(([group, components]) => (
              <UpgradeGroupTable
                key={group}
                group={group}
                components={components}
                selected={selected}
                toggle={toggle}
              />
            ))}
          </div>
        )}
      </div>
      {selected.size > 0 && (
        <div className="space-y-3 rounded-lg border border-border bg-bg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-fg">
              {t("upgrade.selectedComponents")}
            </h2>
            <span className="text-sm text-fg-muted">
              {selected.size} selected
            </span>
          </div>
          <ul className="list-disc space-y-1 pl-4 text-fg">
            {Array.from(selected).map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={status === "loading"}
              className="inline-flex min-h-11 min-w-24 items-center justify-center rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-primary/50"
            >
              {status === "loading"
                ? t("upgrade.publishing")
                : t("upgrade.publishCta")}
            </button>
            {status === "success" && (
              <p className="text-sm text-success-fg">{message}</p>
            )}
            {status === "error" && (
              <p className="text-sm text-danger-fg">{message}</p>
            )}
          </div>
        </div>
      )}
      {showConfirm && (
        <ConfirmModal
          onConfirm={publish}
          onCancel={() => setShowConfirm(false)}
          selected={Array.from(selected)}
          message={
            status === "error" && lastResponseStatus
              ? lastResponseStatus >= 400 && lastResponseStatus < 500
                ? "Previous publish failed due to permissions or validation. Double-check and retry."
                : "Previous publish failed. You can retry now."
              : undefined
          }
        />
      )}
    </div>
  );
}

function isValidUpgradeGroups(payload: unknown): payload is ComponentGroups {
  if (!payload || typeof payload !== "object") return false;
  return Object.values(payload as Record<string, unknown>).every((group) => {
    if (!Array.isArray(group)) return false;
    return group.every((item) => upgradeComponentSchema.safeParse(item).success);
  });
}

function StatusPill({
  status,
}: {
  status:
    | "idle"
    | "loading"
    | "error"
    | "forbidden"
    | "publishing"
    | "publish_error"
    | "success";
}) {
  const map: Record<
    typeof status,
    { label: string; className: string }
  > = {
    idle: { label: "Idle", className: "bg-bg-4 text-fg-muted" },
    loading: { label: "Loading", className: "bg-info-soft text-info-fg" },
    forbidden: { label: "No access", className: "bg-warning-soft text-warning-fg" },
    error: { label: "Error", className: "bg-danger-soft text-danger-fg" },
    publish_error: { label: "Publish failed", className: "bg-danger-soft text-danger-fg" },
    publishing: { label: "Publishing", className: "bg-info-soft text-info-fg" },
    success: { label: "Healthy", className: "bg-success-soft text-success-fg" },
  };
  const cfg = map[status];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function parsePrefill(value: unknown): Set<string> {
  if (!value) return new Set();
  if (Array.isArray(value)) {
    return value.reduce((acc, item) => {
      if (typeof item === "string") {
        item.split(",").forEach((part) => {
          const trimmed = part.trim();
          if (trimmed) acc.add(trimmed);
        });
      }
      return acc;
    }, new Set<string>());
  }
  if (typeof value === "string") {
    return new Set(
      value
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
    );
  }
  return new Set();
}

function UpgradeGroupTable({
  group,
  components,
  selected,
  toggle,
}: {
  group: string;
  components: UpgradeComponent[];
  selected: Set<string>;
  toggle: (file: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-border bg-bg-2/80 p-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold capitalize text-fg">{group}</h2>
        <span className="rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-fg-muted">
          {components.length}
        </span>
      </div>
      <div className="overflow-hidden rounded border border-border bg-bg">
        <div className="grid grid-cols-[24px,1.5fr,1fr,1fr] gap-2 bg-bg-2 px-3 py-2 text-xs font-semibold text-fg-muted">
          <span aria-hidden />
          <span>Component</span>
          <span>Current</span>
          <span>New</span>
        </div>
        <ul className="divide-y divide-border-muted">
          {components.map((c) => (
            <li key={c.file} className="grid grid-cols-[24px,1.5fr,1fr,1fr] items-center gap-2 px-3 py-2 text-sm text-fg">
              <input
                type="checkbox"
                aria-label={`Select ${c.componentName}`}
                checked={selected.has(c.file)}
                onChange={() => toggle(c.file)}
              />
              <div className="space-y-1">
                <p className="font-medium">{c.componentName}</p>
                <p className="text-xs text-fg-muted break-all">{c.file}</p>
              </div>
              <span className="text-xs text-fg-muted break-all">
                {c.oldChecksum ?? "—"}
              </span>
              <span className="text-xs font-mono text-fg break-all">
                {c.newChecksum}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ConfirmModal({
  onConfirm,
  onCancel,
  selected,
  message,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  selected: string[];
  message?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay-scrim-1 p-4">
      <div className="w-full max-w-lg space-y-4 rounded-lg border border-border bg-bg p-5 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-fg">Confirm publish</h2>
          <p className="text-sm text-fg-muted">
            You&apos;re about to publish the selected components. Review the list before continuing.
          </p>
        </div>
        {message && <p className="rounded bg-warning-soft px-3 py-2 text-sm text-warning-fg">{message}</p>}
        <ul className="max-h-48 overflow-y-auto rounded border border-border bg-bg-2 px-3 py-2 text-sm text-fg">
          {selected.map((file) => (
            <li key={file} className="py-1">
              {file}
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded border border-border bg-bg px-4 py-2 text-sm font-semibold text-fg hover:border-border-strong"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover"
          >
            Publish now
          </button>
        </div>
      </div>
    </div>
  );
}
