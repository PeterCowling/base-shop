import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  type EffectClass,
  type EffectReversibility,
  type MetaObservation,
  stableHash,
  throwOnContractErrors,
  validateMetaObservation,
} from "./self-evolving-contracts.js";

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
  | "actuator_rollback_applied";

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
}

const EVENTS_ROOT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "self-evolving",
  "events",
);

const OBSERVATIONS_ROOT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "self-evolving",
  "observations",
);

function resolveLogPath(rootDir: string, businessId: string): string {
  return path.join(rootDir, EVENTS_ROOT, `${businessId}.jsonl`);
}

function resolveObservationPath(rootDir: string, businessId: string): string {
  return path.join(rootDir, OBSERVATIONS_ROOT, `${businessId}.jsonl`);
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

export function appendSelfEvolvingEvent(
  rootDir: string,
  businessId: string,
  event: SelfEvolvingEvent,
): { written: boolean; path: string } {
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
