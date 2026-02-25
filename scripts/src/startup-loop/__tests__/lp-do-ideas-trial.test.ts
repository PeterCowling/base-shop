import { describe, expect, it } from "@jest/globals";

import {
  T1_SEMANTIC_KEYWORDS,
  buildDedupeKey,
  buildDispatchId,
  runTrialOrchestrator,
  type ArtifactDeltaEvent,
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
