import { betaBinomialPosterior } from "@acme/lib/math/experimentation";

import type {
  CandidateBeliefState,
  ConstraintProfile,
  DataQualityStatus,
  ImprovementCandidate,
  ImprovementOutcome,
  MaturityBucket,
  MaturityWindowProfile,
  PolicyDecisionRecord,
  SelfEvolvingPolicyState,
  StartupStage,
  StructuralFeatureSnapshot,
  UtilityBreakdown,
} from "./self-evolving-contracts.js";
import { stableHash } from "./self-evolving-contracts.js";

export const POLICY_VERSION = "self-evolving-policy.v1";
export const UTILITY_VERSION = "self-evolving-utility.v1";
export const PRIOR_FAMILY_VERSION = "self-evolving-priors.v1";

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

export interface CandidateOutcomeSignal {
  event_id: string;
  timestamp: string;
  outcome: ImprovementOutcome;
}

export interface PolicyScoreInput {
  business_id: string;
  startup_stage: StartupStage;
  route_hint: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
  candidate_belief?: CandidateBeliefState | null;
  outcome_signals?: readonly CandidateOutcomeSignal[];
  captured_at: string;
}

export interface ScorePolicySummary {
  policy_version: string;
  utility_version: string;
  prior_family_version: string;
  belief_state_id: string;
  structural_snapshot_id: string;
  evidence_weight: number;
  evidence_floor_met: boolean;
  fallback_reason: string | null;
}

export interface ScoreResult {
  priority_score_v1: number;
  priority_score_v2: number | null;
  autonomy_cap: 1 | 2 | 3 | 4;
  reasons: string[];
  evidence: CandidateEvidenceProfile;
  utility: UtilityBreakdown;
  policy: ScorePolicySummary;
}

function clampScore(score: number): number {
  if (score < 0) return 0;
  if (score > 5) return 5;
  return score;
}

function clampUnit(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
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

function buildDefaultConstraintProfile(): ConstraintProfile {
  return {
    schema_version: "constraint-profile.v1",
    wip_cap: 10,
    max_candidates_per_route: {
      "lp-do-fact-find": 6,
      "lp-do-plan": 4,
      "lp-do-build": 3,
    },
    max_guarded_trial_blast_radius: "medium",
    minimum_evidence_floor: "instrumented",
    hold_window_days: 7,
    exploration_budget_slots: 1,
  };
}

function buildDefaultMaturityWindowProfile(): MaturityWindowProfile {
  return {
    schema_version: "maturity-window-profile.v1",
    immediate_days: 0,
    short_days: 7,
    medium_days: 28,
    long_days: 56,
  };
}

export function createDefaultPolicyState(
  businessId: string,
  updatedAt: string,
): SelfEvolvingPolicyState {
  return {
    schema_version: "policy-state.v1",
    business_id: businessId,
    policy_state_id: stableHash(`${businessId}|${POLICY_VERSION}|policy-state`).slice(0, 16),
    policy_version: POLICY_VERSION,
    utility_version: UTILITY_VERSION,
    prior_family_version: PRIOR_FAMILY_VERSION,
    authority_level: "shadow",
    active_constraint_profile: buildDefaultConstraintProfile(),
    maturity_windows: buildDefaultMaturityWindowProfile(),
    candidate_beliefs: {},
    last_decision_id: null,
    updated_at: updatedAt,
    updated_by: "self-evolving-orchestrator",
  };
}

function createBetaPosterior(
  priorAlpha: number,
  priorBeta: number,
): CandidateBeliefState["success_if_attempted"] {
  return {
    family: "beta_binomial",
    prior_alpha: priorAlpha,
    prior_beta: priorBeta,
    alpha: priorAlpha,
    beta: priorBeta,
    successes: 0,
    failures: 0,
    updated_through_event_id: null,
  };
}

function createBucketPosterior(
  priorAlpha: [number, number, number, number, number],
): CandidateBeliefState["time_to_effect"] {
  return {
    family: "dirichlet_categorical",
    buckets: ["immediate", "short", "medium", "long", "unknown"],
    prior_alpha: priorAlpha,
    alpha: [...priorAlpha],
    counts: [0, 0, 0, 0, 0],
    updated_through_event_id: null,
  };
}

function routePriorShift(routeHint: PolicyScoreInput["route_hint"]): number {
  if (routeHint === "lp-do-build") return 0.25;
  if (routeHint === "lp-do-plan") return 0;
  return -0.15;
}

function blastRadiusPenalty(candidate: ImprovementCandidate): number {
  if (candidate.blast_radius_tag === "large") return 0.8;
  if (candidate.blast_radius_tag === "medium") return 0.45;
  return 0.2;
}

function seedSuccessPrior(
  candidate: ImprovementCandidate,
  input: PolicyScoreInput,
): CandidateBeliefState["success_if_attempted"] {
  const stageShift =
    input.startup_stage === "traction" ? 0.4 : input.startup_stage === "launched" ? 0.15 : 0;
  const routeShift = routePriorShift(input.route_hint);
  const alpha = 2.4 + stageShift + routeShift;
  const beta = 2.2 + blastRadiusPenalty(candidate);
  return createBetaPosterior(alpha, beta);
}

function seedImpactPrior(
  candidate: ImprovementCandidate,
  input: PolicyScoreInput,
): CandidateBeliefState["positive_impact_if_attempted"] {
  const candidateShift =
    candidate.candidate_type === "container_update" ||
    candidate.candidate_type === "deterministic_extraction"
      ? 0.4
      : 0;
  const alpha = 2.1 + candidateShift + routePriorShift(input.route_hint);
  const beta = 2.3 + (input.startup_stage === "prelaunch" ? 0.4 : 0);
  return createBetaPosterior(alpha, beta);
}

function seedGuardrailPrior(
  candidate: ImprovementCandidate,
): CandidateBeliefState["guardrail_breach_if_attempted"] {
  const blastPenalty =
    candidate.blast_radius_tag === "large"
      ? 1.6
      : candidate.blast_radius_tag === "medium"
        ? 1
        : 0.5;
  return createBetaPosterior(1 + blastPenalty, 5 - Math.min(blastPenalty, 2));
}

function seedTimeToEffectPrior(
  input: PolicyScoreInput,
): CandidateBeliefState["time_to_effect"] {
  if (input.route_hint === "lp-do-build") {
    return createBucketPosterior([1, 2, 2, 1, 1]);
  }
  if (input.route_hint === "lp-do-plan") {
    return createBucketPosterior([1, 2, 1, 1, 2]);
  }
  return createBucketPosterior([1, 1, 1, 1, 2]);
}

function posterMean(
  posterior: CandidateBeliefState["success_if_attempted"],
): number {
  return posterior.alpha / (posterior.alpha + posterior.beta);
}

function posteriorUpperBound(
  posterior: CandidateBeliefState["success_if_attempted"],
): number {
  return betaBinomialPosterior({
    successes: posterior.successes,
    failures: posterior.failures,
    priorAlpha: posterior.prior_alpha,
    priorBeta: posterior.prior_beta,
  }).credibleInterval.upper;
}

function outcomeIndicatesPositiveImpact(outcome: ImprovementOutcome): boolean {
  return (
    outcome.implementation_status === "success" &&
    outcome.kept_or_reverted === "kept" &&
    outcome.measured_impact > 0 &&
    outcome.measurement_status !== "missing"
  );
}

function outcomeIndicatesGuardrailBreach(outcome: ImprovementOutcome): boolean {
  return (
    outcome.implementation_status !== "success" ||
    outcome.regressions_detected > 0 ||
    outcome.kept_or_reverted !== "kept"
  );
}

function classifyTimeToEffect(outcome: ImprovementOutcome): MaturityBucket {
  const window = outcome.post_window.toLowerCase();
  if (outcome.implementation_status !== "success") {
    return "immediate";
  }
  if (window.includes("56") || window.includes("retention") || window.includes("churn")) {
    return "long";
  }
  if (window.includes("28") || window.includes("30") || window.includes("month")) {
    return "medium";
  }
  if (window.includes("7") || window.includes("14") || window.includes("week")) {
    return "short";
  }
  return "unknown";
}

function incrementBetaPosterior(
  posterior: CandidateBeliefState["success_if_attempted"],
  success: boolean,
  eventId: string,
): void {
  if (success) {
    posterior.successes += 1;
    posterior.alpha += 1;
  } else {
    posterior.failures += 1;
    posterior.beta += 1;
  }
  posterior.updated_through_event_id = eventId;
}

function incrementBucketPosterior(
  posterior: CandidateBeliefState["time_to_effect"],
  bucket: MaturityBucket,
  eventId: string,
): void {
  const index = posterior.buckets.indexOf(bucket);
  if (index === -1) {
    return;
  }
  posterior.counts[index] += 1;
  posterior.alpha[index] += 1;
  posterior.updated_through_event_id = eventId;
}

export function buildStructuralFeatureSnapshot(input: {
  business_id: string;
  candidate: ImprovementCandidate;
  startup_stage: StartupStage;
  route_hint: PolicyScoreInput["route_hint"];
  evidence_classification: CandidateEvidenceClassification;
  evidence_grade: "exploratory" | "structural" | "measured" | null;
  recurrence_count_window: number;
  operator_minutes_estimate: number;
  quality_impact_estimate: number;
  captured_at: string;
}): StructuralFeatureSnapshot {
  const constraintRefs = [
    `risk:${input.candidate.risk_level}`,
    `blast:${input.candidate.blast_radius_tag}`,
    `effort:${input.candidate.estimated_effort}`,
    `route:${input.route_hint}`,
  ];
  return {
    snapshot_id: stableHash(
      JSON.stringify({
        business_id: input.business_id,
        candidate_id: input.candidate.candidate_id,
        route_hint: input.route_hint,
        evidence: input.evidence_classification,
        recurrence_count_window: input.recurrence_count_window,
        captured_at: input.captured_at,
      }),
    ).slice(0, 16),
    candidate_id: input.candidate.candidate_id,
    business_id: input.business_id,
    captured_at: input.captured_at,
    startup_stage: input.startup_stage,
    candidate_type: input.candidate.candidate_type,
    recommended_route_hint: input.route_hint,
    recurrence_count_window: input.recurrence_count_window,
    operator_minutes_estimate: input.operator_minutes_estimate,
    quality_impact_estimate: input.quality_impact_estimate,
    evidence_grade: input.evidence_grade,
    evidence_classification: input.evidence_classification,
    blast_radius_tag: input.candidate.blast_radius_tag,
    risk_level: input.candidate.risk_level,
    estimated_effort: input.candidate.estimated_effort,
    constraint_refs: constraintRefs,
  };
}

function computeEvidenceWeight(
  evidence: CandidateEvidenceProfile,
  outcomeSignals: readonly CandidateOutcomeSignal[],
): number {
  const base = evidence.classification === "measured"
    ? 0.8
    : evidence.classification === "instrumented"
      ? 0.6
      : evidence.classification === "structural_only"
        ? 0.35
        : 0.15;
  const outcomeBonus = Math.min(0.25, outcomeSignals.length * 0.08);
  return clampUnit(base + outcomeBonus);
}

export function deriveCandidateBeliefState(input: {
  candidate: ImprovementCandidate;
  structural_snapshot: StructuralFeatureSnapshot;
  evidence: CandidateEvidenceProfile;
  policy_input: PolicyScoreInput;
}): CandidateBeliefState {
  const priorBelief = input.policy_input.candidate_belief ?? null;
  const successPosterior = seedSuccessPrior(input.candidate, input.policy_input);
  const impactPosterior = seedImpactPrior(input.candidate, input.policy_input);
  const breachPosterior = seedGuardrailPrior(input.candidate);
  const timePosterior = seedTimeToEffectPrior(input.policy_input);

  let lastVerifiedOutcomeAt = priorBelief?.last_verified_outcome_at ?? null;
  let lastOutcomeEventId = priorBelief?.last_outcome_event_id ?? null;

  for (const signal of input.policy_input.outcome_signals ?? []) {
    incrementBetaPosterior(
      successPosterior,
      signal.outcome.implementation_status === "success",
      signal.event_id,
    );
    incrementBetaPosterior(
      impactPosterior,
      outcomeIndicatesPositiveImpact(signal.outcome),
      signal.event_id,
    );
    incrementBetaPosterior(
      breachPosterior,
      outcomeIndicatesGuardrailBreach(signal.outcome),
      signal.event_id,
    );
    incrementBucketPosterior(
      timePosterior,
      classifyTimeToEffect(signal.outcome),
      signal.event_id,
    );
    lastVerifiedOutcomeAt = signal.timestamp;
    lastOutcomeEventId = signal.event_id;
  }

  return {
    schema_version: "candidate-belief.v1",
    candidate_id: input.candidate.candidate_id,
    structural_snapshot_id: input.structural_snapshot.snapshot_id,
    success_if_attempted: successPosterior,
    positive_impact_if_attempted: impactPosterior,
    guardrail_breach_if_attempted: breachPosterior,
    time_to_effect: timePosterior,
    evidence_weight: computeEvidenceWeight(
      input.evidence,
      input.policy_input.outcome_signals ?? [],
    ),
    evidence_floor_met: input.evidence.classification !== "insufficient",
    last_verified_outcome_at: lastVerifiedOutcomeAt,
    last_outcome_event_id: lastOutcomeEventId,
    last_decision_id: priorBelief?.last_decision_id ?? null,
    last_override_id: priorBelief?.last_override_id ?? null,
    updated_at: input.policy_input.captured_at,
  };
}

function effortPenalty(candidate: ImprovementCandidate, dimensions: ScoreDimensionsV2): number {
  const effortBase =
    candidate.estimated_effort === "L" ? 1.75 : candidate.estimated_effort === "M" ? 1.1 : 0.55;
  return effortBase + clampScore(dimensions.implementation_effort_score) * 0.18;
}

function instabilityPenalty(candidate: ImprovementCandidate): number {
  if (candidate.candidate_state === "blocked" || candidate.candidate_state === "reverted") {
    return 0.9;
  }
  if (candidate.candidate_state === "monitored" || candidate.candidate_state === "canary") {
    return 0.45;
  }
  return 0;
}

export function computeUtilityBreakdown(input: {
  candidate: ImprovementCandidate;
  belief_state: CandidateBeliefState;
  dimensions: ScoreDimensionsV2;
  evidence: CandidateEvidenceProfile;
}): UtilityBreakdown {
  const rewardSurface =
    clampScore(input.dimensions.frequency_score) +
    clampScore(input.dimensions.operator_time_score) +
    clampScore(input.dimensions.quality_risk_reduction_score) +
    clampScore(input.dimensions.outcome_impact_score);
  const expectedReward = posterMean(input.belief_state.positive_impact_if_attempted) * (rewardSurface / 2);
  const downsidePenalty =
    posteriorUpperBound(input.belief_state.guardrail_breach_if_attempted) *
    (1.4 + blastRadiusPenalty(input.candidate) * 2.2);
  const evidencePenalty =
    input.belief_state.evidence_floor_met
      ? 0
      : input.evidence.classification === "structural_only"
        ? 1
        : 1.75;
  const utility: UtilityBreakdown = {
    expected_reward: Number(expectedReward.toFixed(4)),
    downside_penalty: Number(downsidePenalty.toFixed(4)),
    effort_penalty: Number(effortPenalty(input.candidate, input.dimensions).toFixed(4)),
    evidence_penalty: Number(evidencePenalty.toFixed(4)),
    instability_penalty: Number(instabilityPenalty(input.candidate).toFixed(4)),
    exploration_bonus: 0,
    net_utility: 0,
  };
  utility.net_utility = Number(
    (
      utility.expected_reward -
      utility.downside_penalty -
      utility.effort_penalty -
      utility.evidence_penalty -
      utility.instability_penalty +
      utility.exploration_bonus
    ).toFixed(4),
  );
  return utility;
}

export function buildPolicyDecisionRecord(input: {
  business_id: string;
  candidate_id: string;
  chosen_action: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build" | "reject";
  created_at: string;
  structural_snapshot: StructuralFeatureSnapshot;
  belief_state: CandidateBeliefState;
  utility: UtilityBreakdown;
}): PolicyDecisionRecord {
  const decisionContextId = stableHash(
    JSON.stringify({
      candidate_id: input.candidate_id,
      structural_snapshot_id: input.structural_snapshot.snapshot_id,
      utility: input.utility,
      created_at: input.created_at,
      chosen_action: input.chosen_action,
    }),
  ).slice(0, 16);
  return {
    schema_version: "policy-decision.v1",
    decision_id: stableHash(
      `${input.business_id}|${input.candidate_id}|${decisionContextId}|${input.chosen_action}`,
    ).slice(0, 16),
    business_id: input.business_id,
    candidate_id: input.candidate_id,
    decision_type: "candidate_route",
    decision_mode: "deterministic",
    policy_version: POLICY_VERSION,
    utility_version: UTILITY_VERSION,
    prior_family_version: PRIOR_FAMILY_VERSION,
    decision_context_id: decisionContextId,
    structural_snapshot: input.structural_snapshot,
    belief_state_id: stableHash(
      `${input.candidate_id}|${input.belief_state.structural_snapshot_id}|belief`,
    ).slice(0, 16),
    eligible_actions: ["lp-do-fact-find", "lp-do-plan", "lp-do-build"],
    chosen_action: input.chosen_action,
    action_probability: null,
    utility: input.utility,
    created_at: input.created_at,
  };
}

export function computeScoreResult(
  candidate: ImprovementCandidate,
  dimensions: ScoreDimensionsV2,
  weights: ScoreWeights,
  evidence: CandidateEvidenceGate,
  policyInput?: PolicyScoreInput,
): ScoreResult {
  const reasons: string[] = [];
  const v1 = computePriorityScoreV1(dimensions, weights);
  let v2: number | null = null;
  let autonomyCap: 1 | 2 | 3 | 4 = candidate.autonomy_level_required;
  const evidenceProfile = assessEvidenceProfile(evidence);
  const normalizedPolicyInput: PolicyScoreInput = policyInput ?? {
    business_id: "unknown",
    startup_stage: "prelaunch",
    route_hint: "lp-do-fact-find",
    candidate_belief: null,
    outcome_signals: [],
    captured_at: new Date().toISOString(),
  };
  const structuralSnapshot = buildStructuralFeatureSnapshot({
    business_id: normalizedPolicyInput.business_id,
    candidate,
    startup_stage: normalizedPolicyInput.startup_stage,
    route_hint: normalizedPolicyInput.route_hint,
    evidence_classification: evidenceProfile.classification,
    evidence_grade:
      evidenceProfile.classification === "measured"
        ? "measured"
        : evidenceProfile.classification === "insufficient"
          ? null
          : "structural",
    recurrence_count_window: evidence.observation_count,
    operator_minutes_estimate: Math.round(clampScore(dimensions.operator_time_score) * 10),
    quality_impact_estimate: clampScore(dimensions.quality_risk_reduction_score) / 5,
    captured_at: normalizedPolicyInput.captured_at,
  });
  const beliefState = deriveCandidateBeliefState({
    candidate,
    structural_snapshot: structuralSnapshot,
    evidence: evidenceProfile,
    policy_input: normalizedPolicyInput,
  });
  const utility = computeUtilityBreakdown({
    candidate,
    belief_state: beliefState,
    dimensions,
    evidence: evidenceProfile,
  });

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

  if (utility.net_utility < 0) {
    reasons.push("negative_expected_utility");
  }

  return {
    priority_score_v1: v1,
    priority_score_v2: v2,
    autonomy_cap: autonomyCap,
    reasons,
    evidence: evidenceProfile,
    utility,
    policy: {
      policy_version: POLICY_VERSION,
      utility_version: UTILITY_VERSION,
      prior_family_version: PRIOR_FAMILY_VERSION,
      belief_state_id: stableHash(
        `${candidate.candidate_id}|${beliefState.structural_snapshot_id}|belief`,
      ).slice(0, 16),
      structural_snapshot_id: structuralSnapshot.snapshot_id,
      evidence_weight: beliefState.evidence_weight,
      evidence_floor_met: beliefState.evidence_floor_met,
      fallback_reason: policyInput ? null : "policy_input_missing_cold_start_priors_applied",
    },
  };
}
