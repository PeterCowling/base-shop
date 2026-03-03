import type { DataQualityStatus, ImprovementCandidate } from "./self-evolving-contracts.js";

export interface ScoreDimensionsV1 {
  frequency_score: number;
  operator_time_score: number;
  quality_risk_reduction_score: number;
  token_savings_score: number;
  implementation_effort_score: number;
  blast_radius_risk_score: number;
}

export interface ScoreDimensionsV2 extends ScoreDimensionsV1 {
  outcome_impact_score: number;
  time_to_impact_score: number;
}

export interface ScoreWeights {
  w1: number;
  w2: number;
  w3: number;
  w4: number;
  w5: number;
  w6: number;
  w7: number;
  w8: number;
}

export interface CandidateEvidenceGate {
  has_kpi_baseline: boolean;
  has_impact_mechanism: boolean;
  has_measurement_plan: boolean;
  has_canary_path: boolean;
  data_quality_status: DataQualityStatus | null;
  sample_size: number | null;
  minimum_sample_size: number;
}

export interface ScoreResult {
  priority_score_v1: number;
  priority_score_v2: number | null;
  autonomy_cap: 1 | 2 | 3 | 4;
  reasons: string[];
}

function clampScore(score: number): number {
  if (score < 0) return 0;
  if (score > 5) return 5;
  return score;
}

function normalizeDimensionsV1(dimensions: ScoreDimensionsV1): ScoreDimensionsV1 {
  return {
    frequency_score: clampScore(dimensions.frequency_score),
    operator_time_score: clampScore(dimensions.operator_time_score),
    quality_risk_reduction_score: clampScore(dimensions.quality_risk_reduction_score),
    token_savings_score: clampScore(dimensions.token_savings_score),
    implementation_effort_score: clampScore(dimensions.implementation_effort_score),
    blast_radius_risk_score: clampScore(dimensions.blast_radius_risk_score),
  };
}

export function computePriorityScoreV1(
  dimensions: ScoreDimensionsV1,
  weights: ScoreWeights,
): number {
  const normalized = normalizeDimensionsV1(dimensions);
  return (
    weights.w1 * normalized.frequency_score +
    weights.w2 * normalized.operator_time_score +
    weights.w3 * normalized.quality_risk_reduction_score +
    weights.w4 * normalized.token_savings_score -
    weights.w5 * normalized.implementation_effort_score -
    weights.w6 * normalized.blast_radius_risk_score
  );
}

export function canUseScoringV2(evidence: CandidateEvidenceGate): boolean {
  return (
    evidence.has_kpi_baseline &&
    evidence.has_impact_mechanism &&
    evidence.has_measurement_plan &&
    evidence.has_canary_path &&
    evidence.data_quality_status === "ok" &&
    typeof evidence.sample_size === "number" &&
    evidence.sample_size >= evidence.minimum_sample_size
  );
}

export function computeScoreResult(
  candidate: ImprovementCandidate,
  dimensions: ScoreDimensionsV2,
  weights: ScoreWeights,
  evidence: CandidateEvidenceGate,
): ScoreResult {
  const reasons: string[] = [];
  const v1 = computePriorityScoreV1(dimensions, weights);
  let v2: number | null = null;
  let autonomyCap: 1 | 2 | 3 | 4 = candidate.autonomy_level_required;

  if (canUseScoringV2(evidence)) {
    const outcomeScore = clampScore(dimensions.outcome_impact_score);
    const timeScore = clampScore(dimensions.time_to_impact_score);
    v2 = v1 + weights.w7 * outcomeScore + weights.w8 * timeScore;
  } else {
    reasons.push("v2_evidence_missing_or_low_quality");
    if (autonomyCap > 2) {
      autonomyCap = 2;
      reasons.push("autonomy_capped_at_level_2_without_v2_evidence");
    }
  }

  if (candidate.risk_level === "high" && autonomyCap > 1) {
    autonomyCap = 1;
    reasons.push("high_risk_candidate_autonomy_capped");
  }

  if (candidate.change_scope === "global_system" && autonomyCap > 2) {
    autonomyCap = 2;
    reasons.push("global_scope_candidate_autonomy_capped");
  }

  return {
    priority_score_v1: v1,
    priority_score_v2: v2,
    autonomy_cap: autonomyCap,
    reasons,
  };
}
