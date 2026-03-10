import type { ImprovementCandidate, MetaObservation } from "./self-evolving-contracts.js";

export interface LabeledCandidate {
  candidate_id: string;
  is_true_repeat_work: boolean;
}

export interface Pilot0Result {
  precision_at_k: number;
  false_positive_rate: number;
  labeled_count: number;
  pass: boolean;
}

export interface Pilot1Result {
  recurrence_reduction: number;
  cycle_time_reduction: number;
  kpi_delta: number;
  rollback_drill_passed: boolean;
  pass: boolean;
}

export function evaluatePilot0(input: {
  topKCandidateIds: string[];
  labels: LabeledCandidate[];
  precisionThreshold: number;
}): Pilot0Result {
  const labelMap = new Map(
    input.labels.map((label) => [label.candidate_id, label.is_true_repeat_work]),
  );
  const evaluated = input.topKCandidateIds
    .map((candidateId) => labelMap.get(candidateId))
    .filter((value): value is boolean => typeof value === "boolean");

  if (evaluated.length === 0) {
    return {
      precision_at_k: 0,
      false_positive_rate: 1,
      labeled_count: 0,
      pass: false,
    };
  }

  const trueCount = evaluated.filter(Boolean).length;
  const falseCount = evaluated.length - trueCount;
  const precision = trueCount / evaluated.length;

  return {
    precision_at_k: precision,
    false_positive_rate: falseCount / evaluated.length,
    labeled_count: evaluated.length,
    pass: precision >= input.precisionThreshold,
  };
}

export function evaluatePilot1(input: {
  beforeRecurrenceDensity: number;
  afterRecurrenceDensity: number;
  beforeCycleTimeHours: number;
  afterCycleTimeHours: number;
  targetKpiDelta: number;
  rollbackDrillPassed: boolean;
}): Pilot1Result {
  const recurrenceReduction =
    input.beforeRecurrenceDensity <= 0
      ? 0
      : (input.beforeRecurrenceDensity - input.afterRecurrenceDensity) /
        input.beforeRecurrenceDensity;
  const cycleTimeReduction =
    input.beforeCycleTimeHours <= 0
      ? 0
      : (input.beforeCycleTimeHours - input.afterCycleTimeHours) /
        input.beforeCycleTimeHours;

  const pass =
    recurrenceReduction >= 0.5 &&
    cycleTimeReduction >= 0.2 &&
    input.targetKpiDelta > 0 &&
    input.rollbackDrillPassed;

  return {
    recurrence_reduction: recurrenceReduction,
    cycle_time_reduction: cycleTimeReduction,
    kpi_delta: input.targetKpiDelta,
    rollback_drill_passed: input.rollbackDrillPassed,
    pass,
  };
}

export function selectTopKCandidatesByRecurrence(
  candidates: ImprovementCandidate[],
  observations: MetaObservation[],
  k: number,
): string[] {
  const observationIds = new Set(observations.map((observation) => observation.observation_id));
  const countByCandidate = new Map<string, number>();
  for (const candidate of candidates) {
    const count = candidate.trigger_observations.filter((id) =>
      observationIds.has(id),
    ).length;
    countByCandidate.set(candidate.candidate_id, count);
  }

  return [...countByCandidate.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(0, k))
    .map(([candidateId]) => candidateId);
}
