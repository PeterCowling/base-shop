"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";
import type { CandidateDetail, CandidateDetailStrings, StageRun } from "./types";
import {
  extractStageBInput,
  extractStageBSummary,
  type StageBLaneMeta,
} from "./stageBHelpers";
import StageBLaneApplyCard from "./StageBLaneApplyCard";
import StageBLaneGuidanceCard from "./StageBLaneGuidanceCard";
import StageBSummaryCard from "./StageBSummary";
import StageBFormFields from "./StageBFormFields";
import {
  DEFAULT_STAGE_B_FORM,
  hydrateStageBForm,
  parseStageBForm,
  type StageBFormState,
} from "./stageBForm";

export default function StageBRunCard({
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
  const latestStageB = useMemo(
    () => stageRuns.find((run) => run.stage === "B"),
    [stageRuns],
  );
  const latestSummary = useMemo(
    () => extractStageBSummary(latestStageB),
    [latestStageB],
  );

  const [form, setForm] = useState<StageBFormState>(DEFAULT_STAGE_B_FORM);
  const [laneMeta, setLaneMeta] = useState<StageBLaneMeta | null>(null);
  const [hasEdited, setHasEdited] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const cooldownActive = Boolean(candidate?.cooldown?.active);

  useEffect(() => {
    if (hasEdited) return;
    const input = extractStageBInput(latestStageB);
    setForm(hydrateStageBForm(input));
    setLaneMeta(input?.lane ?? null);
  }, [hasEdited, latestStageB]);

  const handleLaneApplied = useCallback(
    (
      meta: StageBLaneMeta,
      prefill: { freight?: string; leadTimeDays?: string; incoterms?: string },
    ) => {
      setHasEdited(true);
      setLaneMeta(meta);
      setForm((current) => ({
        ...current,
        ...(prefill.freight !== undefined ? { freight: prefill.freight } : {}),
        ...(prefill.leadTimeDays !== undefined
          ? { leadTimeDays: prefill.leadTimeDays }
          : {}),
        ...(prefill.incoterms !== undefined
          ? { incoterms: prefill.incoterms }
          : {}),
      }));
    },
    [],
  );

  const runStageB = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!candidate) return;

      setMessage(null);
      setRunning(true);

      const parsed = parseStageBForm(form);
      if (!parsed) {
        setMessage({ tone: "error", text: strings.stageB.errorInvalid });
        setRunning(false);
        return;
      }

      const payload = {
        candidateId,
        ...parsed,
        ...(form.incoterms.trim() ? { incoterms: form.incoterms.trim() } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        ...(laneMeta ? { lane: laneMeta } : {}),
      };

      try {
        const response = await fetch("/api/stages/b/run", {
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
              : strings.stageB.errorRun;
          setMessage({ tone: "error", text });
        } else {
          setMessage({ tone: "success", text: strings.stageB.success });
        }
      } catch (error) {
        console.error(error);
        setMessage({ tone: "error", text: strings.stageB.errorRun });
      } finally {
        setRunning(false);
        await onRun();
      }
    },
    [
      candidate,
      candidateId,
      form,
      laneMeta,
      onRun,
      strings.cooldown,
      strings.stageB,
    ],
  );

  const inputDisabled = running || loading || cooldownActive;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageB.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.stageB.title}
        </h2>
      </Stack>

      <div className="mt-4">
        <StageBLaneApplyCard
          laneMeta={laneMeta}
          disabled={inputDisabled}
          strings={strings.stageB}
          notAvailable={strings.notAvailable}
          onApplied={handleLaneApplied}
        />
      </div>

      <div className="mt-4">
        <StageBLaneGuidanceCard strings={strings.stageB.guidance} />
      </div>

      <StageBSummaryCard
        summary={latestSummary}
        strings={strings.stageB}
        notAvailable={strings.notAvailable}
      />

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={runStageB}>
        <StageBFormFields
          form={form}
          setForm={setForm}
          disabled={inputDisabled}
          strings={strings.stageB}
          onEdit={() => setHasEdited(true)}
        />
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
                : strings.stageB.inputHelp}
            </span>
          )}
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={inputDisabled}
          >
            {strings.stageB.runLabel}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
