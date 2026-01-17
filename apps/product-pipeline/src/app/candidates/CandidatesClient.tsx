"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { Cluster, Inline, Stack } from "@acme/ui/components/atoms/primitives";

type Candidate = {
  id: string;
  leadId: string | null;
  stageStatus: string | null;
  decision: string | null;
  decisionReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  stageK: {
    status: string | null;
    createdAt: string | null;
    summary: {
      peakCashOutlayCents: string | null;
      paybackDay: number | null;
      annualizedCapitalReturnRate: number | null;
      returnBand: string | null;
    } | null;
  };
  stageR: {
    status: string | null;
    createdAt: string | null;
    summary: {
      riskScore: number | null;
      riskBand: string | null;
      effortScore: number | null;
      effortBand: string | null;
      returnRate: number | null;
      rankScore: number | null;
      nextAction: string | null;
    } | null;
  };
  lead: {
    id: string;
    title: string | null;
    source: string | null;
    url: string | null;
  } | null;
};

type CandidateStrings = {
  rankedLabel: string;
  rankedTitle: string;
  runStageKLabel: string;
  exportCsvLabel: string;
  selectAllLabel: string;
  selectLabel: string;
  stageLabel: string;
  returnBandLabel: string;
  peakCashLabel: string;
  paybackLabel: string;
  riskLabel: string;
  effortLabel: string;
  nextLabel: string;
  nextActions: {
    advance: string;
    reviewRisk: string;
    reviewEffort: string;
    needStageK: string;
  };
  bulk: {
    running: string;
    progress: string;
    complete: string;
    error: string;
    noneSelected: string;
  };
  notAvailable: string;
};

export default function CandidatesClient({
  strings,
}: {
  strings: CandidateStrings;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{
    tone: "info" | "success" | "error";
    text: string;
  } | null>(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/candidates?limit=50");
      if (!response.ok) return;
      const data = (await response.json()) as {
        ok?: boolean;
        candidates?: Candidate[];
      };
      if (data.ok && Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
        const allowed = new Set(data.candidates.map((candidate) => candidate.id));
        setSelectedIds((current) =>
          current.filter((id) => allowed.has(id)),
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected =
    candidates.length > 0 &&
    candidates.every((candidate) => selectedSet.has(candidate.id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) => {
      if (candidates.length === 0) return current;
      const allIds = candidates.map((candidate) => candidate.id);
      const isAllSelected = allIds.every((id) => current.includes(id));
      return isAllSelected ? [] : allIds;
    });
  }, [candidates]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((existing) => existing !== id);
      }
      return [...current, id];
    });
  }, []);

  const exportUrl = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const params = new URLSearchParams();
    params.set("ids", selectedIds.join(","));
    return `/api/exports/candidates?${params.toString()}`;
  }, [selectedIds]);

  const handleExport = useCallback(() => {
    if (!exportUrl) return;
    window.location.assign(exportUrl);
  }, [exportUrl]);

  const runBulkStageK = useCallback(async () => {
    if (selectedIds.length === 0) {
      setBulkMessage({ tone: "error", text: strings.bulk.noneSelected });
      return;
    }

    setBulkRunning(true);
    setBulkMessage({ tone: "info", text: strings.bulk.running });

    let success = 0;
    let failed = 0;

    for (let index = 0; index < selectedIds.length; index += 1) {
      const candidateId = selectedIds[index];
      if (!candidateId) continue;
      const progressText = strings.bulk.progress
        .replace("{current}", String(index + 1))
        .replace("{total}", String(selectedIds.length));
      setBulkMessage({ tone: "info", text: progressText });

      try {
        const composeResponse = await fetch("/api/stages/k/compose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId }),
        });
        if (!composeResponse.ok) {
          failed += 1;
          continue;
        }
        const composeData = (await composeResponse.json()) as {
          ok?: boolean;
          input?: unknown;
          scenario?: unknown;
        };
        if (!composeData.ok || !composeData.input) {
          failed += 1;
          continue;
        }

        const runResponse = await fetch("/api/stages/k/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId,
            input: composeData.input,
            scenario: composeData.scenario,
            requestedBy: "bulk_run",
          }),
        });
        if (!runResponse.ok) {
          failed += 1;
          continue;
        }
        success += 1;
      } catch (error) {
        console.error(error);
        failed += 1;
      }
    }

    const summaryText = strings.bulk.complete
      .replace("{success}", String(success))
      .replace("{failed}", String(failed));
    setBulkMessage({
      tone: failed > 0 ? "error" : "success",
      text: summaryText,
    });
    setBulkRunning(false);
    await loadCandidates();
  }, [loadCandidates, selectedIds, strings.bulk]);

  const rankedCandidates = useMemo(() => {
    if (candidates.length === 0) return candidates;
    return [...candidates].sort((a, b) => {
      const scoreA =
        a.stageR.summary?.rankScore ??
        a.stageK.summary?.annualizedCapitalReturnRate ??
        -Infinity;
      const scoreB =
        b.stageR.summary?.rankScore ??
        b.stageK.summary?.annualizedCapitalReturnRate ??
        -Infinity;
      return scoreB - scoreA;
    });
  }, [candidates]);

  return (
    <section className="pp-card p-6">
      <Cluster justify="between" alignY="center" className="gap-4">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.rankedLabel}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">
            {strings.rankedTitle}
          </h2>
          {bulkMessage ? (
            <span
              className={`text-xs ${
                bulkMessage.tone === "error"
                  ? "text-red-600"
                  : bulkMessage.tone === "success"
                    ? "text-emerald-600"
                    : "text-foreground/60"
              }`}
            >
              {bulkMessage.text}
            </span>
          ) : null}
        </Stack>
        <Cluster gap={3} alignY="center">
          <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground/60">
            <input
              type="checkbox"
              aria-label={strings.selectAllLabel}
              checked={allSelected}
              onChange={toggleSelectAll}
            />
            {strings.selectAllLabel}
          </label>
          <button
            className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleExport}
            disabled={!exportUrl}
            type="button"
          >
            {strings.exportCsvLabel}
          </button>
          <button
            className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void runBulkStageK()}
            disabled={bulkRunning || selectedIds.length === 0}
            type="button"
          >
            {strings.runStageKLabel}
          </button>
        </Cluster>
      </Cluster>

      <Stack gap={4} className="mt-6">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="rounded-3xl border border-border-1 bg-surface-2 p-4"
              >
                <div className="h-4 w-24 rounded-full bg-foreground/10" />
                <div className="mt-3 h-5 w-48 rounded-full bg-foreground/10" />
                <div className="mt-4 h-3 w-32 rounded-full bg-foreground/10" />
                <div className="mt-6 h-8 w-full rounded-2xl bg-foreground/10" />
              </div>
            ))
          : rankedCandidates.map((candidate) => {
              const title =
                candidate.lead?.title ??
                candidate.lead?.url ??
                strings.notAvailable;
              const stage = candidate.stageStatus ?? strings.notAvailable;
              const returnBand = candidate.stageK.summary?.returnBand
                ? candidate.stageK.summary.returnBand.toUpperCase()
                : strings.notAvailable;
              let peakCash = strings.notAvailable;
              if (candidate.stageK.summary?.peakCashOutlayCents) {
                try {
                  peakCash = formatCurrency(
                    BigInt(candidate.stageK.summary.peakCashOutlayCents),
                  );
                } catch {
                  peakCash = strings.notAvailable;
                }
              }
              const payback =
                candidate.stageK.summary?.paybackDay !== null &&
                candidate.stageK.summary?.paybackDay !== undefined
                  ? String(candidate.stageK.summary.paybackDay)
                  : strings.notAvailable;
              const risk = candidate.stageR.summary?.riskBand
                ? candidate.stageR.summary.riskBand.toUpperCase()
                : strings.notAvailable;
              const effort = candidate.stageR.summary?.effortBand
                ? candidate.stageR.summary.effortBand.toUpperCase()
                : strings.notAvailable;
              const nextAction = candidate.stageR.summary?.nextAction ?? null;
              const next =
                nextAction === "ADVANCE"
                  ? strings.nextActions.advance
                  : nextAction === "REVIEW_RISK"
                    ? strings.nextActions.reviewRisk
                    : nextAction === "REVIEW_EFFORT"
                      ? strings.nextActions.reviewEffort
                      : nextAction === "NEED_STAGE_K"
                        ? strings.nextActions.needStageK
                        : strings.notAvailable;

              return (
                <div
                  key={candidate.id}
                  className="rounded-3xl border border-border-1 bg-surface-2 p-4"
                >
                  <Cluster justify="between" alignY="center" className="gap-4">
                    <Stack gap={1}>
                      <span className="text-xs text-foreground/60">
                        {candidate.id}
                      </span>
                      <Link
                        href={`/candidates/${candidate.id}`}
                        className="text-lg font-semibold hover:underline"
                      >
                        {title}
                      </Link>
                      <span className="text-xs text-foreground/60">
                        {strings.stageLabel}: {stage}
                      </span>
                    </Stack>
                    <Cluster gap={4} alignY="center">
                      <Inline gap={4} alignY="center" className="text-sm">
                        <Stack gap={1}>
                          <span className="text-xs text-foreground/60">
                            {strings.returnBandLabel}
                          </span>
                          <span className="font-semibold">{returnBand}</span>
                        </Stack>
                        <Stack gap={1}>
                          <span className="text-xs text-foreground/60">
                            {strings.peakCashLabel}
                          </span>
                          <span className="font-semibold">{peakCash}</span>
                        </Stack>
                        <Stack gap={1}>
                          <span className="text-xs text-foreground/60">
                            {strings.paybackLabel}
                          </span>
                          <span className="font-semibold">{payback}</span>
                        </Stack>
                      </Inline>
                      <input
                        type="checkbox"
                        aria-label={strings.selectLabel}
                        checked={selectedSet.has(candidate.id)}
                        onChange={() => toggleSelected(candidate.id)}
                      />
                    </Cluster>
                  </Cluster>
                  <Inline gap={3} className="mt-4 text-xs">
                    <span className="rounded-full border border-border-2 px-3 py-1">
                      {strings.riskLabel}: {risk}
                    </span>
                    <span className="rounded-full border border-border-2 px-3 py-1">
                      {strings.effortLabel}: {effort}
                    </span>
                    <span className="rounded-full border border-border-2 px-3 py-1">
                      {strings.nextLabel}: {next}
                    </span>
                  </Inline>
                </div>
              );
            })}
      </Stack>
    </section>
  );
}
