/**
 * Tests for the idempotent trial queue and telemetry.
 *
 * TC-01: Replay the same event/dispatch twice → one `processed` + one `skipped`
 * TC-02: Invalid packet (missing dispatch_id, empty evidence_refs, wrong mode)
 *         → error state, no downstream invocation, diagnostic reason present
 * TC-03: Queue state transitions are monotonic (forward-only), history is append-only
 * TC-04: Telemetry record validates against schema for both `processed` and `skipped` outcomes
 *
 * Additional:
 * - Edge: advance() on non-existent dispatch_id
 * - Edge: transition from terminal state (processed → enqueued rejected)
 * - Edge: getAggregates() counts are consistent with entry map
 * - Edge: listEntries() sort order is deterministic
 * - Edge: multiple duplicate suppression paths (dispatch_id vs dedupe_key)
 */

import { describe, expect, it } from "@jest/globals";

import {
  TrialQueue,
  validatePacket,
  type QueueEntry,
  type TelemetryRecord,
  type TelemetryAggregates,
} from "../lp-do-ideas-trial-queue.js";
import type { TrialDispatchPacket } from "../lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_DATE_A = new Date("2026-02-24T12:00:00.000Z");
const FIXED_DATE_B = new Date("2026-02-24T12:00:05.000Z");

/** Builds a minimal valid TrialDispatchPacket. */
function makePacket(
  overrides: Partial<TrialDispatchPacket> = {},
): TrialDispatchPacket {
  return {
    schema_version: "dispatch.v1",
    dispatch_id: "IDEA-DISPATCH-20260224120000-0001",
    mode: "trial",
    business: "HBAG",
    trigger: "artifact_delta",
    artifact_id: "HBAG-SELL-PACK",
    before_sha: "abc1234",
    after_sha: "def5678",
    area_anchor: "channel-strategy",
    location_anchors: ["docs/business-os/strategy/HBAG/sell-pack.user.md"],
    provisional_deliverable_family: "business-artifact",
    current_truth: "HBAG-SELL-PACK changed (abc1234 → def5678)",
    next_scope_now: "Investigate channel-strategy delta for HBAG",
    adjacent_later: [],
    recommended_route: "lp-do-fact-find",
    status: "fact_find_ready",
    priority: "P2",
    confidence: 0.75,
    evidence_refs: ["docs/business-os/strategy/HBAG/sell-pack.user.md"],
    created_at: FIXED_DATE_A.toISOString(),
    queue_state: "enqueued",
    ...overrides,
  };
}

/** Returns a fresh TrialQueue with a fixed clock returning the given date. */
function makeQueue(clockDate: Date = FIXED_DATE_A): TrialQueue {
  return new TrialQueue({ clock: () => clockDate });
}

// ---------------------------------------------------------------------------
// validatePacket unit tests
// ---------------------------------------------------------------------------

describe("validatePacket", () => {
  it("accepts a fully valid packet", () => {
    const result = validatePacket(makePacket());
    expect(result.valid).toBe(true);
  });

  it("rejects packet missing dispatch_id", () => {
    const { dispatch_id: _omitted, ...rest } = makePacket();
    const result = validatePacket(rest as Partial<TrialDispatchPacket>);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("missing_dispatch_id");
    }
  });

  it("rejects packet with empty dispatch_id", () => {
    const result = validatePacket(makePacket({ dispatch_id: "   " }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("empty_dispatch_id");
    }
  });

  it("rejects packet with wrong schema_version", () => {
    const result = validatePacket(
      makePacket({ schema_version: "dispatch.v2" as "dispatch.v1" }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("wrong_schema_version");
    }
  });

  it("rejects packet with mode=live", () => {
    const result = validatePacket(makePacket({ mode: "live" as "trial" }));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("wrong_mode");
    }
  });

  it("rejects packet with empty evidence_refs array", () => {
    const result = validatePacket(
      makePacket({ evidence_refs: [] as unknown as [string, ...string[]] }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("empty_evidence_refs");
    }
  });

  it("rejects packet with invalid status", () => {
    const result = validatePacket(
      makePacket({ status: "unknown_status" as "fact_find_ready" }),
    );
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("invalid_status");
    }
  });
});

// ---------------------------------------------------------------------------
// TC-01: Replay same event twice → one processed + one skipped
// ---------------------------------------------------------------------------

describe("TC-01: Replay idempotency — same dispatch enqueued twice", () => {
  it("second enqueue of same dispatch_id produces a skipped result", () => {
    const queue = makeQueue();
    const packet = makePacket();

    const r1 = queue.enqueue(packet);
    expect(r1.ok).toBe(true);

    const r2 = queue.enqueue(packet);
    expect(r2.ok).toBe(false);
    if (!r2.ok) {
      expect(r2.queue_state).toBe("skipped");
    }
  });

  it("after advancing to processed, replay yields one processed entry and one skipped telemetry record", () => {
    const queue = makeQueue();
    const packet = makePacket();

    // First enqueue succeeds
    const r1 = queue.enqueue(packet);
    expect(r1.ok).toBe(true);

    // Advance to processed (operator confirmation)
    const adv = queue.advance(packet.dispatch_id, "processed", "operator confirmed");
    expect(adv.ok).toBe(true);

    // Replay — same dispatch_id
    const r2 = queue.enqueue(packet);
    expect(r2.ok).toBe(false);
    if (!r2.ok) {
      expect(r2.queue_state).toBe("skipped");
    }

    // Queue has exactly one entry
    expect(queue.size()).toBe(1);
    const entry = queue.getEntry(packet.dispatch_id);
    expect(entry?.queue_state).toBe("processed");

    // Telemetry: enqueued → advanced_to_processed → skipped (3 records)
    const telemetry = queue.getTelemetry();
    expect(telemetry).toHaveLength(3);
    expect(telemetry[0].kind).toBe("enqueued");
    expect(telemetry[1].kind).toBe("advanced_to_processed");
    expect(telemetry[2].kind).toBe("skipped_duplicate_dispatch_id");
  });

  it("duplicate via dedupe key (different dispatch_id, same artifact tuple) produces skipped", () => {
    const queue = makeQueue();

    const first = makePacket({ dispatch_id: "IDEA-DISPATCH-20260224120000-0001" });
    const dupe = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0002", // different ID
      // same artifact_id, before_sha, after_sha → same dedupe key
    });

    const r1 = queue.enqueue(first);
    expect(r1.ok).toBe(true);

    const r2 = queue.enqueue(dupe);
    expect(r2.ok).toBe(false);
    if (!r2.ok) {
      expect(r2.queue_state).toBe("skipped");
    }

    // Only one entry in the queue (the canonical one)
    expect(queue.size()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// TC-02: Invalid packet → error state, diagnostic reason, no downstream
// ---------------------------------------------------------------------------

describe("TC-02: Invalid packet handling", () => {
  it("missing dispatch_id enters error state with diagnostic reason", () => {
    const queue = makeQueue();
    const { dispatch_id: _omit, ...partial } = makePacket();
    const result = queue.enqueue(partial as Partial<TrialDispatchPacket>);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.queue_state).toBe("error");
      expect(result.reason).toContain("dispatch_id");
    }

    // No entries in queue (error packets do not create entries)
    expect(queue.size()).toBe(0);
  });

  it("empty evidence_refs enters error state", () => {
    const queue = makeQueue();
    const result = queue.enqueue(
      makePacket({ evidence_refs: [] as unknown as [string, ...string[]] }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.queue_state).toBe("error");
      expect(result.reason).toContain("evidence_refs");
    }
    expect(queue.size()).toBe(0);
  });

  it("mode=live enters error state", () => {
    const queue = makeQueue();
    const result = queue.enqueue(makePacket({ mode: "live" as "trial" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.queue_state).toBe("error");
      expect(result.reason).toContain("mode");
    }
    expect(queue.size()).toBe(0);
  });

  it("wrong schema_version enters error state", () => {
    const queue = makeQueue();
    const result = queue.enqueue(
      makePacket({ schema_version: "dispatch.v99" as "dispatch.v1" }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.queue_state).toBe("error");
      expect(result.reason).toContain("schema_version");
    }
    expect(queue.size()).toBe(0);
  });

  it("validation failure writes a telemetry record with kind=validation_rejected", () => {
    const queue = makeQueue();
    const { dispatch_id: _omit, ...partial } = makePacket();
    queue.enqueue(partial as Partial<TrialDispatchPacket>);

    const telemetry = queue.getTelemetry();
    expect(telemetry).toHaveLength(1);
    expect(telemetry[0].kind).toBe("validation_rejected");
    expect(telemetry[0].queue_state).toBe("error");
    expect(telemetry[0].reason).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// TC-03: Monotonic state transitions — forward-only, history append-only
// ---------------------------------------------------------------------------

describe("TC-03: Monotonic state transitions", () => {
  it("enqueued → processed is permitted", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket());
    const result = queue.advance("IDEA-DISPATCH-20260224120000-0001", "processed");
    expect(result.ok).toBe(true);
    expect(queue.getEntry("IDEA-DISPATCH-20260224120000-0001")?.queue_state).toBe("processed");
  });

  it("enqueued → error is permitted", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket());
    const result = queue.advance(
      "IDEA-DISPATCH-20260224120000-0001",
      "error",
      "downstream invocation failed",
    );
    expect(result.ok).toBe(true);
    expect(queue.getEntry("IDEA-DISPATCH-20260224120000-0001")?.queue_state).toBe("error");
  });

  it("processed → enqueued is NOT permitted (backward transition rejected)", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket());
    queue.advance("IDEA-DISPATCH-20260224120000-0001", "processed");

    const backward = queue.advance("IDEA-DISPATCH-20260224120000-0001", "enqueued");
    expect(backward.ok).toBe(false);
    if (!backward.ok) {
      expect(backward.reason).toContain("not permitted");
    }
    // State unchanged
    expect(queue.getEntry("IDEA-DISPATCH-20260224120000-0001")?.queue_state).toBe("processed");
  });

  it("error → processed is NOT permitted", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket());
    queue.advance("IDEA-DISPATCH-20260224120000-0001", "error");

    const attempt = queue.advance("IDEA-DISPATCH-20260224120000-0001", "processed");
    expect(attempt.ok).toBe(false);
    expect(queue.getEntry("IDEA-DISPATCH-20260224120000-0001")?.queue_state).toBe("error");
  });

  it("skipped is terminal — advance from skipped is rejected", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket());
    queue.advance("IDEA-DISPATCH-20260224120000-0001", "processed");
    queue.advance("IDEA-DISPATCH-20260224120000-0001", "skipped");

    const attempt = queue.advance("IDEA-DISPATCH-20260224120000-0001", "processed");
    expect(attempt.ok).toBe(false);
  });

  it("advance on unknown dispatch_id returns ok:false", () => {
    const queue = makeQueue();
    const result = queue.advance("IDEA-DISPATCH-NONEXISTENT-0000", "processed");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("not found");
    }
  });

  it("advance to same state is rejected", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket());
    // Entry is already in enqueued
    const result = queue.advance("IDEA-DISPATCH-20260224120000-0001", "enqueued");
    expect(result.ok).toBe(false);
  });

  it("telemetry log is append-only across multiple transitions", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket());
    queue.advance("IDEA-DISPATCH-20260224120000-0001", "processed");

    const t1 = queue.getTelemetry();
    expect(t1).toHaveLength(2);

    // getTelemetry returns snapshot — original log is not mutated by caller
    t1.push({} as TelemetryRecord);
    const t2 = queue.getTelemetry();
    expect(t2).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// TC-04: Telemetry schema compliance for processed and skipped outcomes
// ---------------------------------------------------------------------------

describe("TC-04: Telemetry schema compliance", () => {
  /** Asserts a TelemetryRecord has all required fields with correct types. */
  function assertTelemetryRecordShape(record: TelemetryRecord): void {
    expect(typeof record.recorded_at).toBe("string");
    expect(record.recorded_at.length).toBeGreaterThan(0);
    expect(typeof record.dispatch_id).toBe("string");
    expect(record.dispatch_id.length).toBeGreaterThan(0);
    expect(typeof record.kind).toBe("string");
    expect(typeof record.queue_state).toBe("string");
    expect(typeof record.processing_timestamp).toBe("string");
    expect(record.processing_timestamp.length).toBeGreaterThan(0);
    // reason and event_timestamp may be null — both must be present as keys
    expect("reason" in record).toBe(true);
    expect("event_timestamp" in record).toBe(true);
  }

  it("telemetry record for enqueued state is schema-compliant", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket());

    const telemetry = queue.getTelemetry();
    expect(telemetry).toHaveLength(1);
    assertTelemetryRecordShape(telemetry[0]);
    expect(telemetry[0].kind).toBe("enqueued");
    expect(telemetry[0].queue_state).toBe("enqueued");
    expect(telemetry[0].event_timestamp).toBe(FIXED_DATE_A.toISOString());
  });

  it("telemetry record for processed state is schema-compliant", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket());
    queue.advance("IDEA-DISPATCH-20260224120000-0001", "processed", "operator confirmed");

    const telemetry = queue.getTelemetry();
    expect(telemetry).toHaveLength(2);

    const processedRecord = telemetry[1];
    assertTelemetryRecordShape(processedRecord);
    expect(processedRecord.kind).toBe("advanced_to_processed");
    expect(processedRecord.queue_state).toBe("processed");
    expect(processedRecord.reason).toBe("operator confirmed");
  });

  it("telemetry record for skipped (duplicate dispatch_id) is schema-compliant", () => {
    const queue = makeQueue();
    const packet = makePacket();
    queue.enqueue(packet);
    queue.enqueue(packet); // duplicate

    const telemetry = queue.getTelemetry();
    expect(telemetry).toHaveLength(2);

    const skippedRecord = telemetry[1];
    assertTelemetryRecordShape(skippedRecord);
    expect(skippedRecord.kind).toBe("skipped_duplicate_dispatch_id");
    expect(skippedRecord.queue_state).toBe("skipped");
    expect(skippedRecord.reason).not.toBeNull();
  });

  it("telemetry record for skipped (duplicate dedupe key) is schema-compliant", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket({ dispatch_id: "IDEA-DISPATCH-20260224120000-0001" }));
    queue.enqueue(makePacket({ dispatch_id: "IDEA-DISPATCH-20260224120000-0002" }));

    const telemetry = queue.getTelemetry();
    const skippedRecord = telemetry.find(
      (r) => r.kind === "skipped_duplicate_dedupe_key",
    );
    expect(skippedRecord).toBeDefined();
    if (skippedRecord) {
      assertTelemetryRecordShape(skippedRecord);
      expect(skippedRecord.queue_state).toBe("skipped");
    }
  });

  it("telemetry record for validation_rejected is schema-compliant", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket({ mode: "live" as "trial" }));

    const telemetry = queue.getTelemetry();
    expect(telemetry).toHaveLength(1);
    assertTelemetryRecordShape(telemetry[0]);
    expect(telemetry[0].kind).toBe("validation_rejected");
    expect(telemetry[0].queue_state).toBe("error");
    // event_timestamp is null for validation failures before packet is fully parsed
    // (mode=live is validated after dispatch_id, so dispatch_id is present —
    // event_timestamp is derived from packet.created_at which is present here)
  });

  it("all telemetry records across a full lifecycle are schema-compliant", () => {
    const queue = makeQueue();
    const packet = makePacket();
    queue.enqueue(packet);
    queue.advance(packet.dispatch_id, "processed");
    queue.enqueue(packet); // duplicate

    const telemetry = queue.getTelemetry();
    for (const record of telemetry) {
      assertTelemetryRecordShape(record);
    }
  });
});

// ---------------------------------------------------------------------------
// Aggregates
// ---------------------------------------------------------------------------

describe("getAggregates", () => {
  it("returns all-zero aggregates for an empty queue", () => {
    const queue = makeQueue();
    const agg = queue.getAggregates();
    expect(agg.dispatch_count).toBe(0);
    expect(agg.duplicate_suppression_count).toBe(0);
    expect(agg.route_accuracy_denominator).toBe(0);
    expect(agg.processed_count).toBe(0);
    expect(agg.enqueued_count).toBe(0);
    expect(agg.error_count).toBe(0);
    expect(agg.skipped_count).toBe(0);
  });

  it("counts single enqueued dispatch correctly", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket());
    const agg = queue.getAggregates();
    expect(agg.dispatch_count).toBe(1);
    expect(agg.enqueued_count).toBe(1);
    expect(agg.route_accuracy_denominator).toBe(1); // enqueued + processed
  });

  it("counts processed correctly after advance", () => {
    const queue = makeQueue();
    queue.enqueue(makePacket());
    queue.advance("IDEA-DISPATCH-20260224120000-0001", "processed");
    const agg = queue.getAggregates();
    expect(agg.dispatch_count).toBe(2); // enqueued + advanced_to_processed telemetry events
    expect(agg.processed_count).toBe(1);
    expect(agg.enqueued_count).toBe(0);
    expect(agg.route_accuracy_denominator).toBe(1);
  });

  it("duplicate_suppression_count increments for each suppressed submission", () => {
    const queue = makeQueue();
    const packet = makePacket();
    queue.enqueue(packet);
    queue.enqueue(packet); // duplicate
    queue.enqueue(packet); // duplicate again

    const agg = queue.getAggregates();
    expect(agg.duplicate_suppression_count).toBe(2);
  });

  it("route_accuracy_denominator counts only enqueued + processed (not error or skipped)", () => {
    const queue = makeQueue();
    // Valid enqueue
    queue.enqueue(makePacket({ dispatch_id: "IDEA-DISPATCH-20260224120000-0001" }));
    // Duplicate (skipped — not counted in denominator for entries map)
    queue.enqueue(makePacket({ dispatch_id: "IDEA-DISPATCH-20260224120000-0001" }));
    // Invalid (error — no entry created)
    queue.enqueue(makePacket({ mode: "live" as "trial" }));

    const agg = queue.getAggregates();
    // Only one valid entry in enqueued state
    expect(agg.route_accuracy_denominator).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// listEntries deterministic sort
// ---------------------------------------------------------------------------

describe("listEntries", () => {
  it("returns entries sorted by event_timestamp then dispatch_id", () => {
    const queue = new TrialQueue({ clock: () => FIXED_DATE_A });

    const packetA = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0001",
      artifact_id: "HBAG-SELL-PACK",
      before_sha: "aaa",
      after_sha: "bbb",
      created_at: new Date("2026-02-24T12:00:02.000Z").toISOString(),
    });

    const packetB = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0002",
      artifact_id: "HBAG-MARKET-PACK",
      before_sha: "ccc",
      after_sha: "ddd",
      created_at: new Date("2026-02-24T12:00:01.000Z").toISOString(),
    });

    queue.enqueue(packetA);
    queue.enqueue(packetB);

    const entries = queue.listEntries();
    expect(entries).toHaveLength(2);
    // packetB has earlier event_timestamp → should come first
    expect(entries[0].dispatch_id).toBe("IDEA-DISPATCH-20260224120000-0002");
    expect(entries[1].dispatch_id).toBe("IDEA-DISPATCH-20260224120000-0001");
  });

  it("uses dispatch_id as tiebreaker for equal event_timestamps", () => {
    const sharedTimestamp = FIXED_DATE_A.toISOString();
    const queue = new TrialQueue({ clock: () => FIXED_DATE_A });

    const p1 = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0002",
      artifact_id: "HBAG-B",
      before_sha: "bbb",
      after_sha: "ccc",
      created_at: sharedTimestamp,
    });
    const p2 = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0001",
      artifact_id: "HBAG-A",
      before_sha: "ddd",
      after_sha: "eee",
      created_at: sharedTimestamp,
    });

    queue.enqueue(p1);
    queue.enqueue(p2);

    const entries = queue.listEntries();
    // "...-0001" < "...-0002" lexicographically
    expect(entries[0].dispatch_id).toBe("IDEA-DISPATCH-20260224120000-0001");
    expect(entries[1].dispatch_id).toBe("IDEA-DISPATCH-20260224120000-0002");
  });
});

// ---------------------------------------------------------------------------
// Clock injection and timestamps
// ---------------------------------------------------------------------------

describe("Clock injection", () => {
  it("uses injected clock for processing_timestamp", () => {
    let callCount = 0;
    const dates = [FIXED_DATE_A, FIXED_DATE_B];
    const queue = new TrialQueue({ clock: () => dates[callCount++ % dates.length] });

    queue.enqueue(makePacket());

    const entry = queue.getEntry("IDEA-DISPATCH-20260224120000-0001");
    expect(entry?.processing_timestamp).toBe(FIXED_DATE_A.toISOString());
  });

  it("event_timestamp comes from packet.created_at not from the clock", () => {
    const queue = new TrialQueue({ clock: () => FIXED_DATE_B });
    const packetCreatedAt = new Date("2026-02-24T08:00:00.000Z").toISOString();
    queue.enqueue(makePacket({ created_at: packetCreatedAt }));

    const entry = queue.getEntry("IDEA-DISPATCH-20260224120000-0001");
    expect(entry?.event_timestamp).toBe(packetCreatedAt);
    expect(entry?.processing_timestamp).toBe(FIXED_DATE_B.toISOString());
  });
});
