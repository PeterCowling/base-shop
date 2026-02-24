/**
 * lp-do-ideas trial queue and telemetry.
 *
 * Implements the idempotent in-memory trial queue described in:
 *   docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md  (Section 7)
 *
 * Design rules:
 * - Pure in-memory data structure — no file I/O. CLI/persistence is the
 *   caller's responsibility.
 * - Queue state machine is monotonic (forward-only transitions).
 * - Duplicate suppression on both `dispatch_id` and
 *   (artifact_id, before_sha, after_sha) dedupe key.
 * - Telemetry is append-only: one TelemetryRecord per state transition.
 * - Clock is injectable for deterministic tests.
 *
 * Contract: docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md
 * Telemetry schema: docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md
 */

import type {
  DispatchStatus,
  QueueState,
  TrialDispatchPacket,
} from "./lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Re-export types the caller needs without depending on the full orchestrator
// ---------------------------------------------------------------------------

export type { DispatchStatus, QueueState, TrialDispatchPacket };

// ---------------------------------------------------------------------------
// Queue entry
// ---------------------------------------------------------------------------

/** A single entry in the in-memory trial queue. */
export interface QueueEntry {
  /** Unique dispatch identifier (primary key). */
  dispatch_id: string;
  /**
   * Deduplication key: `"<artifact_id>:<before_sha|null>:<after_sha>"`.
   * Used to suppress duplicate events that arrive with different dispatch_ids.
   */
  dedupe_key: string;
  /** Current lifecycle state. Transitions are monotonic (forward-only). */
  queue_state: QueueState;
  /** The validated dispatch packet. Null only when entry is in error state due to validation failure. */
  packet: TrialDispatchPacket | null;
  /** ISO 8601 timestamp from packet.created_at (event clock). */
  event_timestamp: string;
  /** ISO 8601 timestamp when the queue processed/transitioned this entry. */
  processing_timestamp: string;
  /** Human-readable reason for the current state (error diagnostics, skip reason). */
  state_reason: string | null;
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

/** The reason a telemetry record was appended. */
export type TelemetryEventKind =
  | "enqueued"
  | "advanced_to_processed"
  | "advanced_to_error"
  | "skipped_duplicate_dispatch_id"
  | "skipped_duplicate_dedupe_key"
  | "validation_rejected";

/** A single append-only telemetry record. */
export interface TelemetryRecord {
  /** ISO 8601 timestamp when this record was written. */
  recorded_at: string;
  /** The dispatch_id this record pertains to (may be synthetic for validation failures). */
  dispatch_id: string;
  /** What happened. */
  kind: TelemetryEventKind;
  /** Queue state after this transition. */
  queue_state: QueueState;
  /** Optional reason or diagnostic. */
  reason: string | null;
  /** ISO 8601 event timestamp (from packet.created_at). Null when packet was rejected before parsing. */
  event_timestamp: string | null;
  /** ISO 8601 timestamp when processing occurred. */
  processing_timestamp: string;
}

/** Aggregated telemetry counters derived from the telemetry log. */
export interface TelemetryAggregates {
  /** Total dispatches submitted to the queue (including duplicates and errors). */
  dispatch_count: number;
  /** Number of submissions suppressed due to duplicate dispatch_id or dedupe key. */
  duplicate_suppression_count: number;
  /**
   * Total successfully routed dispatches (processed + enqueued).
   * Denominator for route-accuracy measurement.
   */
  route_accuracy_denominator: number;
  /** Count of entries in `processed` state. */
  processed_count: number;
  /** Count of entries in `enqueued` state. */
  enqueued_count: number;
  /** Count of entries in `error` state. */
  error_count: number;
  /** Count of entries in `skipped` state. */
  skipped_count: number;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Reason for a packet validation failure. */
export type ValidationFailureReason =
  | "missing_dispatch_id"
  | "empty_dispatch_id"
  | "wrong_mode"
  | "wrong_schema_version"
  | "empty_evidence_refs"
  | "invalid_status"
  | "missing_required_field";

/** Result of validating a TrialDispatchPacket. */
export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: ValidationFailureReason; detail: string };

const VALID_STATUSES: ReadonlySet<DispatchStatus> = new Set<DispatchStatus>([
  "fact_find_ready",
  "briefing_ready",
  "auto_executed",
  "logged_no_action",
]);

/**
 * Validates a TrialDispatchPacket against the queue's acceptance criteria.
 *
 * Checks:
 * - dispatch_id: present and non-empty
 * - mode: must be "trial"
 * - schema_version: must be "dispatch.v1"
 * - evidence_refs: non-empty array
 * - status: must be a valid DispatchStatus
 */
export function validatePacket(
  packet: Partial<TrialDispatchPacket>,
): ValidationResult {
  // dispatch_id
  if (!("dispatch_id" in packet) || packet.dispatch_id === undefined) {
    return {
      valid: false,
      reason: "missing_dispatch_id",
      detail: "dispatch_id is required",
    };
  }
  if (packet.dispatch_id.trim() === "") {
    return {
      valid: false,
      reason: "empty_dispatch_id",
      detail: "dispatch_id must not be empty",
    };
  }

  // schema_version
  if (packet.schema_version !== "dispatch.v1") {
    return {
      valid: false,
      reason: "wrong_schema_version",
      detail: `schema_version must be "dispatch.v1", got ${JSON.stringify(packet.schema_version)}`,
    };
  }

  // mode
  if (packet.mode !== "trial") {
    return {
      valid: false,
      reason: "wrong_mode",
      detail: `mode must be "trial", got ${JSON.stringify(packet.mode)}`,
    };
  }

  // evidence_refs
  if (
    !Array.isArray(packet.evidence_refs) ||
    packet.evidence_refs.length === 0
  ) {
    return {
      valid: false,
      reason: "empty_evidence_refs",
      detail: "evidence_refs must be a non-empty array",
    };
  }

  // status
  if (
    !packet.status ||
    !VALID_STATUSES.has(packet.status as DispatchStatus)
  ) {
    return {
      valid: false,
      reason: "invalid_status",
      detail: `status "${packet.status}" is not a valid DispatchStatus`,
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Monotonic transition guard
// ---------------------------------------------------------------------------

/**
 * Allowed forward transitions (state machine is monotonic).
 *
 * Rules:
 * - `enqueued` → `processed` | `error`
 * - Any state → `skipped` (idempotency guard fires at any point)
 * - No backward transitions.
 * - `processed` | `error` are terminal (cannot advance further).
 */
const ALLOWED_TRANSITIONS: ReadonlyMap<QueueState, ReadonlySet<QueueState>> =
  new Map([
    ["enqueued", new Set<QueueState>(["processed", "error", "skipped"])],
    ["processed", new Set<QueueState>(["skipped"])],
    ["error", new Set<QueueState>(["skipped"])],
    // skipped is fully terminal
    ["skipped", new Set<QueueState>()],
  ]);

/** Returns true if the transition from → to is permitted. */
function isTransitionAllowed(from: QueueState, to: QueueState): boolean {
  return ALLOWED_TRANSITIONS.get(from)?.has(to) ?? false;
}

// ---------------------------------------------------------------------------
// TrialQueue
// ---------------------------------------------------------------------------

export interface TrialQueueOptions {
  /** Injectable clock for deterministic timestamps in tests. Defaults to () => new Date(). */
  clock?: () => Date;
}

/**
 * In-memory idempotent trial queue.
 *
 * Primary data structure: `Map<dispatch_id, QueueEntry>`.
 * Secondary deduplication index: `Set<dedupe_key>` (artifact-level).
 *
 * Usage:
 * ```typescript
 * const queue = new TrialQueue();
 * const result = queue.enqueue(packet);
 * queue.advance("IDEA-DISPATCH-...", "processed");
 * const telemetry = queue.getTelemetry();
 * const aggregates = queue.getAggregates();
 * ```
 */
export class TrialQueue {
  private readonly entries: Map<string, QueueEntry> = new Map();
  /** Secondary dedup index: maps dedupe_key → dispatch_id of the canonical entry. */
  private readonly dedupeIndex: Map<string, string> = new Map();
  private readonly telemetryLog: TelemetryRecord[] = [];
  private readonly clock: () => Date;

  constructor(options: TrialQueueOptions = {}) {
    this.clock = options.clock ?? (() => new Date());
  }

  // -------------------------------------------------------------------------
  // enqueue
  // -------------------------------------------------------------------------

  /**
   * Submits a dispatch packet to the queue.
   *
   * Steps:
   * 1. Validate packet structure.
   * 2. Check dispatch_id duplicate (primary dedup).
   * 3. Check dedupe_key duplicate (secondary dedup).
   * 4. Create QueueEntry in `enqueued` state.
   * 5. Append telemetry record.
   *
   * Returns:
   * - `{ ok: true; entry: QueueEntry }` on success
   * - `{ ok: false; reason: string; queue_state: "skipped" | "error" }` on failure
   */
  enqueue(
    packet: Partial<TrialDispatchPacket>,
  ):
    | { ok: true; entry: QueueEntry }
    | { ok: false; reason: string; queue_state: "skipped" | "error" } {
    const now = this.clock();
    const processingTimestamp = now.toISOString();

    // Step 1: Validate
    const validation = validatePacket(packet);
    if (!validation.valid) {
      const syntheticId =
        typeof (packet as Record<string, unknown>).dispatch_id === "string" &&
        ((packet as Record<string, unknown>).dispatch_id as string).length > 0
          ? ((packet as Record<string, unknown>).dispatch_id as string)
          : `REJECTED-${processingTimestamp}`;

      this.telemetryLog.push({
        recorded_at: processingTimestamp,
        dispatch_id: syntheticId,
        kind: "validation_rejected",
        queue_state: "error",
        reason: `${validation.reason}: ${validation.detail}`,
        event_timestamp: null,
        processing_timestamp: processingTimestamp,
      });

      return {
        ok: false,
        reason: `${validation.reason}: ${validation.detail}`,
        queue_state: "error",
      };
    }

    // Safe to cast: validation confirmed required fields present
    const validPacket = packet as TrialDispatchPacket;
    const dispatchId = validPacket.dispatch_id;
    const eventTimestamp = validPacket.created_at ?? processingTimestamp;

    // Step 2: dispatch_id primary dedup
    if (this.entries.has(dispatchId)) {
      const existing = this.entries.get(dispatchId)!;
      this.telemetryLog.push({
        recorded_at: processingTimestamp,
        dispatch_id: dispatchId,
        kind: "skipped_duplicate_dispatch_id",
        queue_state: "skipped",
        reason: `Duplicate dispatch_id "${dispatchId}" — already in state "${existing.queue_state}"`,
        event_timestamp: eventTimestamp,
        processing_timestamp: processingTimestamp,
      });
      return {
        ok: false,
        reason: `Duplicate dispatch_id: ${dispatchId}`,
        queue_state: "skipped",
      };
    }

    // Step 3: dedupe key secondary dedup
    const dedupeKey = buildDedupeKeyFromPacket(validPacket);
    if (this.dedupeIndex.has(dedupeKey)) {
      const canonicalId = this.dedupeIndex.get(dedupeKey)!;
      this.telemetryLog.push({
        recorded_at: processingTimestamp,
        dispatch_id: dispatchId,
        kind: "skipped_duplicate_dedupe_key",
        queue_state: "skipped",
        reason: `Duplicate dedupe key "${dedupeKey}" — canonical dispatch_id is "${canonicalId}"`,
        event_timestamp: eventTimestamp,
        processing_timestamp: processingTimestamp,
      });
      return {
        ok: false,
        reason: `Duplicate dedupe key for dispatch ${dispatchId} (canonical: ${canonicalId})`,
        queue_state: "skipped",
      };
    }

    // Step 4: create entry
    const entry: QueueEntry = {
      dispatch_id: dispatchId,
      dedupe_key: dedupeKey,
      queue_state: "enqueued",
      packet: validPacket,
      event_timestamp: eventTimestamp,
      processing_timestamp: processingTimestamp,
      state_reason: null,
    };

    this.entries.set(dispatchId, entry);
    this.dedupeIndex.set(dedupeKey, dispatchId);

    // Step 5: telemetry
    this.telemetryLog.push({
      recorded_at: processingTimestamp,
      dispatch_id: dispatchId,
      kind: "enqueued",
      queue_state: "enqueued",
      reason: null,
      event_timestamp: eventTimestamp,
      processing_timestamp: processingTimestamp,
    });

    return { ok: true, entry };
  }

  // -------------------------------------------------------------------------
  // advance
  // -------------------------------------------------------------------------

  /**
   * Advances a queue entry to a new state.
   *
   * Enforces monotonic state machine: only forward transitions are permitted.
   * Appends a telemetry record for the transition.
   *
   * @param dispatchId - The dispatch_id of the entry to transition.
   * @param newState - The target QueueState.
   * @param reason - Optional human-readable reason for the transition.
   *
   * Returns:
   * - `{ ok: true; entry: QueueEntry }` on success
   * - `{ ok: false; reason: string }` on failure (entry not found, invalid transition)
   */
  advance(
    dispatchId: string,
    newState: QueueState,
    reason?: string,
  ):
    | { ok: true; entry: QueueEntry }
    | { ok: false; reason: string } {
    const now = this.clock();
    const processingTimestamp = now.toISOString();

    const entry = this.entries.get(dispatchId);
    if (!entry) {
      return {
        ok: false,
        reason: `dispatch_id "${dispatchId}" not found in queue`,
      };
    }

    if (entry.queue_state === newState) {
      return {
        ok: false,
        reason: `dispatch_id "${dispatchId}" is already in state "${newState}"`,
      };
    }

    if (!isTransitionAllowed(entry.queue_state, newState)) {
      return {
        ok: false,
        reason:
          `Invalid transition for dispatch_id "${dispatchId}": ` +
          `"${entry.queue_state}" → "${newState}" is not permitted by the monotonic state machine`,
      };
    }

    // Apply transition
    entry.queue_state = newState;
    entry.processing_timestamp = processingTimestamp;
    entry.state_reason = reason ?? null;

    // Map newState → telemetry kind
    const kind = stateToTelemetryKind(newState);

    this.telemetryLog.push({
      recorded_at: processingTimestamp,
      dispatch_id: dispatchId,
      kind,
      queue_state: newState,
      reason: reason ?? null,
      event_timestamp: entry.event_timestamp,
      processing_timestamp: processingTimestamp,
    });

    return { ok: true, entry };
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  /** Returns the QueueEntry for a given dispatch_id, or undefined. */
  getEntry(dispatchId: string): QueueEntry | undefined {
    return this.entries.get(dispatchId);
  }

  /**
   * Returns all queue entries sorted deterministically by:
   *   1. event_timestamp ascending (ISO 8601 lexicographic)
   *   2. dispatch_id ascending (lexicographic tiebreaker)
   */
  listEntries(): QueueEntry[] {
    return [...this.entries.values()].sort((a, b) => {
      const tsCmp = a.event_timestamp.localeCompare(b.event_timestamp);
      if (tsCmp !== 0) return tsCmp;
      return a.dispatch_id.localeCompare(b.dispatch_id);
    });
  }

  /** Returns the append-only telemetry log. The returned array is a snapshot copy. */
  getTelemetry(): TelemetryRecord[] {
    return [...this.telemetryLog];
  }

  /** Computes aggregated telemetry counters from the current log and entry map. */
  getAggregates(): TelemetryAggregates {
    let dispatchCount = 0;
    let duplicateSuppression = 0;
    let processedCount = 0;
    let enqueuedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const record of this.telemetryLog) {
      dispatchCount++;
      if (
        record.kind === "skipped_duplicate_dispatch_id" ||
        record.kind === "skipped_duplicate_dedupe_key"
      ) {
        duplicateSuppression++;
      }
    }

    for (const entry of this.entries.values()) {
      switch (entry.queue_state) {
        case "processed":
          processedCount++;
          break;
        case "enqueued":
          enqueuedCount++;
          break;
        case "error":
          errorCount++;
          break;
        case "skipped":
          skippedCount++;
          break;
      }
    }

    return {
      dispatch_count: dispatchCount,
      duplicate_suppression_count: duplicateSuppression,
      route_accuracy_denominator: processedCount + enqueuedCount,
      processed_count: processedCount,
      enqueued_count: enqueuedCount,
      error_count: errorCount,
      skipped_count: skippedCount,
    };
  }

  /** Returns the number of entries currently in the queue (all states). */
  size(): number {
    return this.entries.size;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Builds the dedupe key for an already-validated packet.
 * Format: "<artifact_id>:<before_sha|null>:<after_sha>"
 * Mirrors buildDedupeKey() in lp-do-ideas-trial.ts but operates on a packet.
 */
function buildDedupeKeyFromPacket(packet: TrialDispatchPacket): string {
  return `${packet.artifact_id}:${packet.before_sha ?? "null"}:${packet.after_sha}`;
}

/** Maps a QueueState to the appropriate TelemetryEventKind for an advance() call. */
function stateToTelemetryKind(state: QueueState): TelemetryEventKind {
  switch (state) {
    case "processed":
      return "advanced_to_processed";
    case "error":
      return "advanced_to_error";
    case "skipped":
      // Reached via advance() rather than enqueue() — still a skip
      return "skipped_duplicate_dispatch_id";
    default:
      // enqueued is only set at creation time, not via advance()
      return "enqueued";
  }
}
