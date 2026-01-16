"use client";

/* eslint-disable ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Pending DS token rollout for controls */

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@ui/components/atoms/primitives";
import type { CandidateDetail, CandidateDetailStrings, StageRun } from "./types";
import {
  extractStageTInput,
  extractStageTSummary,
  formatStageTList,
  parseStageTList,
  type StageTDecision,
} from "./stageTHelpers";
import StageTSummaryCard from "./StageTSummary";

type FormState = {
  decision: StageTDecision;
  reasonCodes: string;
  requiredEvidence: string;
  notes: string;
};

const DEFAULT_FORM: FormState = {
  decision: "needs_review",
  reasonCodes: "",
  requiredEvidence: "",
  notes: "",
};

export default function StageTRunCard({
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
  const latestStageT = useMemo(
    () => stageRuns.find((run) => run.stage === "T"),
    [stageRuns],
  );
  const latestSummary = useMemo(
    () => extractStageTSummary(latestStageT),
    [latestStageT],
  );

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [hasEdited, setHasEdited] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const cooldownActive = Boolean(candidate?.cooldown?.active);

  useEffect(() => {
    if (hasEdited) return;
    const input = extractStageTInput(latestStageT);
    if (!input) {
      setForm(DEFAULT_FORM);
      return;
    }
    setForm({
      decision: input.decision ?? "needs_review",
      reasonCodes: formatStageTList(input.reasonCodes),
      requiredEvidence: formatStageTList(input.requiredEvidence),
      notes: input.notes ?? "",
    });
  }, [hasEdited, latestStageT]);

  const runStageT = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!candidate) return;

      setMessage(null);
      setRunning(true);

      const reasonCodes = parseStageTList(form.reasonCodes);
      const requiredEvidence = parseStageTList(form.requiredEvidence);

      const payload = {
        candidateId,
        decision: form.decision,
        ...(reasonCodes.length > 0 ? { reasonCodes } : {}),
        ...(requiredEvidence.length > 0 ? { requiredEvidence } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      };

      try {
        const response = await fetch("/api/stages/t/run", {
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
              : strings.stageT.errorRun;
          setMessage({ tone: "error", text });
        } else {
          setMessage({ tone: "success", text: strings.stageT.success });
        }
      } catch (error) {
        console.error(error);
        setMessage({ tone: "error", text: strings.stageT.errorRun });
      } finally {
        setRunning(false);
        await onRun();
      }
    },
    [candidate, candidateId, form, onRun, strings.cooldown, strings.stageT],
  );

  const decisionOptions: Array<{ value: StageTDecision; label: string }> = [
    { value: "allowed", label: strings.stageT.decisions.allowed },
    { value: "needs_review", label: strings.stageT.decisions.needsReview },
    { value: "blocked", label: strings.stageT.decisions.blocked },
  ];

  return (
    <section className="pp-card p-6" id="stage-t">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageT.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.stageT.title}
        </h2>
      </Stack>

      <StageTSummaryCard
        summary={latestSummary}
        strings={strings.stageT}
        notAvailable={strings.notAvailable}
      />

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
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={runStageT}>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageT.inputDecision}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.decision}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                decision: event.target.value as StageTDecision,
              }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive}
          >
            {decisionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.stageT.inputReasons}
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.reasonCodes}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                reasonCodes: event.target.value,
              }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive}
            placeholder={strings.stageT.inputReasonsPlaceholder}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.stageT.inputEvidence}
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.requiredEvidence}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                requiredEvidence: event.target.value,
              }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive}
            placeholder={strings.stageT.inputEvidencePlaceholder}
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
          {strings.stageT.inputNotes}
          <textarea
            className="mt-2 min-h-24 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.notes}
            onChange={(event) => {
              setForm((current) => ({ ...current, notes: event.target.value }));
              setHasEdited(true);
            }}
            disabled={running || cooldownActive}
            placeholder={strings.stageT.inputNotesPlaceholder}
          />
        </label>
        <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
          <span className="text-xs text-foreground/60">
            {message?.text ?? strings.stageT.inputHelp}
          </span>
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={running || loading || cooldownActive}
          >
            {strings.stageT.runLabel}
          </button>
        </Cluster>
      </form>
      ) : null}
    </section>
  );
}
