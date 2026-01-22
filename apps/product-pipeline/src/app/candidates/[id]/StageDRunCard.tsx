/* eslint-disable ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Pending DS token rollout for controls */
"use client";

import { type FormEvent,useCallback, useEffect, useMemo, useState } from "react";
import { Cluster, Stack } from "@acme/design-system/primitives";

import {
  DEFAULT_STAGE_D_FORM,
  hydrateStageDForm,
  parseStageDForm,
  type StageDFormState,
} from "./stageDForm";
import StageDFormFields, {
  type StageDReadinessOption,
} from "./StageDFormFields";
import { extractStageDInput, extractStageDSummary } from "./stageDHelpers";
import StageDSummaryCard from "./StageDSummary";
import { resolveGateMessage, resolveStageTSGate } from "./stageGate";
import type { CandidateDetail, CandidateDetailStrings, StageRun } from "./types";

export default function StageDRunCard({
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
  const latestStageD = useMemo(
    () => stageRuns.find((run) => run.stage === "D"),
    [stageRuns],
  );
  const latestSummary = useMemo(
    () => extractStageDSummary(latestStageD),
    [latestStageD],
  );

  const [form, setForm] = useState<StageDFormState>(DEFAULT_STAGE_D_FORM);
  const [hasEdited, setHasEdited] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const cooldownActive = Boolean(candidate?.cooldown?.active);
  const stageGate = resolveStageTSGate(stageRuns);

  useEffect(() => {
    if (hasEdited) return;
    const input = extractStageDInput(latestStageD);
    setForm(hydrateStageDForm(input));
  }, [hasEdited, latestStageD]);

  const runStageD = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!candidate) return;

      setMessage(null);
      setRunning(true);

      const parsed = parseStageDForm(form);
      if (!parsed) {
        setMessage({ tone: "error", text: strings.stageD.errorInvalid });
        setRunning(false);
        return;
      }

      const payload = {
        candidateId,
        ...parsed,
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      };

      try {
        const response = await fetch("/api/stages/d/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = (await response.json().catch(() => null)) as
          | { error?: string; details?: { reasonCode?: string } }
          | null;
        if (!response.ok) {
          const reason = data?.details?.reasonCode;
          const gateError = resolveGateMessage(data?.error ?? null, strings.gates);
          const text =
            gateError ??
            (data?.error === "cooldown_active"
              ? `${strings.cooldown.activeMessage}${reason ? ` (${reason})` : ""}`
              : strings.stageD.errorRun);
          setMessage({ tone: "error", text });
        } else {
          setMessage({ tone: "success", text: strings.stageD.success });
        }
      } catch (error) {
        console.error(error);
        setMessage({ tone: "error", text: strings.stageD.errorRun });
      } finally {
        setRunning(false);
        await onRun();
      }
    },
    [candidate, candidateId, form, onRun, strings.cooldown, strings.gates, strings.stageD],
  );

  const inputDisabled = running || loading || cooldownActive || Boolean(stageGate);

  const readinessOptions: StageDReadinessOption[] = [
    { value: "not_started", label: strings.stageD.assetReadiness.notStarted },
    { value: "in_progress", label: strings.stageD.assetReadiness.inProgress },
    { value: "ready", label: strings.stageD.assetReadiness.ready },
  ];

  return (
    <section className="pp-card p-6" id="stage-d">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageD.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.stageD.title}
        </h2>
      </Stack>

      <StageDSummaryCard
        summary={latestSummary}
        strings={strings.stageD}
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
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={runStageD}>
          <StageDFormFields
            form={form}
            setForm={setForm}
            disabled={inputDisabled}
            strings={strings.stageD}
            readinessOptions={readinessOptions}
            onEdit={() => setHasEdited(true)}
          />
          <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
            {message ? (
              <span
                className={
                  message.tone === "success"
                    ? "text-xs text-emerald-600" // i18n-exempt -- LINT-1007 [ttl=2026-12-31] CSS utility classes
                    : "text-xs text-red-600" // i18n-exempt -- LINT-1007 [ttl=2026-12-31] CSS utility classes
                }
              >
                {message.text}
              </span>
            ) : (
              <span className="text-xs text-foreground/60">
                {cooldownActive
                  ? strings.cooldown.activeMessage
                  : strings.stageD.inputHelp}
              </span>
            )}
            <button
              className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={inputDisabled}
            >
              {strings.stageD.runLabel}
            </button>
          </Cluster>
        </form>
      ) : null}
    </section>
  );
}
