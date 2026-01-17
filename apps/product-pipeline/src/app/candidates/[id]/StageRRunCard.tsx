"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Cluster, Grid, Stack } from "@acme/ui/components/atoms/primitives";
import { formatPercent } from "@/lib/format";
import type { CandidateDetail, CandidateDetailStrings, StageRun } from "./types";
import {
  extractStageRInput,
  extractStageRSummary,
  formatStageRDrivers,
  formatStageRScore,
  parseStageRDrivers,
} from "./stageRHelpers";

type FormState = {
  riskScore: string;
  effortScore: string;
  riskDrivers: string;
  effortDrivers: string;
  notes: string;
};

const DEFAULT_FORM: FormState = {
  riskScore: "50",
  effortScore: "50",
  riskDrivers: "",
  effortDrivers: "",
  notes: "",
};

export default function StageRRunCard({
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
  const latestStageR = useMemo(
    () => stageRuns.find((run) => run.stage === "R"),
    [stageRuns],
  );
  const latestSummary = useMemo(
    () => extractStageRSummary(latestStageR),
    [latestStageR],
  );

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [hasEdited, setHasEdited] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const cooldownActive = Boolean(candidate?.cooldown?.active);

  useEffect(() => {
    if (hasEdited) return;
    const input = extractStageRInput(latestStageR);
    if (!input) {
      setForm(DEFAULT_FORM);
      return;
    }
    setForm({
      riskScore:
        input.riskScore !== undefined ? String(input.riskScore) : "50",
      effortScore:
        input.effortScore !== undefined ? String(input.effortScore) : "50",
      riskDrivers: formatStageRDrivers(input.riskDrivers),
      effortDrivers: formatStageRDrivers(input.effortDrivers),
      notes: input.notes ?? "",
    });
  }, [hasEdited, latestStageR]);

  const runStageR = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage(null);
      setRunning(true);

      const riskScore = Number.parseFloat(form.riskScore);
      const effortScore = Number.parseFloat(form.effortScore);
      if (
        !Number.isFinite(riskScore) ||
        !Number.isFinite(effortScore) ||
        riskScore < 0 ||
        riskScore > 100 ||
        effortScore < 0 ||
        effortScore > 100
      ) {
        setMessage({ tone: "error", text: strings.stageR.errorInvalid });
        setRunning(false);
        return;
      }

      const payload = {
        candidateId,
        riskScore,
        effortScore,
        riskDrivers: parseStageRDrivers(form.riskDrivers),
        effortDrivers: parseStageRDrivers(form.effortDrivers),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      };

      try {
        const response = await fetch("/api/stages/r/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json().catch(() => null)) as
          | { error?: string; details?: { reasonCode?: string } }
          | null;
        if (!response.ok) {
          const reason = data?.details?.reasonCode;
          const text =
            data?.error === "cooldown_active"
              ? `${strings.cooldown.activeMessage}${reason ? ` (${reason})` : ""}`
              : strings.stageR.errorRun;
          setMessage({ tone: "error", text });
        } else {
          setMessage({ tone: "success", text: strings.stageR.success });
        }
      } catch (error) {
        console.error(error);
        setMessage({ tone: "error", text: strings.stageR.errorRun });
      } finally {
        setRunning(false);
        await onRun();
      }
    },
    [
      candidateId,
      form.effortDrivers,
      form.effortScore,
      form.notes,
      form.riskDrivers,
      form.riskScore,
      onRun,
      strings.cooldown.activeMessage,
      strings.stageR.errorInvalid,
      strings.stageR.errorRun,
      strings.stageR.success,
    ],
  );

  const nextAction = latestSummary?.nextAction ?? null;
  const nextLabel =
    nextAction === "ADVANCE"
      ? strings.stageR.nextActions.advance
      : nextAction === "REVIEW_RISK"
        ? strings.stageR.nextActions.reviewRisk
        : nextAction === "REVIEW_EFFORT"
          ? strings.stageR.nextActions.reviewEffort
          : nextAction === "NEED_STAGE_K"
            ? strings.stageR.nextActions.needStageK
            : strings.notAvailable;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageR.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.stageR.title}
        </h2>
      </Stack>

      {latestSummary ? (
        <Grid cols={1} gap={3} className="mt-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">
              {strings.stageR.summaryRisk}
            </div>
            <div className="mt-1 text-sm font-semibold">
              {formatStageRScore(
                latestSummary.riskScore,
                latestSummary.riskBand,
                strings.notAvailable,
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">
              {strings.stageR.summaryEffort}
            </div>
            <div className="mt-1 text-sm font-semibold">
              {formatStageRScore(
                latestSummary.effortScore,
                latestSummary.effortBand,
                strings.notAvailable,
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">
              {strings.stageR.summaryRank}
            </div>
            <div className="mt-1 text-sm font-semibold">
              {latestSummary.rankScore !== null &&
              latestSummary.rankScore !== undefined
                ? formatPercent(latestSummary.rankScore)
                : strings.notAvailable}
            </div>
          </div>
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">
              {strings.stageR.summaryNext}
            </div>
            <div className="mt-1 text-sm font-semibold">{nextLabel}</div>
          </div>
        </Grid>
      ) : null}

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={runStageR}>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageR.inputRiskScore}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.riskScore}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                riskScore: event.target.value,
              }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive}
            type="number"
            min={0}
            max={100}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageR.inputEffortScore}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.effortScore}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                effortScore: event.target.value,
              }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive}
            type="number"
            min={0}
            max={100}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.stageR.inputRiskDrivers}
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.riskDrivers}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                riskDrivers: event.target.value,
              }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.stageR.inputEffortDrivers}
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.effortDrivers}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                effortDrivers: event.target.value,
              }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.stageR.inputNotes}
          <textarea
            className="mt-2 min-h-20 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.notes}
            onChange={(event) => {
              setForm((current) => ({ ...current, notes: event.target.value }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive}
          />
        </label>
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
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
                : strings.stageR.inputHelp}
            </span>
          )}
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={running || loading || cooldownActive}
          >
            {strings.stageR.runLabel}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
