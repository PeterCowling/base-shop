/**
 * Tests for the lp-do-ideas dispatch routing adapter.
 *
 * TC-01: fact_find_ready packet with all required fields → RouteSuccess with FactFindInvocationPayload
 * TC-02: briefing_ready packet with required fields → RouteSuccess with BriefingInvocationPayload
 * TC-03: auto_executed status → RouteError RESERVED_STATUS
 * TC-04: logged_no_action status → RouteError UNKNOWN_STATUS
 * TC-05: Invalid schema_version → RouteError INVALID_SCHEMA_VERSION
 * TC-06: Invalid mode → RouteError INVALID_MODE
 * TC-07: Status/route mismatch → RouteError ROUTE_STATUS_MISMATCH
 * TC-08: Empty area_anchor → RouteError MISSING_AREA_ANCHOR
 * TC-09: Empty evidence_refs → RouteError MISSING_EVIDENCE_REFS
 * TC-10: Missing location_anchors on fact-find path → RouteError MISSING_LOCATION_ANCHORS
 * TC-11: Missing provisional_deliverable_family on fact-find path → RouteError MISSING_DELIVERABLE_FAMILY
 * TC-12: Case normalisation (mixed-case status/route values)
 * TC-13: Unknown status → RouteError UNKNOWN_STATUS
 * TC-14: Unknown route → RouteError UNKNOWN_ROUTE
 * TC-15: Payload fields are correctly mapped from source packet
 */

import { describe, expect, it } from "@jest/globals";

import {
  routeDispatch,
  type FactFindInvocationPayload,
  type BriefingInvocationPayload,
  type RouteSuccess,
  type RouteError,
} from "../lp-do-ideas-routing-adapter.js";
import type { TrialDispatchPacket } from "../lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_DATE = new Date("2026-02-24T15:30:00.000Z");

/** Builds a minimal valid fact_find_ready TrialDispatchPacket. */
function makeFactFindPacket(
  overrides: Partial<TrialDispatchPacket> = {},
): TrialDispatchPacket {
  return {
    schema_version: "dispatch.v1",
    dispatch_id: "IDEA-DISPATCH-20260224153000-0001",
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
    created_at: FIXED_DATE.toISOString(),
    queue_state: "enqueued",
    ...overrides,
  };
}

/** Builds a minimal valid briefing_ready TrialDispatchPacket. */
function makeBriefingPacket(
  overrides: Partial<TrialDispatchPacket> = {},
): TrialDispatchPacket {
  return {
    schema_version: "dispatch.v1",
    dispatch_id: "IDEA-DISPATCH-20260224153000-0002",
    mode: "trial",
    business: "HBAG",
    trigger: "artifact_delta",
    artifact_id: "HBAG-MARKET-PACK",
    before_sha: "ccc1234",
    after_sha: "fff5678",
    area_anchor: "market-intelligence",
    location_anchors: ["docs/business-os/strategy/HBAG/market-pack.user.md"],
    provisional_deliverable_family: "business-artifact",
    current_truth: "HBAG-MARKET-PACK changed",
    next_scope_now: "Understand market-intelligence delta for HBAG",
    adjacent_later: [],
    recommended_route: "lp-do-briefing",
    status: "briefing_ready",
    priority: "P3",
    confidence: 0.6,
    evidence_refs: ["docs/business-os/strategy/HBAG/market-pack.user.md"],
    created_at: FIXED_DATE.toISOString(),
    queue_state: "enqueued",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TC-01: fact_find_ready → RouteSuccess with FactFindInvocationPayload
// ---------------------------------------------------------------------------

describe("TC-01: fact_find_ready → FactFindInvocationPayload", () => {
  it("returns RouteSuccess for a valid fact_find_ready packet", () => {
    const packet = makeFactFindPacket();
    const result = routeDispatch(packet);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.route).toBe("lp-do-fact-find");
      expect(result.payload.skill).toBe("lp-do-fact-find");
    }
  });

  it("payload contains all required FactFindInvocationPayload fields", () => {
    const packet = makeFactFindPacket();
    const result = routeDispatch(packet) as RouteSuccess;

    expect(result.ok).toBe(true);
    const payload = result.payload as FactFindInvocationPayload;

    expect(payload.skill).toBe("lp-do-fact-find");
    expect(payload.dispatch_id).toBe(packet.dispatch_id);
    expect(payload.business).toBe(packet.business);
    expect(payload.area_anchor).toBe(packet.area_anchor);
    expect(payload.location_anchors).toEqual(packet.location_anchors);
    expect(payload.provisional_deliverable_family).toBe(packet.provisional_deliverable_family);
    expect(payload.evidence_refs).toEqual(packet.evidence_refs);
    expect(payload.dispatch_created_at).toBe(packet.created_at);
    expect(payload.source_packet).toBe(packet);
  });
});

// ---------------------------------------------------------------------------
// TC-02: briefing_ready → RouteSuccess with BriefingInvocationPayload
// ---------------------------------------------------------------------------

describe("TC-02: briefing_ready → BriefingInvocationPayload", () => {
  it("returns RouteSuccess for a valid briefing_ready packet", () => {
    const packet = makeBriefingPacket();
    const result = routeDispatch(packet);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.route).toBe("lp-do-briefing");
      expect(result.payload.skill).toBe("lp-do-briefing");
    }
  });

  it("payload contains all required BriefingInvocationPayload fields", () => {
    const packet = makeBriefingPacket();
    const result = routeDispatch(packet) as RouteSuccess;

    expect(result.ok).toBe(true);
    const payload = result.payload as BriefingInvocationPayload;

    expect(payload.skill).toBe("lp-do-briefing");
    expect(payload.dispatch_id).toBe(packet.dispatch_id);
    expect(payload.business).toBe(packet.business);
    expect(payload.area_anchor).toBe(packet.area_anchor);
    expect(payload.evidence_refs).toEqual(packet.evidence_refs);
    expect(payload.dispatch_created_at).toBe(packet.created_at);
    expect(payload.source_packet).toBe(packet);
  });

  it("briefing path passes through location_anchors if present", () => {
    const packet = makeBriefingPacket({
      location_anchors: ["some/path/to/doc.md"],
    });
    const result = routeDispatch(packet) as RouteSuccess;
    const payload = result.payload as BriefingInvocationPayload;
    expect(payload.location_anchors).toEqual(["some/path/to/doc.md"]);
  });

  it("briefing path produces empty location_anchors array if packet has none", () => {
    const packet = makeBriefingPacket({
      location_anchors: [] as unknown as [string, ...string[]],
    });
    const result = routeDispatch(packet) as RouteSuccess;
    const payload = result.payload as BriefingInvocationPayload;
    expect(payload.location_anchors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// TC-03: auto_executed → RESERVED_STATUS
// ---------------------------------------------------------------------------

describe("TC-03: auto_executed → RESERVED_STATUS", () => {
  it("rejects auto_executed status with RESERVED_STATUS error code", () => {
    const packet = makeFactFindPacket({
      status: "auto_executed",
      recommended_route: "lp-do-fact-find",
    });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("RESERVED_STATUS");
    expect(result.dispatch_id).toBe(packet.dispatch_id);
    expect(result.error).toContain("auto_executed");
  });
});

// ---------------------------------------------------------------------------
// TC-04: logged_no_action → UNKNOWN_STATUS (non-routable)
// ---------------------------------------------------------------------------

describe("TC-04: logged_no_action → UNKNOWN_STATUS", () => {
  it("rejects logged_no_action status with UNKNOWN_STATUS error code", () => {
    const packet = makeFactFindPacket({
      status: "logged_no_action",
      recommended_route: "lp-do-fact-find",
    });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNKNOWN_STATUS");
    expect(result.dispatch_id).toBe(packet.dispatch_id);
    expect(result.error).toContain("logged_no_action");
  });
});

// ---------------------------------------------------------------------------
// TC-05: Invalid schema_version → INVALID_SCHEMA_VERSION
// ---------------------------------------------------------------------------

describe("TC-05: Invalid schema_version", () => {
  it("rejects packet with wrong schema_version", () => {
    const packet = makeFactFindPacket({
      schema_version: "dispatch.v99" as "dispatch.v1",
    });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_SCHEMA_VERSION");
    expect(result.error).toContain("dispatch.v99");
  });
});

// ---------------------------------------------------------------------------
// TC-06: Invalid mode → INVALID_MODE
// ---------------------------------------------------------------------------

describe("TC-06: Invalid mode", () => {
  it("rejects packet with mode=live", () => {
    const packet = makeFactFindPacket({ mode: "live" as "trial" });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_MODE");
    expect(result.error).toContain("live");
  });
});

// ---------------------------------------------------------------------------
// TC-07: Status/route mismatch → ROUTE_STATUS_MISMATCH
// ---------------------------------------------------------------------------

describe("TC-07: Status/route mismatch", () => {
  it("rejects fact_find_ready with lp-do-briefing route", () => {
    const packet = makeFactFindPacket({
      status: "fact_find_ready",
      recommended_route: "lp-do-briefing",
    });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("ROUTE_STATUS_MISMATCH");
    expect(result.error).toContain("fact_find_ready");
    expect(result.error).toContain("lp-do-briefing");
  });

  it("rejects briefing_ready with lp-do-fact-find route", () => {
    const packet = makeBriefingPacket({
      status: "briefing_ready",
      recommended_route: "lp-do-fact-find",
    });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("ROUTE_STATUS_MISMATCH");
  });
});

// ---------------------------------------------------------------------------
// TC-08: Empty area_anchor → MISSING_AREA_ANCHOR
// ---------------------------------------------------------------------------

describe("TC-08: Empty area_anchor", () => {
  it("rejects packet with empty area_anchor string", () => {
    const packet = makeFactFindPacket({ area_anchor: "" });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("MISSING_AREA_ANCHOR");
  });

  it("rejects packet with whitespace-only area_anchor", () => {
    const packet = makeFactFindPacket({ area_anchor: "   " });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("MISSING_AREA_ANCHOR");
  });
});

// ---------------------------------------------------------------------------
// TC-09: Empty evidence_refs → MISSING_EVIDENCE_REFS
// ---------------------------------------------------------------------------

describe("TC-09: Empty evidence_refs", () => {
  it("rejects fact_find_ready packet with empty evidence_refs", () => {
    const packet = makeFactFindPacket({
      evidence_refs: [] as unknown as [string, ...string[]],
    });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("MISSING_EVIDENCE_REFS");
  });

  it("rejects briefing_ready packet with empty evidence_refs", () => {
    const packet = makeBriefingPacket({
      evidence_refs: [] as unknown as [string, ...string[]],
    });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("MISSING_EVIDENCE_REFS");
  });
});

// ---------------------------------------------------------------------------
// TC-10: Missing location_anchors on fact-find path → MISSING_LOCATION_ANCHORS
// ---------------------------------------------------------------------------

describe("TC-10: Missing location_anchors on fact-find path", () => {
  it("rejects fact_find_ready packet with empty location_anchors", () => {
    const packet = makeFactFindPacket({
      location_anchors: [] as unknown as [string, ...string[]],
    });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("MISSING_LOCATION_ANCHORS");
    expect(result.error).toContain("location_anchors");
  });
});

// ---------------------------------------------------------------------------
// TC-11: Missing provisional_deliverable_family on fact-find path
// ---------------------------------------------------------------------------

describe("TC-11: Missing provisional_deliverable_family on fact-find path", () => {
  it("rejects fact_find_ready packet with empty provisional_deliverable_family", () => {
    const packet = makeFactFindPacket({
      provisional_deliverable_family: "" as "business-artifact",
    });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("MISSING_DELIVERABLE_FAMILY");
  });

  it("briefing path does not require provisional_deliverable_family", () => {
    const packet = makeBriefingPacket({
      provisional_deliverable_family: "" as "business-artifact",
    });
    const result = routeDispatch(packet);
    // briefing_ready should succeed even with empty family
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-12: Case normalisation
// ---------------------------------------------------------------------------

describe("TC-12: Case normalisation", () => {
  it("accepts fact_find_ready with uppercase STATUS (normalised before comparison)", () => {
    const packet = makeFactFindPacket({
      status: "FACT_FIND_READY" as "fact_find_ready",
      recommended_route: "lp-do-fact-find",
    });
    const result = routeDispatch(packet);
    expect(result.ok).toBe(true);
  });

  it("accepts briefing_ready with mixed-case route (normalised before comparison)", () => {
    const packet = makeBriefingPacket({
      status: "BRIEFING_READY" as "briefing_ready",
      recommended_route: "LP-DO-BRIEFING" as "lp-do-briefing",
    });
    const result = routeDispatch(packet);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.route).toBe("lp-do-briefing");
    }
  });
});

// ---------------------------------------------------------------------------
// TC-13: Unknown status → UNKNOWN_STATUS
// ---------------------------------------------------------------------------

describe("TC-13: Unknown status", () => {
  it("rejects completely unknown status with UNKNOWN_STATUS", () => {
    const packet = makeFactFindPacket({
      status: "completely_unknown" as "fact_find_ready",
    });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNKNOWN_STATUS");
    expect(result.error).toContain("completely_unknown");
  });
});

// ---------------------------------------------------------------------------
// TC-14: Unknown route → UNKNOWN_ROUTE
// ---------------------------------------------------------------------------

describe("TC-14: Unknown route", () => {
  it("rejects unknown recommended_route with UNKNOWN_ROUTE", () => {
    const packet = makeFactFindPacket({
      recommended_route: "lp-do-unknown-skill" as "lp-do-fact-find",
    });
    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("UNKNOWN_ROUTE");
    expect(result.error).toContain("lp-do-unknown-skill");
  });
});

// ---------------------------------------------------------------------------
// TC-15: Payload fields correctly mapped
// ---------------------------------------------------------------------------

describe("TC-15: Payload field mapping", () => {
  it("fact-find payload dispatch_id is preserved from source packet", () => {
    const packet = makeFactFindPacket({
      dispatch_id: "IDEA-DISPATCH-20260224153000-CUSTOM",
    });
    const result = routeDispatch(packet) as RouteSuccess;
    expect(result.ok).toBe(true);
    expect(result.payload.dispatch_id).toBe("IDEA-DISPATCH-20260224153000-CUSTOM");
  });

  it("fact-find payload source_packet is the original packet reference", () => {
    const packet = makeFactFindPacket();
    const result = routeDispatch(packet) as RouteSuccess;
    const payload = result.payload as FactFindInvocationPayload;
    expect(payload.source_packet).toBe(packet);
  });

  it("briefing payload source_packet is the original packet reference", () => {
    const packet = makeBriefingPacket();
    const result = routeDispatch(packet) as RouteSuccess;
    const payload = result.payload as BriefingInvocationPayload;
    expect(payload.source_packet).toBe(packet);
  });

  it("RouteError captures dispatch_id from packet for correlation", () => {
    const packet = makeFactFindPacket({
      mode: "live" as "trial",
      dispatch_id: "IDEA-DISPATCH-20260224153000-CORR",
    });
    const result = routeDispatch(packet) as RouteError;
    expect(result.ok).toBe(false);
    expect(result.dispatch_id).toBe("IDEA-DISPATCH-20260224153000-CORR");
  });
});
