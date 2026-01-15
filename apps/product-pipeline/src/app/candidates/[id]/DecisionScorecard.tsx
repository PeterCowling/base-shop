"use client";

/* eslint-disable ds/no-hardcoded-copy, ds/no-nonlayered-zindex, ds/enforce-layout-primitives, ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Product pipeline UI awaiting design/i18n refactor */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Cluster, Stack } from "@ui/components/atoms/primitives";
import { formatCurrency, formatPercent } from "@/lib/format";
import { resolveStageLabel } from "@/lib/stage-labels";
import type {
  CandidateDetail,
  CandidateDetailStrings,
  StageRun,
} from "./types";
import { extractStageCSummary } from "./stageCHelpers";
import { extractStageRSummary } from "./stageRHelpers";
import { extractStageSSummary } from "./stageSHelpers";
import { extractStageTSummary } from "./stageTHelpers";

type KeyMetric = {
  label: string;
  value: string;
  helper?: string;
};

type DecisionChoice = "advance" | "review" | "reject" | "pause";

function latestSucceeded(stageRuns: StageRun[], stage: string): StageRun | null {
  return stageRuns.find((run) => run.stage === stage && run.status === "succeeded") ?? null;
}

function safeFormatCurrency(value?: string): string {
  if (!value) return "";
  try {
    return formatCurrency(BigInt(value));
  } catch {
    return "";
  }
}

function riskTone(band: string | null | undefined): "low" | "medium" | "high" | "unknown" {
  if (!band) return "unknown";
  const normalized = band.toLowerCase();
  if (normalized === "low") return "low";
  if (normalized === "medium") return "medium";
  if (normalized === "high") return "high";
  return "unknown";
}

function confidenceLabel(score: number, strings: CandidateDetailStrings["scorecard"]) {
  if (score >= 70) return strings.confidenceHigh;
  if (score >= 40) return strings.confidenceMedium;
  return strings.confidenceLow;
}

function normalizeDecision(value: string | null | undefined): DecisionChoice | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "advance" || normalized === "approved") return "advance";
  if (normalized === "review" || normalized === "needs_review") return "review";
  if (normalized === "reject" || normalized === "rejected" || normalized === "kill")
    return "reject";
  if (
    normalized === "pause" ||
    normalized === "paused" ||
    normalized === "cooldown" ||
    normalized === "hold"
  )
    return "pause";
  return null;
}

function serializeDecision(choice: DecisionChoice): string {
  if (choice === "reject") return "rejected";
  if (choice === "pause") return "paused";
  return choice;
}

export default function DecisionScorecard({
  candidate,
  stageRuns,
  strings,
  onUpdated,
}: {
  candidate: CandidateDetail | null;
  stageRuns: StageRun[];
  strings: CandidateDetailStrings;
  onUpdated?: () => Promise<void>;
}) {
  const [decisionChoice, setDecisionChoice] = useState<DecisionChoice | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setDecisionChoice(normalizeDecision(candidate?.decision ?? null));
    setDecisionReason(candidate?.decisionReason ?? "");
  }, [candidate?.decision, candidate?.decisionReason]);

  const data = useMemo(() => {
    const stageC = latestSucceeded(stageRuns, "C");
    const cSummary = extractStageCSummary(stageC ?? undefined);
    const profit = safeFormatCurrency(cSummary?.contributionPerUnitCents);
    const marginPct = cSummary?.contributionMarginPct ?? null;

    const stageK = latestSucceeded(stageRuns, "K");
    const kSummary =
      stageK?.output && typeof stageK.output === "object"
        ? (stageK.output as { summary?: { peakCashOutlayCents?: string; paybackDay?: number | null } })
            .summary ?? null
        : null;

    const stageS = latestSucceeded(stageRuns, "S");
    const sSummary = extractStageSSummary(stageS ?? undefined);
    const stageT = latestSucceeded(stageRuns, "T");
    const tSummary = extractStageTSummary(stageT ?? undefined);

    const stageR = latestSucceeded(stageRuns, "R");
    const rSummary = extractStageRSummary(stageR ?? undefined);

    const gate =
      tSummary?.decision === "blocked"
        ? "t_blocked"
        : tSummary?.decision === "needs_review"
          ? "t_review"
          : sSummary?.overallRisk === "high" || sSummary?.action === "BLOCK"
            ? "s_blocked"
            : null;

    const missing: string[] = [];
    ["M", "T", "S", "B", "C", "K", "R"].forEach((code) => {
      if (!latestSucceeded(stageRuns, code)) {
        missing.push(resolveStageLabel(code, strings.stageLabels, code));
      }
    });

    let confidence = Math.max(0, 100 - missing.length * 10);
    if (gate) confidence -= 15;
    if (candidate?.cooldown?.active) confidence -= 20;
    const confidenceBadge = confidenceLabel(confidence, strings.scorecard);

    const riskBand = rSummary?.riskBand ?? sSummary?.overallRisk ?? null;
    const effortBand = rSummary?.effortBand ?? null;

    const reasons: string[] = [];
    if (candidate?.cooldown?.active) {
      reasons.push(strings.scorecard.reasonCooldown);
    }
    if (gate === "t_blocked") reasons.push(strings.scorecard.reasonEligibilityBlocked);
    if (gate === "t_review") reasons.push(strings.scorecard.reasonEligibilityReview);
    if (gate === "s_blocked") reasons.push(strings.scorecard.reasonComplianceBlocked);
    if (!profit) reasons.push(strings.scorecard.reasonMissingProfit);
    if (!kSummary?.peakCashOutlayCents) reasons.push(strings.scorecard.reasonMissingCash);
    if (!kSummary?.paybackDay && kSummary?.paybackDay !== 0)
      reasons.push(strings.scorecard.reasonMissingPayback);

    let recommendation: "advance" | "review" | "reject" | "pause" = "advance";
    if (candidate?.cooldown?.active) recommendation = "pause";
    else if (gate === "t_blocked" || gate === "s_blocked") recommendation = "reject";
    else if (gate === "t_review") recommendation = "review";
    else if (riskTone(riskBand) === "high") recommendation = "review";
    else if (!profit || !kSummary?.peakCashOutlayCents) recommendation = "review";

    const keyMetrics: KeyMetric[] = [
      {
        label: strings.scorecard.metricProfit,
        value: profit || strings.notAvailable,
        ...(marginPct !== null && marginPct !== undefined
          ? { helper: `${strings.scorecard.metricMarginLabel}: ${formatPercent(marginPct)}` }
          : {}),
      },
      {
        label: strings.scorecard.metricCashNeeded,
        value: safeFormatCurrency(kSummary?.peakCashOutlayCents) || strings.notAvailable,
      },
      {
        label: strings.scorecard.metricPayback,
        value:
          kSummary?.paybackDay !== null && kSummary?.paybackDay !== undefined
            ? `${kSummary.paybackDay} ${strings.scorecard.metricPaybackDaysLabel}`
            : strings.notAvailable,
      },
    ];

    return {
      recommendation,
      reasons,
      keyMetrics,
      riskBand,
      effortBand,
      confidence,
      confidenceBadge,
      missing,
      gate,
    };
  }, [candidate?.cooldown?.active, stageRuns, strings]);

  const riskLevel = riskTone(data.riskBand);
  const effortLevel = riskTone(data.effortBand);
  const gateMessage =
    data.gate === "t_blocked"
      ? strings.gates.stageTBlocked
      : data.gate === "t_review"
        ? strings.gates.stageTNeedsReview
        : data.gate === "s_blocked"
          ? strings.gates.stageSBlocked
          : null;

  const decisionLabel =
    decisionChoice === "advance"
      ? strings.scorecard.decisionAdvance
      : decisionChoice === "review"
        ? strings.scorecard.decisionReview
        : decisionChoice === "reject"
          ? strings.scorecard.decisionReject
          : decisionChoice === "pause"
            ? strings.scorecard.decisionPause
            : strings.scorecard.decisionNone;

  const decisionOptions: Array<{ value: DecisionChoice; label: string }> = [
    { value: "advance", label: strings.scorecard.decisionAdvance },
    { value: "review", label: strings.scorecard.decisionReview },
    { value: "reject", label: strings.scorecard.decisionReject },
    { value: "pause", label: strings.scorecard.decisionPause },
  ];

  const saveDecision = useCallback(async () => {
    if (!candidate?.id) return;
    if (!decisionChoice) {
      setDecisionMessage({ tone: "error", text: strings.scorecard.decisionRequired });
      return;
    }

    setSaving(true);
    setDecisionMessage(null);
    try {
      const response = await fetch(`/api/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: serializeDecision(decisionChoice),
          decisionReason: decisionReason.trim() ? decisionReason.trim() : null,
        }),
      });
      if (!response.ok) {
        setDecisionMessage({ tone: "error", text: strings.scorecard.decisionError });
      } else {
        setDecisionMessage({ tone: "success", text: strings.scorecard.decisionSaved });
        if (onUpdated) {
          await onUpdated();
        }
      }
    } catch (error) {
      console.error(error);
      setDecisionMessage({ tone: "error", text: strings.scorecard.decisionError });
    } finally {
      setSaving(false);
    }
  }, [
    candidate?.id,
    decisionChoice,
    decisionReason,
    onUpdated,
    strings.scorecard.decisionError,
    strings.scorecard.decisionRequired,
    strings.scorecard.decisionSaved,
  ]);

  return (
    <section className="pp-card sticky top-4 z-10 p-6">
      <Stack gap={3}>
        <div>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.scorecard.label}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">{strings.scorecard.title}</h2>
        </div>

        {gateMessage ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.gates.label}
            </div>
            <div className="mt-1 text-sm font-semibold">{gateMessage}</div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.scorecard.recommendationLabel}
          </div>
          <div className="mt-1 text-lg font-semibold">
            {data.recommendation === "advance"
              ? strings.scorecard.recommendationAdvance
              : data.recommendation === "review"
                ? strings.scorecard.recommendationReview
                : data.recommendation === "reject"
                  ? strings.scorecard.recommendationReject
                  : strings.scorecard.recommendationPause}
          </div>
          {data.reasons.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/80">
              {data.reasons.slice(0, 3).map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-foreground/60">
              {strings.scorecard.reasonDefault}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">
            {strings.scorecard.decisionLabel}
          </div>
          <div className="mt-1 text-sm font-semibold">{decisionLabel}</div>
          <Cluster gap={2} className="mt-3 flex-wrap">
            {decisionOptions.map((option) => {
              const isActive = decisionChoice === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "border border-border-2 text-foreground/70 hover:bg-surface-3"
                  }`}
                  onClick={() => setDecisionChoice(option.value)}
                  disabled={saving}
                >
                  {option.label}
                </button>
              );
            })}
          </Cluster>
          <label className="mt-4 block text-xs uppercase tracking-widest text-foreground/60">
            {strings.scorecard.decisionReasonLabel}
            <textarea
              className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              rows={3}
              value={decisionReason}
              placeholder={strings.scorecard.decisionReasonPlaceholder}
              onChange={(event) => setDecisionReason(event.target.value)}
              disabled={saving}
            />
          </label>
          <Cluster justify="between" alignY="center" className="mt-3">
            {decisionMessage ? (
              <span
                className={
                  decisionMessage.tone === "success"
                    ? "text-xs text-emerald-600"
                    : "text-xs text-red-600"
                }
              >
                {decisionMessage.text}
              </span>
            ) : (
              <span className="text-xs text-foreground/60">
                {candidate?.decisionReason ?? strings.scorecard.decisionReasonPlaceholder}
              </span>
            )}
            <button
              type="button"
              className="min-h-10 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void saveDecision()}
              disabled={saving || !candidate}
            >
              {saving ? strings.scorecard.decisionSaving : strings.scorecard.decisionSave}
            </button>
          </Cluster>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {data.keyMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3"
            >
              <div className="text-xs text-foreground/60">{metric.label}</div>
              <div className="mt-1 text-sm font-semibold">{metric.value}</div>
              {metric.helper ? (
                <div className="mt-1 text-xs text-foreground/60">{metric.helper}</div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">{strings.scorecard.riskLabel}</div>
            <div
              className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                riskLevel === "high"
                  ? "bg-red-100 text-red-800"
                  : riskLevel === "medium"
                    ? "bg-amber-100 text-amber-800"
                    : riskLevel === "low"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-surface-3 text-foreground/70"
              }`}
            >
              {data.riskBand ?? strings.notAvailable}
            </div>
          </div>
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
            <div className="text-xs text-foreground/60">{strings.scorecard.effortLabel}</div>
            <div
              className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                effortLevel === "high"
                  ? "bg-red-100 text-red-800"
                  : effortLevel === "medium"
                    ? "bg-amber-100 text-amber-800"
                    : effortLevel === "low"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-surface-3 text-foreground/70"
              }`}
            >
              {data.effortBand ?? strings.notAvailable}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <Cluster justify="between" alignY="center">
            <div>
              <div className="text-xs text-foreground/60">{strings.scorecard.confidenceLabel}</div>
              <div className="mt-1 text-sm font-semibold">
                {data.confidenceBadge} ({Math.max(0, Math.min(100, Math.round(data.confidence)))}%)
              </div>
            </div>
            {data.missing.length > 0 ? (
              <div className="text-xs text-foreground/60">
                {strings.scorecard.missingLabel}: {data.missing.join(", ")}
              </div>
            ) : (
              <div className="text-xs text-foreground/60">
                {strings.scorecard.confidenceComplete}
              </div>
            )}
          </Cluster>
        </div>
      </Stack>
    </section>
  );
}
