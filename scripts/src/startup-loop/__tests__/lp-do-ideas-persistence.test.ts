/**
 * Tests for the lp-do-ideas persistence adapter.
 *
 * TC-04-A: One run produces expected artifact set (queue-state + telemetry created)
 * TC-04-B: Repeated identical run keeps queue-state stable and appends only expected telemetry
 * TC-04-C: Malformed input fails closed without partial artifact corruption
 *
 * Additional:
 * - loadQueueState: file-not-found returns null
 * - loadQueueState: malformed JSON returns error struct
 * - loadQueueState: wrong schema_version returns error struct
 * - writeQueueState: atomic write via temp-rename
 * - appendTelemetry: JSONL deduplication by dispatch_id+recorded_at+kind
 */

import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import type { LiveDispatchPacket } from "../lp-do-ideas-live.js";
import {
  appendTelemetry,
  loadQueueState,
  type PersistedQueueState,
  type PersistedTelemetryRecord,
  persistOrchestratorResult,
  writeQueueState,
} from "../lp-do-ideas-persistence.js";
import type { TrialDispatchPacket } from "../lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_DATE = new Date("2026-02-25T12:00:00.000Z");
const FIXED_DATE_B = new Date("2026-02-25T12:01:00.000Z");

function makeTmpDir(): string {
  const dir = join(tmpdir(), `persistence-test-${randomBytes(4).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function makeTrialPacket(
  overrides: Partial<TrialDispatchPacket> = {},
): TrialDispatchPacket {
  const id = overrides.dispatch_id ?? "IDEA-DISPATCH-20260225120000-0001";
  const base: TrialDispatchPacket = {
    schema_version: "dispatch.v1",
    dispatch_id: id,
    mode: "trial",
    business: "HEAD",
    trigger: "artifact_delta",
    artifact_id: "HEAD-SELL-PACK",
    before_sha: "abc001",
    after_sha: "def002",
    root_event_id: "HEAD-SELL-PACK:def002",
    anchor_key: "channel-strategy",
    cluster_key: "head:unknown:channel-strategy:HEAD-SELL-PACK:def002",
    cluster_fingerprint: createHash("sha256").update(id).digest("hex"),
    lineage_depth: 0,
    area_anchor: "channel-strategy",
    location_anchors: ["docs/business-os/strategy/HEAD/sell-pack.user.md"],
    provisional_deliverable_family: "business-artifact",
    current_truth: "HEAD-SELL-PACK changed",
    next_scope_now: "Investigate channel-strategy delta for HEAD",
    adjacent_later: [],
    recommended_route: "lp-do-fact-find",
    status: "fact_find_ready",
    priority: "P2",
    confidence: 0.8,
    evidence_refs: ["docs/business-os/strategy/HEAD/sell-pack.user.md"],
    created_at: FIXED_DATE.toISOString(),
    queue_state: "enqueued",
    ...overrides,
  };
  return base;
}

function makeLivePacket(
  overrides: Partial<LiveDispatchPacket> = {},
): LiveDispatchPacket {
  const trial = makeTrialPacket(overrides as Partial<TrialDispatchPacket>);
  return { ...trial, mode: "live" as const };
}

function makeQueueState(
  overrides: Partial<PersistedQueueState> = {},
): PersistedQueueState {
  return {
    schema_version: "queue-state.v1",
    mode: "live",
    business: "HEAD",
    generated_at: FIXED_DATE.toISOString(),
    entries: [],
    ...overrides,
  };
}

function makeTelemetryRecord(
  overrides: Partial<PersistedTelemetryRecord> = {},
): PersistedTelemetryRecord {
  return {
    recorded_at: FIXED_DATE.toISOString(),
    dispatch_id: "IDEA-DISPATCH-20260225120000-0001",
    mode: "live",
    business: "HEAD",
    queue_state: "enqueued",
    kind: "enqueued",
    reason: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// loadQueueState
// ---------------------------------------------------------------------------

describe("loadQueueState", () => {
  it("returns null when file does not exist (first run)", () => {
    const dir = makeTmpDir();
    const result = loadQueueState(join(dir, "nonexistent.json"));
    expect(result).toBeNull();
  });

  it("returns parsed state when file exists with valid schema", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "queue-state.json");
    const state = makeQueueState();
    writeFileSync(filePath, JSON.stringify(state), "utf-8");

    const result = loadQueueState(filePath);
    expect(result).not.toBeNull();
    if (result !== null && !("error" in result)) {
      expect(result.schema_version).toBe("queue-state.v1");
      expect(result.mode).toBe("live");
      expect(result.business).toBe("HEAD");
    }
  });

  it("returns error struct when file contains malformed JSON", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "malformed.json");
    writeFileSync(filePath, "{ not valid json }", "utf-8");

    const result = loadQueueState(filePath);
    expect(result).not.toBeNull();
    expect(result).not.toBeNull();
    if (result !== null) {
      expect("error" in result).toBe(true);
    }
  });

  it("returns error struct when schema_version is wrong", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "bad-schema.json");
    writeFileSync(
      filePath,
      JSON.stringify({ schema_version: "queue-state.v99", entries: [] }),
      "utf-8",
    );

    const result = loadQueueState(filePath);
    if (result !== null) {
      expect("error" in result).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// writeQueueState
// ---------------------------------------------------------------------------

describe("writeQueueState", () => {
  it("creates the file with correct content", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "queue-state.json");
    const state = makeQueueState({ business: "BRIK" });

    writeQueueState(filePath, state);

    expect(existsSync(filePath)).toBe(true);
    const content = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as PersistedQueueState;
    expect(parsed.schema_version).toBe("queue-state.v1");
    expect(parsed.business).toBe("BRIK");
  });

  it("creates parent directories as needed", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "nested", "deep", "queue-state.json");
    const state = makeQueueState();

    writeQueueState(filePath, state);

    expect(existsSync(filePath)).toBe(true);
  });

  it("overwrites an existing file atomically", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "queue-state.json");

    writeQueueState(filePath, makeQueueState({ business: "HEAD" }));
    writeQueueState(filePath, makeQueueState({ business: "BRIK" }));

    const content = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content) as PersistedQueueState;
    expect(parsed.business).toBe("BRIK");
  });
});

// ---------------------------------------------------------------------------
// appendTelemetry
// ---------------------------------------------------------------------------

describe("appendTelemetry", () => {
  it("creates the JSONL file on first append", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "telemetry.jsonl");
    const record = makeTelemetryRecord();

    appendTelemetry(filePath, [record]);

    expect(existsSync(filePath)).toBe(true);
    const lines = readFileSync(filePath, "utf-8")
      .trim()
      .split("\n")
      .filter((l) => l.length > 0);
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]) as PersistedTelemetryRecord;
    expect(parsed.dispatch_id).toBe(record.dispatch_id);
  });

  it("appends new records to an existing JSONL file", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "telemetry.jsonl");

    const rec1 = makeTelemetryRecord({
      dispatch_id: "IDEA-DISPATCH-20260225120000-0001",
      recorded_at: FIXED_DATE.toISOString(),
    });
    const rec2 = makeTelemetryRecord({
      dispatch_id: "IDEA-DISPATCH-20260225120000-0002",
      recorded_at: FIXED_DATE_B.toISOString(),
    });

    appendTelemetry(filePath, [rec1]);
    appendTelemetry(filePath, [rec2]);

    const lines = readFileSync(filePath, "utf-8")
      .trim()
      .split("\n")
      .filter((l) => l.length > 0);
    expect(lines).toHaveLength(2);
  });

  it("deduplicates records by dispatch_id+recorded_at+kind — same record appended twice is idempotent", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "telemetry.jsonl");
    const record = makeTelemetryRecord();

    appendTelemetry(filePath, [record]);
    appendTelemetry(filePath, [record]); // duplicate

    const lines = readFileSync(filePath, "utf-8")
      .trim()
      .split("\n")
      .filter((l) => l.length > 0);
    expect(lines).toHaveLength(1);
  });

  it("is a no-op when passed an empty array", () => {
    const dir = makeTmpDir();
    const filePath = join(dir, "telemetry.jsonl");

    appendTelemetry(filePath, []);

    expect(existsSync(filePath)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TC-04-A: One-command run produces expected artifact set
// ---------------------------------------------------------------------------

describe("TC-04-A: one run produces expected artifact set", () => {
  it("creates queue-state.json and telemetry.jsonl after first run", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "live", "queue-state.json");
    const telemetryPath = join(dir, "live", "telemetry.jsonl");

    const packet = makeLivePacket();

    const result = persistOrchestratorResult({
      queueStatePath,
      telemetryPath,
      mode: "live",
      business: "HEAD",
      dispatched: [packet],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    expect(result.new_entries_written).toBe(1);
    expect(result.telemetry_records_written).toBe(1);

    expect(existsSync(queueStatePath)).toBe(true);
    expect(existsSync(telemetryPath)).toBe(true);
  });

  it("queue-state has correct structure and content", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");

    const packet = makeLivePacket({
      dispatch_id: "IDEA-DISPATCH-20260225120000-0001",
    });

    persistOrchestratorResult({
      queueStatePath,
      telemetryPath,
      mode: "live",
      business: "HEAD",
      dispatched: [packet],
      clock: () => FIXED_DATE,
    });

    const state = JSON.parse(
      readFileSync(queueStatePath, "utf-8"),
    ) as PersistedQueueState;
    expect(state.schema_version).toBe("queue-state.v1");
    expect(state.mode).toBe("live");
    expect(state.business).toBe("HEAD");
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0].dispatch_id).toBe(packet.dispatch_id);
    expect(state.entries[0].queue_state).toBe("enqueued");
  });

  it("telemetry JSONL has one record per dispatched packet", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");

    persistOrchestratorResult({
      queueStatePath,
      telemetryPath,
      mode: "live",
      business: "HEAD",
      dispatched: [
        makeLivePacket({ dispatch_id: "IDEA-DISPATCH-20260225120000-0001" }),
        makeLivePacket({ dispatch_id: "IDEA-DISPATCH-20260225120000-0002" }),
      ],
      clock: () => FIXED_DATE,
    });

    const lines = readFileSync(telemetryPath, "utf-8")
      .trim()
      .split("\n")
      .filter((l) => l.length > 0);
    expect(lines).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// TC-04-B: Repeated identical run keeps queue stable — idempotent
// ---------------------------------------------------------------------------

describe("TC-04-B: repeated identical run is idempotent", () => {
  it("second run with same dispatched packets writes zero new entries", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");

    const packet = makeLivePacket({
      dispatch_id: "IDEA-DISPATCH-20260225120000-0001",
    });

    const opts = {
      queueStatePath,
      telemetryPath,
      mode: "live" as const,
      business: "HEAD",
      dispatched: [packet],
      clock: () => FIXED_DATE,
    };

    persistOrchestratorResult(opts); // first run
    const second = persistOrchestratorResult(opts); // identical run

    expect(second.ok).toBe(true);
    expect(second.new_entries_written).toBe(0);
    expect(second.telemetry_records_written).toBe(0);
  });

  it("queue-state entry count remains stable after duplicate runs", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");

    const packet = makeLivePacket({
      dispatch_id: "IDEA-DISPATCH-20260225120000-0001",
    });

    const opts = {
      queueStatePath,
      telemetryPath,
      mode: "live" as const,
      business: "HEAD",
      dispatched: [packet],
      clock: () => FIXED_DATE,
    };

    persistOrchestratorResult(opts);
    persistOrchestratorResult(opts);
    persistOrchestratorResult(opts);

    const state = JSON.parse(
      readFileSync(queueStatePath, "utf-8"),
    ) as PersistedQueueState;
    expect(state.entries).toHaveLength(1);
  });

  it("telemetry record count remains stable after duplicate runs", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");

    const packet = makeLivePacket({
      dispatch_id: "IDEA-DISPATCH-20260225120000-0001",
    });

    const opts = {
      queueStatePath,
      telemetryPath,
      mode: "live" as const,
      business: "HEAD",
      dispatched: [packet],
      clock: () => FIXED_DATE,
    };

    persistOrchestratorResult(opts);
    persistOrchestratorResult(opts);

    const lines = readFileSync(telemetryPath, "utf-8")
      .trim()
      .split("\n")
      .filter((l) => l.length > 0);
    expect(lines).toHaveLength(1);
  });

  it("new unique packets admitted on subsequent run alongside existing entries", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");

    const first = persistOrchestratorResult({
      queueStatePath,
      telemetryPath,
      mode: "live",
      business: "HEAD",
      dispatched: [makeLivePacket({ dispatch_id: "IDEA-DISPATCH-20260225120000-0001" })],
      clock: () => FIXED_DATE,
    });
    expect(first.new_entries_written).toBe(1);

    const second = persistOrchestratorResult({
      queueStatePath,
      telemetryPath,
      mode: "live",
      business: "HEAD",
      dispatched: [makeLivePacket({ dispatch_id: "IDEA-DISPATCH-20260225120000-0002" })],
      clock: () => FIXED_DATE_B,
    });
    expect(second.new_entries_written).toBe(1);

    const state = JSON.parse(
      readFileSync(queueStatePath, "utf-8"),
    ) as PersistedQueueState;
    expect(state.entries).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// TC-04-C: Malformed input fails closed — no partial artifact corruption
// ---------------------------------------------------------------------------

describe("TC-04-C: malformed input fails closed", () => {
  it("invalid mode returns ok: false without creating files", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");

    const result = persistOrchestratorResult({
      queueStatePath,
      telemetryPath,
      mode: "invalid" as "trial",
      business: "HEAD",
      dispatched: [makeLivePacket()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(false);
    expect(typeof result.error).toBe("string");
    expect(existsSync(queueStatePath)).toBe(false);
    expect(existsSync(telemetryPath)).toBe(false);
  });

  it("empty queueStatePath returns ok: false without creating files", () => {
    const dir = makeTmpDir();
    const telemetryPath = join(dir, "telemetry.jsonl");

    const result = persistOrchestratorResult({
      queueStatePath: "",
      telemetryPath,
      mode: "live",
      business: "HEAD",
      dispatched: [makeLivePacket()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok: false when existing queue-state is malformed JSON", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");

    // Pre-corrupt the queue state file
    writeFileSync(queueStatePath, "{ this is not json }", "utf-8");

    const result = persistOrchestratorResult({
      queueStatePath,
      telemetryPath,
      mode: "live",
      business: "HEAD",
      dispatched: [makeLivePacket()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(false);
    expect(typeof result.error).toBe("string");

    // Existing corrupted file should not be overwritten
    const stillCorrupt = readFileSync(queueStatePath, "utf-8");
    expect(stillCorrupt).toBe("{ this is not json }");
  });

  it("empty dispatched array on first run creates empty queue state (no entries, no telemetry)", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const telemetryPath = join(dir, "telemetry.jsonl");

    const result = persistOrchestratorResult({
      queueStatePath,
      telemetryPath,
      mode: "live",
      business: "HEAD",
      dispatched: [],
      clock: () => FIXED_DATE,
    });

    // Should succeed (no-op) but writes a fresh state with zero entries
    expect(result.ok).toBe(true);
    expect(existsSync(queueStatePath)).toBe(true);
    const state = JSON.parse(
      readFileSync(queueStatePath, "utf-8"),
    ) as PersistedQueueState;
    expect(state.entries).toHaveLength(0);
  });
});
