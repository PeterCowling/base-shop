import { betaBinomialPosterior } from "@acme/lib/math/experimentation";

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
  observation_count: number;
  quality_annotation_count: number;
  ok_quality_count: number;
  measurement_ready_observation_count: number;
}

export interface EvidenceRateSummary {
  sample_size: number;
  successes: number;
  observed_rate: number | null;
  posterior_mean: number | null;
  lower_credible_bound: number | null;
  upper_credible_bound: number | null;
  confidence_level: number;
  method: "beta_binomial_jeffreys";
  status: "measured" | "insufficient_data";
}

export type CandidateEvidenceClassification =
  | "measured"
  | "instrumented"
  | "structural_only"
  | "insufficient";

export interface CandidateEvidenceProfile {
  classification: CandidateEvidenceClassification;
  requirements_met: number;
  requirements_total: number;
  readiness_ratio: number;
  missing_requirements: string[];
  data_quality_ok_rate: EvidenceRateSummary;
  measurement_ready_observation_rate: EvidenceRateSummary;
}

export interface ScoreResult {
  priority_score_v1: number;
  priority_score_v2: number | null;
  autonomy_cap: 1 | 2 | 3 | 4;
  reasons: string[];
  evidence: CandidateEvidenceProfile;
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

function buildEvidenceRateSummary(successes: number, sampleSize: number): EvidenceRateSummary {
  if (sampleSize <= 0) {
    return {
      sample_size: 0,
      successes: 0,
      observed_rate: null,
      posterior_mean: null,
      lower_credible_bound: null,
      upper_credible_bound: null,
      confidence_level: 0.95,
      method: "beta_binomial_jeffreys",
      status: "insufficient_data",
    };
  }

  const posterior = betaBinomialPosterior({
    successes,
    total: sampleSize,
  });

  return {
    sample_size: sampleSize,
    successes,
    observed_rate: successes / sampleSize,
    posterior_mean: posterior.mean,
    lower_credible_bound: posterior.credibleInterval.lower,
    upper_credible_bound: posterior.credibleInterval.upper,
    confidence_level: 0.95,
    method: "beta_binomial_jeffreys",
    status: "measured",
  };
}

export function assessEvidenceProfile(
  evidence: CandidateEvidenceGate,
): CandidateEvidenceProfile {
  const missingRequirements: string[] = [];

  if (!evidence.has_kpi_baseline) {
    missingRequirements.push("kpi_baseline");
  }
  if (!evidence.has_impact_mechanism) {
    missingRequirements.push("impact_mechanism");
  }
  if (!evidence.has_measurement_plan) {
    missingRequirements.push("measurement_plan");
  }
  if (!evidence.has_canary_path) {
    missingRequirements.push("canary_path");
  }
  if (evidence.data_quality_status !== "ok") {
    missingRequirements.push("data_quality_ok");
  }
  if (
    typeof evidence.sample_size !== "number" ||
    evidence.sample_size < evidence.minimum_sample_size
  ) {
    missingRequirements.push("minimum_sample_size");
  }

  let classification: CandidateEvidenceClassification;
  if (missingRequirements.length === 0) {
    classification = "measured";
  } else if (
    evidence.has_kpi_baseline &&
    evidence.has_measurement_plan &&
    evidence.has_canary_path
  ) {
    classification = "instrumented";
  } else if (
    evidence.has_impact_mechanism ||
    evidence.has_kpi_baseline ||
    evidence.has_measurement_plan
  ) {
    classification = "structural_only";
  } else {
    classification = "insufficient";
  }

  const requirementsTotal = 6;
  const requirementsMet = requirementsTotal - missingRequirements.length;

  return {
    classification,
    requirements_met: requirementsMet,
    requirements_total: requirementsTotal,
    readiness_ratio: requirementsMet / requirementsTotal,
    missing_requirements: missingRequirements,
    data_quality_ok_rate: buildEvidenceRateSummary(
      evidence.ok_quality_count,
      evidence.quality_annotation_count,
    ),
    measurement_ready_observation_rate: buildEvidenceRateSummary(
      evidence.measurement_ready_observation_count,
      evidence.observation_count,
    ),
  };
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
  const evidenceProfile = assessEvidenceProfile(evidence);

  if (canUseScoringV2(evidence)) {
    const outcomeScore = clampScore(dimensions.outcome_impact_score);
    const timeScore = clampScore(dimensions.time_to_impact_score);
    v2 = v1 + weights.w7 * outcomeScore + weights.w8 * timeScore;
  } else {
    reasons.push("v2_evidence_missing_or_low_quality");
    reasons.push(`evidence_class:${evidenceProfile.classification}`);
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
    evidence: evidenceProfile,
  };
}
