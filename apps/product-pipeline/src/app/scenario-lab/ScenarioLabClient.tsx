"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Cluster, Grid, Stack } from "@acme/ui/components/atoms/primitives";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import {
  DEFAULT_ADJUSTMENTS,
  adjustInput,
  computeApproxReturn,
  extractStageKInput,
  extractStageKOutput,
  extractStageKRun,
  formatPaybackDay,
  type Adjustments,
  type CandidateDetailResponse,
  type CandidateSummary,
  type ScenarioLabStrings,
} from "./types";

function formatCents(
  value: string | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  try {
    return formatCurrency(BigInt(value));
  } catch {
    return fallback;
  }
}

function formatCandidateLabel(candidate: CandidateSummary): string {
  if (candidate.lead?.title) {
    const shortId = candidate.id.slice(0, 8);
    return `${candidate.lead.title} · ${shortId}`;
  }
  return candidate.id;
}

export default function ScenarioLabClient({
  strings,
}: {
  strings: ScenarioLabStrings;
}) {
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<CandidateDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adjustments, setAdjustments] =
    useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const loadCandidates = useCallback(async () => {
    setCandidatesLoading(true);
    try {
      const response = await fetch("/api/candidates?limit=50");
      if (!response.ok) return;
      const data = (await response.json()) as {
        ok?: boolean;
        candidates?: CandidateSummary[];
      };
      if (data.ok && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
        if (!selectedId && data.candidates.length > 0) {
          const [first] = data.candidates;
          if (first) {
            setSelectedId(first.id);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCandidatesLoading(false);
    }
  }, [selectedId]);

  const loadCandidateDetail = useCallback(async (candidateId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) return;
      const data = (await response.json()) as CandidateDetailResponse;
      if (data.ok) {
        setDetail(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setRunMessage(null);
    void loadCandidateDetail(selectedId);
  }, [selectedId, loadCandidateDetail]);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedId) ?? null,
    [candidates, selectedId],
  );

  const stageKRun = useMemo(
    () => extractStageKRun(detail?.stageRuns ?? []),
    [detail?.stageRuns],
  );
  const stageKInput = useMemo(
    () => extractStageKInput(stageKRun),
    [stageKRun],
  );
  const stageKOutput = useMemo(
    () => extractStageKOutput(stageKRun),
    [stageKRun],
  );

  const baseSummary = stageKOutput?.summary;
  const baseResult = stageKOutput?.result;
  const baseReturn = baseSummary?.annualizedCapitalReturnRate ?? null;
  const approxReturn = useMemo(
    () =>
      computeApproxReturn(
        baseReturn,
        stageKOutput?.sensitivities,
        adjustments,
      ),
    [adjustments, baseReturn, stageKOutput?.sensitivities],
  );
  const approxDelta =
    approxReturn !== null && baseReturn !== null
      ? approxReturn - baseReturn
      : null;

  const statusMessage =
    candidatesLoading || detailLoading
      ? strings.state.loading
      : selectedId
        ? stageKRun
          ? null
          : strings.state.missingStageK
        : candidates.length === 0
          ? strings.selector.empty
          : strings.selector.placeholder;

  const inputsDisabled = running || detailLoading || !stageKInput;

  const runExact = useCallback(async () => {
    if (!selectedId || !stageKInput) {
      setRunMessage({
        tone: "error",
        text: strings.state.missingStageK,
      });
      return;
    }

    setRunning(true);
    setRunMessage(null);
    const adjustedInput = adjustInput(stageKInput, adjustments);

    try {
      const response = await fetch("/api/stages/k/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: selectedId,
          input: adjustedInput,
          requestedBy: "scenario_lab",
        }),
      });
      if (!response.ok) {
        setRunMessage({ tone: "error", text: strings.state.runError });
      } else {
        setRunMessage({ tone: "success", text: strings.state.runSuccess });
      }
    } catch (error) {
      console.error(error);
      setRunMessage({ tone: "error", text: strings.state.runError });
    } finally {
      setRunning(false);
      await loadCandidateDetail(selectedId);
      await loadCandidates();
    }
  }, [
    adjustments,
    loadCandidateDetail,
    loadCandidates,
    selectedId,
    stageKInput,
    strings.state.missingStageK,
    strings.state.runError,
    strings.state.runSuccess,
  ]);

  return (
    <Stack gap={6}>
      <section className="pp-card p-6">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.selector.label}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {strings.selector.title}
          </h2>
        </Stack>
        <div className="mt-4 grid gap-3 md:grid-cols-2 md:items-center">
          <select
            className="min-h-12 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            disabled={candidatesLoading}
          >
            <option value="">{strings.selector.placeholder}</option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {formatCandidateLabel(candidate)}
              </option>
            ))}
          </select>
          <span className="text-xs text-foreground/60">
            {selectedCandidate?.lead?.title ?? strings.selector.placeholder}
          </span>
        </div>
        <p className="mt-2 text-xs text-foreground/60">
          {candidatesLoading
            ? strings.state.loading
            : candidates.length === 0
              ? strings.selector.empty
              : strings.selector.helper}
        </p>
      </section>

      <Grid cols={1} gap={4} className="lg:grid-cols-3">
        <div className="pp-card p-6 lg:col-span-2">
          <Cluster justify="between" alignY="start" className="gap-4">
            <Stack gap={2}>
              <span className="text-xs uppercase tracking-widest text-foreground/60">
                {strings.base.label}
              </span>
              <h2 className="text-xl font-semibold tracking-tight">
                {strings.base.title}
              </h2>
            </Stack>
            <span className="pp-chip">{strings.base.badge}</span>
          </Cluster>
          <Grid cols={1} gap={4} className="mt-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
              <div className="text-xs text-foreground/60">
                {strings.outputs.peakCash}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {formatCents(
                  baseSummary?.peakCashOutlayCents ?? null,
                  strings.notAvailable,
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
              <div className="text-xs text-foreground/60">
                {strings.outputs.payback}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {baseSummary
                  ? formatPaybackDay(
                      baseSummary.paybackDay ?? null,
                      strings.outputs.days,
                    )
                  : strings.notAvailable}
              </div>
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
              <div className="text-xs text-foreground/60">
                {strings.outputs.capitalDays}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {formatNumber(baseResult?.capitalDaysEurosDays)}
              </div>
            </div>
            <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
              <div className="text-xs text-foreground/60">
                {strings.outputs.annualizedReturn}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {formatPercent(baseReturn)}
              </div>
            </div>
          </Grid>
          {statusMessage ? (
            <p className="mt-4 text-xs text-foreground/60">{statusMessage}</p>
          ) : null}
        </div>

        <div className="pp-card p-6">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.controls.label}
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              {strings.controls.title}
            </h2>
          </Stack>
          <Stack gap={4} className="mt-4 text-sm text-foreground/70">
            <label className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.controls.inputPrice}
              <input
                className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                type="number"
                step="0.5"
                value={adjustments.pricePct}
                onChange={(event) =>
                  setAdjustments((current) => ({
                    ...current,
                    pricePct: Number(event.target.value) || 0,
                  }))
                }
                disabled={inputsDisabled}
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.controls.inputCost}
              <input
                className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                type="number"
                step="0.5"
                value={adjustments.costPct}
                onChange={(event) =>
                  setAdjustments((current) => ({
                    ...current,
                    costPct: Number(event.target.value) || 0,
                  }))
                }
                disabled={inputsDisabled}
              />
            </label>
            <label className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.controls.inputVelocity}
              <input
                className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                type="number"
                step="1"
                value={adjustments.velocityPct}
                onChange={(event) =>
                  setAdjustments((current) => ({
                    ...current,
                    velocityPct: Number(event.target.value) || 0,
                  }))
                }
                disabled={inputsDisabled}
              />
            </label>
            <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
              <div className="text-xs text-foreground/60">
                {strings.controls.approxLabel}
              </div>
              <div className="mt-2 text-lg font-semibold">
                {formatPercent(approxReturn)}
              </div>
              <div className="mt-1 text-xs text-foreground/60">
                {strings.controls.approxDeltaLabel}:{" "}
                {formatPercent(approxDelta)}
              </div>
            </div>
            <Cluster justify="between" alignY="center" className="gap-3">
              {runMessage ? (
                <span
                  className={
                    runMessage.tone === "success"
                      ? ("text-xs text-emerald-600" /* i18n-exempt -- PP-1100 status tone class [ttl=2026-06-30] */)
                      : ("text-xs text-red-600" /* i18n-exempt -- PP-1100 status tone class [ttl=2026-06-30] */)
                  }
                >
                  {runMessage.text}
                </span>
              ) : (
                <span className="text-xs text-foreground/60">
                  {statusMessage ?? strings.selector.helper}
                </span>
              )}
              <Cluster gap={2} alignY="center">
                <button
                  className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                  disabled={inputsDisabled}
                >
                  {strings.controls.reset}
                </button>
                <button
                  className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  onClick={() => void runExact()}
                  disabled={inputsDisabled}
                >
                  {strings.controls.runExact}
                </button>
              </Cluster>
            </Cluster>
          </Stack>
        </div>
      </Grid>

      <section className="pp-card p-6">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.sensitivities.label}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {strings.sensitivities.title}
          </h2>
        </Stack>
        <Grid cols={1} gap={4} className="mt-6 md:grid-cols-3">
          {[
            {
              label: strings.sensitivities.price,
              value:
                stageKOutput?.sensitivities?.["price_delta_pct"] ?? null,
            },
            {
              label: strings.sensitivities.cost,
              value:
                stageKOutput?.sensitivities?.["cost_delta_pct"] ?? null,
            },
            {
              label: strings.sensitivities.velocity,
              value:
                stageKOutput?.sensitivities?.["velocity_delta_pct"] ?? null,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border-1 bg-surface-2 p-4"
            >
              <div className="text-xs text-foreground/60">{item.label}</div>
              <div className="mt-2 text-xl font-semibold">
                {formatPercent(item.value)}
              </div>
              <div className="mt-1 text-xs text-foreground/60">
                {strings.sensitivities.unit}
              </div>
            </div>
          ))}
        </Grid>
      </section>
    </Stack>
  );
}
