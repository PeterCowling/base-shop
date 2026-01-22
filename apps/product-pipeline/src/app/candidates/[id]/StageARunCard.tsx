/* eslint-disable ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Pending DS token rollout for controls */
"use client";

import { type FormEvent,useCallback, useEffect, useMemo, useState } from "react";
import { Cluster, Stack } from "@acme/design-system/primitives";

import {
  DEFAULT_STAGE_A_FORM,
  hydrateStageAForm,
  parseStageAForm,
  type StageAFormState,
} from "./stageAForm";
import StageAFormFields from "./StageAFormFields";
import { extractStageAInput, extractStageASummary } from "./stageAHelpers";
import StageASummaryCard from "./StageASummary";
import type { CandidateDetail, CandidateDetailStrings, StageRun } from "./types";

export default function StageARunCard({
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
  const latestStageA = useMemo(
    () => stageRuns.find((run) => run.stage === "A"),
    [stageRuns],
  );
  const latestSummary = useMemo(
    () => extractStageASummary(latestStageA),
    [latestStageA],
  );

  const [form, setForm] = useState<StageAFormState>(DEFAULT_STAGE_A_FORM);
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
    const input = extractStageAInput(latestStageA);
    setForm(hydrateStageAForm(input));
  }, [hasEdited, latestStageA]);

  const runStageA = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!candidate) return;

      setMessage(null);
      setRunning(true);

      const parsed = parseStageAForm(form);
      if (!parsed) {
        setMessage({ tone: "error", text: strings.stageA.errorInvalid });
        setRunning(false);
        return;
      }

      const payload = {
        candidateId,
        ...parsed,
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      };

      try {
        const response = await fetch("/api/stages/a/run", {
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
              : strings.stageA.errorRun;
          setMessage({ tone: "error", text });
        } else {
          setMessage({ tone: "success", text: strings.stageA.success });
        }
      } catch (error) {
        console.error(error);
        setMessage({ tone: "error", text: strings.stageA.errorRun });
      } finally {
        setRunning(false);
        await onRun();
      }
    },
    [candidate, candidateId, form, onRun, strings.cooldown, strings.stageA],
  );

  const inputDisabled = running || loading || cooldownActive;

  return (
    <section className="pp-card p-6" id="stage-a">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageA.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.stageA.title}
        </h2>
      </Stack>

      <StageASummaryCard
        summary={latestSummary}
        strings={strings.stageA}
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
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={runStageA}>
          <StageAFormFields
            form={form}
            setForm={setForm}
            disabled={inputDisabled}
            strings={strings.stageA}
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
                  : strings.stageA.inputHelp}
              </span>
            )}
            <button
              className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={inputDisabled}
            >
              {strings.stageA.runLabel}
            </button>
          </Cluster>
        </form>
      ) : null}
    </section>
  );
}
