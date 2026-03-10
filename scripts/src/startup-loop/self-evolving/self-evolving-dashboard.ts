import { betaBinomialPosterior } from "@acme/lib/math/experimentation";

import type { RankedCandidate } from "./self-evolving-candidates.js";
import type {
  CandidateState,
  MetaObservation,
  PolicyDecisionRecord,
  SelfEvolvingPolicyState,
} from "./self-evolving-contracts.js";
import type { SelfEvolvingDependencyGraphSnapshot } from "./self-evolving-dependency-graph.js";
import type { PolicyEvaluationSummary } from "./self-evolving-evaluation.js";
import {
  type ObservationPostureSummary,
  summarizeObservationPosture,
} from "./self-evolving-evidence-posture.js";
import type { PolicyAuditTelemetry } from "./self-evolving-policy-audit.js";
import type { SurvivalPolicySignals } from "./self-evolving-survival.js";

const ACTIVE_STATES: ReadonlySet<CandidateState> = new Set([
  "draft",
  "validated",
  "blocked",
  "canary",
  "monitored",
]);

export interface DashboardRateMetric {
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

export interface DashboardSnapshot {
  totals: {
    observations: number;
    candidates: number;
    active_candidates: number;
    blocked_candidates: number;
    promoted_candidates: number;
    reverted_candidates: number;
  };
  quality: {
    resolved_candidate_precision: DashboardRateMetric;
    observation_annotation_coverage: DashboardRateMetric;
    annotated_data_quality_ok_rate: DashboardRateMetric;
    measurement_ready_observation_rate: DashboardRateMetric;
    measured_evidence_candidate_rate: DashboardRateMetric;
    evidence_constrained_candidates: number;
  };
  posture: ObservationPostureSummary;
  backlog_saturation: number;
  policy: {
    policy_version: string | null;
    utility_version: string | null;
    authority_level: string | null;
    candidate_beliefs: number;
    decision_records: number;
    stochastic_decisions: number;
    exploration_decisions: number;
    promotion_gate_decisions: number;
    promotion_nomination_decisions: number;
  };
  evaluation: {
    total_decisions: number;
    observed_decisions: number;
    pending_decisions: number;
    censored_decisions: number;
    missing_decisions: number;
    replay_ready_decisions: number;
    prescription_attributed_decisions: number;
    replay_ready_prescription_decisions: number;
    observed_prescription_decisions: number;
    shadow_handoff_decisions: number;
    pending_shadow_handoffs: number;
    matured_shadow_handoffs: number;
    maturity_debt_decisions: number;
    replay_ready_rate: DashboardRateMetric;
    prescription_attribution_rate: DashboardRateMetric;
  };
  audit: {
    calibration_status: "measured" | "insufficient_data";
    calibration_sample_size: number;
    calibration_brier_score: number | null;
    exploration_regret_status: "measured" | "insufficient_data";
    exploration_regret_batches: number;
    exploration_regret_measured_batches: number;
    exploration_total_regret: number | null;
    override_count: number;
    overridden_candidates: number;
    policy_versions_compared: number;
  };
  graph: {
    snapshot_id: string | null;
    node_count: number;
    edge_count: number;
    top_candidate_bottlenecks: Array<{ candidate_id: string; bottleneck_score: number }>;
  };
  survival: {
    snapshot_id: string | null;
    total_records: number;
    verified_curve_status: "empty" | "estimated";
    closure_curve_status: "empty" | "estimated";
    estimated_route_profiles: number;
    insufficient_route_profiles: number;
  };
}

const EMPTY_EVALUATION_SUMMARY: PolicyEvaluationSummary = {
  total_decisions: 0,
  observed_decisions: 0,
  pending_decisions: 0,
  censored_decisions: 0,
  missing_decisions: 0,
  replay_ready_decisions: 0,
  prescription_attributed_decisions: 0,
  replay_ready_prescription_decisions: 0,
  observed_prescription_decisions: 0,
  shadow_handoff_decisions: 0,
  pending_shadow_handoffs: 0,
  matured_shadow_handoffs: 0,
  deterministic_decisions: 0,
  stochastic_decisions: 0,
  policy_version_counts: {},
  prescription_family_counts: {},
};

function buildRateMetric(successes: number, sampleSize: number): DashboardRateMetric {
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

export function buildDashboardSnapshot(input: {
  observations: MetaObservation[];
  ranked_candidates: RankedCandidate[];
  wipCap: number;
  policy_state?: SelfEvolvingPolicyState | null;
  decision_records_count?: number;
  policy_decisions?: readonly PolicyDecisionRecord[] | null;
  evaluation_summary?: PolicyEvaluationSummary | null;
  policy_audit?: PolicyAuditTelemetry | null;
  dependency_graph?: SelfEvolvingDependencyGraphSnapshot | null;
  survival_signals?: SurvivalPolicySignals | null;
}): DashboardSnapshot {
  const candidates = input.ranked_candidates.map((entry) => entry.candidate);
  const activeCandidates = candidates.filter((candidate) =>
    ACTIVE_STATES.has(candidate.candidate_state),
  );
  const blockedCandidates = candidates.filter(
    (candidate) => candidate.candidate_state === "blocked",
  );
  const promotedCandidates = candidates.filter(
    (candidate) => candidate.candidate_state === "promoted",
  );
  const revertedCandidates = candidates.filter(
    (candidate) => candidate.candidate_state === "reverted",
  );

  const qualityObservations = input.observations.filter(
    (observation) => observation.data_quality_status !== null,
  );
  const okQualityObservationCount = qualityObservations.filter(
    (observation) => observation.data_quality_status === "ok",
  ).length;
  const measurementReadyObservationCount = input.observations.filter(
    (observation) =>
      observation.baseline_ref != null &&
      observation.measurement_window != null &&
      observation.data_quality_status === "ok" &&
      typeof observation.sample_size === "number" &&
      observation.sample_size >= 30,
  ).length;
  const resolvedCandidates = input.ranked_candidates.filter((entry) =>
    ["promoted", "kept", "reverted"].includes(entry.candidate.candidate_state),
  );
  const resolvedPrecisionSuccessCount = resolvedCandidates.filter(
    (entry) => entry.candidate.candidate_state !== "reverted",
  ).length;
  const measuredEvidenceCandidateCount = input.ranked_candidates.filter(
    (entry) => entry.score.evidence.classification === "measured",
  ).length;
  const evidenceConstrainedCandidates =
    input.ranked_candidates.length - measuredEvidenceCandidateCount;
  const posture = summarizeObservationPosture(input.observations);
  const policyState = input.policy_state ?? null;
  const policyDecisions = input.policy_decisions ?? [];
  const evaluationSummary = input.evaluation_summary ?? EMPTY_EVALUATION_SUMMARY;
  const maturityDebtDecisions =
    evaluationSummary.pending_decisions + evaluationSummary.censored_decisions;
  const policyAudit = input.policy_audit ?? null;
  const dependencyGraph = input.dependency_graph ?? null;
  const survivalSignals = input.survival_signals ?? null;

  return {
    totals: {
      observations: input.observations.length,
      candidates: candidates.length,
      active_candidates: activeCandidates.length,
      blocked_candidates: blockedCandidates.length,
      promoted_candidates: promotedCandidates.length,
      reverted_candidates: revertedCandidates.length,
    },
    quality: {
      resolved_candidate_precision: buildRateMetric(
        resolvedPrecisionSuccessCount,
        resolvedCandidates.length,
      ),
      observation_annotation_coverage: buildRateMetric(
        qualityObservations.length,
        input.observations.length,
      ),
      annotated_data_quality_ok_rate: buildRateMetric(
        okQualityObservationCount,
        qualityObservations.length,
      ),
      measurement_ready_observation_rate: buildRateMetric(
        measurementReadyObservationCount,
        input.observations.length,
      ),
      measured_evidence_candidate_rate: buildRateMetric(
        measuredEvidenceCandidateCount,
        input.ranked_candidates.length,
      ),
      evidence_constrained_candidates: evidenceConstrainedCandidates,
    },
    posture,
    backlog_saturation:
      input.wipCap <= 0 ? 0 : activeCandidates.length / input.wipCap,
    policy: {
      policy_version: policyState?.policy_version ?? null,
      utility_version: policyState?.utility_version ?? null,
      authority_level: policyState?.authority_level ?? null,
      candidate_beliefs: Object.keys(policyState?.candidate_beliefs ?? {}).length,
      decision_records: input.decision_records_count ?? 0,
      stochastic_decisions: policyDecisions.filter(
        (decision) => decision.decision_mode === "stochastic",
      ).length,
      exploration_decisions: policyDecisions.filter(
        (decision) => decision.decision_type === "exploration_rank",
      ).length,
      promotion_gate_decisions: policyDecisions.filter(
        (decision) => decision.decision_type === "promotion_gate",
      ).length,
      promotion_nomination_decisions: policyDecisions.filter(
        (decision) => decision.decision_type === "promotion_nomination",
      ).length,
    },
    evaluation: {
      total_decisions: evaluationSummary.total_decisions,
      observed_decisions: evaluationSummary.observed_decisions,
      pending_decisions: evaluationSummary.pending_decisions,
      censored_decisions: evaluationSummary.censored_decisions,
      missing_decisions: evaluationSummary.missing_decisions,
      replay_ready_decisions: evaluationSummary.replay_ready_decisions,
      prescription_attributed_decisions: evaluationSummary.prescription_attributed_decisions,
      replay_ready_prescription_decisions:
        evaluationSummary.replay_ready_prescription_decisions,
      observed_prescription_decisions: evaluationSummary.observed_prescription_decisions,
      shadow_handoff_decisions: evaluationSummary.shadow_handoff_decisions,
      pending_shadow_handoffs: evaluationSummary.pending_shadow_handoffs,
      matured_shadow_handoffs: evaluationSummary.matured_shadow_handoffs,
      maturity_debt_decisions: maturityDebtDecisions,
      replay_ready_rate: buildRateMetric(
        evaluationSummary.replay_ready_decisions,
        evaluationSummary.total_decisions,
      ),
      prescription_attribution_rate: buildRateMetric(
        evaluationSummary.prescription_attributed_decisions,
        evaluationSummary.total_decisions,
      ),
    },
    audit: {
      calibration_status:
        policyAudit?.belief_quality.calibration.status ?? "insufficient_data",
      calibration_sample_size:
        policyAudit?.belief_quality.calibration.sample_size ?? 0,
      calibration_brier_score:
        policyAudit?.belief_quality.calibration.brier_score ?? null,
      exploration_regret_status:
        policyAudit?.policy_quality.exploration_regret.status ?? "insufficient_data",
      exploration_regret_batches:
        policyAudit?.policy_quality.exploration_regret.total_batches ?? 0,
      exploration_regret_measured_batches:
        policyAudit?.policy_quality.exploration_regret.measured_batches ?? 0,
      exploration_total_regret:
        policyAudit?.policy_quality.exploration_regret.total_regret ?? null,
      override_count:
        policyAudit?.operator_intervention.overrides.total_overrides ?? 0,
      overridden_candidates:
        policyAudit?.operator_intervention.overrides.overridden_candidates ?? 0,
      policy_versions_compared:
        policyAudit?.policy_quality.policy_version_comparison.length ?? 0,
    },
    graph: {
      snapshot_id: dependencyGraph?.snapshot_id ?? null,
      node_count: dependencyGraph?.node_count ?? 0,
      edge_count: dependencyGraph?.edge_count ?? 0,
      top_candidate_bottlenecks:
        dependencyGraph?.candidate_signals
          .slice(0, 5)
          .map((signal) => ({
            candidate_id: signal.candidate_id,
            bottleneck_score: signal.bottleneck_score,
          })) ?? [],
    },
    survival: {
      snapshot_id: survivalSignals?.snapshot_id ?? null,
      total_records: survivalSignals?.total_records ?? 0,
      verified_curve_status: survivalSignals?.verified_outcome_curve.status ?? "empty",
      closure_curve_status: survivalSignals?.closure_curve.status ?? "empty",
      estimated_route_profiles:
        survivalSignals?.route_profiles.filter((profile) => profile.status === "estimated")
          .length ?? 0,
      insufficient_route_profiles:
        survivalSignals?.route_profiles.filter(
          (profile) => profile.status === "insufficient_data",
        ).length ?? 0,
    },
  };
}
