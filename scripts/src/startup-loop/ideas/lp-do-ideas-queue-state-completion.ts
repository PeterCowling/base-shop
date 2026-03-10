/**
 * Marks queue.v1 dispatches as completed in queue-state.json.
 *
 * This module operates directly on serialized queue.v1 state
 * (docs/business-os/startup-loop/ideas/trial/queue-state.json)
 * and intentionally does not depend on or mutate the in-memory TrialQueue class.
 */

import path from "node:path";

import type {
  ImprovementOutcome,
  KpiAggregation,
  KpiUnit,
  MetaObservation,
} from "../self-evolving/self-evolving-contracts.js";
import { stableHash } from "../self-evolving/self-evolving-contracts.js";
import {
  appendMetaObservation,
  appendSelfEvolvingEvent,
  createLifecycleEvent,
} from "../self-evolving/self-evolving-events.js";

import { IDEAS_TRIAL_QUEUE_STATE_PATH } from "./lp-do-ideas-paths.js";
import {
  atomicWriteQueueState,
  buildCounts,
  type DispatchSelfEvolvingLink,
  type QueueCompletedSelfEvolving,
  type QueueDispatch,
  readQueueStateFile,
} from "./lp-do-ideas-queue-state-file.js";

const DEFAULT_QUEUE_STATE_PATH = IDEAS_TRIAL_QUEUE_STATE_PATH;

export interface SelfEvolvingMeasurementInput {
  kpi_name: string;
  kpi_value: number;
  kpi_unit: KpiUnit;
  aggregation_method: KpiAggregation;
  sample_size: number;
  baseline_ref: string;
  measurement_window: string;
  baseline_window: string;
  post_window: string;
  measured_impact: number;
  impact_confidence: number;
  regressions_detected: number;
  data_quality_status: "ok" | "degraded";
  traffic_segment?: string | null;
  artifact_refs?: string[];
}

export interface MarkDispatchesCompletedOptions {
  queueStatePath: string;
  featureSlug: string;
  planPath: string;
  outcome: string;
  business?: string;
  rootDir?: string;
  clock?: () => Date;
  selfEvolvingMeasurement?: SelfEvolvingMeasurementInput;
}

export type MarkDispatchesCompletedResult =
  | { ok: true; mutated: number; skipped: number }
  | {
      ok: false;
      reason: "no_match" | "parse_error" | "write_error" | "file_not_found";
      error?: string;
    };

function resolveRootDir(inputRootDir: string | undefined): string {
  if (inputRootDir) {
    return inputRootDir;
  }
  return process.cwd().endsWith(`${path.sep}scripts`)
    ? path.resolve(process.cwd(), "..")
    : process.cwd();
}

function addDays(isoTimestamp: string, days: number): string {
  const base = Date.parse(isoTimestamp);
  return new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
}

function normalizedOutcomeStatus(
  outcome: string,
): ImprovementOutcome["implementation_status"] {
  const normalized = outcome.toLowerCase();
  if (normalized.includes("revert") || normalized.includes("rollback")) {
    return "reverted";
  }
  if (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("blocked")
  ) {
    return "failed";
  }
  return "success";
}

function inferredMaturityDays(outcome: string): number {
  const normalized = outcome.toLowerCase();
  if (
    normalized.includes("revert") ||
    normalized.includes("rollback") ||
    normalized.includes("fail") ||
    normalized.includes("error")
  ) {
    return 0;
  }
  if (normalized.includes("retention") || normalized.includes("churn")) {
    return 56;
  }
  if (
    normalized.includes("workflow") ||
    normalized.includes("operator") ||
    normalized.includes("manual") ||
    normalized.includes("queue")
  ) {
    return 7;
  }
  return 28;
}

function extractCandidateIdFromEvidenceRefs(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }
  for (const ref of value) {
    if (
      typeof ref === "string" &&
      ref.startsWith("self-evolving-candidate:") &&
      ref.length > "self-evolving-candidate:".length
    ) {
      return ref.slice("self-evolving-candidate:".length);
    }
  }
  return null;
}

function readSelfEvolvingLink(dispatch: QueueDispatch): DispatchSelfEvolvingLink | null {
  const direct = dispatch.self_evolving;
  if (direct && typeof direct === "object") {
    return direct;
  }
  const nested = dispatch.processed_by?.self_evolving;
  if (nested && typeof nested === "object") {
    return nested as DispatchSelfEvolvingLink;
  }
  const candidateId = extractCandidateIdFromEvidenceRefs(dispatch.evidence_refs);
  if (!candidateId) {
    return null;
  }
  return {
    candidate_id: candidateId,
    decision_id: stableHash(`${candidateId}|completion-link-fallback`).slice(0, 16),
    policy_version: "self-evolving-policy.v1",
    recommended_route_origin: "lp-do-fact-find",
    executor_path: "unknown",
    handoff_emitted_at:
      typeof dispatch.created_at === "string" ? dispatch.created_at : new Date().toISOString(),
  };
}

function buildPendingOutcomeEventPayload(input: {
  link: DispatchSelfEvolvingLink;
  dispatchId: string;
  completedAt: string;
  planPath: string;
  outcome: string;
  implementationStatus: ImprovementOutcome["implementation_status"];
  measurementObservationIds: string[];
  measurementStatus:
    | "pending"
    | "verified"
    | "verified_degraded"
    | "missing"
    | "insufficient_sample";
  maturityStatus: "pending" | "matured";
}): ImprovementOutcome {
  return {
    schema_version: "outcome.v2",
    candidate_id: input.link.candidate_id,
    gap_case: input.link.gap_case ?? null,
    prescription: input.link.prescription ?? null,
    dispatch_id: input.dispatchId,
    decision_id: input.link.decision_id,
    policy_version: input.link.policy_version,
    implementation_status: input.implementationStatus,
    promoted_at: null,
    maturity_status: input.maturityStatus,
    measurement_status: input.measurementStatus,
    baseline_window: input.measurementStatus.startsWith("verified") ? "verified-baseline" : "implementation",
    post_window: input.completedAt,
    measured_impact: 0,
    impact_confidence: input.measurementStatus.startsWith("verified") ? 0.7 : 0,
    regressions_detected: input.implementationStatus === "success" ? 0 : 1,
    rollback_executed_at:
      input.implementationStatus === "reverted" ? input.completedAt : null,
    kept_or_reverted:
      input.implementationStatus === "success"
        ? "kept"
        : input.implementationStatus === "reverted"
          ? "reverted"
          : "not_kept",
    measurement_observation_ids: input.measurementObservationIds,
    outcome_source_path: input.planPath,
    root_cause_notes: input.outcome,
    follow_up_actions: [],
  };
}

function writeVerifiedMeasurementFeedback(input: {
  rootDir: string;
  business: string;
  link: DispatchSelfEvolvingLink;
  dispatchId: string;
  planPath: string;
  outcome: string;
  completedAt: string;
  measurement: SelfEvolvingMeasurementInput;
}): { observationId: string; outcomeEventId: string } {
  const observationId = stableHash(
    `${input.link.candidate_id}|${input.dispatchId}|${input.measurement.kpi_name}|${input.completedAt}`,
  ).slice(0, 16);
  const observation: MetaObservation = {
    schema_version: "meta-observation.v2",
    observation_id: observationId,
    observation_type: "experiment_result_observed",
    timestamp: input.completedAt,
    business: input.business,
    actor_type: "automation",
    run_id: stableHash(`${input.dispatchId}|measurement-run`).slice(0, 16),
    session_id: stableHash(`${input.dispatchId}|measurement-session`).slice(0, 16),
    skill_id: "lp-do-ideas-queue-state-completion",
    container_id: null,
    artifact_refs: input.measurement.artifact_refs ?? [input.planPath],
    context_path: "startup-loop/ideas/completion",
    hard_signature: stableHash(
      `${input.link.candidate_id}|${input.measurement.kpi_name}|${input.measurement.measurement_window}`,
    ),
    soft_cluster_id: null,
    fingerprint_version: "1",
    repeat_count_window: 1,
    operator_minutes_estimate: 0,
    quality_impact_estimate: Math.max(0, input.measurement.measured_impact),
    detector_confidence: 0.9,
    severity: input.measurement.regressions_detected > 0 ? 0.7 : 0.15,
    inputs_hash: stableHash(JSON.stringify(input.measurement)),
    outputs_hash: stableHash(
      `${input.measurement.kpi_name}|${input.measurement.kpi_value}|${input.measurement.data_quality_status}`,
    ),
    toolchain_version: "completion-bridge.v1",
    model_version: null,
    kpi_name: input.measurement.kpi_name,
    kpi_value: input.measurement.kpi_value,
    kpi_unit: input.measurement.kpi_unit,
    aggregation_method: input.measurement.aggregation_method,
    sample_size: input.measurement.sample_size,
    data_quality_status: input.measurement.data_quality_status,
    data_quality_reason_code: null,
    baseline_ref: input.measurement.baseline_ref,
    measurement_window: input.measurement.measurement_window,
    traffic_segment: input.measurement.traffic_segment ?? "all",
    evidence_refs: [
      `self-evolving-candidate:${input.link.candidate_id}`,
      input.planPath,
    ],
    evidence_grade: "measured",
    measurement_contract_status: "verified",
  };
  appendMetaObservation(input.rootDir, input.business, observation);

  const outcome = {
    ...buildPendingOutcomeEventPayload({
      link: input.link,
      dispatchId: input.dispatchId,
      completedAt: input.completedAt,
      planPath: input.planPath,
      outcome: input.outcome,
      implementationStatus: "success",
      measurementObservationIds: [observationId],
      measurementStatus:
        input.measurement.data_quality_status === "degraded"
          ? "verified_degraded"
          : "verified",
      maturityStatus: "matured",
    }),
    baseline_window: input.measurement.baseline_window,
    post_window: input.measurement.post_window,
    measured_impact: input.measurement.measured_impact,
    impact_confidence: input.measurement.impact_confidence,
    regressions_detected: input.measurement.regressions_detected,
  } satisfies ImprovementOutcome;

  const lifecycleEvent = createLifecycleEvent({
    correlation_id: input.link.candidate_id,
    event_type: "outcome_recorded",
    lifecycle: {
      candidate_id: input.link.candidate_id,
      dispatch_id: input.dispatchId,
      outcome,
    },
    run_id: stableHash(`${input.dispatchId}|outcome-run`).slice(0, 16),
    session_id: stableHash(`${input.dispatchId}|outcome-session`).slice(0, 16),
    source_component: "lp-do-ideas-queue-state-completion",
    timestamp: input.completedAt,
    artifact_refs: [input.planPath],
  });
  appendSelfEvolvingEvent(input.rootDir, input.business, lifecycleEvent);

  return {
    observationId,
    outcomeEventId: lifecycleEvent.event_id,
  };
}

function writeOutcomeMissingFeedback(input: {
  rootDir: string;
  business: string;
  link: DispatchSelfEvolvingLink;
  dispatchId: string;
  planPath: string;
  completedAt: string;
  reasonCode: string;
  detail: string | null;
}): string {
  const lifecycleEvent = createLifecycleEvent({
    correlation_id: input.link.candidate_id,
    event_type: "outcome_missing",
    lifecycle: {
      candidate_id: input.link.candidate_id,
      dispatch_id: input.dispatchId,
      outcome_missing: {
        reason_code: input.reasonCode,
        detail: input.detail,
        expected_artifact_ref: input.planPath,
      },
    },
    run_id: stableHash(`${input.dispatchId}|missing-run`).slice(0, 16),
    session_id: stableHash(`${input.dispatchId}|missing-session`).slice(0, 16),
    source_component: "lp-do-ideas-queue-state-completion",
    timestamp: input.completedAt,
    artifact_refs: [input.planPath],
    status: "blocked",
  });
  appendSelfEvolvingEvent(input.rootDir, input.business, lifecycleEvent);
  return lifecycleEvent.event_id;
}

export function buildSelfEvolvingCompletionState(input: {
  rootDir: string;
  business: string;
  dispatch: QueueDispatch;
  planPath: string;
  outcome: string;
  completedAt: string;
  measurement?: SelfEvolvingMeasurementInput;
}): QueueCompletedSelfEvolving | null {
  const link = readSelfEvolvingLink(input.dispatch);
  const dispatchId =
    typeof input.dispatch.dispatch_id === "string" ? input.dispatch.dispatch_id : null;
  if (!link || !dispatchId) {
    return null;
  }

  const implementationStatus = normalizedOutcomeStatus(input.outcome);
  const maturityDueAt = addDays(input.completedAt, inferredMaturityDays(input.outcome));
  const state: QueueCompletedSelfEvolving = {
    candidate_id: link.candidate_id,
    decision_id: link.decision_id,
    gap_case: link.gap_case,
    prescription: link.prescription,
    dispatch_id: dispatchId,
    maturity_due_at: maturityDueAt,
    maturity_status: Date.parse(maturityDueAt) <= Date.parse(input.completedAt) ? "matured" : "pending",
    measurement_status: "pending",
    outcome_event_id: null,
    verified_observation_ids: [],
  };

  if (input.measurement) {
    const feedback = writeVerifiedMeasurementFeedback({
      rootDir: input.rootDir,
      business: input.business,
      link,
      dispatchId,
      planPath: input.planPath,
      outcome: input.outcome,
      completedAt: input.completedAt,
      measurement: input.measurement,
    });
    state.maturity_due_at = input.completedAt;
    state.maturity_status = "matured";
    state.measurement_status =
      input.measurement.data_quality_status === "degraded"
        ? "verified_degraded"
        : "verified";
    state.outcome_event_id = feedback.outcomeEventId;
    state.verified_observation_ids = [feedback.observationId];
    return state;
  }

  if (implementationStatus !== "success") {
    state.maturity_due_at = input.completedAt;
    state.maturity_status = "matured";
    state.measurement_status = "missing";
    state.outcome_event_id = writeOutcomeMissingFeedback({
      rootDir: input.rootDir,
      business: input.business,
      link,
      dispatchId,
      planPath: input.planPath,
      completedAt: input.completedAt,
      reasonCode: "metric_not_available",
      detail: input.outcome,
    });
  }

  return state;
}

export function finalizeSelfEvolvingCompletionIfMatured(input: {
  rootDir: string;
  business: string;
  dispatch: QueueDispatch;
  planPath: string;
  completedAt: string;
}): QueueCompletedSelfEvolving | null {
  const existing = input.dispatch.completed_by?.self_evolving;
  if (!existing) {
    return null;
  }
  if (existing.outcome_event_id) {
    return existing;
  }
  if (existing.maturity_status === "pending" && Date.parse(existing.maturity_due_at) > Date.parse(input.completedAt)) {
    return existing;
  }

  const link = readSelfEvolvingLink(input.dispatch);
  if (!link) {
    return existing;
  }

  return {
    ...existing,
    maturity_status: "matured",
    measurement_status:
      existing.measurement_status === "pending" ? "missing" : existing.measurement_status,
    outcome_event_id: writeOutcomeMissingFeedback({
      rootDir: input.rootDir,
      business: input.business,
      link,
      dispatchId: existing.dispatch_id,
      planPath: input.planPath,
      completedAt: input.completedAt,
      reasonCode: "metric_not_available",
      detail: "Maturity window elapsed without verified measurement.",
    }),
  };
}

export function parseMarkDispatchesCompletedArgs(
  argv: string[],
): MarkDispatchesCompletedOptions {
  const flags = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    if (!token?.startsWith("--") || !value || value.startsWith("--")) {
      continue;
    }
    flags.set(token.slice(2), value);
    index += 1;
  }

  const queueStatePath = flags.get("queue-state-path") ?? DEFAULT_QUEUE_STATE_PATH;
  const featureSlug = flags.get("feature-slug");
  const planPath = flags.get("plan-path");
  const outcome = flags.get("outcome");
  const business = flags.get("business");
  const rootDir = flags.get("root-dir");

  if (!featureSlug) {
    throw new Error("missing_required_flag:--feature-slug");
  }
  if (!planPath) {
    throw new Error("missing_required_flag:--plan-path");
  }
  if (!outcome) {
    throw new Error("missing_required_flag:--outcome");
  }

  return {
    queueStatePath,
    featureSlug,
    planPath,
    outcome,
    ...(business ? { business } : {}),
    ...(rootDir ? { rootDir } : {}),
  };
}

export function markDispatchesCompleted(
  options: MarkDispatchesCompletedOptions,
): MarkDispatchesCompletedResult {
  const clock = options.clock ?? (() => new Date());
  const rootDir = resolveRootDir(options.rootDir);
  const queueResult = readQueueStateFile(options.queueStatePath);
  if (!queueResult.ok) {
    return queueResult;
  }

  let mutated = 0;
  let skipped = 0;

  for (const dispatch of queueResult.queue.dispatches) {
    const slugMatches =
      dispatch.processed_by?.target_slug === options.featureSlug ||
      dispatch.processed_by?.fact_find_slug === options.featureSlug;
    const businessMatches =
      options.business === undefined || dispatch.business === options.business;

    if (dispatch.queue_state === "completed") {
      if (slugMatches && businessMatches) {
        skipped += 1;
      }
      continue;
    }
    if (!slugMatches || !businessMatches) {
      continue;
    }

    const completedAt = clock().toISOString();
    dispatch.queue_state = "completed";
    dispatch.status = "completed";
    dispatch.completed_by = {
      plan_path: options.planPath,
      completed_at: completedAt,
      outcome: options.outcome,
      self_evolving: buildSelfEvolvingCompletionState({
        rootDir,
        business:
          typeof dispatch.business === "string" ? dispatch.business : options.business ?? "unknown",
        dispatch,
        planPath: options.planPath,
        outcome: options.outcome,
        completedAt,
        measurement: options.selfEvolvingMeasurement,
      }) ?? undefined,
    };
    mutated += 1;
  }

  if (mutated === 0) {
    return { ok: false, reason: "no_match" };
  }

  queueResult.queue.counts = buildCounts(queueResult.queue.dispatches);
  queueResult.queue.last_updated = clock().toISOString();

  const writeResult = atomicWriteQueueState(options.queueStatePath, queueResult.queue);
  if (!writeResult.ok) {
    return { ok: false, reason: "write_error", error: writeResult.error };
  }

  return { ok: true, mutated, skipped };
}

if (process.argv[1]?.includes("lp-do-ideas-queue-state-completion")) {
  try {
    const options = parseMarkDispatchesCompletedArgs(process.argv.slice(2));
    const result = markDispatchesCompleted(options);
    if (!result.ok && result.reason !== "no_match") {
      process.stderr.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    }
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify(
        {
          ok: false,
          reason: "parse_error",
          error: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      )}\n`,
    );
    process.exitCode = 1;
  }
}
