import type { RankedCandidate } from "./self-evolving-candidates.js";
import { getContainerContract } from "./self-evolving-containers.js";
import type {
  ImprovementOutcome,
  MetaObservation,
  PolicyDecisionRecord,
  PromotionGateContext,
  StartupState,
} from "./self-evolving-contracts.js";
import { stableHash } from "./self-evolving-contracts.js";
import type { PolicyEvaluationDataset } from "./self-evolving-evaluation.js";
import type { SelfEvolvingEvent } from "./self-evolving-events.js";
import { decideExperimentOutcome, type ExperimentDecisionPolicy } from "./self-evolving-experiment.js";

const PROMOTION_GATE_ESTIMATOR_VERSION = "promotion-gate.v1";

interface OutcomeProjection {
  event_id: string;
  outcome: ImprovementOutcome;
  timestamp: string;
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function parseContainerName(executorPath: string): string | null {
  const prefix = "lp-do-build:container:";
  if (!executorPath.startsWith(prefix)) {
    return null;
  }
  const containerName = executorPath.slice(prefix.length).trim();
  return containerName.length > 0 ? containerName : null;
}

function parseDurationHours(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const shorthand = value.match(/^(\d+)([dhm])$/i);
  if (shorthand) {
    const amount = Number.parseInt(shorthand[1] ?? "0", 10);
    const unit = shorthand[2]?.toLowerCase();
    if (unit === "d") return amount * 24;
    if (unit === "h") return amount;
    if (unit === "m") return amount / 60;
  }

  const rangeParts = value.split("/");
  if (rangeParts.length === 2) {
    const start = Date.parse(rangeParts[0] ?? "");
    const end = Date.parse(rangeParts[1] ?? "");
    if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
      return Number(((end - start) / (1000 * 60 * 60)).toFixed(6));
    }
  }

  return null;
}

function buildOutcomeProjectionMap(
  events: readonly SelfEvolvingEvent[],
): Map<string, OutcomeProjection> {
  const byDecisionId = new Map<string, OutcomeProjection>();
  for (const event of events) {
    const outcome = event.lifecycle?.outcome;
    if (!outcome?.decision_id) {
      continue;
    }
    const nextProjection: OutcomeProjection = {
      event_id: event.event_id,
      outcome,
      timestamp: event.timestamp,
    };
    const prior = byDecisionId.get(outcome.decision_id);
    if (!prior || Date.parse(nextProjection.timestamp) >= Date.parse(prior.timestamp)) {
      byDecisionId.set(outcome.decision_id, nextProjection);
    }
  }
  return byDecisionId;
}

function buildEvaluationMap(
  dataset: PolicyEvaluationDataset,
): Map<string, PolicyEvaluationDataset["records"][number]> {
  const byCandidateId = new Map<string, PolicyEvaluationDataset["records"][number]>();
  for (const record of dataset.records) {
    const prior = byCandidateId.get(record.candidate_id);
    const priorStamp = prior?.completed_at ?? prior?.decision_created_at ?? "";
    const nextStamp = record.completed_at ?? record.decision_created_at;
    if (!prior || Date.parse(nextStamp) >= Date.parse(priorStamp)) {
      byCandidateId.set(record.candidate_id, record);
    }
  }
  return byCandidateId;
}

function buildObservationMap(
  observations: readonly MetaObservation[],
): Map<string, MetaObservation> {
  return new Map(observations.map((observation) => [observation.observation_id, observation] as const));
}

function selectTargetObservation(input: {
  startup_state: StartupState;
  observations: readonly MetaObservation[];
}): MetaObservation | null {
  const primaryKpi =
    input.startup_state.kpi_definitions.find((definition) => definition.kind === "primary")?.name ??
    null;
  if (primaryKpi) {
    const primaryObservation =
      input.observations.find((observation) => observation.kpi_name === primaryKpi) ?? null;
    if (primaryObservation) {
      return primaryObservation;
    }
  }
  return input.observations[0] ?? null;
}

function buildExperimentPolicy(targetKpi: string): ExperimentDecisionPolicy {
  return {
    minimum_sample_size: 30,
    minimum_runtime_hours: 24,
    decision_method: "threshold",
    target_kpi: targetKpi,
    target_delta_threshold: 0,
    guardrail_kpis: [
      {
        name: "regressions_detected",
        min_allowed_delta: 0,
      },
    ],
    stop_conditions: ["missing_verified_measurement", "guardrail_breach"],
  };
}

function buildPromotionUtility(
  utility: PolicyDecisionRecord["utility"],
  chosenAction: "promote" | "revert" | "hold",
): PolicyDecisionRecord["utility"] {
  if (chosenAction === "hold") {
    return {
      ...utility,
      instability_penalty: Number((utility.instability_penalty + 0.15).toFixed(6)),
      net_utility: Number((utility.net_utility - 0.15).toFixed(6)),
    };
  }
  if (chosenAction === "revert") {
    return {
      ...utility,
      downside_penalty: Number((utility.downside_penalty + 0.35).toFixed(6)),
      net_utility: Number((utility.net_utility - 0.35).toFixed(6)),
    };
  }
  return utility;
}

function buildContext(input: {
  container_name: string | null;
  experiment_hook_contract: string | null;
  causal_status: PromotionGateContext["causal_status"];
  evaluation_status: PromotionGateContext["evaluation_status"];
  outcome_event_id: string | null;
  verified_observation_ids: string[];
  target_kpi: string | null;
  measured_impact: number | null;
  sample_size: number | null;
  runtime_hours: number | null;
  reason_code: string;
}): PromotionGateContext {
  return {
    schema_version: "promotion-gate.v1",
    estimator_version: PROMOTION_GATE_ESTIMATOR_VERSION,
    container_name: input.container_name,
    experiment_hook_contract: input.experiment_hook_contract,
    causal_status: input.causal_status,
    evaluation_status: input.evaluation_status,
    outcome_event_id: input.outcome_event_id,
    verified_observation_ids: [...input.verified_observation_ids].sort(compareStrings),
    target_kpi: input.target_kpi,
    measured_impact: input.measured_impact,
    sample_size: input.sample_size,
    runtime_hours: input.runtime_hours,
    reason_code: input.reason_code,
  };
}

function holdDecision(input: {
  base_decision: PolicyDecisionRecord;
  created_at: string;
  reason_code: string;
  container_name: string | null;
  experiment_hook_contract: string | null;
  evaluation_status: PromotionGateContext["evaluation_status"];
  verified_observation_ids?: string[];
  outcome_event_id?: string | null;
  target_kpi?: string | null;
  measured_impact?: number | null;
  sample_size?: number | null;
  runtime_hours?: number | null;
  causal_status: PromotionGateContext["causal_status"];
}): PolicyDecisionRecord {
  const context = buildContext({
    container_name: input.container_name,
    experiment_hook_contract: input.experiment_hook_contract,
    causal_status: input.causal_status,
    evaluation_status: input.evaluation_status,
    outcome_event_id: input.outcome_event_id ?? null,
    verified_observation_ids: input.verified_observation_ids ?? [],
    target_kpi: input.target_kpi ?? null,
    measured_impact: input.measured_impact ?? null,
    sample_size: input.sample_size ?? null,
    runtime_hours: input.runtime_hours ?? null,
    reason_code: input.reason_code,
  });
  return {
    ...input.base_decision,
    decision_id: stableHash(
      `${input.base_decision.decision_id}|${PROMOTION_GATE_ESTIMATOR_VERSION}|hold|${input.reason_code}`,
    ).slice(0, 16),
    decision_type: "promotion_gate",
    decision_mode: "deterministic",
    eligible_actions: ["promote", "revert", "hold"],
    chosen_action: "hold",
    action_probability: 1,
    utility: buildPromotionUtility(input.base_decision.utility, "hold"),
    portfolio_selection: null,
    exploration_rank: null,
    promotion_gate: context,
    created_at: input.created_at,
  };
}

export function buildPromotionGateDecisions(input: {
  startup_state: StartupState;
  ranked_candidates: readonly RankedCandidate[];
  route_decisions: readonly PolicyDecisionRecord[];
  evaluation_dataset: PolicyEvaluationDataset;
  observations: readonly MetaObservation[];
  lifecycle_events: readonly SelfEvolvingEvent[];
  created_at: string;
}): PolicyDecisionRecord[] {
  const routeDecisionByCandidateId = new Map(
    input.route_decisions
      .filter((decision) => decision.decision_type === "candidate_route")
      .map((decision) => [decision.candidate_id, decision] as const),
  );
  const evaluationByCandidateId = buildEvaluationMap(input.evaluation_dataset);
  const outcomeByDecisionId = buildOutcomeProjectionMap(input.lifecycle_events);
  const observationById = buildObservationMap(input.observations);

  return input.ranked_candidates.map((rankedCandidate) => {
    const baseDecision = routeDecisionByCandidateId.get(rankedCandidate.candidate.candidate_id);
    if (!baseDecision) {
      throw new Error(
        `promotion_gate_missing_route_decision:${rankedCandidate.candidate.candidate_id}`,
      );
    }

    const containerName = parseContainerName(rankedCandidate.candidate.executor_path);
    if (!containerName) {
      return holdDecision({
        base_decision: baseDecision,
        created_at: input.created_at,
        reason_code: "non_container_executor_path",
        container_name: null,
        experiment_hook_contract: null,
        evaluation_status: "none",
        causal_status: "ineligible",
      });
    }

    let experimentHookContract: string | null = null;
    try {
      experimentHookContract = getContainerContract(containerName).experiment_hook_contract;
    } catch {
      return holdDecision({
        base_decision: baseDecision,
        created_at: input.created_at,
        reason_code: "unknown_container_contract",
        container_name: containerName,
        experiment_hook_contract: null,
        evaluation_status: "none",
        causal_status: "ineligible",
      });
    }

    if (experimentHookContract === "none") {
      return holdDecision({
        base_decision: baseDecision,
        created_at: input.created_at,
        reason_code: "experiment_hook_contract_absent",
        container_name: containerName,
        experiment_hook_contract: experimentHookContract,
        evaluation_status: "none",
        causal_status: "ineligible",
      });
    }

    const evaluationRecord =
      evaluationByCandidateId.get(rankedCandidate.candidate.candidate_id) ?? null;
    if (!evaluationRecord) {
      return holdDecision({
        base_decision: baseDecision,
        created_at: input.created_at,
        reason_code: "no_evaluation_record",
        container_name: containerName,
        experiment_hook_contract: experimentHookContract,
        evaluation_status: "none",
        causal_status: "insufficient_data",
      });
    }

    if (evaluationRecord.evaluation_status !== "observed") {
      return holdDecision({
        base_decision: baseDecision,
        created_at: input.created_at,
        reason_code: `evaluation_status_${evaluationRecord.evaluation_status}`,
        container_name: containerName,
        experiment_hook_contract: experimentHookContract,
        evaluation_status: evaluationRecord.evaluation_status,
        verified_observation_ids: evaluationRecord.verified_observation_ids,
        outcome_event_id: evaluationRecord.outcome_event_id,
        causal_status: "insufficient_data",
      });
    }

    const outcomeProjection =
      outcomeByDecisionId.get(evaluationRecord.decision_id) ?? null;
    if (!outcomeProjection) {
      return holdDecision({
        base_decision: baseDecision,
        created_at: input.created_at,
        reason_code: "outcome_event_missing",
        container_name: containerName,
        experiment_hook_contract: experimentHookContract,
        evaluation_status: evaluationRecord.evaluation_status,
        verified_observation_ids: evaluationRecord.verified_observation_ids,
        causal_status: "insufficient_data",
      });
    }

    const verifiedObservations = evaluationRecord.verified_observation_ids
      .map((observationId) => observationById.get(observationId) ?? null)
      .filter((observation): observation is MetaObservation => observation != null);
    const targetObservation = selectTargetObservation({
      startup_state: input.startup_state,
      observations: verifiedObservations,
    });
    const runtimeHours =
      parseDurationHours(targetObservation?.measurement_window) ??
      parseDurationHours(outcomeProjection.outcome.post_window) ??
      parseDurationHours(outcomeProjection.outcome.baseline_window);

    if (!targetObservation || targetObservation.kpi_name == null) {
      return holdDecision({
        base_decision: baseDecision,
        created_at: input.created_at,
        reason_code: "target_observation_missing",
        container_name: containerName,
        experiment_hook_contract: experimentHookContract,
        evaluation_status: evaluationRecord.evaluation_status,
        verified_observation_ids: evaluationRecord.verified_observation_ids,
        outcome_event_id: outcomeProjection.event_id,
        causal_status: "insufficient_data",
      });
    }

    if (
      typeof targetObservation.sample_size !== "number" ||
      targetObservation.data_quality_status == null ||
      runtimeHours == null
    ) {
      return holdDecision({
        base_decision: baseDecision,
        created_at: input.created_at,
        reason_code: "target_observation_incomplete",
        container_name: containerName,
        experiment_hook_contract: experimentHookContract,
        evaluation_status: evaluationRecord.evaluation_status,
        verified_observation_ids: evaluationRecord.verified_observation_ids,
        outcome_event_id: outcomeProjection.event_id,
        target_kpi: targetObservation.kpi_name,
        measured_impact: outcomeProjection.outcome.measured_impact,
        sample_size: targetObservation.sample_size ?? null,
        runtime_hours: runtimeHours,
        causal_status: "insufficient_data",
      });
    }

    if (
      outcomeProjection.outcome.implementation_status === "failed" ||
      outcomeProjection.outcome.implementation_status === "reverted"
    ) {
      const reasonCode = `implementation_status_${outcomeProjection.outcome.implementation_status}`;
      return {
        ...baseDecision,
        decision_id: stableHash(
          `${baseDecision.decision_id}|${PROMOTION_GATE_ESTIMATOR_VERSION}|revert|${reasonCode}`,
        ).slice(0, 16),
        decision_type: "promotion_gate",
        decision_mode: "deterministic",
        eligible_actions: ["promote", "revert", "hold"],
        chosen_action: "revert",
        action_probability: 1,
        utility: buildPromotionUtility(baseDecision.utility, "revert"),
        portfolio_selection: null,
        exploration_rank: null,
        promotion_gate: buildContext({
          container_name: containerName,
          experiment_hook_contract: experimentHookContract,
          causal_status: "evaluated",
          evaluation_status: evaluationRecord.evaluation_status,
          outcome_event_id: outcomeProjection.event_id,
          verified_observation_ids: evaluationRecord.verified_observation_ids,
          target_kpi: targetObservation.kpi_name,
          measured_impact: outcomeProjection.outcome.measured_impact,
          sample_size: targetObservation.sample_size,
          runtime_hours: runtimeHours,
          reason_code: reasonCode,
        }),
        created_at: input.created_at,
      };
    }

    const experimentPolicy = buildExperimentPolicy(targetObservation.kpi_name);
    const experimentDecision = decideExperimentOutcome(
      experimentPolicy,
      {
        kpi_name: targetObservation.kpi_name,
        delta: outcomeProjection.outcome.measured_impact,
        sample_size: targetObservation.sample_size,
        runtime_hours: runtimeHours,
        data_quality_status: targetObservation.data_quality_status,
      },
      [
        {
          kpi_name: "regressions_detected",
          delta: outcomeProjection.outcome.regressions_detected === 0
            ? 0
            : -outcomeProjection.outcome.regressions_detected,
          sample_size: targetObservation.sample_size,
          runtime_hours: runtimeHours,
          data_quality_status: targetObservation.data_quality_status,
        },
      ],
    );
    const chosenAction =
      experimentDecision.action === "keep"
        ? "promote"
        : experimentDecision.action === "revert"
          ? "revert"
          : "hold";

    return {
      ...baseDecision,
      decision_id: stableHash(
        `${baseDecision.decision_id}|${PROMOTION_GATE_ESTIMATOR_VERSION}|${chosenAction}|${experimentDecision.reason}`,
      ).slice(0, 16),
      decision_type: "promotion_gate",
      decision_mode: "deterministic",
      eligible_actions: ["promote", "revert", "hold"],
      chosen_action: chosenAction,
      action_probability: 1,
      utility: buildPromotionUtility(baseDecision.utility, chosenAction),
      portfolio_selection: null,
      exploration_rank: null,
      promotion_gate: buildContext({
        container_name: containerName,
        experiment_hook_contract: experimentHookContract,
        causal_status: "evaluated",
        evaluation_status: evaluationRecord.evaluation_status,
        outcome_event_id: outcomeProjection.event_id,
        verified_observation_ids: evaluationRecord.verified_observation_ids,
        target_kpi: targetObservation.kpi_name,
        measured_impact: outcomeProjection.outcome.measured_impact,
        sample_size: targetObservation.sample_size,
        runtime_hours: runtimeHours,
        reason_code: experimentDecision.reason,
      }),
      created_at: input.created_at,
    };
  });
}

export function buildPromotionGateDataset(input: {
  decisions: readonly PolicyDecisionRecord[];
}): {
  total: number;
  promote: number;
  revert: number;
  hold: number;
} {
  let promote = 0;
  let revert = 0;
  let hold = 0;
  for (const decision of input.decisions) {
    if (decision.decision_type !== "promotion_gate") {
      continue;
    }
    if (decision.chosen_action === "promote") promote += 1;
    if (decision.chosen_action === "revert") revert += 1;
    if (decision.chosen_action === "hold") hold += 1;
  }
  return {
    total: promote + revert + hold,
    promote,
    revert,
    hold,
  };
}
