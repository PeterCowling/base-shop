import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  type EffectClass,
  type EffectReversibility,
  type MetaObservation,
  type SelfEvolvingLifecyclePayload,
  stableHash,
  throwOnContractErrors,
  validateLifecyclePayload,
  validateMetaObservation,
} from "./self-evolving-contracts.js";

function nonEmptyString(input: unknown): boolean {
  return typeof input === "string" && input.trim().length > 0;
}

function isIsoDate(input: string | null | undefined): boolean {
  if (!input) {
    return false;
  }
  return !Number.isNaN(Date.parse(input));
}

export type SelfEvolvingLifecycleEventType =
  | "candidate_generated"
  | "operator_review_recorded"
  | "followup_dispatch_handoff"
  | "outcome_recorded"
  | "outcome_missing";

export type SelfEvolvingEventType =
  | "execution_start"
  | "execution_end"
  | "validation_failure"
  | "operator_intervention"
  | "routing_override"
  | "kpi_snapshot"
  | "experiment_assignment"
  | "experiment_outcome"
  | "feedback_signal_ingested"
  | "actuator_call_start"
  | "actuator_call_end"
  | "actuator_effect_applied"
  | "actuator_rollback_applied"
  | SelfEvolvingLifecycleEventType;

const OBSERVATION_TO_EVENT_TYPE: Record<
  MetaObservation["observation_type"],
  SelfEvolvingEventType
> = {
  execution_event: "execution_end",
  validation_failure: "validation_failure",
  operator_intervention: "operator_intervention",
  routing_override: "routing_override",
  metric_regression: "kpi_snapshot",
  metric_plateau: "kpi_snapshot",
  funnel_dropoff_detected: "kpi_snapshot",
  experiment_result_observed: "experiment_outcome",
  customer_feedback_theme_recurring: "feedback_signal_ingested",
};

export interface SelfEvolvingEvent {
  schema_version: string;
  event_id: string;
  correlation_id: string;
  run_id: string;
  session_id: string;
  timestamp: string;
  source_component: string;
  status: "ok" | "error" | "blocked";
  inputs_hash: string;
  outputs_hash: string;
  error_class: string | null;
  artifact_refs: string[];
  effect_class: EffectClass | null;
  effect_reversibility: EffectReversibility | null;
  event_type: SelfEvolvingEventType;
  lifecycle?: SelfEvolvingLifecyclePayload | null;
}

export interface CreateLifecycleEventInput {
  artifact_refs?: string[];
  correlation_id: string;
  effect_class?: EffectClass | null;
  effect_reversibility?: EffectReversibility | null;
  error_class?: string | null;
  event_type: SelfEvolvingLifecycleEventType;
  inputs_hash?: string;
  lifecycle: SelfEvolvingLifecyclePayload;
  outputs_hash?: string;
  run_id: string;
  session_id: string;
  source_component: string;
  status?: SelfEvolvingEvent["status"];
  timestamp: string;
}

const SELF_EVOLVING_ROOT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "self-evolving",
);

const LIFECYCLE_EVENT_TYPES = new Set<SelfEvolvingLifecycleEventType>([
  "candidate_generated",
  "operator_review_recorded",
  "followup_dispatch_handoff",
  "outcome_recorded",
  "outcome_missing",
]);

function resolveLogPath(rootDir: string, businessId: string): string {
  return path.join(rootDir, SELF_EVOLVING_ROOT, businessId, "events.jsonl");
}

function resolveObservationPath(rootDir: string, businessId: string): string {
  return path.join(rootDir, SELF_EVOLVING_ROOT, businessId, "observations.jsonl");
}

function readLog(rootDir: string, businessId: string): SelfEvolvingEvent[] {
  const filePath = resolveLogPath(rootDir, businessId);
  try {
    const content = readFileSync(filePath, "utf-8").trim();
    if (content.length === 0) return [];
    return content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as SelfEvolvingEvent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function writeLog(
  rootDir: string,
  businessId: string,
  events: SelfEvolvingEvent[],
): string {
  const filePath = resolveLogPath(rootDir, businessId);
  mkdirSync(path.dirname(filePath), { recursive: true });
  const body = events.map((event) => JSON.stringify(event)).join("\n");
  writeFileSync(filePath, `${body}\n`, "utf-8");
  return filePath;
}

export function makeEventId(input: {
  correlation_id: string;
  event_type: SelfEvolvingEventType;
  run_id: string;
  session_id: string;
  source_component: string;
  timestamp: string;
}): string {
  return stableHash(
    [
      input.correlation_id,
      input.event_type,
      input.run_id,
      input.session_id,
      input.source_component,
      input.timestamp,
    ].join("|"),
  );
}

export function isLifecycleEventType(
  eventType: SelfEvolvingEventType,
): eventType is SelfEvolvingLifecycleEventType {
  return LIFECYCLE_EVENT_TYPES.has(eventType as SelfEvolvingLifecycleEventType);
}

function validateLifecyclePayloadByEventType(
  eventType: SelfEvolvingLifecycleEventType,
  lifecycle: SelfEvolvingLifecyclePayload,
): string[] {
  const errors: string[] = [];

  if (eventType === "operator_review_recorded" && !lifecycle.review) {
    errors.push("review_required_for_operator_review_recorded");
  }
  if (eventType !== "operator_review_recorded" && lifecycle.review) {
    errors.push("review_only_allowed_for_operator_review_recorded");
  }
  if (eventType === "followup_dispatch_handoff" && !nonEmptyString(lifecycle.dispatch_id)) {
    errors.push("dispatch_id_required_for_handoff");
  }
  if (eventType === "outcome_recorded" && !lifecycle.outcome) {
    errors.push("outcome_required_for_outcome_recorded");
  }
  if (eventType !== "outcome_recorded" && lifecycle.outcome) {
    errors.push("outcome_only_allowed_for_outcome_recorded");
  }
  if (eventType === "outcome_missing" && !lifecycle.outcome_missing) {
    errors.push("outcome_missing_required_for_outcome_missing");
  }
  if (eventType !== "outcome_missing" && lifecycle.outcome_missing) {
    errors.push("outcome_missing_only_allowed_for_outcome_missing");
  }

  return errors;
}

export function validateSelfEvolvingEvent(event: SelfEvolvingEvent): string[] {
  const errors: string[] = [];
  if (!nonEmptyString(event.schema_version)) errors.push("schema_version");
  if (!nonEmptyString(event.event_id)) errors.push("event_id");
  if (!nonEmptyString(event.correlation_id)) errors.push("correlation_id");
  if (!nonEmptyString(event.run_id)) errors.push("run_id");
  if (!nonEmptyString(event.session_id)) errors.push("session_id");
  if (!isIsoDate(event.timestamp)) errors.push("timestamp");
  if (!nonEmptyString(event.source_component)) errors.push("source_component");
  if (
    event.status !== "ok" &&
    event.status !== "error" &&
    event.status !== "blocked"
  ) {
    errors.push("status");
  }
  if (!nonEmptyString(event.inputs_hash)) errors.push("inputs_hash");
  if (!nonEmptyString(event.outputs_hash)) errors.push("outputs_hash");
  if (!Array.isArray(event.artifact_refs)) errors.push("artifact_refs");
  if (
    event.error_class !== null &&
    !nonEmptyString(event.error_class)
  ) {
    errors.push("error_class");
  }

  const hasLifecycle = event.lifecycle != null;
  const lifecycleEventType = isLifecycleEventType(event.event_type);
  if (
    event.schema_version !== "event.v1" &&
    event.schema_version !== "event.v2"
  ) {
    errors.push("unsupported_schema_version");
  }
  if (hasLifecycle && event.schema_version !== "event.v2") {
    errors.push("lifecycle_requires_event_v2");
  }
  if (lifecycleEventType && !hasLifecycle) {
    errors.push("lifecycle_payload_required");
  }
  if (!lifecycleEventType && hasLifecycle) {
    errors.push("unexpected_lifecycle_payload");
  }
  if (event.lifecycle) {
    errors.push(
      ...validateLifecyclePayload(event.lifecycle).map((error) => `lifecycle.${error}`),
    );
    if (lifecycleEventType) {
      const lifecycleType = event.event_type as SelfEvolvingLifecycleEventType;
      errors.push(
        ...validateLifecyclePayloadByEventType(
          lifecycleType,
          event.lifecycle,
        ).map((error) => `lifecycle.${error}`),
      );
    }
  }

  return errors;
}

function defaultLifecycleEventStatus(
  eventType: SelfEvolvingLifecycleEventType,
  lifecycle: SelfEvolvingLifecyclePayload,
): SelfEvolvingEvent["status"] {
  if (eventType === "outcome_missing") {
    return "blocked";
  }
  if (
    eventType === "operator_review_recorded" &&
    lifecycle.review &&
    lifecycle.review.decision !== "approved"
  ) {
    return "blocked";
  }
  return "ok";
}

export function createLifecycleEvent(
  input: CreateLifecycleEventInput,
): SelfEvolvingEvent {
  const payloadHash = stableHash(
    JSON.stringify({
      event_type: input.event_type,
      lifecycle: input.lifecycle,
    }),
  );
  const event: SelfEvolvingEvent = {
    schema_version: "event.v2",
    event_id: makeEventId({
      correlation_id: input.correlation_id,
      event_type: input.event_type,
      run_id: input.run_id,
      session_id: input.session_id,
      source_component: input.source_component,
      timestamp: input.timestamp,
    }),
    correlation_id: input.correlation_id,
    run_id: input.run_id,
    session_id: input.session_id,
    timestamp: input.timestamp,
    source_component: input.source_component,
    status:
      input.status ??
      defaultLifecycleEventStatus(input.event_type, input.lifecycle),
    inputs_hash: input.inputs_hash ?? payloadHash,
    outputs_hash: input.outputs_hash ?? payloadHash,
    error_class: input.error_class ?? null,
    artifact_refs: input.artifact_refs ?? [],
    effect_class: input.effect_class ?? null,
    effect_reversibility: input.effect_reversibility ?? null,
    event_type: input.event_type,
    lifecycle: input.lifecycle,
  };
  throwOnContractErrors("self_evolving_event", validateSelfEvolvingEvent(event));
  return event;
}

export function appendSelfEvolvingEvent(
  rootDir: string,
  businessId: string,
  event: SelfEvolvingEvent,
): { written: boolean; path: string } {
  throwOnContractErrors("self_evolving_event", validateSelfEvolvingEvent(event));
  const existing = readLog(rootDir, businessId);
  if (existing.some((entry) => entry.event_id === event.event_id)) {
    return { written: false, path: resolveLogPath(rootDir, businessId) };
  }
  const merged = [...existing, event];
  const outputPath = writeLog(rootDir, businessId, merged);
  return { written: true, path: outputPath };
}

function readObservations(
  rootDir: string,
  businessId: string,
): MetaObservation[] {
  const filePath = resolveObservationPath(rootDir, businessId);
  try {
    const content = readFileSync(filePath, "utf-8").trim();
    if (content.length === 0) return [];
    return content
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as MetaObservation);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function writeObservations(
  rootDir: string,
  businessId: string,
  observations: MetaObservation[],
): string {
  const filePath = resolveObservationPath(rootDir, businessId);
  mkdirSync(path.dirname(filePath), { recursive: true });
  const body = observations.map((observation) => JSON.stringify(observation)).join("\n");
  writeFileSync(filePath, `${body}\n`, "utf-8");
  return filePath;
}

export function appendMetaObservation(
  rootDir: string,
  businessId: string,
  observation: MetaObservation,
): { written: boolean; path: string } {
  const observationErrors = validateMetaObservation(observation);
  throwOnContractErrors("meta_observation", observationErrors);

  const existing = readObservations(rootDir, businessId);
  if (existing.some((entry) => entry.observation_id === observation.observation_id)) {
    return { written: false, path: resolveObservationPath(rootDir, businessId) };
  }

  const merged = [...existing, observation];
  const outputPath = writeObservations(rootDir, businessId, merged);
  return { written: true, path: outputPath };
}

export function appendObservationAsEvent(
  rootDir: string,
  businessId: string,
  observation: MetaObservation,
): { written: boolean; path: string } {
  const observationErrors = validateMetaObservation(observation);
  throwOnContractErrors("meta_observation", observationErrors);

  const eventType = OBSERVATION_TO_EVENT_TYPE[observation.observation_type];

  const event: SelfEvolvingEvent = {
    schema_version: "event.v1",
    event_id: makeEventId({
      correlation_id: observation.observation_id,
      event_type: eventType,
      run_id: observation.run_id,
      session_id: observation.session_id,
      source_component: observation.context_path,
      timestamp: observation.timestamp,
    }),
    correlation_id: observation.observation_id,
    run_id: observation.run_id,
    session_id: observation.session_id,
    timestamp: observation.timestamp,
    source_component: observation.context_path,
    status: observation.severity >= 0.8 ? "error" : "ok",
    inputs_hash: observation.inputs_hash,
    outputs_hash: observation.outputs_hash,
    error_class: null,
    artifact_refs: observation.artifact_refs,
    effect_class: null,
    effect_reversibility: null,
    event_type: eventType,
  };

  appendMetaObservation(rootDir, businessId, observation);
  return appendSelfEvolvingEvent(rootDir, businessId, event);
}

export function readSelfEvolvingEvents(
  rootDir: string,
  businessId: string,
): SelfEvolvingEvent[] {
  return readLog(rootDir, businessId);
}

export function readMetaObservations(
  rootDir: string,
  businessId: string,
): MetaObservation[] {
  return readObservations(rootDir, businessId);
}

export function replaceSelfEvolvingEvents(
  rootDir: string,
  businessId: string,
  events: SelfEvolvingEvent[],
): string {
  for (const event of events) {
    const errors = validateSelfEvolvingEvent(event);
    throwOnContractErrors("self_evolving_event", errors);
  }
  return writeLog(rootDir, businessId, events);
}

export function replaceMetaObservations(
  rootDir: string,
  businessId: string,
  observations: MetaObservation[],
): string {
  for (const observation of observations) {
    const errors = validateMetaObservation(observation);
    throwOnContractErrors("meta_observation", errors);
  }
  return writeObservations(rootDir, businessId, observations);
}
