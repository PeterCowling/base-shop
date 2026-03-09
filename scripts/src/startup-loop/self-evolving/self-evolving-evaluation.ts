import type { QueueDispatch } from "../ideas/lp-do-ideas-queue-state-file.js";

import type {
  ImprovementOutcome,
  OutcomeMissingRecord,
  PolicyDecisionMode,
  PolicyDecisionRecord,
} from "./self-evolving-contracts.js";
import type { SelfEvolvingEvent } from "./self-evolving-events.js";

export type PolicyEvaluationStatus = "observed" | "pending" | "censored" | "missing";

export interface PolicyEvaluationRecord {
  schema_version: "policy-evaluation.v1";
  decision_id: string;
  decision_context_id: string;
  business_id: string;
  candidate_id: string;
  policy_version: string;
  utility_version: string;
  decision_mode: PolicyDecisionMode;
  chosen_action: string;
  eligible_actions: string[];
  action_probability: number | null;
  dispatch_id: string | null;
  queue_state: string | null;
  completed_at: string | null;
  maturity_due_at: string | null;
  maturity_status: ImprovementOutcome["maturity_status"] | null;
  measurement_status: NonNullable<ImprovementOutcome["measurement_status"]> | null;
  evaluation_status: PolicyEvaluationStatus;
  evaluation_ready: boolean;
  outcome_event_id: string | null;
  verified_observation_ids: string[];
  outcome_reason_code: string | null;
  outcome_source_path: string | null;
  linked_dispatch_count: number;
  recorded_at: string;
}

export interface PolicyEvaluationSummary {
  total_decisions: number;
  observed_decisions: number;
  pending_decisions: number;
  censored_decisions: number;
  missing_decisions: number;
  replay_ready_decisions: number;
  deterministic_decisions: number;
  stochastic_decisions: number;
  policy_version_counts: Record<string, number>;
}

export interface PolicyEvaluationDataset {
  schema_version: "policy-evaluation-dataset.v1";
  generated_at: string;
  records: PolicyEvaluationRecord[];
  summary: PolicyEvaluationSummary;
}

interface OutcomeEventProjection {
  event_id: string;
  dispatch_id: string | null;
  measurement_status: NonNullable<ImprovementOutcome["measurement_status"]> | null;
  maturity_status: ImprovementOutcome["maturity_status"] | null;
  completed_at: string;
  outcome_source_path: string | null;
  evaluation_status: PolicyEvaluationStatus;
}

function nonEmptyString(input: unknown): input is string {
  return typeof input === "string" && input.trim().length > 0;
}

function readDispatchDecisionId(dispatch: QueueDispatch): string | null {
  if (nonEmptyString(dispatch.self_evolving?.decision_id)) {
    return dispatch.self_evolving.decision_id;
  }
  if (nonEmptyString(dispatch.processed_by?.self_evolving?.decision_id)) {
    return dispatch.processed_by.self_evolving.decision_id;
  }
  if (nonEmptyString(dispatch.completed_by?.self_evolving?.decision_id)) {
    return dispatch.completed_by.self_evolving.decision_id;
  }
  return null;
}

function selectBestDispatch(dispatches: readonly QueueDispatch[]): QueueDispatch | null {
  if (dispatches.length === 0) {
    return null;
  }
  return [...dispatches].sort((left, right) => {
    const leftRank =
      left.completed_by?.self_evolving
        ? 2
        : left.self_evolving || left.processed_by?.self_evolving
          ? 1
          : 0;
    const rightRank =
      right.completed_by?.self_evolving
        ? 2
        : right.self_evolving || right.processed_by?.self_evolving
          ? 1
          : 0;
    if (leftRank !== rightRank) {
      return rightRank - leftRank;
    }

    const leftTimestamp =
      left.completed_by?.completed_at ?? left.created_at ?? "1970-01-01T00:00:00.000Z";
    const rightTimestamp =
      right.completed_by?.completed_at ?? right.created_at ?? "1970-01-01T00:00:00.000Z";
    return Date.parse(rightTimestamp) - Date.parse(leftTimestamp);
  })[0] ?? null;
}

function classifyOutcomeStatus(input: {
  maturity_status: ImprovementOutcome["maturity_status"] | null | undefined;
  measurement_status: ImprovementOutcome["measurement_status"] | null | undefined;
}): PolicyEvaluationStatus {
  if (input.maturity_status === "pending") {
    return "pending";
  }
  if (
    input.measurement_status === "verified" ||
    input.measurement_status === "verified_degraded"
  ) {
    return "observed";
  }
  if (
    input.measurement_status === "missing" ||
    input.measurement_status === "insufficient_sample" ||
    (input.maturity_status === "matured" && input.measurement_status === "pending")
  ) {
    return "missing";
  }
  return "censored";
}

function buildOutcomeEventMaps(events: readonly SelfEvolvingEvent[]): {
  byEventId: Map<string, SelfEvolvingEvent>;
  byDecisionId: Map<string, OutcomeEventProjection>;
} {
  const byEventId = new Map<string, SelfEvolvingEvent>();
  const byDecisionId = new Map<string, OutcomeEventProjection>();

  for (const event of events) {
    byEventId.set(event.event_id, event);
    const outcome = event.lifecycle?.outcome;
    if (!outcome?.decision_id) {
      continue;
    }
    const evaluationStatus = classifyOutcomeStatus({
      maturity_status: outcome.maturity_status,
      measurement_status: outcome.measurement_status,
    });
    const nextProjection: OutcomeEventProjection = {
      event_id: event.event_id,
      dispatch_id: outcome.dispatch_id ?? event.lifecycle?.dispatch_id ?? null,
      measurement_status: outcome.measurement_status ?? null,
      maturity_status: outcome.maturity_status ?? null,
      completed_at: event.timestamp,
      outcome_source_path: outcome.outcome_source_path ?? event.artifact_refs[0] ?? null,
      evaluation_status: evaluationStatus,
    };
    const prior = byDecisionId.get(outcome.decision_id);
    if (!prior || Date.parse(nextProjection.completed_at) >= Date.parse(prior.completed_at)) {
      byDecisionId.set(outcome.decision_id, nextProjection);
    }
  }

  return { byEventId, byDecisionId };
}

function readOutcomeMissingReason(
  eventById: ReadonlyMap<string, SelfEvolvingEvent>,
  outcomeEventId: string | null,
): string | null {
  if (!outcomeEventId) {
    return null;
  }
  const event = eventById.get(outcomeEventId);
  const outcomeMissing = event?.lifecycle?.outcome_missing as OutcomeMissingRecord | null | undefined;
  return outcomeMissing?.reason_code ?? null;
}

function summarizePolicyEvaluationRecords(
  records: readonly PolicyEvaluationRecord[],
): PolicyEvaluationSummary {
  const policyVersionCounts: Record<string, number> = {};
  let observed = 0;
  let pending = 0;
  let censored = 0;
  let missing = 0;
  let replayReady = 0;
  let deterministic = 0;
  let stochastic = 0;

  for (const record of records) {
    policyVersionCounts[record.policy_version] =
      (policyVersionCounts[record.policy_version] ?? 0) + 1;

    if (record.decision_mode === "stochastic") {
      stochastic += 1;
    } else {
      deterministic += 1;
    }

    if (record.evaluation_ready) {
      replayReady += 1;
    }

    if (record.evaluation_status === "observed") observed += 1;
    if (record.evaluation_status === "pending") pending += 1;
    if (record.evaluation_status === "censored") censored += 1;
    if (record.evaluation_status === "missing") missing += 1;
  }

  return {
    total_decisions: records.length,
    observed_decisions: observed,
    pending_decisions: pending,
    censored_decisions: censored,
    missing_decisions: missing,
    replay_ready_decisions: replayReady,
    deterministic_decisions: deterministic,
    stochastic_decisions: stochastic,
    policy_version_counts: policyVersionCounts,
  };
}

export function buildPolicyEvaluationDataset(input: {
  decisions: readonly PolicyDecisionRecord[];
  queue_dispatches: readonly QueueDispatch[];
  lifecycle_events?: readonly SelfEvolvingEvent[];
  now?: Date;
}): PolicyEvaluationDataset {
  const nowIso = (input.now ?? new Date()).toISOString();
  const dispatchesByDecisionId = new Map<string, QueueDispatch[]>();
  for (const dispatch of input.queue_dispatches) {
    const decisionId = readDispatchDecisionId(dispatch);
    if (!decisionId) {
      continue;
    }
    const existing = dispatchesByDecisionId.get(decisionId);
    if (existing) {
      existing.push(dispatch);
    } else {
      dispatchesByDecisionId.set(decisionId, [dispatch]);
    }
  }

  const { byEventId, byDecisionId } = buildOutcomeEventMaps(input.lifecycle_events ?? []);
  const records = input.decisions
    .map((decision): PolicyEvaluationRecord => {
      const linkedDispatches = dispatchesByDecisionId.get(decision.decision_id) ?? [];
      const selectedDispatch = selectBestDispatch(linkedDispatches);
      const completion = selectedDispatch?.completed_by?.self_evolving ?? null;
      const completionStatus = completion
        ? classifyOutcomeStatus({
            maturity_status: completion.maturity_status,
            measurement_status: completion.measurement_status,
          })
        : null;
      const outcomeProjection = byDecisionId.get(decision.decision_id);
      const evaluationStatus =
        completionStatus ??
        outcomeProjection?.evaluation_status ??
        (selectedDispatch ? "censored" : "censored");
      const outcomeEventId = completion?.outcome_event_id ?? outcomeProjection?.event_id ?? null;
      const completedAt =
        selectedDispatch?.completed_by?.completed_at ??
        outcomeProjection?.completed_at ??
        null;
      const dispatchId =
        completion?.dispatch_id ??
        (nonEmptyString(selectedDispatch?.dispatch_id) ? selectedDispatch.dispatch_id : null) ??
        outcomeProjection?.dispatch_id ??
        null;

      return {
        schema_version: "policy-evaluation.v1",
        decision_id: decision.decision_id,
        decision_context_id: decision.decision_context_id,
        business_id: decision.business_id,
        candidate_id: decision.candidate_id,
        policy_version: decision.policy_version,
        utility_version: decision.utility_version,
        decision_mode: decision.decision_mode,
        chosen_action: decision.chosen_action,
        eligible_actions: [...decision.eligible_actions],
        action_probability: decision.action_probability,
        dispatch_id: dispatchId,
        queue_state:
          typeof selectedDispatch?.queue_state === "string" ? selectedDispatch.queue_state : null,
        completed_at: completedAt,
        maturity_due_at: completion?.maturity_due_at ?? null,
        maturity_status: completion?.maturity_status ?? outcomeProjection?.maturity_status ?? null,
        measurement_status:
          completion?.measurement_status ?? outcomeProjection?.measurement_status ?? null,
        evaluation_status: evaluationStatus,
        evaluation_ready: evaluationStatus === "observed",
        outcome_event_id: outcomeEventId,
        verified_observation_ids: [...(completion?.verified_observation_ids ?? [])],
        outcome_reason_code: readOutcomeMissingReason(byEventId, outcomeEventId),
        outcome_source_path:
          selectedDispatch?.completed_by?.plan_path ??
          selectedDispatch?.completed_by?.micro_build_path ??
          outcomeProjection?.outcome_source_path ??
          null,
        linked_dispatch_count: linkedDispatches.length,
        recorded_at: completedAt ?? decision.created_at ?? nowIso,
      };
    })
    .sort((left, right) => Date.parse(left.recorded_at) - Date.parse(right.recorded_at));

  return {
    schema_version: "policy-evaluation-dataset.v1",
    generated_at: nowIso,
    records,
    summary: summarizePolicyEvaluationRecords(records),
  };
}
