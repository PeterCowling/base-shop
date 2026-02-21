import path from "node:path";

import {
  buildThresholdSet,
  evaluateGrowthLedger,
  GROWTH_METRIC_CATALOG,
  GROWTH_STAGE_KEYS,
  type GrowthLedger,
  type GrowthStageKey,
  type StageEvaluation,
} from "@acme/lib";
import { growthLedgerPath, updateGrowthLedger } from "@acme/lib/server";

import {
  getWeeklyGrowthMetrics,
  type GrowthMetricsAdapterOptions,
  type GrowthPeriod,
  type WeeklyGrowthMetrics,
} from "./growth-metrics-adapter";

export interface S10GrowthAccountingOptions extends GrowthMetricsAdapterOptions {
  dataRoot?: string;
  loopSpecVersion?: string;
  period?: GrowthPeriod;
  timestamp?: string;
}

export interface S10GrowthStageSummary {
  stage_statuses: Record<GrowthStageKey, GrowthLedger["stages"][GrowthStageKey]["status"]>;
  overall_status: "green" | "yellow" | "red";
  guardrail_signal: "scale" | "hold" | "kill";
  blocking_confidence: number;
  overall_coverage: number;
  actions: string[];
  threshold_set_id: string;
  threshold_set_hash: string;
  ledger_revision: number;
}

export interface GrowthAccountingEventPayload {
  schema_version: 1;
  event: "stage_completed";
  run_id: string;
  stage: "S10";
  timestamp: string;
  loop_spec_version: string;
  artifacts: Record<string, string>;
  blocking_reason: null;
  growth_accounting: {
    input: {
      metrics: WeeklyGrowthMetrics["metrics"];
      data_quality: WeeklyGrowthMetrics["data_quality"];
      sources: WeeklyGrowthMetrics["sources"];
    };
    threshold_set: {
      threshold_set_id: string;
      threshold_set_hash: string;
      generated_at: string;
    };
    output: S10GrowthStageSummary;
  };
}

export interface S10GrowthAccountingResult {
  ledgerPath: string;
  changed: boolean;
  ledger: GrowthLedger;
  metrics: WeeklyGrowthMetrics;
  stageSummary: S10GrowthStageSummary;
  eventPayload: GrowthAccountingEventPayload;
}

function parseTimestampFromRunId(runId: string): string | null {
  const withClock = runId.match(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/);
  if (withClock) {
    const [, year, month, day, hour, minute] = withClock;
    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
      ),
    ).toISOString();
  }

  const dateOnly = runId.match(/(\d{4})(\d{2})(\d{2})/);
  if (!dateOnly) {
    return null;
  }

  const [, year, month, day] = dateOnly;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).toISOString();
}

function startOfIsoWeek(date: Date): Date {
  const dayIndex = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date);
  monday.setUTCDate(monday.getUTCDate() - dayIndex);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

function isoWeekNumber(date: Date): { year: number; week: number } {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  target.setUTCDate(target.getUTCDate() + 3 - ((target.getUTCDay() + 6) % 7));
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diffDays =
    (target.getTime() - firstThursday.getTime()) / (24 * 60 * 60 * 1000);
  const week = 1 + Math.round((diffDays - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);

  return { year: target.getUTCFullYear(), week };
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultPeriod(runId: string, business: string, timestamp: string): GrowthPeriod {
  const parsed = parseTimestampFromRunId(runId);
  const date = parsed ? new Date(parsed) : new Date(timestamp);
  const startDate = startOfIsoWeek(date);
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);

  const weekInfo = isoWeekNumber(date);
  return {
    period_id: `${weekInfo.year}-W${String(weekInfo.week).padStart(2, "0")}`,
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    forecast_id: `${business}-FC-unknown`,
  };
}

function stageStatuses(
  evaluations: Record<GrowthStageKey, StageEvaluation>,
): Record<GrowthStageKey, GrowthLedger["stages"][GrowthStageKey]["status"]> {
  return {
    acquisition: evaluations.acquisition.status,
    activation: evaluations.activation.status,
    revenue: evaluations.revenue.status,
    retention: evaluations.retention.status,
    referral: evaluations.referral.status,
  };
}

function stageLedgerState(
  evaluations: Record<GrowthStageKey, StageEvaluation>,
): GrowthLedger["stages"] {
  return {
    acquisition: {
      status: evaluations.acquisition.status,
      policy: evaluations.acquisition.stage_policy,
      metrics: evaluations.acquisition.metrics,
      reasons: evaluations.acquisition.reasons,
    },
    activation: {
      status: evaluations.activation.status,
      policy: evaluations.activation.stage_policy,
      metrics: evaluations.activation.metrics,
      reasons: evaluations.activation.reasons,
    },
    revenue: {
      status: evaluations.revenue.status,
      policy: evaluations.revenue.stage_policy,
      metrics: evaluations.revenue.metrics,
      reasons: evaluations.revenue.reasons,
    },
    retention: {
      status: evaluations.retention.status,
      policy: evaluations.retention.stage_policy,
      metrics: evaluations.retention.metrics,
      reasons: evaluations.retention.reasons,
    },
    referral: {
      status: evaluations.referral.status,
      policy: evaluations.referral.stage_policy,
      metrics: evaluations.referral.metrics,
      reasons: evaluations.referral.reasons,
    },
  };
}

function thresholdSetFromCatalog(generatedAt: string) {
  return buildThresholdSet(
    {
      acquisition: GROWTH_METRIC_CATALOG.acquisition.thresholds,
      activation: GROWTH_METRIC_CATALOG.activation.thresholds,
      revenue: GROWTH_METRIC_CATALOG.revenue.thresholds,
      retention: GROWTH_METRIC_CATALOG.retention.thresholds,
      referral: GROWTH_METRIC_CATALOG.referral.thresholds,
    },
    generatedAt,
  );
}

export async function runS10GrowthAccounting(
  runId: string,
  business: string,
  options: S10GrowthAccountingOptions = {},
): Promise<S10GrowthAccountingResult> {
  const baseDir = options.baseDir ?? process.cwd();
  const timestamp =
    options.timestamp ??
    parseTimestampFromRunId(runId) ??
    new Date().toISOString();
  const period = options.period ?? defaultPeriod(runId, business, timestamp);
  const metrics = getWeeklyGrowthMetrics(runId, business, period, { baseDir });
  const thresholdSet = thresholdSetFromCatalog(timestamp);
  const evaluation = evaluateGrowthLedger({
    metrics: metrics.metrics,
    thresholdSet,
    catalog: GROWTH_METRIC_CATALOG,
  });
  const ledgerStageState = stageLedgerState(evaluation.stageEvaluations);

  const dataRoot = options.dataRoot ?? path.join(baseDir, "data", "shops");

  const ledgerWrite = await updateGrowthLedger({
    shopId: business,
    options: { dataRoot },
    computeNext: (current) => ({
      schema_version: 1,
      ledger_revision: current ? current.ledger_revision : 1,
      business,
      period,
      threshold_set_id: thresholdSet.threshold_set_id,
      threshold_set_hash: thresholdSet.threshold_set_hash,
      threshold_locked_at: timestamp,
      updated_at: timestamp,
      stages: ledgerStageState,
    }),
  });

  const stageSummary: S10GrowthStageSummary = {
    stage_statuses: stageStatuses(evaluation.stageEvaluations),
    overall_status: evaluation.overallStatus,
    guardrail_signal: evaluation.guardrailSignal,
    blocking_confidence: evaluation.blockingConfidence,
    overall_coverage: evaluation.overallCoverage,
    actions: evaluation.actions,
    threshold_set_id: thresholdSet.threshold_set_id,
    threshold_set_hash: thresholdSet.threshold_set_hash,
    ledger_revision: ledgerWrite.ledger.ledger_revision,
  };

  const ledgerPath = growthLedgerPath(business, dataRoot);
  const runDir = path.join(
    "docs/business-os/startup-baselines",
    business,
    "runs",
    runId,
  );
  const ledgerRelativePath = path.relative(path.join(baseDir, runDir), ledgerPath);

  const eventPayload: GrowthAccountingEventPayload = {
    schema_version: 1,
    event: "stage_completed",
    run_id: runId,
    stage: "S10",
    timestamp,
    loop_spec_version: options.loopSpecVersion ?? "1.0.0",
    artifacts: {
      growth_ledger: ledgerRelativePath,
    },
    blocking_reason: null,
    growth_accounting: {
      input: {
        metrics: metrics.metrics,
        data_quality: metrics.data_quality,
        sources: metrics.sources,
      },
      threshold_set: {
        threshold_set_id: thresholdSet.threshold_set_id,
        threshold_set_hash: thresholdSet.threshold_set_hash,
        generated_at: thresholdSet.generated_at,
      },
      output: stageSummary,
    },
  };

  return {
    ledgerPath,
    changed: ledgerWrite.changed,
    ledger: ledgerWrite.ledger,
    metrics,
    stageSummary,
    eventPayload,
  };
}

export { GROWTH_STAGE_KEYS };
