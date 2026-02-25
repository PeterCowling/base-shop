/**
 * lp-do-ideas persistence adapter.
 *
 * Provides deterministic, atomic file-backed persistence for the lp-do-ideas
 * dispatch queue state and telemetry JSONL stream.
 *
 * Design rules:
 * - Atomic writes via write-to-temp-then-rename (crash-safe).
 * - Queue state deduplication by dispatch_id (idempotent admissions).
 * - Telemetry deduplication by dispatch_id+recorded_at (append-only semantics).
 * - Malformed input fails closed: no partial writes on bad input.
 * - No dependencies on in-memory queue objects — operates purely on serialized state.
 *
 * Contract: docs/business-os/startup-loop/ideas/lp-do-ideas-trial-contract.md
 * Seam:     docs/business-os/startup-loop/ideas/lp-do-ideas-go-live-seam.md
 */

import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";

import type { LiveDispatchPacket } from "./lp-do-ideas-live.js";
import type { QueueState, TrialDispatchPacket } from "./lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Union of all persisted packet types. */
export type PersistedPacket = TrialDispatchPacket | LiveDispatchPacket;

/** A single entry in the persisted queue state. */
export interface PersistedQueueEntry {
  /** Primary key. */
  dispatch_id: string;
  /** Current lifecycle state. */
  queue_state: QueueState;
  /** ISO-8601: when this entry was first admitted to the queue. */
  dispatched_at: string;
  /** The original dispatch packet. */
  packet: PersistedPacket;
}

/**
 * Serializable queue state snapshot.
 * Written atomically to `<namespace>/queue-state.json`.
 */
export interface PersistedQueueState {
  schema_version: "queue-state.v1";
  /** "trial" or "live" — determines which orchestrator produced the packets. */
  mode: "trial" | "live";
  /** Business identifier. */
  business: string;
  /** ISO-8601: when this snapshot was last written. */
  generated_at: string;
  /** All admitted queue entries. */
  entries: PersistedQueueEntry[];
}

/**
 * A single JSONL telemetry record appended to `<namespace>/telemetry.jsonl`.
 */
export interface PersistedTelemetryRecord {
  /** ISO-8601: when this record was written. */
  recorded_at: string;
  /** The dispatch_id this record pertains to. */
  dispatch_id: string;
  /** "trial" or "live". */
  mode: "trial" | "live";
  /** Business identifier. */
  business: string;
  /** Queue state at time of record. */
  queue_state: QueueState;
  /** Kind of event (mirrors TelemetryEventKind in the queue module). */
  kind: string;
  /** Optional human-readable reason. */
  reason: string | null;
}

// ---------------------------------------------------------------------------
// Options and result types for persistOrchestratorResult
// ---------------------------------------------------------------------------

export interface PersistenceOptions {
  /** Path to the queue-state JSON file (created or updated). */
  queueStatePath: string;
  /** Path to the telemetry JSONL file (created or appended). */
  telemetryPath: string;
  /** Mode of the orchestrator run. */
  mode: "trial" | "live";
  /** Business identifier. */
  business: string;
  /** Dispatched packets from the orchestrator result. */
  dispatched: PersistedPacket[];
  /** Injectable clock for deterministic tests. */
  clock?: () => Date;
}

export interface PersistenceResult {
  ok: boolean;
  /** Number of new entries written to the queue state. */
  new_entries_written: number;
  /** Number of new telemetry records appended. */
  telemetry_records_written: number;
  /** Present when ok is false. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Atomic write helper
// ---------------------------------------------------------------------------

/**
 * Writes content to a temp file in the same directory as `targetPath`,
 * then renames it to `targetPath` atomically.
 *
 * The temp file is placed in the same directory as the target to ensure
 * rename() is an atomic on-disk operation (same filesystem).
 */
function atomicWrite(targetPath: string, content: string): void {
  const dir = dirname(targetPath);
  mkdirSync(dir, { recursive: true });
  const suffix = randomBytes(4).toString("hex");
  const tmpPath = join(dir, `.${basename(targetPath)}.tmp.${suffix}`);
  writeFileSync(tmpPath, content, "utf-8");
  renameSync(tmpPath, targetPath);
}

// ---------------------------------------------------------------------------
// Queue state persistence
// ---------------------------------------------------------------------------

/**
 * Loads a persisted queue state from disk.
 * Returns null if the file does not exist (first run).
 * Returns { error } if the file exists but cannot be parsed.
 */
export function loadQueueState(
  filePath: string,
): PersistedQueueState | null | { error: string } {
  if (!existsSync(filePath)) {
    return null;
  }

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: `[persistence] Failed to read queue state at "${filePath}": ${message}`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: `[persistence] Queue state at "${filePath}" is not valid JSON: ${message}`,
    };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as Record<string, unknown>).schema_version !== "queue-state.v1"
  ) {
    return {
      error:
        `[persistence] Queue state at "${filePath}" has invalid schema. ` +
        `Expected schema_version="queue-state.v1".`,
    };
  }

  return parsed as PersistedQueueState;
}

/**
 * Writes a persisted queue state to disk atomically.
 * Creates parent directories as needed.
 */
export function writeQueueState(
  filePath: string,
  state: PersistedQueueState,
): void {
  atomicWrite(filePath, JSON.stringify(state, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Telemetry JSONL persistence
// ---------------------------------------------------------------------------

/** Builds a deduplication key for a telemetry record. */
function telemetryDedupeKey(record: PersistedTelemetryRecord): string {
  return `${record.dispatch_id}::${record.recorded_at}::${record.kind}`;
}

/**
 * Reads existing telemetry records from a JSONL file.
 * Returns empty array if the file does not exist or contains no valid records.
 * Silently skips malformed lines (append-only semantics are preserved).
 */
function readExistingTelemetry(filePath: string): PersistedTelemetryRecord[] {
  if (!existsSync(filePath)) {
    return [];
  }

  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const records: PersistedTelemetryRecord[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    try {
      const record = JSON.parse(trimmed) as PersistedTelemetryRecord;
      if (typeof record.dispatch_id === "string" && record.dispatch_id.length > 0) {
        records.push(record);
      }
    } catch {
      // Skip malformed lines
    }
  }
  return records;
}

/**
 * Appends new telemetry records to a JSONL file atomically.
 * Deduplicates by dispatch_id+recorded_at+kind — already-appended records
 * are silently skipped (idempotent).
 */
export function appendTelemetry(
  filePath: string,
  records: PersistedTelemetryRecord[],
): void {
  if (records.length === 0) {
    return;
  }

  const existingRecords = readExistingTelemetry(filePath);
  const seenKeys = new Set(existingRecords.map(telemetryDedupeKey));

  const newRecords = records.filter(
    (record) => !seenKeys.has(telemetryDedupeKey(record)),
  );
  if (newRecords.length === 0) {
    return;
  }

  const allRecords = [...existingRecords, ...newRecords];
  const content = allRecords.map((r) => JSON.stringify(r)).join("\n") + "\n";
  atomicWrite(filePath, content);
}

// ---------------------------------------------------------------------------
// Combined: persistOrchestratorResult
// ---------------------------------------------------------------------------

/**
 * Persists the dispatched packets from an orchestrator run.
 *
 * Steps:
 * 1. Load existing queue state (or create empty state on first run).
 * 2. Merge new dispatched packets — skip any dispatch_id already present.
 * 3. Write updated queue state atomically.
 * 4. Build and append telemetry records for newly admitted packets.
 *
 * Returns a result with counters. Returns { ok: false, error } on any
 * failure, without partial writes (fail-closed).
 */
export function persistOrchestratorResult(
  options: PersistenceOptions,
): PersistenceResult {
  const {
    queueStatePath,
    telemetryPath,
    mode,
    business,
    dispatched,
    clock,
  } = options;

  const now = clock != null ? clock() : new Date();
  const generatedAt = now.toISOString();

  // Validate input before any file operations
  if (!queueStatePath || !telemetryPath) {
    return {
      ok: false,
      new_entries_written: 0,
      telemetry_records_written: 0,
      error:
        "[persistence] queueStatePath and telemetryPath are required.",
    };
  }

  if (mode !== "trial" && mode !== "live") {
    return {
      ok: false,
      new_entries_written: 0,
      telemetry_records_written: 0,
      error: `[persistence] Invalid mode "${mode}". Must be "trial" or "live".`,
    };
  }

  // Load existing queue state
  const existing = loadQueueState(queueStatePath);
  if (existing !== null && "error" in existing) {
    return {
      ok: false,
      new_entries_written: 0,
      telemetry_records_written: 0,
      error: existing.error,
    };
  }

  const currentEntries: PersistedQueueEntry[] =
    existing?.entries ?? [];
  const existingIds = new Set(currentEntries.map((e) => e.dispatch_id));

  // Determine new entries
  const newEntries: PersistedQueueEntry[] = [];
  for (const packet of dispatched) {
    if (existingIds.has(packet.dispatch_id)) {
      continue; // idempotent: already admitted
    }
    newEntries.push({
      dispatch_id: packet.dispatch_id,
      queue_state: "enqueued",
      dispatched_at: generatedAt,
      packet,
    });
    existingIds.add(packet.dispatch_id);
  }

  if (newEntries.length === 0 && existing !== null) {
    // Nothing new — queue state is already up to date
    return {
      ok: true,
      new_entries_written: 0,
      telemetry_records_written: 0,
    };
  }

  // Build updated queue state
  const updatedState: PersistedQueueState = {
    schema_version: "queue-state.v1",
    mode,
    business,
    generated_at: generatedAt,
    entries: [...currentEntries, ...newEntries],
  };

  // Persist atomically — fail closed: no partial state
  try {
    writeQueueState(queueStatePath, updatedState);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      new_entries_written: 0,
      telemetry_records_written: 0,
      error: `[persistence] Failed to write queue state: ${message}`,
    };
  }

  // Build telemetry records for newly admitted packets
  const newTelemetryRecords: PersistedTelemetryRecord[] = newEntries.map(
    (entry) => ({
      recorded_at: generatedAt,
      dispatch_id: entry.dispatch_id,
      mode,
      business,
      queue_state: "enqueued" as QueueState,
      kind: "enqueued",
      reason: null,
    }),
  );

  // Append telemetry
  try {
    appendTelemetry(telemetryPath, newTelemetryRecords);
  } catch (err) {
    // Telemetry failure is non-fatal: queue state was already written.
    // Log the error in the result warnings but keep ok: true.
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: true,
      new_entries_written: newEntries.length,
      telemetry_records_written: 0,
      error: `[persistence] Telemetry append failed (queue state was written): ${message}`,
    };
  }

  return {
    ok: true,
    new_entries_written: newEntries.length,
    telemetry_records_written: newTelemetryRecords.length,
  };
}
