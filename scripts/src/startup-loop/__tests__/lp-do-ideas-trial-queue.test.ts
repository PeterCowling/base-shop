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

import { createHash } from "node:crypto";

import { describe, expect, it } from "@jest/globals";

import type { TrialDispatchPacket } from "../lp-do-ideas-trial.js";
import {
  type QueueEntry,
  type TelemetryAggregates,
  type TelemetryRecord,
  TrialQueue,
  validatePacket,
} from "../lp-do-ideas-trial-queue.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_DATE_A = new Date("2026-02-24T12:00:00.000Z");
const FIXED_DATE_B = new Date("2026-02-24T12:00:05.000Z");

/** Builds a minimal valid TrialDispatchPacket. */
function makePacket(
  overrides: Partial<TrialDispatchPacket> = {},
): TrialDispatchPacket {
  const base: TrialDispatchPacket = {
    schema_version: "dispatch.v1",
    dispatch_id: "IDEA-DISPATCH-20260224120000-0001",
    mode: "trial",
    business: "HBAG",
    trigger: "artifact_delta",
    artifact_id: "HBAG-SELL-PACK",
    before_sha: "abc1234",
    after_sha: "def5678",
    root_event_id: "HBAG-SELL-PACK:def5678",
    anchor_key: "channel-strategy",
    cluster_key: "hbag:unknown:channel-strategy:HBAG-SELL-PACK:def5678",
    cluster_fingerprint: createHash("sha256")
      .update("HBAG-SELL-PACK:def5678\nchannel-strategy\ndocs/business-os/strategy/HBAG/sell-pack.user.md")
      .digest("hex"),
    lineage_depth: 0,
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
  };

  const merged = { ...base, ...overrides } as TrialDispatchPacket;
  const rootEventId =
    overrides.root_event_id ??
    `${merged.artifact_id}:${merged.after_sha}`;
  const anchorKey = overrides.anchor_key ?? merged.area_anchor;
  const clusterKey =
    overrides.cluster_key ??
    `${merged.business.toLowerCase()}:unknown:${anchorKey}:${rootEventId}`;
  const clusterFingerprint =
    overrides.cluster_fingerprint ??
    createHash("sha256")
      .update(
        [
          rootEventId,
          anchorKey,
          [...merged.evidence_refs].sort((a, b) => a.localeCompare(b)).join("|"),
        ].join("\n"),
      )
      .digest("hex");

  return {
    ...merged,
    root_event_id: rootEventId,
    anchor_key: anchorKey,
    cluster_key: clusterKey,
    cluster_fingerprint: clusterFingerprint,
    lineage_depth: overrides.lineage_depth ?? merged.lineage_depth ?? 0,
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

  it("dispatch_id collision with distinct dedupe keys remints and admits second dispatch", () => {
    const queue = makeQueue();
    const collidingDispatchId = "IDEA-DISPATCH-20260224120000-0001";
    const first = makePacket({
      dispatch_id: collidingDispatchId,
      before_sha: "abc1000",
      after_sha: "def1000",
    });
    const second = makePacket({
      dispatch_id: collidingDispatchId,
      before_sha: "abc2000",
      after_sha: "def2000",
    });

    const r1 = queue.enqueue(first);
    const r2 = queue.enqueue(second);

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) {
      return;
    }

    expect(r2.entry.dispatch_id).not.toBe(collidingDispatchId);
    expect(r2.entry.dispatch_id).toMatch(/^IDEA-DISPATCH-[0-9]{14}-[0-9]{4}$/);
    expect(queue.size()).toBe(2);
    expect(queue.getTelemetry().map((record) => record.kind)).toEqual([
      "enqueued",
      "enqueued",
    ]);
  });
});

describe("TC-06: cluster identity + dual-key dedupe transition", () => {
  it("TC-06-01: same root+anchor+fingerprint admits once", () => {
    const queue = makeQueue();
    const first = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0101",
      root_event_id: "HBAG-SELL-PACK:def9000",
      anchor_key: "channel-strategy",
      cluster_key: "hbag:sell:channel-strategy:HBAG-SELL-PACK:def9000",
      cluster_fingerprint: "cfp-001",
      before_sha: "abc9000",
      after_sha: "def9000",
    });
    const duplicate = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0102",
      root_event_id: "HBAG-SELL-PACK:def9000",
      anchor_key: "channel-strategy",
      cluster_key: "hbag:sell:channel-strategy:HBAG-SELL-PACK:def9000",
      cluster_fingerprint: "cfp-001",
      before_sha: "abc9001",
      after_sha: "def9001",
    });

    const r1 = queue.enqueue(first);
    const r2 = queue.enqueue(duplicate);

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(false);
    if (!r2.ok) {
      expect(r2.reason).toContain("v2");
    }
    expect(queue.size()).toBe(1);
  });

  it("TC-06-02: fingerprint change admits new cluster revision", () => {
    const queue = makeQueue();
    const first = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0201",
      root_event_id: "HBAG-SELL-PACK:def9010",
      anchor_key: "channel-strategy",
      cluster_key: "hbag:sell:channel-strategy:HBAG-SELL-PACK:def9010",
      cluster_fingerprint: "cfp-010",
      before_sha: "abc9010",
      after_sha: "def9010",
    });
    const revision = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0202",
      root_event_id: "HBAG-SELL-PACK:def9010",
      anchor_key: "channel-strategy",
      cluster_key: "hbag:sell:channel-strategy:HBAG-SELL-PACK:def9010",
      cluster_fingerprint: "cfp-011",
      before_sha: "abc9011",
      after_sha: "def9011",
    });

    expect(queue.enqueue(first).ok).toBe(true);
    const second = queue.enqueue(revision);
    expect(second.ok).toBe(true);
    expect(queue.size()).toBe(2);
  });

  it("same-origin v2 duplicate attaches new evidence to canonical entry", () => {
    const queue = makeQueue();
    const first = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0251",
      root_event_id: "HBAG-SELL-PACK:def9025",
      anchor_key: "channel-strategy",
      cluster_key: "hbag:sell:channel-strategy:HBAG-SELL-PACK:def9025",
      cluster_fingerprint: "cfp-025",
      before_sha: "abc9025",
      after_sha: "def9025",
      evidence_refs: ["docs/a.md"],
      location_anchors: ["docs/a.md"],
    });
    const duplicate = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0252",
      root_event_id: "HBAG-SELL-PACK:def9025",
      anchor_key: "channel-strategy",
      cluster_key: "hbag:sell:channel-strategy:HBAG-SELL-PACK:def9025",
      cluster_fingerprint: "cfp-025",
      before_sha: "abc9026",
      after_sha: "def9026",
      evidence_refs: ["docs/a.md", "docs/new.md"],
      location_anchors: ["docs/a.md", "docs/new-location.md"],
    });

    expect(queue.enqueue(first).ok).toBe(true);
    const second = queue.enqueue(duplicate);

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toContain("attached_evidence=1");
      expect(second.reason).toContain("attached_locations=1");
    }

    const canonical = queue.getEntry(first.dispatch_id);
    expect(canonical?.packet?.evidence_refs).toEqual(["docs/a.md", "docs/new.md"]);
    expect(canonical?.packet?.location_anchors).toEqual([
      "docs/a.md",
      "docs/new-location.md",
    ]);
  });

  it("TC-06-03: evidence order variance does not alter fallback v2 dedupe", () => {
    const queue = makeQueue();
    const first = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0301",
      artifact_id: "",
      before_sha: null,
      after_sha: "",
      root_event_id: "ROOT-ALPHA",
      anchor_key: "",
      cluster_key: "",
      cluster_fingerprint: "",
      evidence_refs: ["docs/b.md", "docs/a.md"],
    });
    const reordered = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0302",
      artifact_id: "",
      before_sha: null,
      after_sha: "",
      root_event_id: "ROOT-ALPHA",
      anchor_key: "",
      cluster_key: "",
      cluster_fingerprint: "",
      evidence_refs: ["docs/a.md", "docs/b.md"],
    });

    expect(queue.enqueue(first).ok).toBe(true);
    const second = queue.enqueue(reordered);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toContain("v2");
    }
    expect(queue.size()).toBe(1);
  });

  it("TC-06-04: legacy v1 dedupe suppresses when v2 keys differ", () => {
    const queue = makeQueue();
    const first = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0401",
      artifact_id: "HBAG-SELL-PACK",
      before_sha: "abc9040",
      after_sha: "def9040",
      cluster_key: "hbag:sell:channel-strategy:ROOT-9040-A",
      cluster_fingerprint: "cfp-040a",
    });
    const second = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0402",
      artifact_id: "HBAG-SELL-PACK",
      before_sha: "abc9040",
      after_sha: "def9040",
      cluster_key: "hbag:sell:channel-strategy:ROOT-9040-B",
      cluster_fingerprint: "cfp-040b",
    });

    expect(queue.enqueue(first).ok).toBe(true);
    const duplicate = queue.enqueue(second);
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) {
      expect(duplicate.reason).toContain("v1");
    }
    expect(queue.size()).toBe(1);
  });
});

describe("TC-08: lane scheduler and governance", () => {
  it("TC-08-01: scheduler never exceeds per-lane WIP caps", () => {
    const queue = makeQueue(FIXED_DATE_B);

    queue.enqueue(
      makePacket({
        dispatch_id: "IDEA-DISPATCH-20260224120000-0801",
        before_sha: "do-a-01",
        after_sha: "do-a-02",
        root_event_id: "HBAG-DO-01",
        cluster_key: "hbag:sell:channel-strategy:HBAG-DO-01",
        cluster_fingerprint: "cfp-do-01",
      }),
    );
    queue.enqueue(
      makePacket({
        dispatch_id: "IDEA-DISPATCH-20260224120000-0802",
        before_sha: "do-b-01",
        after_sha: "do-b-02",
        root_event_id: "HBAG-DO-02",
        cluster_key: "hbag:sell:channel-strategy:HBAG-DO-02",
        cluster_fingerprint: "cfp-do-02",
      }),
    );
    queue.enqueue(
      makePacket(
        {
          dispatch_id: "IDEA-DISPATCH-20260224120000-0803",
          before_sha: "im-a-01",
          after_sha: "im-a-02",
          root_event_id: "HBAG-IMPROVE-01",
          cluster_key: "hbag:ops:improve:HBAG-IMPROVE-01",
          cluster_fingerprint: "cfp-improve-01",
          status: "briefing_ready",
          recommended_route: "lp-do-briefing",
          priority: "P3",
        },
        // explicit lane admission (needed until upstream sets lane directly)
      ),
      { lane: "IMPROVE" },
    );
    queue.enqueue(
      makePacket({
        dispatch_id: "IDEA-DISPATCH-20260224120000-0804",
        before_sha: "im-b-01",
        after_sha: "im-b-02",
        root_event_id: "HBAG-IMPROVE-02",
        cluster_key: "hbag:ops:improve:HBAG-IMPROVE-02",
        cluster_fingerprint: "cfp-improve-02",
        status: "briefing_ready",
        recommended_route: "lp-do-briefing",
        priority: "P3",
      }),
      { lane: "IMPROVE" },
    );

    const scheduled = queue.planNextDispatches({
      wip_caps: { DO: 1, IMPROVE: 2 },
      active_counts: { DO: 0, IMPROVE: 1 },
      now: FIXED_DATE_B,
    });

    const doCount = scheduled.filter((entry) => entry.lane === "DO").length;
    const improveCount = scheduled.filter((entry) => entry.lane === "IMPROVE").length;

    expect(doCount).toBeLessThanOrEqual(1);
    expect(improveCount).toBeLessThanOrEqual(1);
    expect(scheduled.length).toBeLessThanOrEqual(2);
  });

  it("TC-08-02: aging promotes older low-priority item within lane", () => {
    const queue = makeQueue(FIXED_DATE_B);
    const oldTimestamp = new Date("2026-02-21T12:00:00.000Z").toISOString();
    const newTimestamp = FIXED_DATE_B.toISOString();

    queue.enqueue(
      makePacket({
        dispatch_id: "IDEA-DISPATCH-20260224120000-0810",
        before_sha: "old-01",
        after_sha: "old-02",
        root_event_id: "HBAG-DO-OLD",
        cluster_key: "hbag:sell:channel-strategy:HBAG-DO-OLD",
        cluster_fingerprint: "cfp-do-old",
        priority: "P3",
        created_at: oldTimestamp,
      }),
    );
    queue.enqueue(
      makePacket({
        dispatch_id: "IDEA-DISPATCH-20260224120000-0811",
        before_sha: "new-01",
        after_sha: "new-02",
        root_event_id: "HBAG-DO-NEW",
        cluster_key: "hbag:sell:channel-strategy:HBAG-DO-NEW",
        cluster_fingerprint: "cfp-do-new",
        priority: "P1",
        created_at: newTimestamp,
      }),
    );

    const scheduled = queue.planNextDispatches({
      wip_caps: { DO: 1, IMPROVE: 0 },
      now: FIXED_DATE_B,
      aging_window_hours: 24,
    });

    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].dispatch_id).toBe("IDEA-DISPATCH-20260224120000-0810");
    expect(scheduled[0].lane).toBe("DO");
  });

  it("TC-08-03: lane reassignment requires explicit override path", () => {
    const queue = makeQueue();
    const packet = makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0820",
      before_sha: "lane-01",
      after_sha: "lane-02",
      root_event_id: "HBAG-LANE-01",
      cluster_key: "hbag:sell:channel-strategy:HBAG-LANE-01",
      cluster_fingerprint: "cfp-lane-01",
    });

    expect(queue.enqueue(packet).ok).toBe(true);
    expect(queue.getEntry(packet.dispatch_id)?.lane).toBe("DO");

    const noOverride = queue.reassignLane(packet.dispatch_id, "IMPROVE");
    expect(noOverride.ok).toBe(false);
    if (!noOverride.ok) {
      expect(noOverride.reason).toContain("requires explicit override");
    }

    const missingReason = queue.reassignLane(packet.dispatch_id, "IMPROVE", {
      override: true,
    });
    expect(missingReason.ok).toBe(false);
    if (!missingReason.ok) {
      expect(missingReason.reason).toContain("requires a non-empty reason");
    }

    const reassigned = queue.reassignLane(packet.dispatch_id, "IMPROVE", {
      override: true,
      reason: "reflection debt triage",
    });
    expect(reassigned.ok).toBe(true);
    expect(queue.getEntry(packet.dispatch_id)?.lane).toBe("IMPROVE");

    const telemetry = queue.getTelemetry();
    const laneEvent = telemetry.find((entry) => entry.kind === "lane_reassigned");
    expect(laneEvent).toBeDefined();
    expect(laneEvent?.reason).toContain("DO->IMPROVE");
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

// ---------------------------------------------------------------------------
// TC-09: Classifier-aware scheduling (QueueEntry.classification)
// ---------------------------------------------------------------------------

describe("TC-09: Classifier-aware scheduling", () => {
  it("TC-09-01: classified entry outranks unclassified entry with higher legacy priority", () => {
    // P1 unclassified vs P3 classified with high urgency
    // Classified entry must always win regardless of legacy priority
    const queue = makeQueue(FIXED_DATE_A);

    queue.enqueue(
      makePacket({
        dispatch_id: "IDEA-DISPATCH-20260224120000-0901",
        before_sha: "c901-a",
        after_sha: "c901-b",
        root_event_id: "TC09-UNCLASSIFIED-01",
        cluster_key: "hbag:sell:channel-strategy:TC09-UNCLASSIFIED-01",
        cluster_fingerprint: "cfp-0901",
        priority: "P1",
        created_at: FIXED_DATE_A.toISOString(),
      }),
    );
    queue.enqueue(
      makePacket({
        dispatch_id: "IDEA-DISPATCH-20260224120000-0902",
        before_sha: "c902-a",
        after_sha: "c902-b",
        root_event_id: "TC09-CLASSIFIED-01",
        cluster_key: "hbag:sell:channel-strategy:TC09-CLASSIFIED-01",
        cluster_fingerprint: "cfp-0902",
        priority: "P3",
        created_at: FIXED_DATE_A.toISOString(),
      }),
    );

    // Inject classification onto the P3 entry via listEntries() seam
    const entry = queue.listEntries().find((e) => e.dispatch_id === "IDEA-DISPATCH-20260224120000-0902");
    expect(entry).toBeDefined();
    entry!.classification = { effective_priority_rank: 1, urgency: "U1", effort: "M" };

    const scheduled = queue.planNextDispatches({
      wip_caps: { DO: 1, IMPROVE: 0 },
      now: FIXED_DATE_A,
    });

    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].dispatch_id).toBe("IDEA-DISPATCH-20260224120000-0902");
  });

  it("TC-09-02: among two classified entries, lower effective_priority_rank wins", () => {
    const queue = makeQueue(FIXED_DATE_A);

    for (const id of ["0910", "0911"]) {
      queue.enqueue(
        makePacket({
          dispatch_id: `IDEA-DISPATCH-20260224120000-${id}`,
          before_sha: `${id}-a`,
          after_sha: `${id}-b`,
          root_event_id: `TC09-CLASSIFIED-${id}`,
          cluster_key: `hbag:sell:channel-strategy:TC09-CLASSIFIED-${id}`,
          cluster_fingerprint: `cfp-${id}`,
          priority: "P2",
          created_at: FIXED_DATE_A.toISOString(),
        }),
      );
    }

    const entries = queue.listEntries();
    const entry0910 = entries.find((e) => e.dispatch_id === "IDEA-DISPATCH-20260224120000-0910");
    const entry0911 = entries.find((e) => e.dispatch_id === "IDEA-DISPATCH-20260224120000-0911");
    expect(entry0910).toBeDefined();
    expect(entry0911).toBeDefined();

    // 0910 gets rank 5 (P2-equivalent), 0911 gets rank 1 (P0-equivalent)
    entry0910!.classification = { effective_priority_rank: 5, urgency: "U2", effort: "M" };
    entry0911!.classification = { effective_priority_rank: 1, urgency: "U2", effort: "M" };

    const scheduled = queue.planNextDispatches({
      wip_caps: { DO: 1, IMPROVE: 0 },
      now: FIXED_DATE_A,
    });

    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].dispatch_id).toBe("IDEA-DISPATCH-20260224120000-0911");
  });

  it("TC-09-03: among two classified entries with same rank, lower urgency rank wins", () => {
    const queue = makeQueue(FIXED_DATE_A);

    for (const id of ["0920", "0921"]) {
      queue.enqueue(
        makePacket({
          dispatch_id: `IDEA-DISPATCH-20260224120000-${id}`,
          before_sha: `${id}-a`,
          after_sha: `${id}-b`,
          root_event_id: `TC09-URGENCY-${id}`,
          cluster_key: `hbag:sell:channel-strategy:TC09-URGENCY-${id}`,
          cluster_fingerprint: `cfp-${id}`,
          priority: "P2",
          created_at: FIXED_DATE_A.toISOString(),
        }),
      );
    }

    const entries = queue.listEntries();
    const entry0920 = entries.find((e) => e.dispatch_id === "IDEA-DISPATCH-20260224120000-0920");
    const entry0921 = entries.find((e) => e.dispatch_id === "IDEA-DISPATCH-20260224120000-0921");
    expect(entry0920).toBeDefined();
    expect(entry0921).toBeDefined();

    // Same rank, but 0921 has U0 (critical) vs 0920 has U2 (routine)
    entry0920!.classification = { effective_priority_rank: 3, urgency: "U2", effort: "M" };
    entry0921!.classification = { effective_priority_rank: 3, urgency: "U0", effort: "M" };

    const scheduled = queue.planNextDispatches({
      wip_caps: { DO: 1, IMPROVE: 0 },
      now: FIXED_DATE_A,
    });

    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].dispatch_id).toBe("IDEA-DISPATCH-20260224120000-0921");
  });

  it("TC-09-04: classification field is absent by default after enqueue", () => {
    const queue = makeQueue(FIXED_DATE_A);
    queue.enqueue(makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0930",
      before_sha: "c930-a",
      after_sha: "c930-b",
      root_event_id: "TC09-DEFAULT-01",
      cluster_key: "hbag:sell:channel-strategy:TC09-DEFAULT-01",
      cluster_fingerprint: "cfp-0930",
    }));

    const entry = queue.getEntry("IDEA-DISPATCH-20260224120000-0930");
    expect(entry?.classification).toBeUndefined();
  });

  it("TC-09-05: listEntries() mutation seam — setting classification on returned entry is visible to scheduler", () => {
    const queue = makeQueue(FIXED_DATE_A);
    queue.enqueue(makePacket({
      dispatch_id: "IDEA-DISPATCH-20260224120000-0940",
      before_sha: "c940-a",
      after_sha: "c940-b",
      root_event_id: "TC09-SEAM-01",
      cluster_key: "hbag:sell:channel-strategy:TC09-SEAM-01",
      cluster_fingerprint: "cfp-0940",
      priority: "P3",
    }));

    // Mutation via listEntries() seam
    const liveEntry = queue.listEntries().find((e) => e.dispatch_id === "IDEA-DISPATCH-20260224120000-0940");
    expect(liveEntry).toBeDefined();
    liveEntry!.classification = { effective_priority_rank: 1, urgency: "U0", effort: "XS" };

    // getEntry() should return the same mutated state
    const entry = queue.getEntry("IDEA-DISPATCH-20260224120000-0940");
    expect(entry?.classification).toEqual({ effective_priority_rank: 1, urgency: "U0", effort: "XS" });

    // Scheduler should produce a high score for this entry
    const scheduled = queue.planNextDispatches({
      wip_caps: { DO: 1, IMPROVE: 0 },
      now: FIXED_DATE_A,
    });
    expect(scheduled).toHaveLength(1);
    // Score for classified: 10000 - 0*1000 - 1*10 + (5-0) = 9995
    expect(scheduled[0].score).toBe(9995);
  });
});
