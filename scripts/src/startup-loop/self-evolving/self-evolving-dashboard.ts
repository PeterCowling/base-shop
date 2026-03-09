import { betaBinomialPosterior } from "@acme/lib/math/experimentation";

import type { RankedCandidate } from "./self-evolving-candidates.js";
import type {
  CandidateState,
  MetaObservation,
  SelfEvolvingPolicyState,
} from "./self-evolving-contracts.js";
import {
  type ObservationPostureSummary,
  summarizeObservationPosture,
} from "./self-evolving-evidence-posture.js";

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
  };
}

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
    },
  };
}
