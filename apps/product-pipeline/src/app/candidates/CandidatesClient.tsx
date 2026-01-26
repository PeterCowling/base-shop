"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Cluster, Inline, Stack } from "@acme/design-system/primitives";

import { formatCurrency } from "@/lib/format";
import { formatStageStatus } from "@/lib/stage-labels";

import { runFullEvaluation } from "./fullEvaluation";

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
  stageM: {
    status: string | null;
    createdAt: string | null;
  };
  stageT: {
    status: string | null;
    createdAt: string | null;
    summary: {
      decision: string | null;
      action: string | null;
    } | null;
  };
  stageS: {
    status: string | null;
    createdAt: string | null;
    summary: {
      overallRisk: string | null;
      action: string | null;
    } | null;
  };
  stageB: {
    status: string | null;
    createdAt: string | null;
  };
  stageC: {
    status: string | null;
    createdAt: string | null;
    summary: {
      contributionPerUnitCents: string | null;
      contributionMarginPct: number | null;
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
  runFullEvalLabel: string;
  runStageKLabel: string;
  exportCsvLabel: string;
  viewCandidateLabel: string;
  selectAllLabel: string;
  selectLabel: string;
  stageLabel: string;
  profitLabel: string;
  peakCashLabel: string;
  paybackLabel: string;
  riskLabel: string;
  effortLabel: string;
  nextLabel: string;
  recommendation: {
    label: string;
    advance: string;
    review: string;
    reject: string;
    pause: string;
  };
  nextSteps: {
    needStageM: string;
    needStageT: string;
    needStageS: string;
    needStageB: string;
    needStageC: string;
    needStageK: string;
    needStageR: string;
    ready: string;
  };
  gates: {
    eligibilityBlocked: string;
    eligibilityReview: string;
    complianceBlocked: string;
  };
  filters: {
    label: string;
    needsDecision: string;
    blockedEligibility: string;
    missingMarket: string;
    profitableCashHeavy: string;
    highRisk: string;
    lowConfidence: string;
    clear: string;
  };
  stageLabels: Record<string, string>;
  bulk: {
    running: string;
    progress: string;
    complete: string;
    error: string;
    noneSelected: string;
  };
  bulkFullEval: {
    running: string;
    progress: string;
    complete: string;
    error: string;
    noneSelected: string;
  };
  notAvailable: string;
};

type FilterKey =
  | "needsDecision"
  | "blockedEligibility"
  | "missingMarket"
  | "profitableCashHeavy"
  | "highRisk"
  | "lowConfidence";

const FILTER_ACTIVE_CLASS =
  "bg-primary text-primary-foreground"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] CSS utility classes
const FILTER_INACTIVE_CLASS =
  "border border-border-2 text-foreground/70 hover:bg-surface-3"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] CSS utility classes
const FILTER_CLEAR_CLASS =
  "rounded-full border border-border-2 px-3 py-1 text-xs font-semibold text-foreground/70 hover:bg-surface-3"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] CSS utility classes

function parseCashValue(value: string | null | undefined): bigint | null {
  if (!value) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function normalizeLower(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function isSucceeded(status: string | null | undefined): boolean {
  return status === "succeeded";
}

function computeConfidence(candidate: Candidate): number {
  let score = 100;
  const statuses = [
    candidate.stageM.status,
    candidate.stageT.status,
    candidate.stageS.status,
    candidate.stageB.status,
    candidate.stageC.status,
    candidate.stageK.status,
    candidate.stageR.status,
  ];
  statuses.forEach((status) => {
    if (!isSucceeded(status)) score -= 10;
  });
  const decision = normalizeLower(candidate.stageT.summary?.decision ?? null);
  if (decision === "blocked") score -= 15;
  if (decision === "needs_review") score -= 10;
  return Math.max(0, score);
}

type GateStatus = "eligibility_blocked" | "eligibility_review" | "compliance_blocked" | null;

function resolveGate(candidate: Candidate): GateStatus {
  const decision = normalizeLower(candidate.stageT.summary?.decision ?? null);
  if (decision === "blocked") return "eligibility_blocked";
  if (decision === "needs_review") return "eligibility_review";
  const complianceRisk = normalizeLower(candidate.stageS.summary?.overallRisk ?? null);
  const complianceAction = normalizeLower(candidate.stageS.summary?.action ?? null);
  if (complianceAction === "block" || complianceRisk === "high") {
    return "compliance_blocked";
  }
  return null;
}

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
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);

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

  const runBulkFullEval = useCallback(async () => {
    if (selectedIds.length === 0) {
      setBulkMessage({ tone: "error", text: strings.bulkFullEval.noneSelected });
      return;
    }

    setBulkRunning(true);
    setBulkMessage({ tone: "info", text: strings.bulkFullEval.running });

    let success = 0;
    let failed = 0;

    for (let index = 0; index < selectedIds.length; index += 1) {
      const candidateId = selectedIds[index];
      if (!candidateId) continue;
      const progressText = strings.bulkFullEval.progress
        .replace("{current}", String(index + 1))
        .replace("{total}", String(selectedIds.length));
      setBulkMessage({ tone: "info", text: progressText });

      const candidate = candidates.find((item) => item.id === candidateId);
      if (!candidate) {
        failed += 1;
        continue;
      }

      try {
        const status = await runFullEvaluation({
          candidateId,
          lead: candidate.lead ?? null,
          statuses: {
            M: candidate.stageM.status,
            B: candidate.stageB.status,
            C: candidate.stageC.status,
            K: candidate.stageK.status,
          },
          stageLabels: strings.stageLabels,
          gateContext: {
            eligibilityDecision: candidate.stageT.summary?.decision ?? null,
            complianceRisk: candidate.stageS.summary?.overallRisk ?? null,
            complianceAction: candidate.stageS.summary?.action ?? null,
          },
          requestedBy: "bulk_full_eval",
        });

        if (status.missing.length > 0) {
          failed += 1;
        } else {
          success += 1;
        }
      } catch (error) {
        console.error(error);
        failed += 1;
      }
    }

    const summaryText = strings.bulkFullEval.complete
      .replace("{success}", String(success))
      .replace("{failed}", String(failed));
    setBulkMessage({
      tone: failed > 0 ? "error" : "success",
      text: summaryText,
    });
    setBulkRunning(false);
    await loadCandidates();
  }, [
    candidates,
    loadCandidates,
    selectedIds,
    strings.bulkFullEval,
    strings.stageLabels,
  ]);

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

  const resolveRecommendation = useCallback(
    (candidate: Candidate) => {
      const decision = normalizeLower(candidate.decision ?? null);
      if (decision === "rejected" || decision === "reject" || decision === "kill")
        return "reject";
      if (
        decision === "paused" ||
        decision === "pause" ||
        decision === "cooldown" ||
        decision === "hold"
      )
        return "pause";
      if (decision === "advance" || decision === "approved") return "advance";
      if (decision === "review" || decision === "needs_review") return "review";
      const eligibilityDecision = normalizeLower(
        candidate.stageT.summary?.decision ?? null,
      );
      if (eligibilityDecision === "blocked") return "reject";
      if (eligibilityDecision === "needs_review") return "review";
      const complianceRisk = normalizeLower(
        candidate.stageS.summary?.overallRisk ?? null,
      );
      const complianceAction = normalizeLower(
        candidate.stageS.summary?.action ?? null,
      );
      if (complianceAction === "block" || complianceRisk === "high") return "reject";
      const next = candidate.stageR.summary?.nextAction ?? null;
      if (next === "ADVANCE") return "advance";
      if (!candidate.stageK.summary?.peakCashOutlayCents) return "review";
      if (!candidate.stageR.summary?.riskBand) return "review";
      return "review";
    },
    [],
  );

  const cashMedian = useMemo(() => {
    const values = candidates
      .map((candidate) =>
        parseCashValue(candidate.stageK.summary?.peakCashOutlayCents ?? null),
      )
      .filter((value): value is bigint => value !== null);
    if (values.length === 0) return null;
    values.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    return values[Math.floor(values.length / 2)] ?? null;
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    if (activeFilters.length === 0) return rankedCandidates;
    return rankedCandidates.filter((candidate) => {
      const eligibilityDecision = normalizeLower(
        candidate.stageT.summary?.decision ?? null,
      );
      const eligibilityBlocked =
        eligibilityDecision === "blocked" ||
        eligibilityDecision === "needs_review";
      const missingMarket = !isSucceeded(candidate.stageM.status);
      const complianceRisk = normalizeLower(
        candidate.stageS.summary?.overallRisk ?? null,
      );
      const complianceAction = normalizeLower(
        candidate.stageS.summary?.action ?? null,
      );
      const riskBand = normalizeLower(
        candidate.stageR.summary?.riskBand ?? null,
      );
      const highRisk =
        complianceAction === "block" ||
        complianceRisk === "high" ||
        riskBand === "high";
      const confidence = computeConfidence(candidate);
      const lowConfidence = confidence < 50;
      const cashValue = parseCashValue(
        candidate.stageK.summary?.peakCashOutlayCents ?? null,
      );
      const returnRate = candidate.stageK.summary?.annualizedCapitalReturnRate;
      const profitValue = parseCashValue(
        candidate.stageC.summary?.contributionPerUnitCents ?? null,
      );
      const profitable =
        (profitValue !== null && profitValue > 0n) ||
        (returnRate !== null && returnRate !== undefined && returnRate > 0);
      const cashHeavy =
        cashMedian !== null && cashValue !== null && cashValue > cashMedian;
      const profitableCashHeavy = profitable && cashHeavy;
      const recommendation = resolveRecommendation(candidate);
      const needsDecision = !candidate.decision && recommendation !== "pause";

      const filters: Record<FilterKey, boolean> = {
        needsDecision,
        blockedEligibility: eligibilityBlocked,
        missingMarket,
        profitableCashHeavy,
        highRisk,
        lowConfidence,
      };

      return activeFilters.every((filter) => filters[filter]);
    });
  }, [activeFilters, cashMedian, rankedCandidates, resolveRecommendation]);

  const toggleFilter = useCallback((filter: FilterKey) => {
    setActiveFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
  }, []);

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
                  ? "text-danger"
                  : bulkMessage.tone === "success"
                    ? "text-success"
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
            className="min-h-12 min-w-12 rounded-full border border-border-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void runBulkFullEval()}
            disabled={bulkRunning || selectedIds.length === 0}
            type="button"
          >
            {strings.runFullEvalLabel}
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

      <div className="mt-4">
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.filters.label}
        </span>
        <Inline gap={2} className="mt-2 flex-wrap">
          {(
            [
              { key: "needsDecision", label: strings.filters.needsDecision },
              {
                key: "blockedEligibility",
                label: strings.filters.blockedEligibility,
              },
              { key: "missingMarket", label: strings.filters.missingMarket },
              {
                key: "profitableCashHeavy",
                label: strings.filters.profitableCashHeavy,
              },
              { key: "highRisk", label: strings.filters.highRisk },
              { key: "lowConfidence", label: strings.filters.lowConfidence },
            ] as Array<{ key: FilterKey; label: string }>
          ).map((filter) => {
            const isActive = activeFilters.includes(filter.key);
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => toggleFilter(filter.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive ? FILTER_ACTIVE_CLASS : FILTER_INACTIVE_CLASS
                }`}
              >
                {filter.label}
              </button>
            );
          })}
          {activeFilters.length > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className={FILTER_CLEAR_CLASS}
            >
              {strings.filters.clear}
            </button>
          ) : null}
        </Inline>
      </div>

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
          : filteredCandidates.map((candidate) => {
              const title =
                candidate.lead?.title ??
                candidate.lead?.url ??
                strings.notAvailable;
              const stage = formatStageStatus(
                candidate.stageStatus,
                strings.stageLabels,
                strings.notAvailable,
              );
              let profitPerSale = strings.notAvailable;
              if (candidate.stageC.summary?.contributionPerUnitCents) {
                try {
                  profitPerSale = formatCurrency(
                    BigInt(candidate.stageC.summary.contributionPerUnitCents),
                  );
                } catch {
                  profitPerSale = strings.notAvailable;
                }
              }
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
              const gate = resolveGate(candidate);
              const nextStep = (() => {
                if (gate === "eligibility_blocked" || gate === "eligibility_review") {
                  return { label: strings.nextSteps.needStageT, href: "#stage-t" };
                }
                if (gate === "compliance_blocked") {
                  return { label: strings.nextSteps.needStageS, href: "#stage-s" };
                }
                const stageOrder = [
                  { status: candidate.stageM.status, label: strings.nextSteps.needStageM, href: "#stage-m" },
                  { status: candidate.stageT.status, label: strings.nextSteps.needStageT, href: "#stage-t" },
                  { status: candidate.stageS.status, label: strings.nextSteps.needStageS, href: "#stage-s" },
                  { status: candidate.stageB.status, label: strings.nextSteps.needStageB, href: "#stage-b" },
                  { status: candidate.stageC.status, label: strings.nextSteps.needStageC, href: "#stage-c" },
                  { status: candidate.stageK.status, label: strings.nextSteps.needStageK, href: "#stage-k" },
                  { status: candidate.stageR.status, label: strings.nextSteps.needStageR, href: "#stage-r" },
                ];
                const missing = stageOrder.find((stage) => !isSucceeded(stage.status));
                if (missing) return { label: missing.label, href: missing.href };
                return { label: strings.nextSteps.ready, href: "" };
              })();
              const gateLabel =
                gate === "eligibility_blocked"
                  ? strings.gates.eligibilityBlocked
                  : gate === "eligibility_review"
                    ? strings.gates.eligibilityReview
                    : gate === "compliance_blocked"
                      ? strings.gates.complianceBlocked
                      : null;
              const actionHref = nextStep.href
                ? `/candidates/${candidate.id}${nextStep.href}`
                : `/candidates/${candidate.id}`;
              const recommendation = resolveRecommendation(candidate);
              const recommendationLabel =
                recommendation === "advance"
                  ? strings.recommendation.advance
                  : recommendation === "reject"
                    ? strings.recommendation.reject
                    : recommendation === "pause"
                      ? strings.recommendation.pause
                      : strings.recommendation.review;

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
                      <Inline gap={2} alignY="center" className="text-xs text-foreground/60">
                        <span className="rounded-full bg-surface-3 px-2 py-1 text-foreground/80">
                          {strings.recommendation.label}: {recommendationLabel}
                        </span>
                        <span>
                          {strings.stageLabel}: {stage}
                        </span>
                      </Inline>
                    </Stack>
                    <Cluster gap={4} alignY="center">
                      <Inline gap={4} alignY="center" className="text-sm">
                        <Stack gap={1}>
                          <span className="text-xs text-foreground/60">
                            {strings.profitLabel}
                          </span>
                          <span className="font-semibold">{profitPerSale}</span>
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
                    {gateLabel ? (
                      <span className="rounded-full border border-border-2 bg-amber-50 px-3 py-1 text-amber-800">
                        {gateLabel}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-border-2 px-3 py-1">
                      {strings.nextLabel}: {nextStep.label}
                    </span>
                    <Link
                      href={actionHref}
                      className="rounded-full bg-primary px-3 py-1 text-primary-foreground hover:opacity-80"
                    >
                      {nextStep.label}
                    </Link>
                  </Inline>
                </div>
              );
            })}
      </Stack>
    </section>
  );
}
