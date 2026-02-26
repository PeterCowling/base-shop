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
 * - Duplicate suppression on both `dispatch_id` and dual dedupe keys:
 *   v1 legacy tuple + v2 cluster key/fingerprint.
 * - Telemetry is append-only: one TelemetryRecord per state transition.
 * - Clock is injectable for deterministic tests.
 *
 * Contract: docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md
 * Telemetry schema: docs/business-os/startup-loop/ideas/lp-do-ideas-telemetry.schema.md
 */

import { createHash } from "node:crypto";

import type {
  DispatchStatus,
  QueueState,
  TrialDispatchPacket,
} from "./lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Re-export types the caller needs without depending on the full orchestrator
// ---------------------------------------------------------------------------

export type { DispatchStatus, QueueState, TrialDispatchPacket };

export type QueueLane = "DO" | "IMPROVE";

export interface LaneWipCaps {
  DO: number;
  IMPROVE: number;
}

export interface LaneActiveCounts {
  DO: number;
  IMPROVE: number;
}

export interface LaneSchedulerOptions {
  wip_caps: LaneWipCaps;
  active_counts?: Partial<LaneActiveCounts>;
  now?: Date;
  max_dispatches?: number;
  aging_window_hours?: number;
}

export interface ScheduledDispatch {
  dispatch_id: string;
  lane: QueueLane;
  /**
   * Legacy display field — reflects the original packet priority tier (P1/P2/P3),
   * not the classifier-based sort rank. Sort order is determined by `score`.
   * When a classified entry outranks an unclassified one, this field still shows
   * the packet's original priority label.
   */
  priority: "P1" | "P2" | "P3";
  age_hours: number;
  score: number;
}

export interface ReassignLaneOptions {
  override?: boolean;
  reason?: string;
}

export interface EnqueueOptions {
  lane?: QueueLane;
}

// ---------------------------------------------------------------------------
// Queue entry
// ---------------------------------------------------------------------------

/** A single entry in the in-memory trial queue. */
export interface QueueEntry {
  /** Unique dispatch identifier (primary key). */
  dispatch_id: string;
  /**
   * Compatibility alias of dedupe_key_v2 for existing queue-state readers.
   */
  dedupe_key: string;
  /** Legacy dedupe key: `<artifact_id>:<before_sha|null>:<after_sha>` (nullable for non-artifact events). */
  dedupe_key_v1: string | null;
  /** Cluster dedupe key: `<cluster_key>:<cluster_fingerprint>`. */
  dedupe_key_v2: string;
  /** Current lifecycle state. Transitions are monotonic (forward-only). */
  queue_state: QueueState;
  /** Logical queue lane assigned at admission (`DO` or `IMPROVE`). */
  lane: QueueLane;
  /** The validated dispatch packet. Null only when entry is in error state due to validation failure. */
  packet: TrialDispatchPacket | null;
  /** ISO 8601 timestamp from packet.created_at (event clock). */
  event_timestamp: string;
  /** ISO 8601 timestamp when the queue processed/transitioned this entry. */
  processing_timestamp: string;
  /** Human-readable reason for the current state (error diagnostics, skip reason). */
  state_reason: string | null;
  /**
   * Classifier output injected after enqueue. Optional — absent when the idea has not
   * been classified yet. When present, `planNextDispatches()` uses `effective_priority_rank`
   * and urgency/effort to compute a classifier-aware scheduling score that outranks any
   * unclassified entry.
   */
  classification?: {
    /** Numeric rank from the classifier (1=P0 highest … 10=P5 lowest). Lower = higher priority. */
    effective_priority_rank: number;
    /** Urgency code from the classifier (U0–U3). */
    urgency: string;
    /** Effort estimate from the classifier (XS/S/M/L/XL). */
    effort: string;
  };
}

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

/** The reason a telemetry record was appended. */
export type TelemetryEventKind =
  | "enqueued"
  | "advanced_to_processed"
  | "advanced_to_error"
  | "lane_reassigned"
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

const LANE_SEQUENCE: readonly QueueLane[] = ["DO", "IMPROVE"];
const DEFAULT_AGING_WINDOW_HOURS = 24;

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

function coerceNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.floor(value));
}

function computeAvailableLaneSlots(
  wipCaps: LaneWipCaps,
  activeCounts?: Partial<LaneActiveCounts>,
): LaneWipCaps {
  const doCap = coerceNonNegativeInteger(wipCaps.DO);
  const improveCap = coerceNonNegativeInteger(wipCaps.IMPROVE);

  const doActive = coerceNonNegativeInteger(activeCounts?.DO ?? 0);
  const improveActive = coerceNonNegativeInteger(activeCounts?.IMPROVE ?? 0);

  return {
    DO: Math.max(0, doCap - doActive),
    IMPROVE: Math.max(0, improveCap - improveActive),
  };
}

function priorityBaseScore(priority: "P1" | "P2" | "P3"): number {
  switch (priority) {
    case "P1":
      return 300;
    case "P2":
      return 200;
    case "P3":
      return 100;
    default:
      return 0;
  }
}

/**
 * Maps a classifier urgency code to a numeric rank (lower = more urgent).
 * Unknown codes map to 4 (treated as lower urgency than U3).
 */
function urgencyRank(u: string): number {
  switch (u) {
    case "U0": return 0;
    case "U1": return 1;
    case "U2": return 2;
    case "U3": return 3;
    default:   return 4;
  }
}

/**
 * Maps a classifier effort estimate to a numeric rank (lower = less effort).
 * Unknown codes map to 5.
 */
function effortRank(e: string): number {
  switch (e) {
    case "XS": return 0;
    case "S":  return 1;
    case "M":  return 2;
    case "L":  return 3;
    case "XL": return 4;
    default:   return 5;
  }
}

/**
 * Scores a classified entry using a composite formula that guarantees all
 * classified entries outrank any unclassified entry.
 *
 * Formula: 10000 - (urgencyRank * 1000) - (effective_priority_rank * 10) + (5 - effortRank)
 *
 * Score bands:
 * - Classified entries: 5_006 – 9_959  (always above max unclassified)
 * - Unclassified entries: ≤ 500 + 100  (max is P1 + full aging window)
 */
function computeClassifiedScore(classification: {
  effective_priority_rank: number;
  urgency: string;
  effort: string;
}): number {
  const ur = urgencyRank(classification.urgency);
  const er = effortRank(classification.effort);
  return 10000 - ur * 1000 - classification.effective_priority_rank * 10 + (5 - er);
}

function computeSchedulingScore(
  priority: "P1" | "P2" | "P3",
  ageHours: number,
  agingWindowHours: number,
  classification?: QueueEntry["classification"],
): number {
  if (classification !== undefined) {
    return computeClassifiedScore(classification);
  }
  const normalizedAge = Math.max(0, ageHours);
  const agingMultiplier = normalizedAge / Math.max(1, agingWindowHours);
  return priorityBaseScore(priority) + agingMultiplier * 100;
}

function computeAgeHours(eventTimestamp: string, nowMs: number): number {
  const eventMs = Date.parse(eventTimestamp);
  if (Number.isNaN(eventMs)) {
    return 0;
  }
  const deltaMs = Math.max(0, nowMs - eventMs);
  return deltaMs / (60 * 60 * 1000);
}

function normalizeLaneToken(value: string): QueueLane | null {
  const normalized = value.trim().toUpperCase();
  if (normalized === "DO" || normalized === "IMPROVE") {
    return normalized;
  }
  return null;
}

function resolveAdmissionLane(
  packet: TrialDispatchPacket,
  explicitLane?: QueueLane,
): QueueLane {
  if (explicitLane) {
    return explicitLane;
  }

  const rawLane = (packet as unknown as Record<string, unknown>).lane;
  if (typeof rawLane === "string") {
    const lane = normalizeLaneToken(rawLane);
    if (lane) {
      return lane;
    }
  }

  if (packet.status === "fact_find_ready") {
    return "DO";
  }
  return "IMPROVE";
}

function tryTakeNextLaneDispatch(
  lane: QueueLane,
  candidates: Record<QueueLane, ScheduledDispatch[]>,
  availableSlots: LaneWipCaps,
): ScheduledDispatch | null {
  if (availableSlots[lane] <= 0) {
    return null;
  }
  const candidate = candidates[lane].shift();
  if (!candidate) {
    return null;
  }
  availableSlots[lane] -= 1;
  return candidate;
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
 * Secondary deduplication indexes:
 * - v1 tuple index for legacy compatibility (`dedupe_key_v1`)
 * - v2 cluster index for primary suppression (`dedupe_key_v2`)
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
  /** Secondary dedup index (legacy): dedupe_key_v1 → dispatch_id of canonical entry. */
  private readonly dedupeIndexV1: Map<string, string> = new Map();
  /** Secondary dedup index (cluster): dedupe_key_v2 → dispatch_id of canonical entry. */
  private readonly dedupeIndexV2: Map<string, string> = new Map();
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
   * 3. Check dedupe keys duplicate (secondary dedup: v2 then v1).
   * 4. Create QueueEntry in `enqueued` state.
   * 5. Append telemetry record.
   *
   * Returns:
   * - `{ ok: true; entry: QueueEntry }` on success
   * - `{ ok: false; reason: string; queue_state: "skipped" | "error" }` on failure
   */
  enqueue(
    packet: Partial<TrialDispatchPacket>,
    enqueueOptions: EnqueueOptions = {},
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
    let validPacket = packet as TrialDispatchPacket;
    let dispatchId = validPacket.dispatch_id;
    const eventTimestamp = validPacket.created_at ?? processingTimestamp;
    const lane = resolveAdmissionLane(validPacket, enqueueOptions.lane);
    const dedupeKeyV2 = buildDedupeKeyV2FromPacket(validPacket);
    const dedupeKeyV1 = buildDedupeKeyV1FromPacket(validPacket);

    // Step 2: dispatch_id primary dedup. If the ID collides but dedupe keys
    // differ, remint dispatch_id to preserve the distinct dispatch.
    const existingByDispatchId = this.entries.get(dispatchId);
    if (existingByDispatchId) {
      const sameV2 = existingByDispatchId.dedupe_key_v2 === dedupeKeyV2;
      const sameV1 =
        dedupeKeyV1 !== null &&
        existingByDispatchId.dedupe_key_v1 === dedupeKeyV1;

      if (sameV2 || sameV1) {
        this.telemetryLog.push({
          recorded_at: processingTimestamp,
          dispatch_id: dispatchId,
          kind: "skipped_duplicate_dispatch_id",
          queue_state: "skipped",
          reason: `Duplicate dispatch_id "${dispatchId}" — already in state "${existingByDispatchId.queue_state}"`,
          event_timestamp: eventTimestamp,
          processing_timestamp: processingTimestamp,
        });
        return {
          ok: false,
          reason: `Duplicate dispatch_id: ${dispatchId}`,
          queue_state: "skipped",
        };
      }

      const remintedDispatchId = mintCollisionDispatchId(
        dispatchId,
        processingTimestamp,
        this.entries,
      );
      dispatchId = remintedDispatchId;
      validPacket = {
        ...validPacket,
        dispatch_id: remintedDispatchId,
      };
    }

    // Step 3: dedupe key secondary dedup (v2 first, then v1 compatibility)

    if (this.dedupeIndexV2.has(dedupeKeyV2)) {
      const canonicalId = this.dedupeIndexV2.get(dedupeKeyV2)!;
      const attachment = attachEvidenceToCanonicalEntry(
        this.entries.get(canonicalId),
        validPacket,
      );
      const attachmentSummary =
        attachment.evidence_added_count > 0 ||
        attachment.location_added_count > 0
          ? `; attached_evidence=${attachment.evidence_added_count}; attached_locations=${attachment.location_added_count}`
          : "";
      this.telemetryLog.push({
        recorded_at: processingTimestamp,
        dispatch_id: dispatchId,
        kind: "skipped_duplicate_dedupe_key",
        queue_state: "skipped",
        reason:
          `Duplicate dedupe key v2 "${dedupeKeyV2}" — canonical dispatch_id is "${canonicalId}"` +
          attachmentSummary,
        event_timestamp: eventTimestamp,
        processing_timestamp: processingTimestamp,
      });
      return {
        ok: false,
        reason:
          `Duplicate dedupe key v2 for dispatch ${dispatchId} ` +
          `(canonical: ${canonicalId})${attachmentSummary}`,
        queue_state: "skipped",
      };
    }

    if (dedupeKeyV1 && this.dedupeIndexV1.has(dedupeKeyV1)) {
      const canonicalId = this.dedupeIndexV1.get(dedupeKeyV1)!;
      this.telemetryLog.push({
        recorded_at: processingTimestamp,
        dispatch_id: dispatchId,
        kind: "skipped_duplicate_dedupe_key",
        queue_state: "skipped",
        reason: `Duplicate dedupe key v1 "${dedupeKeyV1}" — canonical dispatch_id is "${canonicalId}"`,
        event_timestamp: eventTimestamp,
        processing_timestamp: processingTimestamp,
      });
      return {
        ok: false,
        reason:
          `Duplicate dedupe key v1 for dispatch ${dispatchId} ` +
          `(canonical: ${canonicalId})`,
        queue_state: "skipped",
      };
    }

    // Step 4: create entry
    const entry: QueueEntry = {
      dispatch_id: dispatchId,
      dedupe_key: dedupeKeyV2,
      dedupe_key_v1: dedupeKeyV1,
      dedupe_key_v2: dedupeKeyV2,
      queue_state: "enqueued",
      lane,
      packet: validPacket,
      event_timestamp: eventTimestamp,
      processing_timestamp: processingTimestamp,
      state_reason: null,
    };

    this.entries.set(dispatchId, entry);
    this.dedupeIndexV2.set(dedupeKeyV2, dispatchId);
    if (dedupeKeyV1) {
      this.dedupeIndexV1.set(dedupeKeyV1, dispatchId);
    }

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

  /**
   * Reassigns a queue entry to a different lane.
   *
   * This operation is protected by an explicit override requirement to prevent
   * accidental lane churn.
   */
  reassignLane(
    dispatchId: string,
    nextLane: QueueLane,
    options: ReassignLaneOptions = {},
  ):
    | { ok: true; entry: QueueEntry }
    | { ok: false; reason: string } {
    const entry = this.entries.get(dispatchId);
    if (!entry) {
      return {
        ok: false,
        reason: `dispatch_id "${dispatchId}" not found in queue`,
      };
    }

    if (!options.override) {
      return {
        ok: false,
        reason:
          `Lane reassignment for dispatch_id "${dispatchId}" requires explicit override. ` +
          `Call reassignLane(..., { override: true, reason: "..." }).`,
      };
    }

    const reason = options.reason?.trim() ?? "";
    if (reason.length === 0) {
      return {
        ok: false,
        reason:
          `Lane reassignment for dispatch_id "${dispatchId}" requires a non-empty reason.`,
      };
    }

    if (entry.lane === nextLane) {
      return {
        ok: false,
        reason:
          `dispatch_id "${dispatchId}" is already assigned to lane "${nextLane}"`,
      };
    }

    const processingTimestamp = this.clock().toISOString();
    const previousLane = entry.lane;
    entry.lane = nextLane;
    entry.processing_timestamp = processingTimestamp;
    entry.state_reason = reason;

    this.telemetryLog.push({
      recorded_at: processingTimestamp,
      dispatch_id: dispatchId,
      kind: "lane_reassigned",
      queue_state: entry.queue_state,
      reason: `lane_reassigned:${previousLane}->${nextLane}; reason=${reason}`,
      event_timestamp: entry.event_timestamp,
      processing_timestamp: processingTimestamp,
    });

    return { ok: true, entry };
  }

  /**
   * Computes the next dispatches to execute under lane-specific WIP caps.
   *
   * The scheduler is non-mutating: it returns a deterministic plan snapshot
   * without changing queue state.
   */
  planNextDispatches(options: LaneSchedulerOptions): ScheduledDispatch[] {
    const now = options.now ?? this.clock();
    const nowMs = now.getTime();
    const maxDispatches = Math.max(0, options.max_dispatches ?? Number.MAX_SAFE_INTEGER);
    const agingWindowHours = Math.max(
      1,
      options.aging_window_hours ?? DEFAULT_AGING_WINDOW_HOURS,
    );
    const availableByLane = computeAvailableLaneSlots(
      options.wip_caps,
      options.active_counts,
    );

    const laneCandidates: Record<QueueLane, ScheduledDispatch[]> = {
      DO: [],
      IMPROVE: [],
    };

    for (const entry of this.entries.values()) {
      if (entry.queue_state !== "enqueued" || !entry.packet) {
        continue;
      }

      const ageHours = computeAgeHours(entry.event_timestamp, nowMs);
      const score = computeSchedulingScore(
        entry.packet.priority,
        ageHours,
        agingWindowHours,
        entry.classification,
      );

      laneCandidates[entry.lane].push({
        dispatch_id: entry.dispatch_id,
        lane: entry.lane,
        priority: entry.packet.priority,
        age_hours: ageHours,
        score,
      });
    }

    for (const lane of LANE_SEQUENCE) {
      laneCandidates[lane].sort((left, right) => {
        if (left.score !== right.score) {
          return right.score - left.score;
        }
        const leftEntry = this.entries.get(left.dispatch_id);
        const rightEntry = this.entries.get(right.dispatch_id);
        const leftTimestamp = leftEntry?.event_timestamp ?? "";
        const rightTimestamp = rightEntry?.event_timestamp ?? "";
        const tsCmp = leftTimestamp.localeCompare(rightTimestamp);
        if (tsCmp !== 0) {
          return tsCmp;
        }
        return left.dispatch_id.localeCompare(right.dispatch_id);
      });
    }

    const planned: ScheduledDispatch[] = [];
    let totalRemaining = Math.min(
      maxDispatches,
      availableByLane.DO + availableByLane.IMPROVE,
    );
    let laneCursor = 0;

    while (totalRemaining > 0) {
      const lane = LANE_SEQUENCE[laneCursor % LANE_SEQUENCE.length];
      const alternateLane =
        lane === "DO"
          ? "IMPROVE"
          : "DO";

      const preferredDispatch = tryTakeNextLaneDispatch(
        lane,
        laneCandidates,
        availableByLane,
      );
      const selectedDispatch =
        preferredDispatch ??
        tryTakeNextLaneDispatch(
          alternateLane,
          laneCandidates,
          availableByLane,
        );

      if (!selectedDispatch) {
        break;
      }

      planned.push(selectedDispatch);
      totalRemaining -= 1;
      laneCursor += 1;
    }

    return planned;
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

const DISPATCH_ID_PATTERN = /^IDEA-DISPATCH-(\d{14})-(\d{4})$/;
const MAX_DISPATCH_SEQUENCE = 9999;

function padNumber(value: number, length: number): string {
  return String(value).padStart(length, "0");
}

function formatDispatchId(timestampToken: string, seq: number): string {
  return `IDEA-DISPATCH-${timestampToken}-${padNumber(seq, 4)}`;
}

function isoToDispatchTimestamp(isoValue: string): string {
  const dateValue = new Date(isoValue);
  if (Number.isNaN(dateValue.getTime())) {
    return "19700101000000";
  }
  return (
    `${dateValue.getUTCFullYear()}` +
    `${padNumber(dateValue.getUTCMonth() + 1, 2)}` +
    `${padNumber(dateValue.getUTCDate(), 2)}` +
    `${padNumber(dateValue.getUTCHours(), 2)}` +
    `${padNumber(dateValue.getUTCMinutes(), 2)}` +
    `${padNumber(dateValue.getUTCSeconds(), 2)}`
  );
}

function mintDispatchIdWithPrefix(
  timestampToken: string,
  startSeq: number,
  entries: ReadonlyMap<string, QueueEntry>,
): string | null {
  const normalizedStart =
    ((Math.max(1, startSeq) - 1) % MAX_DISPATCH_SEQUENCE) + 1;
  for (let offset = 0; offset < MAX_DISPATCH_SEQUENCE; offset += 1) {
    const seq = ((normalizedStart - 1 + offset) % MAX_DISPATCH_SEQUENCE) + 1;
    const candidate = formatDispatchId(timestampToken, seq);
    if (!entries.has(candidate)) {
      return candidate;
    }
  }
  return null;
}

function mintCollisionDispatchId(
  dispatchId: string,
  processingTimestamp: string,
  entries: ReadonlyMap<string, QueueEntry>,
): string {
  const parsed = DISPATCH_ID_PATTERN.exec(dispatchId);
  if (parsed) {
    const [, timestampToken, seqToken] = parsed;
    const startSeq = Number.parseInt(seqToken, 10) + 1;
    const candidate = mintDispatchIdWithPrefix(timestampToken, startSeq, entries);
    if (candidate) {
      return candidate;
    }
  }

  const fallbackTimestamp = isoToDispatchTimestamp(processingTimestamp);
  const fallbackCandidate = mintDispatchIdWithPrefix(
    fallbackTimestamp,
    1,
    entries,
  );
  if (fallbackCandidate) {
    return fallbackCandidate;
  }

  throw new Error(
    "Unable to mint unique dispatch_id after collision (all sequence slots exhausted).",
  );
}

/**
 * Builds the v1 dedupe key for an already-validated packet.
 * Format: "<artifact_id>:<before_sha|null>:<after_sha>".
 * Returns null when required fields are absent (for compatibility with
 * non-artifact dispatches such as operator injects).
 */
function buildDedupeKeyV1FromPacket(packet: TrialDispatchPacket): string | null {
  const artifactId = readPacketString(packet, "artifact_id");
  const afterSha = readPacketString(packet, "after_sha");
  if (!artifactId || !afterSha) {
    return null;
  }

  const beforeSha = readPacketString(packet, "before_sha");
  return `${artifactId}:${beforeSha ?? "null"}:${afterSha}`;
}

/**
 * Builds the v2 dedupe key for an already-validated packet.
 * Format: "<cluster_key>:<cluster_fingerprint>".
 *
 * For legacy packets that do not carry cluster fields, this function falls back
 * to deterministic construction from stable packet fields.
 */
function buildDedupeKeyV2FromPacket(packet: TrialDispatchPacket): string {
  const rootEventId =
    readPacketString(packet, "root_event_id") ??
    buildFallbackRootEventId(packet);
  const anchorKey =
    readPacketString(packet, "anchor_key") ??
    normalizeKeyToken(readPacketString(packet, "area_anchor") ?? "unknown");
  const clusterKey =
    readPacketString(packet, "cluster_key") ??
    buildFallbackClusterKey(packet, rootEventId, anchorKey);
  const clusterFingerprint =
    readPacketString(packet, "cluster_fingerprint") ??
    buildFallbackClusterFingerprint(packet, rootEventId, anchorKey);

  return `${clusterKey}:${clusterFingerprint}`;
}

function normalizeKeyToken(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized.length > 0 ? normalized : "unknown";
}

function sha256(input: string): string {
  // Use sha256 so dedupe keys remain deterministic across runtimes.
  return createHash("sha256").update(input, "utf-8").digest("hex");
}

function readPacketString(
  packet: TrialDispatchPacket,
  key: string,
): string | null {
  const value = (packet as unknown as Record<string, unknown>)[key];
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildFallbackRootEventId(packet: TrialDispatchPacket): string {
  const artifactId = readPacketString(packet, "artifact_id");
  const afterSha = readPacketString(packet, "after_sha");
  if (artifactId && afterSha) {
    return `${artifactId}:${afterSha}`;
  }
  return `dispatch:${readPacketString(packet, "dispatch_id") ?? "unknown"}`;
}

function buildFallbackClusterKey(
  packet: TrialDispatchPacket,
  rootEventId: string,
  anchorKey: string,
): string {
  const business = normalizeKeyToken(readPacketString(packet, "business") ?? "unknown");
  return `${business}:unknown:${anchorKey}:${rootEventId}`;
}

function readEvidenceRefs(packet: TrialDispatchPacket): string[] {
  const value = (packet as unknown as Record<string, unknown>).evidence_refs;
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .sort((left, right) => left.localeCompare(right));
}

function readLocationAnchors(packet: TrialDispatchPacket): string[] {
  const value = (packet as unknown as Record<string, unknown>).location_anchors;
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function mergeUniqueSorted(
  existing: readonly string[],
  incoming: readonly string[],
): { merged: string[]; addedCount: number } {
  const mergedSet = new Set(existing.map((value) => value.trim()).filter((value) => value.length > 0));
  let addedCount = 0;
  for (const candidate of incoming) {
    const normalized = candidate.trim();
    if (normalized.length === 0) {
      continue;
    }
    if (!mergedSet.has(normalized)) {
      mergedSet.add(normalized);
      addedCount += 1;
    }
  }
  return {
    merged: [...mergedSet].sort((left, right) => left.localeCompare(right)),
    addedCount,
  };
}

function attachEvidenceToCanonicalEntry(
  canonicalEntry: QueueEntry | undefined,
  incomingPacket: TrialDispatchPacket,
): { evidence_added_count: number; location_added_count: number } {
  if (!canonicalEntry?.packet) {
    return {
      evidence_added_count: 0,
      location_added_count: 0,
    };
  }

  const canonicalPacket = canonicalEntry.packet;
  const mergedEvidence = mergeUniqueSorted(
    readEvidenceRefs(canonicalPacket),
    readEvidenceRefs(incomingPacket),
  );
  if (mergedEvidence.merged.length > 0) {
    canonicalPacket.evidence_refs = mergedEvidence.merged as [string, ...string[]];
  }

  const mergedLocations = mergeUniqueSorted(
    readLocationAnchors(canonicalPacket),
    readLocationAnchors(incomingPacket),
  );
  if (mergedLocations.merged.length > 0) {
    canonicalPacket.location_anchors = mergedLocations.merged as [string, ...string[]];
  }

  return {
    evidence_added_count: mergedEvidence.addedCount,
    location_added_count: mergedLocations.addedCount,
  };
}

function buildFallbackClusterFingerprint(
  packet: TrialDispatchPacket,
  rootEventId: string,
  anchorKey: string,
): string {
  const evidenceRefs = readEvidenceRefs(packet).join("|");
  const artifactId = readPacketString(packet, "artifact_id") ?? "unknown-artifact";
  const beforeSha = readPacketString(packet, "before_sha") ?? "null";
  const afterSha = readPacketString(packet, "after_sha") ?? "unknown-after";
  return sha256(
    [rootEventId, anchorKey, artifactId, beforeSha, afterSha, evidenceRefs].join("\n"),
  );
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
