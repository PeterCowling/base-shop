/* eslint-disable ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Pending DS token rollout for controls */
"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@ui/components/atoms/primitives";
import { formatStageRunLabel } from "@/lib/stage-labels";
import type { CandidateDetailStrings, StageRun } from "./types";

type StageRunOption = {
  id: string;
  label: string;
};

export default function CandidateArtifactUploadCard({
  candidateId,
  stageRuns,
  loading,
  strings,
  onUploaded,
}: {
  candidateId: string;
  stageRuns: StageRun[];
  loading: boolean;
  strings: CandidateDetailStrings;
  onUploaded: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    stageRunId: "",
    kind: "",
    file: null as File | null,
  });

  const stageRunOptions = useMemo<StageRunOption[]>(
    () =>
      stageRuns.map((run) => ({
        id: run.id,
        label: formatStageRunLabel(run, strings.stageLabels),
      })),
    [stageRuns, strings.stageLabels],
  );

  useEffect(() => {
    if (form.stageRunId) {
      const stillValid = stageRunOptions.some(
        (option) => option.id === form.stageRunId,
      );
      if (!stillValid) {
        setForm((current) => ({ ...current, stageRunId: "" }));
      }
    }
    if (!form.stageRunId && stageRunOptions.length === 1) {
      setForm((current) => ({ ...current, stageRunId: stageRunOptions[0]!.id }));
    }
  }, [form.stageRunId, stageRunOptions]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form.stageRunId || !form.kind || !form.file) {
        setMessage(strings.artifactUpload.errorMessage);
        return;
      }

      setSubmitting(true);
      setMessage(null);
      const data = new FormData();
      data.set("candidateId", candidateId);
      data.set("stageRunId", form.stageRunId);
      data.set("kind", form.kind);
      data.set("file", form.file);

      try {
        const response = await fetch("/api/artifacts/upload", {
          method: "POST",
          body: data,
        });
        if (!response.ok) {
          setMessage(strings.artifactUpload.errorMessage);
        } else {
          setMessage(strings.artifactUpload.successMessage);
          setForm({ stageRunId: "", kind: "", file: null });
          await onUploaded();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.artifactUpload.errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [candidateId, form, onUploaded, strings.artifactUpload],
  );

  const stageRunDisabled =
    loading || stageRunOptions.length === 0 || submitting;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.artifactUpload.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.artifactUpload.title}
        </h2>
      </Stack>
      <div className="mt-4">
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? strings.common.hideDetails : strings.common.showDetails}
        </button>
      </div>
      {expanded ? (
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.artifactUpload.stageRunLabel}
            <select
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={form.stageRunId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  stageRunId: event.target.value,
                }))
              }
              disabled={stageRunDisabled}
            >
              <option value="">
                {loading
                  ? strings.artifactUpload.loadingRuns
                  : stageRunOptions.length === 0
                    ? strings.artifactUpload.emptyRuns
                    : strings.notAvailable}
              </option>
              {stageRunOptions.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.artifactUpload.kindLabel}
            <input
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              value={form.kind}
              onChange={(event) =>
                setForm((current) => ({ ...current, kind: event.target.value }))
              }
              disabled={submitting}
              type="text"
            />
          </label>
          <label className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.artifactUpload.fileLabel}
            <input
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  file: event.target.files?.[0] ?? null,
                }))
              }
              disabled={submitting}
              type="file"
            />
          </label>
          <Cluster justify="between" alignY="center" className="gap-3 md:col-span-2">
            <span className="text-xs text-foreground/60">
              {message ?? strings.notAvailable}
            </span>
            <button
              className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={
                submitting ||
                !form.stageRunId ||
                !form.kind ||
                !form.file ||
                stageRunDisabled
              }
            >
              {strings.artifactUpload.submitLabel}
            </button>
          </Cluster>
        </form>
      ) : null}
    </section>
  );
}
