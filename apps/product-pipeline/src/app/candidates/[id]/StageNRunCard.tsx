"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";
import type { CandidateDetail, CandidateDetailStrings, StageRun } from "./types";
import { extractStageNInput, extractStageNSummary, parseStageNTasks } from "./stageNHelpers";
import StageNSummaryCard from "./StageNSummary";
import StageNFormFields, {
  type StageNStatusOption,
} from "./StageNFormFields";
import {
  DEFAULT_STAGE_N_FORM,
  hydrateStageNForm,
  parseStageNForm,
  type StageNFormState,
} from "./stageNForm";

export default function StageNRunCard({
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
  const latestStageN = useMemo(
    () => stageRuns.find((run) => run.stage === "N"),
    [stageRuns],
  );
  const latestSummary = useMemo(
    () => extractStageNSummary(latestStageN),
    [latestStageN],
  );

  const [form, setForm] = useState<StageNFormState>(DEFAULT_STAGE_N_FORM);
  const [hasEdited, setHasEdited] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const cooldownActive = Boolean(candidate?.cooldown?.active);

  useEffect(() => {
    if (hasEdited) return;
    const input = extractStageNInput(latestStageN);
    setForm(hydrateStageNForm(input));
  }, [hasEdited, latestStageN]);

  const runStageN = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!candidate) return;

      setMessage(null);
      setRunning(true);

      const parsed = parseStageNForm(form);
      if (!parsed) {
        setMessage({ tone: "error", text: strings.stageN.errorInvalid });
        setRunning(false);
        return;
      }

      const tasks = parseStageNTasks(form.tasks);

      const payload = {
        candidateId,
        ...parsed,
        ...(tasks.length ? { tasks } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      };

      try {
        const response = await fetch("/api/stages/n/run", {
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
              : strings.stageN.errorRun;
          setMessage({ tone: "error", text });
        } else {
          setMessage({ tone: "success", text: strings.stageN.success });
        }
      } catch (error) {
        console.error(error);
        setMessage({ tone: "error", text: strings.stageN.errorRun });
      } finally {
        setRunning(false);
        await onRun();
      }
    },
    [candidate, candidateId, form, onRun, strings.cooldown, strings.stageN],
  );

  const inputDisabled = running || loading || cooldownActive;

  const statusOptions: StageNStatusOption[] = [
    { value: "not_started", label: strings.stageN.statuses.notStarted },
    { value: "in_progress", label: strings.stageN.statuses.inProgress },
    { value: "waiting_on_supplier", label: strings.stageN.statuses.waitingOnSupplier },
    { value: "terms_improved", label: strings.stageN.statuses.termsImproved },
    { value: "no_progress", label: strings.stageN.statuses.noProgress },
  ];

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageN.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.stageN.title}
        </h2>
      </Stack>

      <StageNSummaryCard
        summary={latestSummary}
        strings={strings.stageN}
        notAvailable={strings.notAvailable}
      />

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={runStageN}>
        <StageNFormFields
          form={form}
          setForm={setForm}
          disabled={inputDisabled}
          strings={strings.stageN}
          statusOptions={statusOptions}
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
                : strings.stageN.inputHelp}
            </span>
          )}
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={inputDisabled}
          >
            {strings.stageN.runLabel}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
