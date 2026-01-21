"use client";

/* eslint-disable ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Pending DS token rollout for controls */

import { type FormEvent,useCallback, useEffect, useMemo, useState } from "react";
import { Cluster, Grid, Stack } from "@acme/ui/components/atoms/primitives";

import { formatCurrency, formatPercent } from "@/lib/format";

import { resolveGateMessage, resolveStageTSGate } from "./stageGate";
import StageKLaneCompareCard from "./StageKLaneCompareCard";
import type { CandidateDetail, CandidateDetailStrings, StageRun } from "./types";

type StageKSummary = {
  peakCashOutlayCents?: string;
  paybackDay?: number | null;
  annualizedCapitalReturnRate?: number | null;
  returnBand?: string;
};

type StageKOutput = {
  summary?: StageKSummary;
};

function buildDefaultInput(): Record<string, unknown> {
  const horizonDays = 120;
  const unitsPlanned = 500;
  const unitsSoldByDay = Array.from({ length: horizonDays + 1 }, (_, day) =>
    Math.min(unitsPlanned, Math.round(day * 5.2)),
  );

  return {
    horizonDays,
    cashflows: [
      { day: 0, amountCents: -68000 },
      { day: 18, amountCents: -6400 },
      { day: 30, amountCents: 22000 },
      { day: 45, amountCents: 28000 },
      { day: 60, amountCents: 22000 },
      { day: 85, amountCents: 18000 },
    ],
    unitsPlanned,
    unitsSoldByDay,
    sellThroughTargetPct: 0.8,
    salvageValueCents: 2800,
  };
}

function extractInput(stageRun?: StageRun): Record<string, unknown> | null {
  if (!stageRun?.input || typeof stageRun.input !== "object") return null;
  if ("input" in stageRun.input) {
    const nested = (stageRun.input as { input?: Record<string, unknown> }).input;
    if (nested && typeof nested === "object") return nested;
  }
  return stageRun.input as Record<string, unknown>;
}

function extractSummary(stageRun?: StageRun): StageKSummary | null {
  if (!stageRun?.output || typeof stageRun.output !== "object") return null;
  const summary = (stageRun.output as StageKOutput).summary;
  if (!summary || typeof summary !== "object") return null;
  return summary;
}

function extractScenario(stageRun?: StageRun): Record<string, unknown> | null {
  if (!stageRun?.input || typeof stageRun.input !== "object") return null;
  const scenario = (stageRun.input as { scenario?: Record<string, unknown> }).scenario;
  if (!scenario || typeof scenario !== "object") return null;
  return scenario;
}

function formatCents(value?: string): string {
  if (!value) return "-";
  try {
    return formatCurrency(BigInt(value));
  } catch {
    return "-";
  }
}

export default function StageKRunCard({
  candidateId,
  candidate,
  stageRuns,
  loading,
  strings,
  onRun,
}: {
  candidateId: string;
  candidate: CandidateDetail | null;
  stageRuns: StageRun[];
  loading: boolean;
  strings: CandidateDetailStrings;
  onRun: () => Promise<void>;
}) {
  const latestStageK = useMemo(
    () => stageRuns.find((run) => run.stage === "K"),
    [stageRuns],
  );
  const latestSummary = useMemo(
    () => extractSummary(latestStageK),
    [latestStageK],
  );

  const [inputJson, setInputJson] = useState(() => {
    const input = extractInput(latestStageK) ?? buildDefaultInput();
    return JSON.stringify(input, null, 2);
  });
  const [scenario, setScenario] = useState<Record<string, unknown> | null>(null);
  const [hasEdited, setHasEdited] = useState(false);
  const [running, setRunning] = useState(false);
  const [composeRunning, setComposeRunning] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const cooldownActive = Boolean(candidate?.cooldown?.active);
  const stageGate = resolveStageTSGate(stageRuns);

  useEffect(() => {
    if (hasEdited) return;
    const input = extractInput(latestStageK) ?? buildDefaultInput();
    setInputJson(JSON.stringify(input, null, 2));
    setScenario(extractScenario(latestStageK));
  }, [hasEdited, latestStageK]);

  const composeStageK = useCallback(async () => {
    setMessage(null);
    setComposeRunning(true);
    try {
      const response = await fetch("/api/stages/k/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; input?: Record<string, unknown>; scenario?: Record<string, unknown> }
        | null;
      if (!response.ok) {
        if (payload?.error === "stage_b_required") {
          setMessage({ tone: "error", text: strings.stageK.composeMissingStageB });
        } else if (payload?.error === "stage_c_required") {
          setMessage({ tone: "error", text: strings.stageK.composeMissingStageC });
        } else {
          setMessage({ tone: "error", text: strings.stageK.composeError });
        }
        return;
      }
      if (!payload?.input) {
        setMessage({ tone: "error", text: strings.stageK.composeError });
        return;
      }
      setInputJson(JSON.stringify(payload.input, null, 2));
      setScenario(payload.scenario ?? null);
      setHasEdited(true);
      setMessage({ tone: "success", text: strings.stageK.composeSuccess });
    } catch (error) {
      console.error(error);
      setMessage({ tone: "error", text: strings.stageK.composeError });
    } finally {
      setComposeRunning(false);
    }
  }, [candidateId, strings.stageK]);

  const runStageK = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage(null);
      setRunning(true);

      let parsedInput: unknown;
      try {
        parsedInput = JSON.parse(inputJson);
      } catch {
        setMessage({
          tone: "error",
          text: strings.stageK.errorInvalidJson,
        });
        setRunning(false);
        return;
      }

      try {
        const response = await fetch("/api/stages/k/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId,
            input: parsedInput,
            ...(scenario ? { scenario } : {}),
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; details?: { reasonCode?: string } }
          | null;
        if (!response.ok) {
          const reason = payload?.details?.reasonCode;
          const gateError = resolveGateMessage(payload?.error ?? null, strings.gates);
          const text =
            gateError ??
            (payload?.error === "cooldown_active"
              ? `${strings.cooldown.activeMessage}${reason ? ` (${reason})` : ""}`
              : strings.stageK.errorRun);
          setMessage({
            tone: "error",
            text,
          });
        } else {
          setMessage({
            tone: "success",
            text: strings.stageK.success,
          });
        }
      } catch (error) {
        console.error(error);
        setMessage({
          tone: "error",
          text: strings.stageK.errorRun,
        });
      } finally {
        setRunning(false);
        await onRun();
      }
    },
    [candidateId, inputJson, onRun, scenario, strings.cooldown, strings.gates, strings.stageK],
  );

  const inputDisabled = running || loading || cooldownActive || Boolean(stageGate);
  const composeDisabled =
    composeRunning || running || loading || cooldownActive || Boolean(stageGate);

  return (
    <section className="pp-card p-6" id="stage-k">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageK.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.stageK.title}
        </h2>
      </Stack>

      {latestSummary ? (
        <Grid cols={1} gap={3} className="mt-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">
              {strings.stageK.summaryPeakCash}
            </div>
            <div className="mt-1 text-sm font-semibold">
              {formatCents(latestSummary.peakCashOutlayCents)}
            </div>
          </div>
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">
              {strings.stageK.summaryPayback}
            </div>
            <div className="mt-1 text-sm font-semibold">
              {latestSummary.paybackDay ?? strings.notAvailable}
            </div>
          </div>
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">
              {strings.stageK.summaryReturn}
            </div>
            <div className="mt-1 text-sm font-semibold">
              {formatPercent(latestSummary.annualizedCapitalReturnRate)}
            </div>
          </div>
        </Grid>
      ) : null}

      <div className="mt-4">
        <StageKLaneCompareCard
          candidateId={candidateId}
          disabled={inputDisabled}
          strings={strings.stageK.laneCompare}
          notAvailable={strings.notAvailable}
        />
      </div>

      <div className="mt-4">
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? strings.common.hideInputs : strings.common.editInputs}
        </button>
      </div>

      {expanded ? (
        <form className="mt-4 grid gap-4" onSubmit={runStageK}>
        <div>
          <Cluster justify="between" alignY="center" className="gap-3">
            <label className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.stageK.inputLabel}
            </label>
            <button
              className="min-h-12 min-w-12 rounded-full border border-border-1 bg-surface-2 px-4 py-2 text-xs font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={composeStageK}
              disabled={composeDisabled}
            >
              {strings.stageK.composeLabel}
            </button>
          </Cluster>
          <textarea
            className="mt-2 min-h-56 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-xs text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={inputJson}
            onChange={(event) => {
              setInputJson(event.target.value);
              setScenario(null);
              setHasEdited(true);
            }}
            disabled={inputDisabled}
          />
        </div>
        <Cluster justify="between" alignY="center" className="gap-3">
          {message ? (
            <span
              className={
                message.tone === "success"
                  ? ("text-xs text-emerald-600" /* i18n-exempt -- PP-1100 status tone class [ttl=2026-06-30] */)
                  : ("text-xs text-red-600" /* i18n-exempt -- PP-1100 status tone class [ttl=2026-06-30] */)
              }
            >
              {message.text}
            </span>
          ) : (
            <span className="text-xs text-foreground/60">
              {cooldownActive
                ? strings.cooldown.activeMessage
                : `${strings.stageK.inputHelp} ${strings.stageK.composeHelp}`}
            </span>
          )}
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={inputDisabled}
          >
            {strings.stageK.runLabel}
          </button>
        </Cluster>
      </form>
      ) : null}
    </section>
  );
}
