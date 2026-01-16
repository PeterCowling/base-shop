/* eslint-disable ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Pending DS token rollout for controls */
"use client";

import { useMemo } from "react";
import { Cluster, Grid, Stack } from "@ui/components/atoms/primitives";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { extractStageMSummary } from "./stageMHelpers";
import { extractStageCSummary } from "./stageCHelpers";
import { extractStageSSummary } from "./stageSHelpers";
import { extractStageTSummary } from "./stageTHelpers";
import { extractStageRSummary } from "./stageRHelpers";
import { resolveStageTSGate } from "./stageGate";
import type { CandidateDetail, CandidateDetailStrings, StageRun } from "./types";

type StatusTone = "good" | "warn" | "bad" | "neutral";

type DecisionItem = {
  key: string;
  title: string;
  status: string;
  statusTone: StatusTone;
  detail: string;
  href: string;
  cta: string;
};

function latestSucceeded(stageRuns: StageRun[], stage: string): StageRun | null {
  return stageRuns.find((run) => run.stage === stage && run.status === "succeeded") ?? null;
}

function safeFormatCurrency(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  try {
    return formatCurrency(BigInt(value));
  } catch {
    return fallback;
  }
}

function parseCents(value: string | null | undefined): bigint | null {
  if (!value) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function formatEuro(value: number | null | undefined, fallback: string): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function applyTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

function toneClasses(tone: StatusTone): string {
  if (tone === "good")
    return "bg-emerald-100 text-emerald-800"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] CSS utility classes
  if (tone === "warn")
    return "bg-amber-100 text-amber-800"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] CSS utility classes
  if (tone === "bad")
    return "bg-red-100 text-red-800"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] CSS utility classes
  return "bg-surface-3 text-foreground/70"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] CSS utility classes
}

export default function DecisionFrameworkCard({
  candidate,
  stageRuns,
  strings,
}: {
  candidate: CandidateDetail | null;
  stageRuns: StageRun[];
  strings: CandidateDetailStrings;
}) {
  const items = useMemo<DecisionItem[]>(() => {
    const notAvailable = strings.notAvailable;
    const stageM = latestSucceeded(stageRuns, "M");
    const stageC = latestSucceeded(stageRuns, "C");
    const stageK = latestSucceeded(stageRuns, "K");
    const stageT = latestSucceeded(stageRuns, "T");
    const stageS = latestSucceeded(stageRuns, "S");
    const stageR = latestSucceeded(stageRuns, "R");

    const mSummary = extractStageMSummary(stageM ?? undefined);
    const cSummary = extractStageCSummary(stageC ?? undefined);
    const sSummary = extractStageSSummary(stageS ?? undefined);
    const tSummary = extractStageTSummary(stageT ?? undefined);
    const rSummary = extractStageRSummary(stageR ?? undefined);

    const kSummary =
      stageK?.output && typeof stageK.output === "object"
        ? (stageK.output as { summary?: { peakCashOutlayCents?: string; paybackDay?: number | null } })
            .summary ?? null
        : null;

    const gate = resolveStageTSGate(stageRuns);

    const marketItem: DecisionItem = (() => {
      const median = mSummary?.priceMedian ?? null;
      const samples = mSummary?.sampleCount ?? null;
      const ready = Boolean(mSummary);
      const status = ready ? strings.decisions.status.ready : strings.decisions.status.needsInput;
      const statusTone = ready ? "good" : "warn";
      const detail = ready
        ? applyTemplate(strings.decisions.market.detail, {
            median: formatEuro(median, notAvailable),
            count:
              samples !== null && samples !== undefined
                ? formatNumber(samples)
                : notAvailable,
          })
        : strings.decisions.market.missing;
      return {
        key: "market",
        title: strings.decisions.items.market,
        status,
        statusTone,
        detail,
        href: "#stage-m",
        cta: ready ? strings.decisions.ctaReview : strings.decisions.ctaFill,
      };
    })();

    const eligibilityItem: DecisionItem = (() => {
      if (gate === "stage_t_blocked") {
        return {
          key: "eligibility",
          title: strings.decisions.items.eligibility,
          status: strings.decisions.status.blocked,
          statusTone: "bad",
          detail: strings.decisions.eligibility.blocked,
          href: "#stage-t",
          cta: strings.decisions.ctaResolve,
        };
      }
      if (gate === "stage_t_needs_review") {
        return {
          key: "eligibility",
          title: strings.decisions.items.eligibility,
          status: strings.decisions.status.review,
          statusTone: "warn",
          detail: strings.decisions.eligibility.review,
          href: "#stage-t",
          cta: strings.decisions.ctaResolve,
        };
      }
      if (gate === "stage_s_blocked") {
        return {
          key: "eligibility",
          title: strings.decisions.items.eligibility,
          status: strings.decisions.status.blocked,
          statusTone: "bad",
          detail: strings.decisions.eligibility.blocked,
          href: "#stage-s",
          cta: strings.decisions.ctaResolve,
        };
      }

      const ready = Boolean(tSummary) && Boolean(sSummary);
      return {
        key: "eligibility",
        title: strings.decisions.items.eligibility,
        status: ready ? strings.decisions.status.clear : strings.decisions.status.needsInput,
        statusTone: ready ? "good" : "warn",
        detail: ready
          ? strings.decisions.eligibility.clear
          : strings.decisions.eligibility.missing,
        href: ready ? "#stage-s" : "#stage-t",
        cta: ready ? strings.decisions.ctaReview : strings.decisions.ctaFill,
      };
    })();

    const profitItem: DecisionItem = (() => {
      const profitRaw = parseCents(cSummary?.contributionPerUnitCents ?? null);
      const margin =
        cSummary?.contributionMarginPct !== null && cSummary?.contributionMarginPct !== undefined
          ? formatPercent(cSummary.contributionMarginPct / 100)
          : notAvailable;
      if (!cSummary || profitRaw === null) {
        return {
          key: "profit",
          title: strings.decisions.items.profit,
          status: strings.decisions.status.needsInput,
          statusTone: "warn",
          detail: strings.decisions.profit.missing,
          href: "#stage-c",
          cta: strings.decisions.ctaFill,
        };
      }
      if (profitRaw <= 0n) {
        const loss = safeFormatCurrency((profitRaw * -1n).toString(), notAvailable);
        return {
          key: "profit",
          title: strings.decisions.items.profit,
          status: strings.decisions.status.notProfitable,
          statusTone: "bad",
          detail: applyTemplate(strings.decisions.profit.loss, {
            profit: loss,
          }),
          href: "#stage-c",
          cta: strings.decisions.ctaReview,
        };
      }
      const profit = safeFormatCurrency(cSummary.contributionPerUnitCents ?? null, notAvailable);
      return {
        key: "profit",
        title: strings.decisions.items.profit,
        status: strings.decisions.status.profitable,
        statusTone: "good",
        detail: applyTemplate(strings.decisions.profit.detail, {
          profit,
          margin,
        }),
        href: "#stage-c",
        cta: strings.decisions.ctaReview,
      };
    })();

    const cashItem: DecisionItem = (() => {
      const peakCash = kSummary?.peakCashOutlayCents ?? null;
      if (!peakCash) {
        return {
          key: "cash",
          title: strings.decisions.items.cash,
          status: strings.decisions.status.needsInput,
          statusTone: "warn",
          detail: strings.decisions.cash.missing,
          href: "#stage-k",
          cta: strings.decisions.ctaFill,
        };
      }
      const payback =
        kSummary?.paybackDay !== null && kSummary?.paybackDay !== undefined
          ? `${kSummary.paybackDay} ${strings.scorecard.metricPaybackDaysLabel}`
          : notAvailable;
      return {
        key: "cash",
        title: strings.decisions.items.cash,
        status: strings.decisions.status.ready,
        statusTone: "good",
        detail: applyTemplate(strings.decisions.cash.detail, {
          cash: safeFormatCurrency(peakCash, notAvailable),
          payback,
        }),
        href: "#stage-k",
        cta: strings.decisions.ctaReview,
      };
    })();

    const priorityItem: DecisionItem = (() => {
      if (!rSummary) {
        return {
          key: "priority",
          title: strings.decisions.items.priority,
          status: strings.decisions.status.needsInput,
          statusTone: "warn",
          detail: strings.decisions.priority.missing,
          href: "#stage-r",
          cta: strings.decisions.ctaFill,
        };
      }
      return {
        key: "priority",
        title: strings.decisions.items.priority,
        status: strings.decisions.status.ready,
        statusTone: "good",
        detail: applyTemplate(strings.decisions.priority.detail, {
          risk: rSummary.riskBand ?? notAvailable,
          effort: rSummary.effortBand ?? notAvailable,
        }),
        href: "#stage-r",
        cta: strings.decisions.ctaReview,
      };
    })();

    const items = [
      marketItem,
      eligibilityItem,
      profitItem,
      cashItem,
      priorityItem,
    ];

    if (candidate?.cooldown?.active) {
      return items.map((item) => ({
        ...item,
        status: strings.scorecard.recommendationPause,
        statusTone: "warn",
        detail: strings.scorecard.reasonCooldown,
        cta: strings.decisions.ctaResolve,
        href: "#cooldown",
      }));
    }

    return items;
  }, [candidate?.cooldown?.active, stageRuns, strings]);

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.decisions.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{strings.decisions.title}</h2>
      </Stack>
      <Grid cols={1} gap={4} className="mt-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-3xl border border-border-1 bg-surface-2 p-4"
          >
            <Cluster justify="between" alignY="center" className="gap-3">
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClasses(item.statusTone)}`}>
                {item.status}
              </span>
            </Cluster>
            <p className="mt-3 text-sm text-foreground/70">{item.detail}</p>
            <a
              href={item.href}
              className="mt-4 inline-flex rounded-full border border-border-2 px-3 py-1 text-xs font-semibold text-foreground/80 hover:bg-surface-3"
            >
              {item.cta}
            </a>
          </div>
        ))}
      </Grid>
    </section>
  );
}
