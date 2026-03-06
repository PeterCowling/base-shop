import { mapCandidateToBackboneRoute } from "./self-evolving-backbone.js";
import {
  DEFAULT_MATURE_BOUNDARY_THRESHOLDS,
  evaluateMatureBoundary,
  type MatureBoundarySignals,
  type MatureBoundaryThresholds,
} from "./self-evolving-boundary.js";
import {
  mergeRankedCandidates,
  type RankedCandidate,
  readCandidateLedger,
  writeCandidateLedger,
} from "./self-evolving-candidates.js";
import {
  type ImprovementCandidate,
  type MetaObservation,
  stableHash,
  type StartupState,
  throwOnContractErrors,
  validateImprovementCandidate,
} from "./self-evolving-contracts.js";
import { buildDashboardSnapshot } from "./self-evolving-dashboard.js";
import {
  detectRepeatWorkCandidates,
  type RepeatWorkCandidate,
  type RepeatWorkDetectorConfig,
} from "./self-evolving-detector.js";
import {
  appendObservationAsEvent,
  readMetaObservations,
} from "./self-evolving-events.js";
import {
  canCreateCandidate,
  type CandidateBudgetPolicy,
  enforceCreationGate,
  validateTransition,
} from "./self-evolving-lifecycle.js";
import {
  type CandidateEvidenceGate,
  computeScoreResult,
  type ScoreDimensionsV2,
  type ScoreWeights,
} from "./self-evolving-scoring.js";
import {
  buildRepeatProblemStatement,
  deriveBoundarySignalSnapshotFromStartupState,
  inferCandidateTypeFromObservations,
  inferExecutorPathFromObservations,
  isNonePlaceholderMetaObservation,
} from "./self-evolving-signal-helpers.js";
import {
  createStartupStateStore,
  writeStartupState,
} from "./self-evolving-startup-state.js";

const DEFAULT_DETECTOR_CONFIG: RepeatWorkDetectorConfig = {
  recurrence_threshold: 2,
  window_days: 7,
  time_density_threshold: 0.2,
  cooldown_days: 2,
};

const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  w1: 1,
  w2: 1,
  w3: 1,
  w4: 0.75,
  w5: 0.75,
  w6: 1,
  w7: 1.25,
  w8: 1,
};

const DEFAULT_BUDGET_POLICY: CandidateBudgetPolicy = {
  max_active_candidates: 10,
  max_candidates_created_per_day: 20,
  blocked_sla_days: 14,
};

function buildScoreDimensions(observations: MetaObservation[]): ScoreDimensionsV2 {
  const count = observations.length;
  const avgMinutes =
    observations.reduce((sum, observation) => sum + observation.operator_minutes_estimate, 0) /
    Math.max(1, count);
  const avgQualityImpact =
    observations.reduce((sum, observation) => sum + observation.quality_impact_estimate, 0) /
    Math.max(1, count);
  const avgSeverity =
    observations.reduce((sum, observation) => sum + observation.severity, 0) /
    Math.max(1, count);
  const hasKpi = observations.some((observation) => observation.kpi_name != null);

  return {
    frequency_score: Math.min(5, count),
    operator_time_score: Math.min(5, avgMinutes / 10),
    quality_risk_reduction_score: Math.min(5, avgQualityImpact * 5),
    token_savings_score: hasKpi ? 2 : 3,
    implementation_effort_score: hasKpi ? 3 : 2,
    blast_radius_risk_score: Math.min(5, avgSeverity * 5),
    outcome_impact_score: hasKpi ? Math.min(5, avgSeverity * 6) : 1,
    time_to_impact_score: hasKpi ? 4 : 2,
  };
}

function buildEvidenceGate(observations: MetaObservation[]): CandidateEvidenceGate {
  const sampleSize = observations
    .map((observation) => observation.sample_size)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => b - a)[0] ?? null;
  const dataQualityStatus =
    observations.find((observation) => observation.data_quality_status === "ok")
      ?.data_quality_status ??
    observations[0]?.data_quality_status ??
    null;
  const qualityAnnotationCount = observations.filter(
    (observation) => observation.data_quality_status !== null,
  ).length;
  const okQualityCount = observations.filter(
    (observation) => observation.data_quality_status === "ok",
  ).length;
  const measurementReadyObservationCount = observations.filter(
    (observation) =>
      observation.baseline_ref != null &&
      observation.measurement_window != null &&
      observation.data_quality_status === "ok" &&
      typeof observation.sample_size === "number" &&
      observation.sample_size >= 30,
  ).length;

  return {
    has_kpi_baseline: observations.some((observation) => observation.baseline_ref != null),
    has_impact_mechanism: observations.some(
      (observation) => observation.quality_impact_estimate > 0,
    ),
    has_measurement_plan: observations.some(
      (observation) => observation.measurement_window != null,
    ),
    has_canary_path: true,
    data_quality_status: dataQualityStatus,
    sample_size: sampleSize,
    minimum_sample_size: 30,
    observation_count: observations.length,
    quality_annotation_count: qualityAnnotationCount,
    ok_quality_count: okQualityCount,
    measurement_ready_observation_count: measurementReadyObservationCount,
  };
}

function applyEvidenceAwareRoute(
  route: ReturnType<typeof mapCandidateToBackboneRoute>,
  evidenceClassification: ReturnType<typeof computeScoreResult>["evidence"]["classification"],
): ReturnType<typeof mapCandidateToBackboneRoute> {
  if (route.route === "reject" || route.route === "lp-do-fact-find") {
    return route;
  }
  if (evidenceClassification === "measured") {
    return route;
  }
  return {
    route: "lp-do-fact-find",
    reason: `evidence_${evidenceClassification}_requires_fact_find`,
  };
}

function buildCandidateFromRepeat(input: {
  business: string;
  repeat: RepeatWorkCandidate;
  observations: MetaObservation[];
  startupState: StartupState;
  now: Date;
}): ImprovementCandidate {
  const candidateType = inferCandidateTypeFromObservations(input.observations);
  const riskLevel: ImprovementCandidate["risk_level"] =
    candidateType === "container_update" ? "medium" : "low";
  const blastRadius: ImprovementCandidate["blast_radius_tag"] =
    candidateType === "container_update" ? "medium" : "small";
  const candidateId = stableHash(`${input.business}|${input.repeat.hard_signature}`).slice(0, 16);
  const expiryAt = new Date(input.now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    schema_version: "candidate.v1",
    candidate_id: candidateId,
    candidate_type: candidateType,
    candidate_state: "draft",
    problem_statement: buildRepeatProblemStatement(
      input.observations,
      input.repeat.recurrence_count,
      input.repeat.hard_signature,
    ),
    trigger_observations: input.repeat.observation_ids,
    executor_path: inferExecutorPathFromObservations(
      input.observations,
      input.startupState,
    ),
    change_scope: "business_only",
    applicability_predicates: [`business=${input.business}`],
    expected_benefit: "Reduce repetitive operator/manual workflow load.",
    risk_level: riskLevel,
    blast_radius_tag: blastRadius,
    autonomy_level_required: 2,
    estimated_effort: "M",
    recommended_action: "route_into_lp-do-build_backbone",
    owners: ["startup-loop"],
    approvers: ["operator"],
    test_plan: "offline_replay_plus_canary",
    validation_contract: "self-evolving.validation.v1",
    rollout_plan: "feature_flag_canary_then_promote",
    rollback_contract: "auto_revert_on_guardrail_breach",
    kill_switch: "self_evolving_global_kill_switch",
    blocked_reason_code: null,
    unblock_requirements: [],
    blocked_since: null,
    expiry_at: expiryAt,
  };
}

export interface SelfEvolvingOrchestratorInput {
  rootDir: string;
  business: string;
  run_id: string;
  session_id: string;
  startup_state: StartupState;
  observations: MetaObservation[];
  now?: Date;
  detector_config?: RepeatWorkDetectorConfig;
  score_weights?: ScoreWeights;
  budget_policy?: CandidateBudgetPolicy;
  boundary_signals?: MatureBoundarySignals;
  boundary_thresholds?: MatureBoundaryThresholds;
}

export interface SelfEvolvingOrchestratorResult {
  business: string;
  generated_at: string;
  startup_state_path: string;
  candidate_path: string;
  observations_count: number;
  repeat_candidates_detected: number;
  candidates_generated: number;
  candidate_rejections: string[];
  ranked_candidates: RankedCandidate[];
  dashboard: ReturnType<typeof buildDashboardSnapshot>;
  boundary: ReturnType<typeof evaluateMatureBoundary>;
}

export function runSelfEvolvingOrchestrator(
  input: SelfEvolvingOrchestratorInput,
): SelfEvolvingOrchestratorResult {
  const now = input.now ?? new Date();
  const detectorConfig = input.detector_config ?? DEFAULT_DETECTOR_CONFIG;
  const scoreWeights = input.score_weights ?? DEFAULT_SCORE_WEIGHTS;
  const budgetPolicy = input.budget_policy ?? DEFAULT_BUDGET_POLICY;

  const store = createStartupStateStore(input.rootDir);
  const startupStatePath = writeStartupState(store, input.startup_state);

  const freshObservations = input.observations.filter(
    (observation) => !isNonePlaceholderMetaObservation(observation),
  );

  for (const observation of freshObservations) {
    appendObservationAsEvent(input.rootDir, input.business, {
      ...observation,
      business: input.business,
      run_id: observation.run_id || input.run_id,
      session_id: observation.session_id || input.session_id,
    });
  }

  const allObservations = readMetaObservations(input.rootDir, input.business).filter(
    (observation) => !isNonePlaceholderMetaObservation(observation),
  );
  const detectedRepeats = detectRepeatWorkCandidates(
    allObservations,
    detectorConfig,
    { now },
  ).filter((candidate) => !candidate.dropped_by_cooldown);

  const existingLedger = readCandidateLedger(input.rootDir, input.business);
  const existingCandidates = existingLedger.candidates.map((item) => item.candidate);

  const generated: RankedCandidate[] = [];
  const rejections: string[] = [];
  let createdTodayCount = 0;

  for (const repeat of detectedRepeats) {
    const repeatObservations = allObservations.filter(
      (observation) => observation.hard_signature === repeat.hard_signature,
    );
    if (repeatObservations.length === 0) {
      rejections.push(`missing_observations_for_signature:${repeat.hard_signature}`);
      continue;
    }

    const candidate = buildCandidateFromRepeat({
      business: input.business,
      repeat,
      observations: repeatObservations,
      startupState: input.startup_state,
      now,
    });
    const contractErrors = validateImprovementCandidate(candidate);
    if (contractErrors.length > 0) {
      rejections.push(
        `invalid_candidate:${candidate.candidate_id}:${contractErrors.join(",")}`,
      );
      continue;
    }

    const creationGate = enforceCreationGate(candidate);
    if (!creationGate.allowed) {
      rejections.push(`${candidate.candidate_id}:${creationGate.reason}`);
      continue;
    }
    const budgetGate = canCreateCandidate(
      [...existingCandidates, ...generated.map((item) => item.candidate)],
      budgetPolicy,
      createdTodayCount,
    );
    if (!budgetGate.allowed) {
      rejections.push(`${candidate.candidate_id}:${budgetGate.reason}`);
      continue;
    }

    const dimensions = buildScoreDimensions(repeatObservations);
    const evidence = buildEvidenceGate(repeatObservations);
    const score = computeScoreResult(candidate, dimensions, scoreWeights, evidence);
    const transition = validateTransition(candidate.candidate_state, "validated");
    const validatedCandidate: ImprovementCandidate = transition.allowed
      ? { ...candidate, candidate_state: "validated" }
      : candidate;
    throwOnContractErrors(
      "improvement_candidate",
      validateImprovementCandidate(validatedCandidate),
    );

    const route = applyEvidenceAwareRoute(
      mapCandidateToBackboneRoute(validatedCandidate),
      score.evidence.classification,
    );

    generated.push({
      candidate: validatedCandidate,
      score,
      route,
      source_hard_signature: repeat.hard_signature,
      generated_at: now.toISOString(),
    });
    createdTodayCount += 1;
  }

  const mergedCandidates = mergeRankedCandidates(existingLedger.candidates, generated);
  const candidatePath = writeCandidateLedger(input.rootDir, input.business, mergedCandidates);

  const dashboard = buildDashboardSnapshot({
    observations: allObservations,
    ranked_candidates: mergedCandidates,
    wipCap: budgetPolicy.max_active_candidates,
  });

  const boundarySignals =
    input.boundary_signals ??
    deriveBoundarySignalSnapshotFromStartupState(input.startup_state).signals;
  const boundary = evaluateMatureBoundary(
    boundarySignals,
    input.boundary_thresholds ?? DEFAULT_MATURE_BOUNDARY_THRESHOLDS,
  );

  return {
    business: input.business,
    generated_at: now.toISOString(),
    startup_state_path: startupStatePath,
    candidate_path: candidatePath,
    observations_count: allObservations.length,
    repeat_candidates_detected: detectedRepeats.length,
    candidates_generated: generated.length,
    candidate_rejections: rejections,
    ranked_candidates: mergedCandidates,
    dashboard,
    boundary,
  };
}
