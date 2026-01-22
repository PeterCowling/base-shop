"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Cluster, Stack } from "@acme/design-system/primitives";

import type { StageBLaneMeta } from "./stageBHelpers";
import type { CandidateDetailStrings } from "./types";

type LaneOption = {
  id: string;
  name: string;
  model: string;
  incoterm: string | null;
  latestVersion: {
    id: string;
    confidence: string | null;
    expiresAt: string | null;
    costBasis: string | null;
    costAmount: number | null;
    leadTimeBaseDays: number | null;
  } | null;
};

type LaneVersionDetail = {
  lane: {
    id: string;
    name: string;
    model: string;
    incoterm: string | null;
  } | null;
  version: {
    id: string;
    versionLabel: string | null;
    status: string | null;
    confidence: string | null;
    expiresAt: string | null;
    currency: string | null;
    sourceCurrency: string | null;
    fxRate: number | null;
    fxDate: string | null;
    fxSource: string | null;
    leadTimeBaseDays: number | null;
    costBasis: string | null;
    costAmount: number | null;
  };
};

function formatOptionLabel(lane: LaneOption): string {
  if (!lane.latestVersion) return lane.name;
  const version = lane.latestVersion;
  const confidence = version.confidence ?? "-";
  const costAmount =
    version.costAmount === null || version.costAmount === undefined
      ? "-"
      : String(version.costAmount);
  const costBasis = version.costBasis ?? "";
  const leadTime =
    version.leadTimeBaseDays === null || version.leadTimeBaseDays === undefined
      ? "-"
      : `${version.leadTimeBaseDays}d`;
  return `${lane.name} | ${confidence} | ${costAmount} ${costBasis} | ${leadTime}`;
}

function buildExpiryWarning(
  expiresAt: string | null | undefined,
  strings: CandidateDetailStrings["stageB"],
): string | null {
  if (!expiresAt) return null;
  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) return null;
  const diffMs = parsed.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / 86_400_000);
  if (diffDays < 0) {
    return strings.lane.warningExpired;
  }
  if (diffDays <= 14) {
    return strings.lane.warningExpiring.replace("{days}", String(diffDays));
  }
  return null;
}

function needsBasisWarning(costBasis: string | null | undefined): boolean {
  if (!costBasis) return false;
  const normalized = costBasis.toLowerCase();
  return !(normalized.includes("unit") || normalized.includes("/unit"));
}

function buildConfidenceWarning(
  confidence: string | null | undefined,
  strings: CandidateDetailStrings["stageB"],
): string | null {
  if (!confidence) return null;
  const normalized = confidence.toUpperCase();
  if (normalized === "C0" || normalized === "C1") {
    return strings.lane.warningLowConfidence.replace(
      "{confidence}",
      confidence,
    );
  }
  return null;
}

export default function StageBLaneApplyCard({
  laneMeta,
  disabled,
  strings,
  notAvailable,
  onApplied,
}: {
  laneMeta: StageBLaneMeta | null;
  disabled: boolean;
  strings: CandidateDetailStrings["stageB"];
  notAvailable: string;
  onApplied: (
    meta: StageBLaneMeta,
    prefill: { freight?: string; leadTimeDays?: string; incoterms?: string },
  ) => void;
}) {
  const [lanes, setLanes] = useState<LaneOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersionId, setSelectedVersionId] = useState("");
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [applying, setApplying] = useState(false);

  const loadLanes = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/logistics/lanes?limit=200&active=true");
      if (!response.ok) {
        setMessage({ tone: "error", text: strings.lane.errorLoad });
        return;
      }
      const data = (await response.json()) as {
        ok?: boolean;
        lanes?: LaneOption[];
      };
      if (data.ok && Array.isArray(data.lanes)) {
        setLanes(data.lanes);
      } else {
        setMessage({ tone: "error", text: strings.lane.errorLoad });
      }
    } catch (error) {
      console.error(error);
      setMessage({ tone: "error", text: strings.lane.errorLoad });
    } finally {
      setLoading(false);
    }
  }, [strings.lane.errorLoad]);

  useEffect(() => {
    void loadLanes();
  }, [loadLanes]);

  const laneOptions = useMemo(
    () => lanes.filter((lane) => lane.latestVersion?.id),
    [lanes],
  );

  const applyLane = useCallback(async () => {
    if (!selectedVersionId) {
      setMessage({ tone: "error", text: strings.lane.errorApply });
      return;
    }

    setApplying(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/logistics/lane-versions/${selectedVersionId}`,
      );
      if (!response.ok) {
        setMessage({ tone: "error", text: strings.lane.errorApply });
        return;
      }
      const data = (await response.json()) as {
        ok?: boolean;
        lane?: LaneVersionDetail["lane"];
        version?: LaneVersionDetail["version"];
      };
      if (!data.ok || !data.version) {
        setMessage({ tone: "error", text: strings.lane.errorApply });
        return;
      }

      const lane = data.lane ?? null;
      const version = data.version;
      const meta: StageBLaneMeta = {
        laneId: lane?.id ?? null,
        laneName: lane?.name ?? null,
        laneModel: lane?.model ?? null,
        laneIncoterm: lane?.incoterm ?? null,
        laneVersionId: version.id,
        laneVersionLabel: version.versionLabel ?? null,
        laneStatus: version.status ?? null,
        laneConfidence: version.confidence ?? null,
        laneExpiresAt: version.expiresAt ?? null,
        laneCurrency: version.currency ?? null,
        laneSourceCurrency: version.sourceCurrency ?? null,
        laneFxRate: version.fxRate ?? null,
        laneFxDate: version.fxDate ?? null,
        laneFxSource: version.fxSource ?? null,
        laneLeadTimeBaseDays: version.leadTimeBaseDays ?? null,
        laneCostBasis: version.costBasis ?? null,
        laneCostAmount: version.costAmount ?? null,
      };

      const prefill = {
        ...(version.costAmount === null || version.costAmount === undefined
          ? {}
          : { freight: String(version.costAmount) }),
        ...(version.leadTimeBaseDays === null ||
        version.leadTimeBaseDays === undefined
          ? {}
          : { leadTimeDays: String(version.leadTimeBaseDays) }),
        ...(lane?.incoterm ? { incoterms: lane.incoterm } : {}),
      };

      onApplied(meta, prefill);
      setMessage({ tone: "success", text: strings.lane.successApply });
    } catch (error) {
      console.error(error);
      setMessage({ tone: "error", text: strings.lane.errorApply });
    } finally {
      setApplying(false);
    }
  }, [onApplied, selectedVersionId, strings.lane.errorApply, strings.lane.successApply]);

  const expiryWarning = buildExpiryWarning(laneMeta?.laneExpiresAt, strings);
  const confidenceWarning = buildConfidenceWarning(
    laneMeta?.laneConfidence ?? null,
    strings,
  );
  const basisWarning = needsBasisWarning(laneMeta?.laneCostBasis ?? null)
    ? strings.lane.warningBasis
    : null;
  const appliedSummary = laneMeta
    ? `${laneMeta.laneName ?? notAvailable} | ${laneMeta.laneConfidence ?? notAvailable} | ${
        laneMeta.laneCostAmount ?? notAvailable
      } ${laneMeta.laneCostBasis ?? ""}`
    : strings.lane.appliedEmpty;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.lane.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.lane.title}
        </h2>
      </Stack>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.lane.selectLabel}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={selectedVersionId}
            onChange={(event) => setSelectedVersionId(event.target.value)}
            disabled={disabled || loading || applying}
          >
            <option value="">{strings.lane.selectPlaceholder}</option>
            {laneOptions.map((lane) => (
              <option
                key={lane.latestVersion?.id ?? lane.id}
                value={lane.latestVersion?.id ?? ""}
              >
                {formatOptionLabel(lane)}
              </option>
            ))}
          </select>
        </label>
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
          <span className="text-xs text-foreground/60">
            {message ? message.text : strings.lane.help}
          </span>
          <button
            className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={applyLane}
            disabled={disabled || loading || applying || laneOptions.length === 0}
          >
            {strings.lane.applyLabel}
          </button>
        </Cluster>
      </div>

      <div className="mt-4 rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-xs text-foreground/70">
        <div className="text-foreground/60">{strings.lane.appliedLabel}</div>
        <div className="mt-1 font-semibold">{appliedSummary}</div>
        {expiryWarning ? (
          <div className="mt-2 text-amber-600">{expiryWarning}</div>
        ) : null}
        {confidenceWarning ? (
          <div className="mt-2 text-amber-600">{confidenceWarning}</div>
        ) : null}
        {basisWarning ? (
          <div className="mt-2 text-amber-600">{basisWarning}</div>
        ) : null}
        {loading && laneOptions.length === 0 ? (
          <div className="mt-2 text-foreground/60">{strings.lane.loading}</div>
        ) : null}
        {!loading && laneOptions.length === 0 ? (
          <div className="mt-2 text-foreground/60">{strings.lane.empty}</div>
        ) : null}
      </div>
    </section>
  );
}
