/**
 * lp-do-ideas metrics runner.
 *
 * Reads persisted queue state and telemetry JSONL from disk and produces a
 * rolled-up IdeasMetricsRollup. Intended for CLI use and go-live checklist
 * VC-01 (route accuracy) and VC-02 (suppression variance) evidence generation.
 *
 * Handles missing files gracefully — returns a not-ready result rather than
 * throwing.
 *
 * Contract: docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-checklist.md
 */

import { existsSync, readFileSync } from "node:fs";

import {
  type IdeasCycleTelemetrySnapshot,
  type IdeasMetricsRollup,
  type QueueEntrySnapshot,
  rollupIdeasMetrics,
} from "./lp-do-ideas-metrics-rollup.js";
import type { PersistedQueueState } from "./lp-do-ideas-persistence.js";
import type { QueueLane } from "./lp-do-ideas-trial-queue.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface MetricsRunnerOptions {
  /** Path to the telemetry JSONL file (e.g. trial/telemetry.jsonl). */
  telemetryPath: string;
  /** Path to the queue state JSON file (e.g. trial/queue-state.json). */
  queueStatePath: string;
  /** Injectable clock for deterministic tests. */
  now?: Date;
}

export type MetricsRunnerResult =
  | { ready: true; rollup: IdeasMetricsRollup }
  | { ready: false; reason: string; rollup: IdeasMetricsRollup };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Infers the queue lane from a persisted packet's status field.
 * Mirrors the resolveAdmissionLane logic in lp-do-ideas-trial-queue.ts:
 * - An explicit `lane` field on the packet (non-standard but tolerated) is
 *   preferred.
 * - Otherwise "fact_find_ready" maps to DO; everything else maps to IMPROVE.
 */
function inferLaneFromPacket(packet: Record<string, unknown>): QueueLane {
  const rawLane = packet["lane"];
  if (typeof rawLane === "string") {
    const normalised = rawLane.trim().toUpperCase();
    if (normalised === "DO" || normalised === "IMPROVE") {
      return normalised as QueueLane;
    }
  }
  return packet["status"] === "fact_find_ready" ? "DO" : "IMPROVE";
}

/**
 * Reads and parses persisted queue entries from a queue-state JSON file.
 *
 * Supports two persisted formats:
 * - schema_version "queue-state.v1" (entries[] from persistOrchestratorResult)
 * - queue_version "queue.v1"        (dispatches[] from the trial queue snapshot)
 *
 * Silently returns [] when the file is absent or unparseable.
 */
function loadQueueEntries(queueStatePath: string): QueueEntrySnapshot[] {
  if (!existsSync(queueStatePath)) {
    return [];
  }

  let raw: string;
  try {
    raw = readFileSync(queueStatePath, "utf-8");
  } catch {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (typeof parsed !== "object" || parsed === null) {
    return [];
  }

  const obj = parsed as Record<string, unknown>;

  // Format A: queue-state.v1 (entries array, each entry has dispatch_id,
  // queue_state, dispatched_at, and packet)
  if (obj["schema_version"] === "queue-state.v1") {
    const state = obj as unknown as PersistedQueueState;
    const entries = Array.isArray(state.entries) ? state.entries : [];
    const result: QueueEntrySnapshot[] = [];
    for (const entry of entries) {
      const packet = entry.packet as Record<string, unknown> | null | undefined;
      const eventTimestamp =
        typeof packet?.["created_at"] === "string"
          ? packet["created_at"]
          : entry.dispatched_at;
      result.push({
        dispatch_id: entry.dispatch_id,
        lane: packet ? inferLaneFromPacket(packet) : "DO",
        queue_state: entry.queue_state,
        event_timestamp: eventTimestamp,
        processing_timestamp: entry.dispatched_at,
      });
    }
    return result;
  }

  // Format B: queue.v1 (dispatches array — direct packet objects with an
  // inline queue_state field)
  if (obj["queue_version"] === "queue.v1" || Array.isArray(obj["dispatches"])) {
    const dispatches = Array.isArray(obj["dispatches"]) ? obj["dispatches"] : [];
    const result: QueueEntrySnapshot[] = [];
    for (const dispatch of dispatches) {
      if (typeof dispatch !== "object" || dispatch === null) {
        continue;
      }
      const d = dispatch as Record<string, unknown>;
      const dispatchId = typeof d["dispatch_id"] === "string" ? d["dispatch_id"] : null;
      if (!dispatchId) {
        continue;
      }
      const queueState = typeof d["queue_state"] === "string" ? d["queue_state"] : "enqueued";
      const eventTimestamp =
        typeof d["created_at"] === "string" ? d["created_at"] : new Date(0).toISOString();
      result.push({
        dispatch_id: dispatchId,
        lane: inferLaneFromPacket(d),
        queue_state: queueState as QueueEntrySnapshot["queue_state"],
        event_timestamp: eventTimestamp,
        processing_timestamp: eventTimestamp,
      });
    }
    return result;
  }

  return [];
}

/**
 * Parses cycle telemetry snapshots from a JSONL file.
 *
 * Lines that do not have all of { cycle_id, phase, mode, candidate_count,
 * admitted_cluster_count } are silently skipped.
 * Absent file is treated as empty input.
 */
function loadCycleSnapshots(telemetryPath: string): IdeasCycleTelemetrySnapshot[] {
  if (!existsSync(telemetryPath)) {
    return [];
  }

  let raw: string;
  try {
    raw = readFileSync(telemetryPath, "utf-8");
  } catch {
    return [];
  }

  const snapshots: IdeasCycleTelemetrySnapshot[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }

    let obj: unknown;
    try {
      obj = JSON.parse(trimmed);
    } catch {
      continue;
    }

    if (typeof obj !== "object" || obj === null) {
      continue;
    }

    const record = obj as Record<string, unknown>;

    // Only lines with the required cycle telemetry fields are accepted
    if (
      typeof record["cycle_id"] !== "string" ||
      typeof record["phase"] !== "string" ||
      typeof record["mode"] !== "string" ||
      typeof record["candidate_count"] !== "number" ||
      typeof record["admitted_cluster_count"] !== "number"
    ) {
      continue;
    }

    snapshots.push({
      cycle_id: record["cycle_id"] as string,
      phase: record["phase"] as IdeasCycleTelemetrySnapshot["phase"],
      mode: record["mode"] as IdeasCycleTelemetrySnapshot["mode"],
      root_event_ids: Array.isArray(record["root_event_ids"])
        ? (record["root_event_ids"] as string[])
        : undefined,
      root_event_count:
        typeof record["root_event_count"] === "number"
          ? (record["root_event_count"] as number)
          : undefined,
      candidate_count: record["candidate_count"] as number,
      admitted_cluster_count: record["admitted_cluster_count"] as number,
      suppression_reason_counts:
        typeof record["suppression_reason_counts"] === "object" &&
        record["suppression_reason_counts"] !== null
          ? (record["suppression_reason_counts"] as IdeasCycleTelemetrySnapshot["suppression_reason_counts"])
          : undefined,
    });
  }

  return snapshots;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs the ideas metrics rollup against real persisted telemetry and queue
 * state files.
 *
 * Returns { ready: true, rollup } when ≥1 cycle snapshot was found.
 * Returns { ready: false, reason, rollup } when no data was available — the
 * rollup still contains a valid zero-state IdeasMetricsRollup so callers can
 * safely read fields without null checks.
 */
export function runMetricsRollup(options: MetricsRunnerOptions): MetricsRunnerResult {
  const { telemetryPath, queueStatePath, now } = options;

  const cycleSnapshots = loadCycleSnapshots(telemetryPath);
  const queueEntries = loadQueueEntries(queueStatePath);

  const rollup = rollupIdeasMetrics({
    cycle_snapshots: cycleSnapshots,
    queue_entries: queueEntries,
    now,
  });

  if (cycleSnapshots.length === 0) {
    const telemetryMissing = !existsSync(telemetryPath);
    const reason = telemetryMissing
      ? `Telemetry file not found: ${telemetryPath}`
      : `No valid cycle telemetry snapshots found in: ${telemetryPath}`;
    return { ready: false, reason, rollup };
  }

  return { ready: true, rollup };
}
