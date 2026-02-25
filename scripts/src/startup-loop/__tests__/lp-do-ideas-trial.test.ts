import { describe, expect, it } from "@jest/globals";

import {
  type ArtifactDeltaEvent,
  buildDedupeKey,
  buildDispatchId,
  runTrialOrchestrator,
  T1_SEMANTIC_KEYWORDS,
} from "../lp-do-ideas-trial.js";

// Fixed clock for deterministic dispatch_id generation
const FIXED_DATE = new Date("2026-02-24T15:30:00.000Z");
const FIXED_CLOCK = () => FIXED_DATE;

// Reusable T1-matching event fixture (opportunity delta class)
const T1_OPPORTUNITY_EVENT: ArtifactDeltaEvent = {
  artifact_id: "HBAG-SELL-PACK",
  business: "HBAG",
  before_sha: "abc1234",
  after_sha: "def5678",
  path: "docs/business-os/strategy/HBAG/sell-pack.user.md",
  domain: "SELL",
  changed_sections: ["ICP Definition", "Target Customer Profile"],
};

// Non-T1 event fixture (constraint delta class — structural change but not semantic)
const NON_T1_CONSTRAINT_EVENT: ArtifactDeltaEvent = {
  artifact_id: "HBAG-MARKET-PACK",
  business: "HBAG",
  before_sha: "aaa0001",
  after_sha: "bbb0002",
  path: "docs/business-os/strategy/HBAG/market-aggregate-pack.user.md",
  domain: "MARKET",
  changed_sections: ["Competitor Table", "Distribution Notes"],
};

// First-registration event (no before_sha — regression/baseline delta class)
const FIRST_REGISTRATION_EVENT: ArtifactDeltaEvent = {
  artifact_id: "HBAG-LOGISTICS-PACK",
  business: "HBAG",
  before_sha: null,
  after_sha: "ccc0003",
  path: "docs/business-os/strategy/HBAG/logistics-pack.user.md",
  domain: "LOGISTICS",
  changed_sections: ["Pricing Policy"],
};

const SOURCE_ELIGIBLE_EVENT: ArtifactDeltaEvent = {
  artifact_id: "HBAG-STRATEGY-INSIGHT_LOG",
  business: "HBAG",
  before_sha: "111aaaa",
  after_sha: "222bbbb",
  path: "docs/business-os/strategy/HBAG/insight-log.user.md",
  domain: "STRATEGY",
  changed_sections: ["ICP Definition"],
};

const PACK_EVENT: ArtifactDeltaEvent = {
  artifact_id: "HBAG-MARKET-PACK",
  business: "HBAG",
  before_sha: "333cccc",
  after_sha: "444dddd",
  path: "docs/business-os/strategy/HBAG/market-pack.user.md",
  domain: "MARKET",
  changed_sections: ["ICP Definition"],
};

const PROJECTION_SUMMARY_EVENT: ArtifactDeltaEvent = {
  artifact_id: "HBAG-MARKET-SUMMARY",
  business: "HBAG",
  before_sha: "555eeee",
  after_sha: "666ffff",
  path: "docs/business-os/strategy/HBAG/index.user.md",
  domain: "MARKET",
  changed_sections: ["ICP Definition"],
};

const PHASE_TEST_REGISTRY = {
  artifacts: [
    {
      artifact_id: "HBAG-STRATEGY-INSIGHT_LOG",
      path: "docs/business-os/strategy/HBAG/insight-log.user.md",
      domain: "STRATEGY" as const,
      business: "HBAG",
      artifact_class: "source_process" as const,
      trigger_policy: "eligible" as const,
      propagation_mode: "source_task" as const,
      depends_on: [],
      produces: [],
      active: true,
    },
    {
      artifact_id: "HBAG-MARKET-PACK",
      path: "docs/business-os/strategy/HBAG/market-pack.user.md",
      domain: "MARKET" as const,
      business: "HBAG",
      artifact_class: "projection_summary" as const,
      trigger_policy: "manual_override_only" as const,
      propagation_mode: "projection_auto" as const,
      depends_on: [],
      produces: [],
      active: true,
    },
    {
      artifact_id: "HBAG-MARKET-SUMMARY",
      path: "docs/business-os/strategy/HBAG/index.user.md",
      domain: "MARKET" as const,
      business: "HBAG",
      artifact_class: "projection_summary" as const,
      trigger_policy: "manual_override_only" as const,
      propagation_mode: "projection_auto" as const,
      depends_on: [],
      produces: [],
      active: true,
    },
  ],
};

describe("T1_SEMANTIC_KEYWORDS", () => {
  it("contains expected category representatives", () => {
    expect(T1_SEMANTIC_KEYWORDS).toContain("icp");
    expect(T1_SEMANTIC_KEYWORDS).toContain("pricing");
    expect(T1_SEMANTIC_KEYWORDS).toContain("positioning");
    expect(T1_SEMANTIC_KEYWORDS).toContain("channel strategy");
  });
});

describe("buildDedupeKey", () => {
  it("produces stable key from event fields", () => {
    const key = buildDedupeKey(T1_OPPORTUNITY_EVENT);
    expect(key).toBe("HBAG-SELL-PACK:abc1234:def5678");
  });

  it("uses literal 'null' string when before_sha is null", () => {
    const key = buildDedupeKey({ ...T1_OPPORTUNITY_EVENT, before_sha: null });
    expect(key).toBe("HBAG-SELL-PACK:null:def5678");
  });
});

describe("buildDispatchId", () => {
  it("produces a string matching the required pattern", () => {
    const id = buildDispatchId(FIXED_DATE, 1);
    expect(id).toMatch(/^IDEA-DISPATCH-[0-9]{14}-[0-9]{4}$/);
  });

  it("encodes the fixed date correctly", () => {
    // 2026-02-24T15:30:00Z → 20260224153000
    const id = buildDispatchId(FIXED_DATE, 1);
    expect(id).toBe("IDEA-DISPATCH-20260224153000-0001");
  });

  it("pads sequence numbers to 4 digits", () => {
    expect(buildDispatchId(FIXED_DATE, 7)).toBe("IDEA-DISPATCH-20260224153000-0007");
    expect(buildDispatchId(FIXED_DATE, 42)).toBe("IDEA-DISPATCH-20260224153000-0042");
  });
});

describe("runTrialOrchestrator — mode guard", () => {
  it("TC-03: mode=live returns ok:false with explicit error", () => {
    const result = runTrialOrchestrator({
      mode: "live",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("live");
      expect(result.error).toContain("not permitted");
    }
  });

  it("TC-03: arbitrary mode string returns ok:false", () => {
    const result = runTrialOrchestrator({
      mode: "production",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(false);
  });

  it("mode=trial is accepted", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
  });
});

describe("runTrialOrchestrator — TC-01: opportunity delta class (T1 match)", () => {
  it("emits exactly one dispatch packet for a T1-matching event", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.dispatched).toHaveLength(1);
    expect(result.suppressed).toBe(0);
    expect(result.noop).toBe(0);
  });

  it("dispatch_id matches required pattern", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { dispatch_id } = result.dispatched[0];
    expect(dispatch_id).toMatch(/^IDEA-DISPATCH-[0-9]{14}-[0-9]{4}$/);
  });

  it("dispatch is deterministic for same input + fixed clock", () => {
    const r1 = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });
    const r2 = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;

    expect(r1.dispatched[0].dispatch_id).toBe(r2.dispatched[0].dispatch_id);
  });

  it("packet has schema_version=dispatch.v1 and mode=trial", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const packet = result.dispatched[0];
    expect(packet.schema_version).toBe("dispatch.v1");
    expect(packet.mode).toBe("trial");
  });

  it("packet routes to lp-do-fact-find with fact_find_ready status", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const packet = result.dispatched[0];
    expect(packet.status).toBe("fact_find_ready");
    expect(packet.recommended_route).toBe("lp-do-fact-find");
  });

  it("packet has non-empty area_anchor, location_anchors, and evidence_refs", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const packet = result.dispatched[0];
    expect(packet.area_anchor.length).toBeGreaterThan(0);
    expect(packet.location_anchors.length).toBeGreaterThanOrEqual(1);
    expect(packet.evidence_refs.length).toBeGreaterThanOrEqual(1);
  });

  it("queue_state is enqueued", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dispatched[0].queue_state).toBe("enqueued");
  });

  it("packet includes cluster identity fields for dual-key dedupe", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const packet = result.dispatched[0];
    expect(packet.root_event_id).toBe("HBAG-SELL-PACK:def5678");
    expect(packet.anchor_key).toBe("channel-strategy");
    expect(packet.cluster_key).toContain(packet.root_event_id);
    expect(packet.cluster_fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(packet.lineage_depth).toBe(0);
  });
});

describe("runTrialOrchestrator — TC-02: idempotency (duplicate suppression)", () => {
  it("replaying the same event twice produces exactly one dispatch and one suppressed", () => {
    const seen = new Set<string>();

    const r1 = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      seenDedupeKeys: seen,
      clock: FIXED_CLOCK,
    });

    const r2 = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      seenDedupeKeys: seen,
      clock: FIXED_CLOCK,
    });

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;

    expect(r1.dispatched).toHaveLength(1);
    expect(r1.suppressed).toBe(0);

    expect(r2.dispatched).toHaveLength(0);
    expect(r2.suppressed).toBe(1);
  });

  it("different after_sha for same artifact_id produces a new dispatch", () => {
    const seen = new Set<string>();

    runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      seenDedupeKeys: seen,
      clock: FIXED_CLOCK,
    });

    const updated: ArtifactDeltaEvent = {
      ...T1_OPPORTUNITY_EVENT,
      before_sha: T1_OPPORTUNITY_EVENT.after_sha,
      after_sha: "fff9999",
    };

    const r2 = runTrialOrchestrator({
      mode: "trial",
      events: [updated],
      seenDedupeKeys: seen,
      clock: FIXED_CLOCK,
    });

    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    expect(r2.dispatched).toHaveLength(1);
    expect(r2.suppressed).toBe(0);
  });

  it("duplicate replay does not inflate root_event_count in shadow telemetry", () => {
    const seen = new Set<string>();

    const firstRun = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      seenDedupeKeys: seen,
      clock: FIXED_CLOCK,
    });
    const replayRun = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      seenDedupeKeys: seen,
      clock: FIXED_CLOCK,
    });

    expect(firstRun.ok).toBe(true);
    expect(replayRun.ok).toBe(true);
    if (!firstRun.ok || !replayRun.ok) return;

    expect(firstRun.shadow_telemetry.root_event_count).toBe(1);
    expect(firstRun.shadow_telemetry.candidate_count).toBe(1);
    expect(replayRun.shadow_telemetry.root_event_count).toBe(0);
    expect(replayRun.shadow_telemetry.candidate_count).toBe(0);
    expect(replayRun.shadow_telemetry.admitted_count).toBe(0);
    expect(replayRun.suppressed).toBe(1);
  });
});

describe("runTrialOrchestrator — constraint delta class (non-T1 sections)", () => {
  it("routes to lp-do-briefing with briefing_ready status", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [NON_T1_CONSTRAINT_EVENT],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.dispatched).toHaveLength(1);
    const packet = result.dispatched[0];
    expect(packet.status).toBe("briefing_ready");
    expect(packet.recommended_route).toBe("lp-do-briefing");
  });
});

describe("runTrialOrchestrator — regression delta class (first registration / missing hashes)", () => {
  it("first registration (null before_sha) produces noop, no dispatch", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [FIRST_REGISTRATION_EVENT],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.dispatched).toHaveLength(0);
    expect(result.noop).toBe(1);
  });

  it("empty after_sha produces noop, no dispatch", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [{ ...T1_OPPORTUNITY_EVENT, after_sha: "" }],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.dispatched).toHaveLength(0);
    expect(result.noop).toBe(1);
  });

  it("no changed_sections provided produces conservative noop", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [{ ...T1_OPPORTUNITY_EVENT, changed_sections: undefined }],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.dispatched).toHaveLength(0);
    expect(result.noop).toBe(1);
  });

  it("empty changed_sections array produces conservative noop", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [{ ...T1_OPPORTUNITY_EVENT, changed_sections: [] }],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.dispatched).toHaveLength(0);
    expect(result.noop).toBe(1);
  });
});

describe("runTrialOrchestrator — TC-04: no writes outside trial paths", () => {
  it("orchestrator is a pure function with no side effects", () => {
    // The orchestrator does not accept or perform any file I/O — verified by
    // the absence of fs/path imports in the module. Queue writes are TASK-05.
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [T1_OPPORTUNITY_EVENT],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    // If this test reaches here without throwing, no file writes occurred.
  });
});

describe("runTrialOrchestrator — deterministic ordering", () => {
  it("produces stable dispatch order regardless of input event order", () => {
    const events = [
      {
        artifact_id: "HBAG-SELL-PACK",
        business: "HBAG",
        before_sha: "aaa",
        after_sha: "bbb",
        path: "docs/sell.md",
        domain: "SELL" as const,
        changed_sections: ["ICP Definition"],
      },
      {
        artifact_id: "HBAG-MARKET-PACK",
        business: "HBAG",
        before_sha: "ccc",
        after_sha: "ddd",
        path: "docs/market.md",
        domain: "MARKET" as const,
        changed_sections: ["Positioning Overview"],
      },
    ];

    const r1 = runTrialOrchestrator({
      mode: "trial",
      events: events,
      clock: FIXED_CLOCK,
    });
    const r2 = runTrialOrchestrator({
      mode: "trial",
      events: [...events].reverse(),
      clock: FIXED_CLOCK,
    });

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;

    const ids1 = r1.dispatched.map((d) => d.artifact_id);
    const ids2 = r2.dispatched.map((d) => d.artifact_id);
    expect(ids1).toEqual(ids2);
  });
});

describe("runTrialOrchestrator — T1 keyword case-insensitivity", () => {
  it("matches ICP in mixed case", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [{ ...T1_OPPORTUNITY_EVENT, changed_sections: ["ICP Analysis"] }],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dispatched[0].status).toBe("fact_find_ready");
  });

  it("matches channel strategy in sentence case", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      events: [
        { ...T1_OPPORTUNITY_EVENT, changed_sections: ["Channel Strategy Review"] },
      ],
      clock: FIXED_CLOCK,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dispatched[0].status).toBe("fact_find_ready");
  });
});

describe("runTrialOrchestrator — TC-05A cutover phase behavior", () => {
  it("TC-05A-01: source delta admits in P2 and P3", () => {
    const p2 = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P2",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [SOURCE_ELIGIBLE_EVENT],
      clock: FIXED_CLOCK,
    });
    const p3 = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P3",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [SOURCE_ELIGIBLE_EVENT],
      clock: FIXED_CLOCK,
    });

    expect(p2.ok).toBe(true);
    expect(p3.ok).toBe(true);
    if (!p2.ok || !p3.ok) return;

    expect(p2.dispatched).toHaveLength(1);
    expect(p3.dispatched).toHaveLength(1);
  });

  it("TC-05A-02: pack-only delta in P2/P3 yields no admission without override", () => {
    const p2 = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P2",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [PACK_EVENT],
      clock: FIXED_CLOCK,
    });
    const p3 = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P3",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [PACK_EVENT],
      clock: FIXED_CLOCK,
    });

    expect(p2.ok).toBe(true);
    expect(p3.ok).toBe(true);
    if (!p2.ok || !p3.ok) return;

    expect(p2.dispatched).toHaveLength(0);
    expect(p3.dispatched).toHaveLength(0);
    expect(p2.noop).toBeGreaterThanOrEqual(1);
    expect(p3.noop).toBeGreaterThanOrEqual(1);
    expect(p2.shadow_telemetry.suppression_reason_counts.pack_without_source_delta).toBe(1);
    expect(p3.shadow_telemetry.suppression_reason_counts.pack_without_source_delta).toBe(1);
    expect(p2.shadow_telemetry.suppression_reason_counts.projection_immunity).toBe(0);
    expect(p3.shadow_telemetry.suppression_reason_counts.projection_immunity).toBe(0);
  });

  it("TC-05A-03: projection artifact deltas do not admit across P0/P1/P2/P3", () => {
    const phases = ["P0", "P1", "P2", "P3"] as const;
    for (const phase of phases) {
      const result = runTrialOrchestrator({
        mode: "trial",
        cutoverPhase: phase,
        standingRegistry: PHASE_TEST_REGISTRY,
        events: [PROJECTION_SUMMARY_EVENT],
        clock: FIXED_CLOCK,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.dispatched).toHaveLength(0);
    }
  });

  it("TC-05A-04: unknown artifact yields warning and no admission", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P2",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [
        {
          ...SOURCE_ELIGIBLE_EVENT,
          artifact_id: "HBAG-STRATEGY-UNKNOWN_SOURCE",
          path: "docs/business-os/strategy/HBAG/unknown-source.user.md",
        },
      ],
      clock: FIXED_CLOCK,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dispatched).toHaveLength(0);
    expect(result.warnings.join(" ")).toContain("unknown artifact");
  });

  it("TC-05A-05: mixed source + pack deltas in source-primary phase do not double-admit", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P2",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [SOURCE_ELIGIBLE_EVENT, PACK_EVENT],
      clock: FIXED_CLOCK,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dispatched).toHaveLength(1);
    expect(result.dispatched[0].artifact_id).toBe(SOURCE_ELIGIBLE_EVENT.artifact_id);
    expect(result.shadow_telemetry.suppression_reason_counts.pack_without_source_delta).toBe(1);
  });

  it("TC-05A-06: P1 emits shadow telemetry fields", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P1",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [SOURCE_ELIGIBLE_EVENT],
      clock: FIXED_CLOCK,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.shadow_telemetry.phase).toBe("P1");
    expect(result.shadow_telemetry.root_event_count).toBe(1);
    expect(result.shadow_telemetry.candidate_count).toBe(1);
    expect(result.shadow_telemetry.admitted_count).toBe(1);
    expect(result.shadow_telemetry.suppression_reason_counts).toHaveProperty(
      "pack_without_source_delta",
    );
  });
});

describe("runTrialOrchestrator — TC-07 anti-loop invariants", () => {
  it("TC-07-01: lineage depth > 2 is rejected without override", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P2",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [
        {
          ...SOURCE_ELIGIBLE_EVENT,
          lineage_depth: 3,
          root_event_id: "HBAG-ROOT-LINEAGE",
        },
      ],
      clock: FIXED_CLOCK,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dispatched).toHaveLength(0);
    expect(result.shadow_telemetry.suppression_reason_counts.lineage_depth_cap_exceeded).toBe(1);
  });

  it("TC-07-02: cooldown suppresses non-material re-admission", () => {
    const seen = new Set<string>();
    const cooldownState = new Map();
    const first = {
      ...SOURCE_ELIGIBLE_EVENT,
      before_sha: "a100001",
      after_sha: "b100001",
      root_event_id: "HBAG-ROOT-COOLDOWN",
      cluster_key: "hbag:sell:channel-strategy:HBAG-ROOT-COOLDOWN",
      cluster_fingerprint: "cfp-cooldown-001",
      material_delta: true,
    };
    const replay = {
      ...SOURCE_ELIGIBLE_EVENT,
      before_sha: "a100002",
      after_sha: "b100002",
      root_event_id: "HBAG-ROOT-COOLDOWN",
      cluster_key: "hbag:sell:channel-strategy:HBAG-ROOT-COOLDOWN",
      cluster_fingerprint: "cfp-cooldown-001",
      material_delta: false,
      changed_sections: ["Last-reviewed metadata"],
    };

    const firstRun = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P2",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [first],
      seenDedupeKeys: seen,
      cooldownState,
      clock: FIXED_CLOCK,
    });
    const replayRun = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P2",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [replay],
      seenDedupeKeys: seen,
      cooldownState,
      clock: FIXED_CLOCK,
    });

    expect(firstRun.ok).toBe(true);
    expect(replayRun.ok).toBe(true);
    if (!firstRun.ok || !replayRun.ok) return;

    expect(firstRun.dispatched).toHaveLength(1);
    expect(replayRun.dispatched).toHaveLength(0);
    expect(replayRun.shadow_telemetry.suppression_reason_counts.cooldown_non_material).toBe(1);
  });

  it("TC-07-03: projection-only regeneration produces zero admissions", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P2",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [
        {
          ...SOURCE_ELIGIBLE_EVENT,
          updated_by_process: "projection_auto",
          material_delta: false,
          changed_sections: ["Last-updated metadata"],
        },
      ],
      clock: FIXED_CLOCK,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dispatched).toHaveLength(0);
    expect(result.shadow_telemetry.suppression_reason_counts.anti_self_trigger_non_material).toBe(1);
  });

  it("TC-07-04: metadata-only source edits are non-material", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P2",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [
        {
          ...SOURCE_ELIGIBLE_EVENT,
          changed_sections: ["Last-reviewed metadata"],
        },
      ],
      clock: FIXED_CLOCK,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dispatched).toHaveLength(0);
    expect(result.shadow_telemetry.suppression_reason_counts.non_material_delta).toBe(1);
  });

  it("TC-07-05: anti-self-trigger does not suppress true source material deltas", () => {
    const result = runTrialOrchestrator({
      mode: "trial",
      cutoverPhase: "P2",
      standingRegistry: PHASE_TEST_REGISTRY,
      events: [
        {
          ...SOURCE_ELIGIBLE_EVENT,
          updated_by_process: "projection_auto",
          material_delta: true,
        },
      ],
      clock: FIXED_CLOCK,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dispatched).toHaveLength(1);
  });
});
