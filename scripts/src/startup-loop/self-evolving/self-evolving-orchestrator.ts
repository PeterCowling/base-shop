import path from "node:path";

import { readQueueStateFile } from "../ideas/lp-do-ideas-queue-state-file.js";

import { promotionActuationEnabled } from "./self-evolving-authority.js";
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
  type PolicyDecisionRecord,
  stableHash,
  type StartupState,
  throwOnContractErrors,
  validateImprovementCandidate,
} from "./self-evolving-contracts.js";
import { buildDashboardSnapshot } from "./self-evolving-dashboard.js";
import {
  buildDependencyGraphSnapshot,
  writeDependencyGraphSnapshot,
} from "./self-evolving-dependency-graph.js";
import {
  detectRepeatWorkCandidates,
  type RepeatWorkCandidate,
  type RepeatWorkDetectorConfig,
} from "./self-evolving-detector.js";
import { buildPolicyEvaluationDataset } from "./self-evolving-evaluation.js";
import {
  appendObservationAsEvent,
  appendSelfEvolvingEvent,
  createLifecycleEvent,
  readMetaObservations,
  readSelfEvolvingEvents,
} from "./self-evolving-events.js";
import { deriveCandidateEvidencePosture } from "./self-evolving-evidence-posture.js";
import { buildExplorationDecisionLayer } from "./self-evolving-exploration.js";
import {
  governExplorationSelections,
  governPortfolioSelections,
  governRouteDecisions,
} from "./self-evolving-governance.js";
import {
  canCreateCandidate,
  type CandidateBudgetPolicy,
  enforceCreationGate,
  validateTransition,
} from "./self-evolving-lifecycle.js";
import { buildPolicyAuditTelemetry } from "./self-evolving-policy-audit.js";
import { buildPortfolioSelection } from "./self-evolving-portfolio.js";
import { buildPromotionGateDecisions } from "./self-evolving-promotion-gate.js";
import {
  assessEvidenceProfile,
  buildPolicyDecisionRecord,
  buildStructuralFeatureSnapshot,
  type CandidateEvidenceGate,
  type CandidateOutcomeSignal,
  computeScoreResult,
  createDefaultPolicyState,
  deriveCandidateBeliefState,
  deriveCandidateRoutingSemantics,
  POLICY_VERSION,
  type PolicyScoreInput,
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
  appendPolicyDecisionJournal,
  createStartupStateStore,
  readPolicyDecisionJournal,
  readPolicyState,
  writePolicyState,
  writeStartupState,
} from "./self-evolving-startup-state.js";
import { buildSurvivalPolicySignals } from "./self-evolving-survival.js";

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

function resolveTrialQueueStatePath(rootDir: string): string {
  return path.join(
    rootDir,
    "docs",
    "business-os",
    "startup-loop",
    "ideas",
    "trial",
    "queue-state.json",
  );
}

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
  posture: ReturnType<typeof deriveCandidateEvidencePosture>,
  evidenceClassification: ReturnType<typeof computeScoreResult>["evidence"]["classification"],
): ReturnType<typeof mapCandidateToBackboneRoute> {
  if (route.route === "reject" || route.route === "lp-do-fact-find") {
    return route;
  }
  if (posture.grade === "exploratory") {
    return {
      route: "lp-do-fact-find",
      reason: "evidence_posture_exploratory_fact_find_only",
    };
  }
  if (!posture.stronger_route_eligible) {
    return {
      route: "lp-do-fact-find",
      reason: "evidence_posture_structural_fact_find_only",
    };
  }
  if (evidenceClassification === "measured") {
    return route;
  }
  return {
    route: "lp-do-fact-find",
    reason: `evidence_fields_${evidenceClassification}_require_fact_find`,
  };
}

function applyLearnedPrescriptionRouting(input: {
  candidate: ImprovementCandidate;
  base_route: ReturnType<typeof mapCandidateToBackboneRoute>;
}): {
  route: ReturnType<typeof mapCandidateToBackboneRoute>;
  semantics: ReturnType<typeof deriveCandidateRoutingSemantics>;
} {
  const semantics = deriveCandidateRoutingSemantics(input.candidate);
  let route = input.base_route;

  if (semantics.prescription_maturity === "retired") {
    route =
      semantics.requirement_posture === "absolute_required"
        ? { route: "lp-do-fact-find", reason: "retired_prescription_requires_new_fact_find" }
        : { route: "reject", reason: "prescription_retired" };
  } else if (
    semantics.prescription_maturity === "unknown" ||
    semantics.prescription_maturity === "hypothesized"
  ) {
    route = {
      route: "lp-do-fact-find",
      reason: `prescription_${semantics.prescription_maturity}_requires_fact_find`,
    };
  } else if (route.route === "reject" && semantics.requirement_posture === "absolute_required") {
    route = {
      route: "lp-do-fact-find",
      reason:
        semantics.blocking_scope === "blocks_stage"
          ? "absolute_required_stage_blocker_requires_fact_find"
          : "absolute_required_requires_fact_find",
    };
  }

  return { route, semantics };
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
  const prescriptionMaturity: ImprovementCandidate["prescription_maturity"] =
    candidateType === "new_skill"
      ? "unknown"
      : candidateType === "container_update" || candidateType === "deterministic_extraction"
        ? "structured"
        : "hypothesized";
  const requiredRoute =
    candidateType === "container_update"
      ? "lp-do-build"
      : candidateType === "deterministic_extraction" || candidateType === "skill_refactor"
        ? "lp-do-plan"
        : "lp-do-fact-find";

  return {
    schema_version: "candidate.v1",
    candidate_id: candidateId,
    gap_case: {
      schema_version: "gap-case.v1",
      gap_case_id: stableHash(`${candidateId}|gap-case`).slice(0, 16),
      source_kind: "self_evolving",
      business_id: input.business,
      stage_id: input.startupState.stage,
      capability_id: null,
      gap_type: `repeat_${candidateType}`,
      reason_code: "repeat_work_detected",
      severity: Math.min(
        1,
        Math.max(...input.observations.map((observation) => observation.severity), 0),
      ),
      evidence_refs: Array.from(
        new Set(
          input.observations.flatMap((observation) => observation.evidence_refs ?? []),
        ),
      ),
      recurrence_key: input.repeat.hard_signature,
      requirement_posture: "relative_required",
      blocking_scope: "degrades_quality",
      structural_context: {
        hard_signature: input.repeat.hard_signature,
        recurrence_count: input.repeat.recurrence_count,
        observation_count: input.observations.length,
      },
      runtime_binding: {
        binding_mode: "compiled_to_candidate",
        candidate_id: candidateId,
      },
    },
    prescription: {
      schema_version: "prescription.v1",
      prescription_id: stableHash(`${candidateId}|prescription`).slice(0, 16),
      prescription_family: `self_evolving_${candidateType}`,
      source: "self_evolving",
      gap_types_supported: [`repeat_${candidateType}`],
      required_route: requiredRoute,
      required_inputs: ["self-evolving observations"],
      expected_artifacts:
        requiredRoute === "lp-do-build"
          ? ["micro-build.md"]
          : requiredRoute === "lp-do-plan"
            ? ["plan.md"]
            : ["fact-find.md"],
      expected_signal_change:
        candidateType === "new_skill"
          ? "Research the unknown repeat-work remedy and mature it into a structured prescription."
          : "Reduce repeated operator/manual workflow load for this recurring signature.",
      risk_class: candidateType === "container_update" ? "medium" : "low",
      maturity: prescriptionMaturity,
    },
    candidate_type: candidateType,
    requirement_posture: "relative_required",
    blocking_scope: "degrades_quality",
    prescription_maturity: prescriptionMaturity,
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

function collectOutcomeSignals(
  candidateId: string,
  events: ReturnType<typeof readSelfEvolvingEvents>,
): CandidateOutcomeSignal[] {
  return events
    .filter(
      (event) =>
        event.event_type === "outcome_recorded" &&
        event.lifecycle?.candidate_id === candidateId &&
        event.lifecycle.outcome != null,
    )
    .map((event) => ({
      event_id: event.event_id,
      timestamp: event.timestamp,
      outcome: event.lifecycle?.outcome as CandidateOutcomeSignal["outcome"],
    }));
}

function buildPolicyScoreInput(input: {
  business: string;
  startupState: StartupState;
  candidate: ImprovementCandidate;
  routeHint: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
  generatedAt: string;
  policyState: ReturnType<typeof createDefaultPolicyState>;
  outcomeSignals: readonly CandidateOutcomeSignal[];
}): PolicyScoreInput {
  return {
    business_id: input.business,
    startup_stage: input.startupState.stage,
    route_hint: input.routeHint,
    candidate_belief:
      input.policyState.candidate_beliefs[input.candidate.candidate_id] ?? null,
    outcome_signals: input.outcomeSignals,
    captured_at: input.generatedAt,
  };
}

function buildRankedCandidate(input: {
  business: string;
  startupState: StartupState;
  candidate: ImprovementCandidate;
  source_hard_signature: string;
  observations: MetaObservation[];
  scoreWeights: ScoreWeights;
  policyState: ReturnType<typeof createDefaultPolicyState>;
  outcomeSignals: readonly CandidateOutcomeSignal[];
  generatedAt: string;
}): {
  ranked: RankedCandidate;
  nextBelief: ReturnType<typeof createDefaultPolicyState>["candidate_beliefs"][string];
  decision: ReturnType<typeof buildPolicyDecisionRecord>;
} {
  const dimensions = buildScoreDimensions(input.observations);
  const evidence = buildEvidenceGate(input.observations);
  const evidenceProfile = assessEvidenceProfile(evidence);
  const posture = deriveCandidateEvidencePosture(
    input.observations,
    evidence.minimum_sample_size,
  );
  const mappedRoute = mapCandidateToBackboneRoute(input.candidate);
  const routeHint =
    mappedRoute.route === "reject" ? "lp-do-fact-find" : mappedRoute.route;
  const structuralSnapshot = buildStructuralFeatureSnapshot({
    business_id: input.business,
    candidate: input.candidate,
    startup_stage: input.startupState.stage,
    route_hint: routeHint,
    evidence_classification: evidenceProfile.classification,
    evidence_grade:
      evidenceProfile.classification === "measured"
        ? "measured"
        : evidenceProfile.classification === "insufficient"
          ? null
          : "structural",
    recurrence_count_window: input.observations.length,
    operator_minutes_estimate: Math.round(dimensions.operator_time_score * 10),
    quality_impact_estimate: dimensions.quality_risk_reduction_score / 5,
    captured_at: input.generatedAt,
  });
  const beliefState = deriveCandidateBeliefState({
    candidate: input.candidate,
    structural_snapshot: structuralSnapshot,
    evidence: evidenceProfile,
    policy_input: buildPolicyScoreInput({
      business: input.business,
      startupState: input.startupState,
      candidate: input.candidate,
      routeHint,
      generatedAt: input.generatedAt,
      policyState: input.policyState,
      outcomeSignals: input.outcomeSignals,
    }),
  });
  const score = computeScoreResult(
    input.candidate,
    dimensions,
    input.scoreWeights,
    evidence,
    buildPolicyScoreInput({
      business: input.business,
      startupState: input.startupState,
      candidate: input.candidate,
      routeHint,
      generatedAt: input.generatedAt,
      policyState: input.policyState,
      outcomeSignals: input.outcomeSignals,
    }),
  );
  const route = applyEvidenceAwareRoute(
    mappedRoute,
    posture,
    score.evidence.classification,
  );
  const routed = applyLearnedPrescriptionRouting({
    candidate: input.candidate,
    base_route: route,
  });
  const decision = buildPolicyDecisionRecord({
    business_id: input.business,
    candidate_id: input.candidate.candidate_id,
    gap_case: input.candidate.gap_case ?? null,
    prescription: input.candidate.prescription ?? null,
    chosen_action: routed.route.route,
    created_at: input.generatedAt,
    structural_snapshot: structuralSnapshot,
    belief_state: beliefState,
    utility: score.utility,
    routing_semantics: routed.semantics,
  });

  const nextBelief = {
    ...beliefState,
    last_decision_id: decision.decision_id,
    updated_at: input.generatedAt,
  };

  return {
    ranked: {
      candidate: input.candidate,
      score,
      route: routed.route,
      source_hard_signature: input.source_hard_signature,
      generated_at: input.generatedAt,
      policy_context: {
        decision_id: decision.decision_id,
        decision_context_id: decision.decision_context_id,
        policy_version: decision.policy_version,
        utility_version: decision.utility_version,
        prior_family_version: decision.prior_family_version,
        belief_state_id: decision.belief_state_id,
        structural_snapshot_id: structuralSnapshot.snapshot_id,
      },
    },
    nextBelief,
    decision,
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
  policy_state_path: string;
  policy_decision_path: string;
  dependency_graph_path: string | null;
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
  const generatedAt = now.toISOString();
  const detectorConfig = input.detector_config ?? DEFAULT_DETECTOR_CONFIG;
  const scoreWeights = input.score_weights ?? DEFAULT_SCORE_WEIGHTS;
  const budgetPolicy = input.budget_policy ?? DEFAULT_BUDGET_POLICY;

  const store = createStartupStateStore(input.rootDir);
  const startupStatePath = writeStartupState(store, input.startup_state);
  const priorPolicyState =
    readPolicyState(store, input.business) ?? createDefaultPolicyState(input.business, generatedAt);

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
  const allEvents = readSelfEvolvingEvents(input.rootDir, input.business);
  const detectedRepeats = detectRepeatWorkCandidates(
    allObservations,
    detectorConfig,
    { now },
  ).filter((candidate) => !candidate.dropped_by_cooldown);

  const existingLedger = readCandidateLedger(input.rootDir, input.business);
  const existingCandidates = existingLedger.candidates.map((item) => item.candidate);
  const existingCandidateIds = new Set(existingCandidates.map((candidate) => candidate.candidate_id));

  const generatedSeeds: RankedCandidate[] = [];
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
      [...existingCandidates, ...generatedSeeds.map((item) => item.candidate)],
      budgetPolicy,
      createdTodayCount,
    );
    if (!budgetGate.allowed) {
      rejections.push(`${candidate.candidate_id}:${budgetGate.reason}`);
      continue;
    }

    const transition = validateTransition(candidate.candidate_state, "validated");
    const validatedCandidate: ImprovementCandidate = transition.allowed
      ? { ...candidate, candidate_state: "validated" }
      : candidate;
    throwOnContractErrors(
      "improvement_candidate",
      validateImprovementCandidate(validatedCandidate),
    );

    generatedSeeds.push({
      candidate: validatedCandidate,
      score: computeScoreResult(
        validatedCandidate,
        buildScoreDimensions(repeatObservations),
        scoreWeights,
        buildEvidenceGate(repeatObservations),
      ),
      route: { route: "lp-do-fact-find", reason: "seed_candidate_before_policy_recompute" },
      source_hard_signature: repeat.hard_signature,
      generated_at: generatedAt,
    });
    createdTodayCount += 1;
  }

  const mergedCandidates = mergeRankedCandidates(existingLedger.candidates, generatedSeeds);
  const nextPolicyState = {
    ...priorPolicyState,
    candidate_beliefs: { ...priorPolicyState.candidate_beliefs },
    updated_at: generatedAt,
    updated_by: "self-evolving-orchestrator",
    policy_version: POLICY_VERSION,
    utility_version: "self-evolving-utility.v1",
    prior_family_version: "self-evolving-priors.v1",
  };
  const priorPolicyDecisions = readPolicyDecisionJournal(store, input.business);
  const decisionsBefore = priorPolicyDecisions.length;
  const routePolicyDecisions: ReturnType<typeof buildPolicyDecisionRecord>[] = [];

  const rerankedCandidates = mergedCandidates.map((entry) => {
    const candidateObservations = allObservations.filter(
      (observation) =>
        observation.hard_signature === entry.source_hard_signature ||
        entry.candidate.trigger_observations.includes(observation.observation_id),
    );
    const outcomeSignals = collectOutcomeSignals(entry.candidate.candidate_id, allEvents);
    const rebuilt = buildRankedCandidate({
      business: input.business,
      startupState: input.startup_state,
      candidate: entry.candidate,
      source_hard_signature: entry.source_hard_signature,
      observations: candidateObservations,
      scoreWeights,
      policyState: nextPolicyState,
      outcomeSignals,
      generatedAt,
    });
    nextPolicyState.candidate_beliefs[entry.candidate.candidate_id] = rebuilt.nextBelief;
    routePolicyDecisions.push(rebuilt.decision);
    return rebuilt.ranked;
  });

  const governedRouteLayer = governRouteDecisions({
    ranked_candidates: rerankedCandidates,
    route_decisions: routePolicyDecisions,
    prior_policy_decisions: priorPolicyDecisions,
    policy_state: nextPolicyState,
    startup_state: input.startup_state,
    created_at: generatedAt,
  });
  const governedRankedCandidates = governedRouteLayer.ranked_candidates;
  const governedRouteDecisions = governedRouteLayer.decision_records;

  const queueStateResult = readQueueStateFile(resolveTrialQueueStatePath(input.rootDir));
  const queueDispatches = queueStateResult.ok ? queueStateResult.queue.dispatches : [];
  const historicalEvaluation = buildPolicyEvaluationDataset({
    decisions: priorPolicyDecisions,
    queue_dispatches: queueDispatches,
    lifecycle_events: allEvents,
    now,
  });
  const survivalSignals = buildSurvivalPolicySignals({
    evaluation_dataset: historicalEvaluation,
    hold_window_days: nextPolicyState.active_constraint_profile.hold_window_days,
  });
  const dependencyGraph = buildDependencyGraphSnapshot({
    business_id: input.business,
    ranked_candidates: governedRankedCandidates,
    policy_decisions: governedRouteDecisions,
    generated_at: generatedAt,
    snapshot_id: stableHash(`${input.business}|${generatedAt}|dependency-graph`).slice(0, 16),
  });
  const portfolioSelection = buildPortfolioSelection({
    business_id: input.business,
    ranked_candidates: governedRankedCandidates,
    candidate_route_decisions: governedRouteDecisions,
    constraint_profile: nextPolicyState.active_constraint_profile,
    dependency_graph: dependencyGraph,
    survival_signals: survivalSignals,
    created_at: generatedAt,
  });
  const governedPortfolioLayer = governPortfolioSelections({
    ranked_candidates: governedRankedCandidates,
    decision_records: portfolioSelection.decision_records,
    prior_policy_decisions: priorPolicyDecisions,
    policy_state: nextPolicyState,
    created_at: generatedAt,
  });
  const portfolioDecisionByCandidateId = new Map(
    governedPortfolioLayer.decision_records.map((decision) => [decision.candidate_id, decision] as const),
  );
  const explorationLayer = buildExplorationDecisionLayer({
    business_id: input.business,
    ranked_candidates: governedRankedCandidates,
    portfolio_decisions: governedPortfolioLayer.decision_records,
    policy_state: nextPolicyState,
    created_at: generatedAt,
  });
  const governedExplorationLayer = governExplorationSelections({
    decision_records: explorationLayer.decision_records,
    prior_policy_decisions: priorPolicyDecisions,
    policy_state: nextPolicyState,
    selected_candidate_ids: governedPortfolioLayer.selected_candidate_ids,
    created_at: generatedAt,
  });
  const explorationDecisionByCandidateId = new Map(
    governedExplorationLayer.decision_records.map((decision) => [decision.candidate_id, decision] as const),
  );
  const portfolioAnnotatedCandidates = governedRankedCandidates.map((rankedCandidate) => {
    const portfolioDecision = portfolioDecisionByCandidateId.get(
      rankedCandidate.candidate.candidate_id,
    );
    const explorationDecision = explorationDecisionByCandidateId.get(
      rankedCandidate.candidate.candidate_id,
    );
    return {
      ...rankedCandidate,
      policy_context: rankedCandidate.policy_context
        ? {
            ...rankedCandidate.policy_context,
            portfolio_decision_id: portfolioDecision?.decision_id ?? null,
            portfolio_selected: governedPortfolioLayer.selected_candidate_ids.has(
              rankedCandidate.candidate.candidate_id,
            ),
            portfolio_selected_at: generatedAt,
            portfolio_adjusted_utility:
              portfolioDecision?.portfolio_selection?.signal_snapshot.adjusted_utility ??
              null,
            exploration_decision_id: explorationDecision?.decision_id ?? null,
            exploration_mode: explorationDecision?.exploration_rank?.policy_mode ?? null,
            exploration_selected: explorationDecision?.chosen_action === "prioritized",
            exploration_selected_at: generatedAt,
            exploration_priority_score:
              explorationDecision?.exploration_rank?.signal_snapshot.exploration_score ??
              null,
            exploration_applied: explorationLayer.applied,
          }
        : rankedCandidate.policy_context,
    };
  });
  const promotionGateDecisions = buildPromotionGateDecisions({
    startup_state: input.startup_state,
    ranked_candidates: portfolioAnnotatedCandidates,
    route_decisions: governedRouteDecisions,
    evaluation_dataset: historicalEvaluation,
    observations: allObservations,
    lifecycle_events: allEvents,
    created_at: generatedAt,
  });
  const promotionGateDecisionByCandidateId = new Map(
    promotionGateDecisions.map((decision) => [decision.candidate_id, decision] as const),
  );
  const allowPromotionActuation = promotionActuationEnabled(
    nextPolicyState.authority_level,
  );
  const fullyAnnotatedCandidates = portfolioAnnotatedCandidates.map((rankedCandidate) => {
    const promotionGateDecision = promotionGateDecisionByCandidateId.get(
      rankedCandidate.candidate.candidate_id,
    );
    const promotionGateAction: "promote" | "revert" | "hold" | null =
      promotionGateDecision?.chosen_action === "promote" ||
      promotionGateDecision?.chosen_action === "revert" ||
      promotionGateDecision?.chosen_action === "hold"
        ? promotionGateDecision.chosen_action
        : null;
    return {
      ...rankedCandidate,
      policy_context: rankedCandidate.policy_context
        ? {
            ...rankedCandidate.policy_context,
            promotion_gate_decision_id: allowPromotionActuation
              ? (promotionGateDecision?.decision_id ?? null)
              : null,
            promotion_gate_action: allowPromotionActuation ? promotionGateAction : null,
            promotion_gate_reason: allowPromotionActuation
              ? (promotionGateDecision?.promotion_gate?.reason_code ?? null)
              : null,
          }
        : rankedCandidate.policy_context,
    };
  });
  const overrideRecords: PolicyDecisionRecord[] = [
    ...governedRouteLayer.override_records,
    ...governedPortfolioLayer.override_records,
    ...governedExplorationLayer.override_records,
  ];
  for (const [candidateId, belief] of Object.entries(nextPolicyState.candidate_beliefs)) {
    const governedRouteDecision = governedRouteDecisions.find(
      (decision) => decision.candidate_id === candidateId,
    );
    if (governedRouteDecision) {
      belief.last_decision_id = governedRouteDecision.decision_id;
    }
    const lastOverride = [...overrideRecords]
      .reverse()
      .find((record) => record.candidate_id === candidateId);
    if (lastOverride) {
      belief.last_override_id = lastOverride.decision_id;
    }
    belief.updated_at = generatedAt;
  }
  const policyDecisions: PolicyDecisionRecord[] = [
    ...governedRouteDecisions,
    ...governedPortfolioLayer.decision_records,
    ...governedExplorationLayer.decision_records,
    ...promotionGateDecisions,
    ...overrideRecords,
  ];

  if (policyDecisions.length > 0) {
    nextPolicyState.last_decision_id = policyDecisions[policyDecisions.length - 1]?.decision_id ?? null;
  }

  const dashboardEvaluation = buildPolicyEvaluationDataset({
    decisions: [...priorPolicyDecisions, ...policyDecisions],
    queue_dispatches: queueDispatches,
    lifecycle_events: allEvents,
    now,
  });
  const policyAudit = buildPolicyAuditTelemetry({
    decisions: [...priorPolicyDecisions, ...policyDecisions],
    evaluation_dataset: dashboardEvaluation,
    generated_at: generatedAt,
  });

  for (const candidate of generatedSeeds) {
    if (existingCandidateIds.has(candidate.candidate.candidate_id)) {
      continue;
    }
    appendSelfEvolvingEvent(
      input.rootDir,
      input.business,
      createLifecycleEvent({
        correlation_id: candidate.candidate.candidate_id,
        event_type: "candidate_generated",
        lifecycle: {
          candidate_id: candidate.candidate.candidate_id,
        },
        run_id: input.run_id,
        session_id: input.session_id,
        source_component: "self-evolving-orchestrator",
        timestamp: generatedAt,
        artifact_refs: [
          "docs/business-os/startup-loop/self-evolving",
        ],
      }),
    );
  }

  const candidatePath = writeCandidateLedger(
    input.rootDir,
    input.business,
    fullyAnnotatedCandidates,
  );
  const policyStatePath = writePolicyState(store, nextPolicyState);
  const policyDecisionPath = appendPolicyDecisionJournal(
    store,
    input.business,
    policyDecisions,
  );
  const dependencyGraphPath = dependencyGraph
    ? writeDependencyGraphSnapshot(input.rootDir, dependencyGraph)
    : null;

  const dashboard = buildDashboardSnapshot({
    observations: allObservations,
    ranked_candidates: fullyAnnotatedCandidates,
    wipCap: budgetPolicy.max_active_candidates,
    policy_state: nextPolicyState,
    decision_records_count: decisionsBefore + policyDecisions.length,
    policy_decisions: policyDecisions,
    evaluation_summary: dashboardEvaluation.summary,
    policy_audit: policyAudit,
    dependency_graph: dependencyGraph,
    survival_signals: survivalSignals,
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
    generated_at: generatedAt,
    startup_state_path: startupStatePath,
    candidate_path: candidatePath,
    policy_state_path: policyStatePath,
    policy_decision_path: policyDecisionPath,
    dependency_graph_path: dependencyGraphPath,
    observations_count: allObservations.length,
    repeat_candidates_detected: detectedRepeats.length,
    candidates_generated: generatedSeeds.length,
    candidate_rejections: rejections,
    ranked_candidates: fullyAnnotatedCandidates,
    dashboard,
    boundary,
  };
}
