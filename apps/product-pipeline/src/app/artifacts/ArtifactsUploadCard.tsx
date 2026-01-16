"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";
import type { ArtifactsStrings, CandidateOption, StageRunOption } from "./types";

type CandidateSummary = {
  id: string;
  lead: { title: string | null } | null;
};

type CandidateDetailResponse = {
  ok?: boolean;
  stageRuns?: Array<{
    id: string;
    stage: string;
    status: string;
    createdAt: string | null;
  }>;
};

function formatCandidateLabel(candidate: CandidateSummary): string {
  if (candidate.lead?.title) {
    const shortId = candidate.id.slice(0, 8);
    return `${candidate.lead.title} | ${shortId}`;
  }
  return candidate.id;
}

function formatStageRunLabel(run: {
  stage: string;
  status: string;
  createdAt: string | null;
}): string {
  const timestamp = run.createdAt ?? "";
  return `${run.stage} | ${run.status}${timestamp ? ` | ${timestamp}` : ""}`;
}

export default function ArtifactsUploadCard({
  strings,
  onUploaded,
}: {
  strings: ArtifactsStrings;
  onUploaded: () => Promise<void>;
}) {
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [stageRuns, setStageRuns] = useState<StageRunOption[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    candidateId: "",
    stageRunId: "",
    kind: "",
    file: null as File | null,
  });

  const loadCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    try {
      const response = await fetch("/api/candidates?limit=200");
      if (!response.ok) return;
      const data = (await response.json()) as {
        ok?: boolean;
        candidates?: CandidateSummary[];
      };
      if (data.ok && Array.isArray(data.candidates)) {
        setCandidates(
          data.candidates.map((candidate) => ({
            id: candidate.id,
            label: formatCandidateLabel(candidate),
          })),
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  const loadStageRuns = useCallback(async (candidateId: string) => {
    setLoadingRuns(true);
    try {
      const response = await fetch(`/api/candidates/${candidateId}`);
      if (!response.ok) return;
      const data = (await response.json()) as CandidateDetailResponse;
      if (data.ok && Array.isArray(data.stageRuns)) {
        setStageRuns(
          data.stageRuns.map((run) => ({
            id: run.id,
            label: formatStageRunLabel(run),
          })),
        );
      } else {
        setStageRuns([]);
      }
    } catch (error) {
      console.error(error);
      setStageRuns([]);
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  useEffect(() => {
    if (!form.candidateId) {
      setStageRuns([]);
      return;
    }
    void loadStageRuns(form.candidateId);
  }, [form.candidateId, loadStageRuns]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!form.candidateId || !form.stageRunId || !form.kind || !form.file) {
        setMessage(strings.upload.errorMessage);
        return;
      }

      setSubmitting(true);
      setMessage(null);
      const data = new FormData();
      data.set("candidateId", form.candidateId);
      data.set("stageRunId", form.stageRunId);
      data.set("kind", form.kind);
      data.set("file", form.file);

      try {
        const response = await fetch("/api/artifacts/upload", {
          method: "POST",
          body: data,
        });
        if (!response.ok) {
          setMessage(strings.upload.errorMessage);
        } else {
          setMessage(strings.upload.successMessage);
          setForm({ candidateId: "", stageRunId: "", kind: "", file: null });
          setStageRuns([]);
          await onUploaded();
        }
      } catch (error) {
        console.error(error);
        setMessage(strings.upload.errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [form, onUploaded, strings.upload],
  );

  const disabled = submitting || loadingCandidates;
  const stageRunDisabled =
    disabled || !form.candidateId || loadingRuns || stageRuns.length === 0;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.upload.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.upload.title}
        </h2>
      </Stack>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.upload.candidateLabel}
          <select
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.candidateId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                candidateId: event.target.value,
                stageRunId: "",
              }))
            }
            disabled={disabled}
          >
            <option value="">
              {loadingCandidates
                ? strings.upload.loadingCandidates
                : strings.notAvailable}
            </option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.upload.stageRunLabel}
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
              {loadingRuns
                ? strings.upload.loadingRuns
                : stageRuns.length === 0
                  ? strings.upload.emptyRuns
                  : strings.notAvailable}
            </option>
            {stageRuns.map((run) => (
              <option key={run.id} value={run.id}>
                {run.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.upload.kindLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            value={form.kind}
            onChange={(event) =>
              setForm((current) => ({ ...current, kind: event.target.value }))
            }
            disabled={disabled}
            type="text"
          />
        </label>
        <label className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.upload.fileLabel}
          <input
            className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                file: event.target.files?.[0] ?? null,
              }))
            }
            disabled={disabled}
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
            disabled={disabled || !form.stageRunId || !form.kind || !form.file}
          >
            {strings.upload.submitLabel}
          </button>
        </Cluster>
      </form>
    </section>
  );
}
