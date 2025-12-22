"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@ui/components/atoms/primitives";
import type { CandidateDetail, CandidateDetailStrings, StageRun } from "./types";
import { extractStageCInput, extractStageCSummary } from "./stageCHelpers";
import StageCSummaryCard from "./StageCSummary";
import StageCFormFields from "./StageCFormFields";
import {
  DEFAULT_STAGE_C_FORM,
  hydrateStageCForm,
  parseStageCForm,
  type StageCFormState,
} from "./stageCForm";

export default function StageCRunCard({
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
  const latestStageC = useMemo(
    () => stageRuns.find((run) => run.stage === "C"),
    [stageRuns],
  );
  const latestSummary = useMemo(
    () => extractStageCSummary(latestStageC),
    [latestStageC],
  );

  const [form, setForm] = useState<StageCFormState>(DEFAULT_STAGE_C_FORM);
  const [hasEdited, setHasEdited] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const cooldownActive = Boolean(candidate?.cooldown?.active);

  useEffect(() => {
    if (hasEdited) return;
    const input = extractStageCInput(latestStageC);
    setForm(hydrateStageCForm(input));
  }, [hasEdited, latestStageC]);

  const runStageC = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!candidate) return;

      setMessage(null);
      setRunning(true);

      const parsed = parseStageCForm(form);
      if (!parsed) {
        setMessage({ tone: "error", text: strings.stageC.errorInvalid });
        setRunning(false);
        return;
      }

      const payload = {
        candidateId,
        ...parsed,
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      };

      try {
        const response = await fetch("/api/stages/c/run", {
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
              : strings.stageC.errorRun;
          setMessage({ tone: "error", text });
        } else {
          setMessage({ tone: "success", text: strings.stageC.success });
        }
      } catch (error) {
        console.error(error);
        setMessage({ tone: "error", text: strings.stageC.errorRun });
      } finally {
        setRunning(false);
        await onRun();
      }
    },
    [candidate, candidateId, form, onRun, strings.cooldown, strings.stageC],
  );

  const inputDisabled = running || loading || cooldownActive;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageC.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.stageC.title}
        </h2>
      </Stack>

      <StageCSummaryCard
        summary={latestSummary}
        strings={strings.stageC}
        notAvailable={strings.notAvailable}
      />

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={runStageC}>
        <StageCFormFields
          form={form}
          setForm={setForm}
          disabled={inputDisabled}
          strings={strings.stageC}
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
                : strings.stageC.inputHelp}
            </span>
          )}
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={inputDisabled}
          >
            {strings.stageC.runLabel}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
