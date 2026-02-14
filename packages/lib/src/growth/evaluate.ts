import { GROWTH_METRIC_CATALOG } from "./schema";
import {
  GROWTH_STAGE_KEYS,
  type GrowthLedgerStatus,
  type GrowthMetricUnit,
  type GrowthStageDefinition,
  type GrowthStageKey,
  type StagePolicy,
  type StageThresholdDefinition,
  type ThresholdSet,
} from "./types";

export interface GrowthEvaluationInput {
  metrics: Record<GrowthStageKey, Record<string, number | null | undefined>>;
  stagePolicies?: Partial<Record<GrowthStageKey, StagePolicy>>;
  thresholdSet?: ThresholdSet;
  catalog?: Record<GrowthStageKey, GrowthStageDefinition>;
}

export interface StageEvaluation {
  stage: GrowthStageKey;
  status: GrowthLedgerStatus;
  reasons: string[];
  is_blocking: boolean;
  metrics: Record<string, number | null>;
  stage_policy: StagePolicy;
}

export type GuardrailSignal = "scale" | "hold" | "kill";

export interface GrowthEvaluationResult {
  stageEvaluations: Record<GrowthStageKey, StageEvaluation>;
  overallStatus: "green" | "yellow" | "red";
  guardrailSignal: GuardrailSignal;
  blockingConfidence: number;
  overallCoverage: number;
  actions: string[];
}

export interface ThresholdEvaluation {
  status: GrowthLedgerStatus;
  reasons: string[];
}

const STATUS_PRIORITY: Record<GrowthLedgerStatus, number> = {
  green: 0,
  not_tracked: 1,
  insufficient_data: 2,
  yellow: 3,
  red: 4,
};

const DECISION_VALID_STATUSES = new Set<GrowthLedgerStatus>([
  "green",
  "yellow",
  "red",
]);

function normalizeMetrics(
  metrics: Record<string, number | null | undefined>,
): Record<string, number | null> {
  const normalized: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(metrics)) {
    normalized[key] = value ?? null;
  }
  return normalized;
}

function isDecisionValid(status: GrowthLedgerStatus): boolean {
  return DECISION_VALID_STATUSES.has(status);
}

function isStageBlocking(status: GrowthLedgerStatus, policy: StagePolicy): boolean {
  if (policy.blocking_mode === "never") {
    return false;
  }

  if (policy.blocking_mode === "after_valid") {
    return isDecisionValid(status);
  }

  return true;
}

function compareThreshold(
  direction: "higher" | "lower",
  value: number,
  greenThreshold: number,
  redThreshold: number,
): GrowthLedgerStatus {
  if (direction === "higher") {
    if (value >= greenThreshold) {
      return "green";
    }

    if (value <= redThreshold) {
      return "red";
    }

    return "yellow";
  }

  if (value <= greenThreshold) {
    return "green";
  }

  if (value >= redThreshold) {
    return "red";
  }

  return "yellow";
}

function formatThresholdUnit(unit: GrowthMetricUnit): string {
  if (unit === "eur_cents") {
    return "cents";
  }

  if (unit === "bps") {
    return "bps";
  }

  return "count";
}

export function evaluateThresholdStatus(
  threshold: StageThresholdDefinition,
  stageMetrics: Record<string, number | null | undefined>,
): ThresholdEvaluation {
  const metricValue = stageMetrics[threshold.metric] ?? null;
  const denominatorValue = threshold.denominator_metric
    ? (stageMetrics[threshold.denominator_metric] ?? null)
    : null;

  if (metricValue === null) {
    return {
      status: "not_tracked",
      reasons: [`Metric '${threshold.metric}' is not tracked in the current payload.`],
    };
  }

  if (threshold.validity_min_denominator > 0) {
    if (denominatorValue === null) {
      return {
        status: "insufficient_data",
        reasons: [
          `Missing denominator '${threshold.denominator_metric ?? "unknown"}' for '${threshold.metric}'.`,
        ],
      };
    }

    if (denominatorValue < threshold.validity_min_denominator) {
      return {
        status: "insufficient_data",
        reasons: [
          `${threshold.denominator_metric ?? "denominator"}=${denominatorValue} below validity minimum ${threshold.validity_min_denominator}.`,
        ],
      };
    }
  }

  const status = compareThreshold(
    threshold.direction,
    metricValue,
    threshold.green_threshold,
    threshold.red_threshold,
  );

  return {
    status,
    reasons: [
      `${threshold.metric}=${metricValue} ${formatThresholdUnit(threshold.unit)} (green=${threshold.green_threshold}, red=${threshold.red_threshold}, direction=${threshold.direction}).`,
    ],
  };
}

function mergeThresholdStatuses(
  evaluations: ThresholdEvaluation[],
): GrowthLedgerStatus {
  let highestStatus: GrowthLedgerStatus = "green";

  for (const evaluation of evaluations) {
    if (STATUS_PRIORITY[evaluation.status] > STATUS_PRIORITY[highestStatus]) {
      highestStatus = evaluation.status;
    }
  }

  return highestStatus;
}

function stageRedAction(stage: GrowthStageKey): string {
  if (stage === "acquisition") {
    return "Acquisition red: stop cold acquisition expansion and keep retargeting-only spend.";
  }

  if (stage === "activation") {
    return "Activation red: pause spend increases and run conversion remediation experiments.";
  }

  if (stage === "revenue") {
    return "Revenue red: hold growth and investigate unit-economics or fulfillment leakage.";
  }

  if (stage === "retention") {
    return "Retention red: pause expansion and remediate product/service quality before re-scaling.";
  }

  return "Referral red: advisory-only in v1; track for coverage but do not block global decisions.";
}

function buildStageEvaluation(
  stage: GrowthStageKey,
  thresholds: StageThresholdDefinition[],
  stagePolicy: StagePolicy,
  stageMetrics: Record<string, number | null | undefined>,
): StageEvaluation {
  const normalizedMetrics = normalizeMetrics(stageMetrics);
  const thresholdEvaluations = thresholds.map((threshold) =>
    evaluateThresholdStatus(threshold, normalizedMetrics),
  );
  const status = mergeThresholdStatuses(thresholdEvaluations);

  return {
    stage,
    status,
    reasons: thresholdEvaluations.flatMap((evaluation) => evaluation.reasons),
    is_blocking: isStageBlocking(status, stagePolicy),
    metrics: normalizedMetrics,
    stage_policy: stagePolicy,
  };
}

function deriveOverallStatus(
  stageEvaluations: StageEvaluation[],
): "green" | "yellow" | "red" {
  const blockingStages = stageEvaluations.filter(
    (evaluation) => evaluation.is_blocking,
  );

  if (blockingStages.some((evaluation) => evaluation.status === "red")) {
    return "red";
  }

  if (
    blockingStages.some(
      (evaluation) =>
        evaluation.status === "yellow" ||
        evaluation.status === "insufficient_data" ||
        evaluation.status === "not_tracked",
    )
  ) {
    return "yellow";
  }

  return "green";
}

function guardrailSignalForStatus(
  status: "green" | "yellow" | "red",
): GuardrailSignal {
  if (status === "green") {
    return "scale";
  }

  if (status === "yellow") {
    return "hold";
  }

  return "kill";
}

function computeCoverage(stageEvaluations: StageEvaluation[]): {
  blockingConfidence: number;
  overallCoverage: number;
} {
  const validStageCount = stageEvaluations.filter((evaluation) =>
    isDecisionValid(evaluation.status),
  ).length;
  const overallCoverage = validStageCount / stageEvaluations.length;

  const blockingStages = stageEvaluations.filter(
    (evaluation) => evaluation.is_blocking,
  );
  if (blockingStages.length === 0) {
    return { blockingConfidence: 1, overallCoverage };
  }

  const validBlockingCount = blockingStages.filter((evaluation) =>
    isDecisionValid(evaluation.status),
  ).length;
  return {
    blockingConfidence: validBlockingCount / blockingStages.length,
    overallCoverage,
  };
}

export function evaluateGrowthLedger(
  input: GrowthEvaluationInput,
): GrowthEvaluationResult {
  const catalog = input.catalog ?? GROWTH_METRIC_CATALOG;

  const stageEvaluations = GROWTH_STAGE_KEYS.map((stage) => {
    const stageThresholds =
      input.thresholdSet?.stages[stage] ?? catalog[stage].thresholds;
    const stagePolicy = input.stagePolicies?.[stage] ?? catalog[stage].stage_policy;
    const stageMetrics = input.metrics[stage] ?? {};

    return buildStageEvaluation(stage, stageThresholds, stagePolicy, stageMetrics);
  });

  const overallStatus = deriveOverallStatus(stageEvaluations);
  const guardrailSignal = guardrailSignalForStatus(overallStatus);
  const coverage = computeCoverage(stageEvaluations);

  const actions = stageEvaluations
    .filter((evaluation) => evaluation.status === "red")
    .map((evaluation) => stageRedAction(evaluation.stage));

  return {
    stageEvaluations: Object.fromEntries(
      stageEvaluations.map((evaluation) => [evaluation.stage, evaluation]),
    ) as Record<GrowthStageKey, StageEvaluation>,
    overallStatus,
    guardrailSignal,
    blockingConfidence: coverage.blockingConfidence,
    overallCoverage: coverage.overallCoverage,
    actions,
  };
}
