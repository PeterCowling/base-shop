import type {
  CandidateState,
  ImprovementCandidate,
  MetaObservation,
} from "./self-evolving-contracts.js";

const ACTIVE_STATES: ReadonlySet<CandidateState> = new Set([
  "draft",
  "validated",
  "blocked",
  "canary",
  "monitored",
]);

export interface DashboardSnapshot {
  totals: {
    observations: number;
    candidates: number;
    active_candidates: number;
    blocked_candidates: number;
    promoted_candidates: number;
    reverted_candidates: number;
  };
  precision_proxy: number;
  data_quality_ok_ratio: number;
  backlog_saturation: number;
}

export function buildDashboardSnapshot(input: {
  observations: MetaObservation[];
  candidates: ImprovementCandidate[];
  wipCap: number;
}): DashboardSnapshot {
  const activeCandidates = input.candidates.filter((candidate) =>
    ACTIVE_STATES.has(candidate.candidate_state),
  );
  const blockedCandidates = input.candidates.filter(
    (candidate) => candidate.candidate_state === "blocked",
  );
  const promotedCandidates = input.candidates.filter(
    (candidate) => candidate.candidate_state === "promoted",
  );
  const revertedCandidates = input.candidates.filter(
    (candidate) => candidate.candidate_state === "reverted",
  );

  const qualityObservations = input.observations.filter(
    (observation) => observation.data_quality_status !== null,
  );
  const okQualityObservations = qualityObservations.filter(
    (observation) => observation.data_quality_status === "ok",
  );

  const precisionEligible = input.observations.filter(
    (observation) => observation.detector_confidence >= 0.5,
  );
  const precisionKept = precisionEligible.filter(
    (observation) => observation.severity >= 0.4,
  );

  return {
    totals: {
      observations: input.observations.length,
      candidates: input.candidates.length,
      active_candidates: activeCandidates.length,
      blocked_candidates: blockedCandidates.length,
      promoted_candidates: promotedCandidates.length,
      reverted_candidates: revertedCandidates.length,
    },
    precision_proxy:
      precisionEligible.length === 0
        ? 0
        : precisionKept.length / precisionEligible.length,
    data_quality_ok_ratio:
      qualityObservations.length === 0
        ? 0
        : okQualityObservations.length / qualityObservations.length,
    backlog_saturation:
      input.wipCap <= 0 ? 0 : activeCandidates.length / input.wipCap,
  };
}
