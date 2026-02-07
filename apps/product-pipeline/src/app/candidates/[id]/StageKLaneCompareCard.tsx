"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Cluster, Grid, Stack } from "@acme/design-system/primitives";

import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

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

type CompareWarning = {
  code: string;
  days?: number;
};

type CompareSummary = {
  peakCashOutlayCents: string;
  paybackDay: number | null;
  annualizedCapitalReturnRate: number | null;
  returnBand: string;
};

type CompareEntry = {
  laneVersionId: string;
  laneId: string;
  laneName: string | null;
  laneModel: string | null;
  laneIncoterm: string | null;
  laneStatus: string | null;
  laneConfidence: string | null;
  laneExpiresAt: string | null;
  laneCostBasis: string | null;
  laneCostAmount: number | null;
  laneLeadTimeBaseDays: number | null;
  warnings: CompareWarning[];
  summary: CompareSummary;
};

type CompareResponse = {
  ok?: boolean;
  base?: {
    summary: CompareSummary;
    lane?: Record<string, unknown> | null;
  };
  comparisons?: CompareEntry[];
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

function formatCents(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    return formatCurrency(BigInt(value));
  } catch {
    return fallback;
  }
}

function formatDeltaCents(
  baseValue: string | null | undefined,
  nextValue: string | null | undefined,
  fallback: string,
): string {
  if (!baseValue || !nextValue) return fallback;
  try {
    const delta = BigInt(nextValue) - BigInt(baseValue);
    if (delta === 0n) return "0";
    const prefix = delta > 0n ? "+" : "-";
    const formatted = formatCurrency(delta < 0n ? -delta : delta);
    return `${prefix}${formatted}`;
  } catch {
    return fallback;
  }
}

function formatDeltaDays(
  baseValue: number | null | undefined,
  nextValue: number | null | undefined,
  fallback: string,
): string {
  if (baseValue === null || baseValue === undefined) return fallback;
  if (nextValue === null || nextValue === undefined) return fallback;
  const delta = nextValue - baseValue;
  if (!Number.isFinite(delta)) return fallback;
  if (delta === 0) return "0d";
  const prefix = delta > 0 ? "+" : "-";
  return `${prefix}${Math.abs(delta)}d`;
}

function formatDeltaReturn(
  baseValue: number | null | undefined,
  nextValue: number | null | undefined,
  fallback: string,
): string {
  if (baseValue === null || baseValue === undefined) return fallback;
  if (nextValue === null || nextValue === undefined) return fallback;
  const delta = nextValue - baseValue;
  if (!Number.isFinite(delta)) return fallback;
  if (delta === 0) return "0pp";
  const prefix = delta > 0 ? "+" : "-";
  const points = Math.abs(delta) * 100;
  return `${prefix}${formatNumber(points)}pp`;
}

export default function StageKLaneCompareCard({
  candidateId,
  disabled,
  strings,
  notAvailable,
}: {
  candidateId: string;
  disabled: boolean;
  strings: CandidateDetailStrings["stageK"]["laneCompare"];
  notAvailable: string;
}) {
  const [lanes, setLanes] = useState<LaneOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [results, setResults] = useState<CompareResponse | null>(null);

  const loadLanes = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/logistics/lanes?limit=200&active=true");
      if (!response.ok) {
        setMessage({ tone: "error", text: strings.errorLoad });
        return;
      }
      const payload = (await response.json()) as {
        ok?: boolean;
        lanes?: LaneOption[];
      };
      if (payload.ok && Array.isArray(payload.lanes)) {
        setLanes(payload.lanes);
      } else {
        setMessage({ tone: "error", text: strings.errorLoad });
      }
    } catch (error) {
      console.error(error);
      setMessage({ tone: "error", text: strings.errorLoad });
    } finally {
      setLoading(false);
    }
  }, [strings.errorLoad]);

  useEffect(() => {
    void loadLanes();
  }, [loadLanes]);

  const laneOptions = useMemo(
    () => lanes.filter((lane) => lane.latestVersion?.id),
    [lanes],
  );

  const toggleSelected = useCallback((versionId: string) => {
    setSelectedIds((current) =>
      current.includes(versionId)
        ? current.filter((id) => id !== versionId)
        : [...current, versionId],
    );
  }, []);

  const runCompare = useCallback(async () => {
    if (selectedIds.length === 0) {
      setMessage({ tone: "error", text: strings.empty });
      return;
    }
    setRunning(true);
    setMessage(null);
    try {
      const response = await fetch("/api/stages/k/compare-lanes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          laneVersionIds: selectedIds,
        }),
      });
      const payload = (await response.json().catch(() => null)) as CompareResponse | null;
      if (!response.ok || !payload?.ok) {
        setMessage({ tone: "error", text: strings.errorCompare });
        return;
      }
      setResults(payload);
      setMessage({ tone: "success", text: strings.successCompare });
    } catch (error) {
      console.error(error);
      setMessage({ tone: "error", text: strings.errorCompare });
    } finally {
      setRunning(false);
    }
  }, [candidateId, selectedIds, strings.empty, strings.errorCompare, strings.successCompare]);

  const baseSummary = results?.base?.summary ?? null;
  const baseLane = results?.base?.lane ?? null;
  const comparisons = results?.comparisons ?? [];

  const warningText = useCallback(
    (entry: CompareEntry) => {
      const messages = entry.warnings.map((warning) => {
        switch (warning.code) {
          case "expired":
            return strings.warningExpired;
          case "expiring":
            return strings.warningExpiring.replace(
              "{days}",
              String(warning.days ?? "-"),
            );
          case "low_confidence":
            return strings.warningLowConfidence.replace(
              "{confidence}",
              entry.laneConfidence ?? notAvailable,
            );
          case "basis_non_unit":
            return strings.warningBasis;
          case "missing_cost":
            return strings.warningMissingCost;
          case "missing_lead_time":
            return strings.warningMissingLeadTime;
          default:
            return null;
        }
      });
      return messages.filter(Boolean).join(" ");
    },
    [notAvailable, strings],
  );

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.label}
        </span>
        <h3 className="text-xl font-semibold tracking-tight">{strings.title}</h3>
      </Stack>

      <div className="mt-4">
        <div className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.selectLabel}
        </div>
        <Grid cols={1} gap={2} className="mt-2">
          {loading && laneOptions.length === 0 ? (
            <div className="text-xs text-foreground/60">{strings.loading}</div>
          ) : null}
          {!loading && laneOptions.length === 0 ? (
            <div className="text-xs text-foreground/60">{strings.noLanes}</div>
          ) : null}
          {laneOptions.map((lane) => {
            const versionId = lane.latestVersion?.id ?? "";
            const checked = selectedIds.includes(versionId);
            return (
              <label
                key={versionId || lane.id}
                className="flex items-center gap-2 text-sm text-foreground/80"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelected(versionId)}
                  disabled={disabled || loading || running || !versionId}
                />
                <span>{formatOptionLabel(lane)}</span>
              </label>
            );
          })}
        </Grid>
        <Cluster justify="between" alignY="center" className="mt-3 gap-3">
          <span className="text-xs text-foreground/60">
            {message ? message.text : strings.help}
          </span>
          <button
            className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={runCompare}
            disabled={disabled || loading || running || selectedIds.length === 0}
          >
            {strings.compareLabel}
          </button>
        </Cluster>
      </div>

      {baseSummary ? (
        <div className="mt-6">
          <div className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.baseLabel}
          </div>
          <Grid cols={1} gap={3} className="mt-2 md:grid-cols-4">
            <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
              <div className="text-xs text-foreground/60">
                {strings.summaryPeakCash}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {formatCents(baseSummary.peakCashOutlayCents, notAvailable)}
              </div>
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
              <div className="text-xs text-foreground/60">
                {strings.summaryPayback}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {baseSummary.paybackDay ?? notAvailable}
              </div>
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
              <div className="text-xs text-foreground/60">
                {strings.summaryReturn}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {formatPercent(baseSummary.annualizedCapitalReturnRate)}
              </div>
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
              <div className="text-xs text-foreground/60">
                {strings.baseLaneLabel}
              </div>
              <div className="mt-1 text-sm font-semibold">
                {typeof baseLane === "object" && baseLane
                  ? ((baseLane as { laneName?: string }).laneName ?? notAvailable)
                  : notAvailable}
              </div>
            </div>
          </Grid>
        </div>
      ) : null}

      {comparisons.length > 0 ? (
        <div className="mt-6 grid gap-4">
          <div className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.resultsLabel}
          </div>
          {comparisons.map((entry) => {
            const warningMessage = warningText(entry);
            return (
              <div
                key={entry.laneVersionId}
                className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-4"
              >
                <div className="text-sm font-semibold">
                  {entry.laneName ?? notAvailable}
                </div>
                <div className="mt-1 text-xs text-foreground/60">
                  {entry.laneModel ?? notAvailable} |{" "}
                  {entry.laneConfidence ?? notAvailable} |{" "}
                  {entry.laneCostAmount ?? notAvailable}{" "}
                  {entry.laneCostBasis ?? ""}
                </div>
                <Grid cols={1} gap={3} className="mt-4 md:grid-cols-3">
                  <div>
                    <div className="text-xs text-foreground/60">
                      {strings.summaryPeakCash}
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      {formatCents(
                        entry.summary.peakCashOutlayCents,
                        notAvailable,
                      )}{" "}
                      <span className="text-xs text-foreground/60">
                        {formatDeltaCents(
                          baseSummary?.peakCashOutlayCents,
                          entry.summary.peakCashOutlayCents,
                          notAvailable,
                        )}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60">
                      {strings.summaryPayback}
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      {entry.summary.paybackDay ?? notAvailable}{" "}
                      <span className="text-xs text-foreground/60">
                        {formatDeltaDays(
                          baseSummary?.paybackDay ?? null,
                          entry.summary.paybackDay ?? null,
                          notAvailable,
                        )}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60">
                      {strings.summaryReturn}
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      {formatPercent(entry.summary.annualizedCapitalReturnRate)}{" "}
                      <span className="text-xs text-foreground/60">
                        {formatDeltaReturn(
                          baseSummary?.annualizedCapitalReturnRate ?? null,
                          entry.summary.annualizedCapitalReturnRate ?? null,
                          notAvailable,
                        )}
                      </span>
                    </div>
                  </div>
                </Grid>
                {warningMessage ? (
                  <div className="mt-3 text-xs text-amber-600">
                    {warningMessage}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
