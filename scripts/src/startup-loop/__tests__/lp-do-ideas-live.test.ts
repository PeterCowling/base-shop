/**
 * Tests for the lp-do-ideas live orchestrator and routing adapter live-mode compatibility.
 *
 * TC-02-A: mode="live" input returns ok: true with dispatch packets
 * TC-02-B: invalid mode returns deterministic fail-closed error
 * TC-02-C: reserved status (auto_executed) still rejects in routing adapter for live packets
 * TC-02-D: routing adapter accepts mode="live" packets that are fully valid
 * TC-02-E: routing adapter still rejects truly invalid modes with INVALID_MODE
 */

import { createHash } from "node:crypto";

import { describe, expect, it } from "@jest/globals";

import {
  type LiveDispatchPacket,
  type LiveOrchestratorResult,
  runLiveOrchestrator,
} from "../lp-do-ideas-live.js";
import { routeDispatch, type RouteError, type RouteSuccess } from "../lp-do-ideas-routing-adapter.js";
import type { ArtifactDeltaEvent } from "../lp-do-ideas-trial.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FIXED_DATE = new Date("2026-02-25T10:00:00.000Z");

function makeValidEvent(overrides: Partial<ArtifactDeltaEvent> = {}): ArtifactDeltaEvent {
  return {
    artifact_id: "HEAD-SELL-PACK",
    business: "HEAD",
    before_sha: "abc0001",
    after_sha: "def0002",
    path: "docs/business-os/strategy/HEAD/sell-pack.user.md",
    domain: "SELL",
    changed_sections: ["channel strategy", "pricing"],
    ...overrides,
  };
}

function makeLivePacketFromResult(result: LiveOrchestratorResult): LiveDispatchPacket {
  if (!result.ok || result.dispatched.length === 0) {
    throw new Error("Expected at least one dispatched packet");
  }
  return result.dispatched[0];
}

// ---------------------------------------------------------------------------
// TC-02-A: mode="live" returns ok: true with dispatch packets
// ---------------------------------------------------------------------------

describe("TC-02-A: mode=live orchestrator happy path", () => {
  it("returns ok: true when mode is 'live' and events are valid", () => {
    const result = runLiveOrchestrator({
      mode: "live",
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dispatched.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("emitted packets have mode='live'", () => {
    const result = runLiveOrchestrator({
      mode: "live",
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const packet of result.dispatched) {
        expect(packet.mode).toBe("live");
      }
    }
  });

  it("result includes suppressed, noop, warnings, and shadow_telemetry", () => {
    const result = runLiveOrchestrator({
      mode: "live",
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(typeof result.suppressed).toBe("number");
      expect(typeof result.noop).toBe("number");
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.shadow_telemetry).toBeDefined();
      expect(typeof result.shadow_telemetry.admitted_count).toBe("number");
    }
  });

  it("packets inherit business, artifact_id, area_anchor from source event", () => {
    const event = makeValidEvent({ business: "BRIK", artifact_id: "BRIK-SELL-PACK" });
    const result = runLiveOrchestrator({
      mode: "live",
      events: [event],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (result.ok && result.dispatched.length > 0) {
      const packet = result.dispatched[0];
      expect(packet.business).toBe("BRIK");
      expect(packet.artifact_id).toBe("BRIK-SELL-PACK");
    }
  });

  it("suppresses first-registration events (no before_sha)", () => {
    const event = makeValidEvent({ before_sha: null });
    const result = runLiveOrchestrator({
      mode: "live",
      events: [event],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dispatched.length).toBe(0);
      expect(result.noop).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// TC-02-B: invalid mode returns deterministic fail-closed error
// ---------------------------------------------------------------------------

describe("TC-02-B: invalid mode → fail-closed error", () => {
  it("returns ok: false for mode='trial'", () => {
    const result = runLiveOrchestrator({
      mode: "trial",
      events: [makeValidEvent()],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("lp-do-ideas-live");
      expect(result.error).toContain("trial");
    }
  });

  it("returns ok: false for empty mode string", () => {
    const result = runLiveOrchestrator({
      mode: "",
      events: [makeValidEvent()],
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok: false for mode='garbage'", () => {
    const result = runLiveOrchestrator({
      mode: "garbage",
      events: [makeValidEvent()],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("garbage");
    }
  });

  it("error message is deterministic and includes mode value", () => {
    const result1 = runLiveOrchestrator({ mode: "invalid_mode", events: [] });
    const result2 = runLiveOrchestrator({ mode: "invalid_mode", events: [] });

    expect(result1.ok).toBe(false);
    expect(result2.ok).toBe(false);
    if (!result1.ok && !result2.ok) {
      expect(result1.error).toBe(result2.error);
      expect(result1.error).toContain("invalid_mode");
    }
  });
});

// ---------------------------------------------------------------------------
// TC-02-C: reserved status (auto_executed) still rejects in adapter for live packets
// ---------------------------------------------------------------------------

describe("TC-02-C: auto_executed status rejected by adapter even for live packets", () => {
  it("rejects auto_executed status on a live packet with RESERVED_STATUS", () => {
    const packet: LiveDispatchPacket = {
      schema_version: "dispatch.v1",
      dispatch_id: "IDEA-DISPATCH-20260225100000-0001",
      mode: "live",
      business: "HEAD",
      trigger: "artifact_delta",
      artifact_id: "HEAD-SELL-PACK",
      before_sha: "abc0001",
      after_sha: "def0002",
      root_event_id: "HEAD-SELL-PACK:def0002",
      anchor_key: "channel-strategy",
      cluster_key: "head:sell:channel-strategy:HEAD-SELL-PACK:def0002",
      cluster_fingerprint: createHash("sha256")
        .update("HEAD-SELL-PACK:def0002\nchannel-strategy")
        .digest("hex"),
      lineage_depth: 0,
      area_anchor: "channel-strategy",
      location_anchors: ["docs/business-os/strategy/HEAD/sell-pack.user.md"],
      provisional_deliverable_family: "business-artifact",
      current_truth: "HEAD-SELL-PACK changed",
      next_scope_now: "Investigate channel-strategy delta for HEAD",
      adjacent_later: [],
      recommended_route: "lp-do-fact-find",
      status: "auto_executed",
      priority: "P2",
      confidence: 0.75,
      evidence_refs: ["docs/business-os/strategy/HEAD/sell-pack.user.md"],
      created_at: FIXED_DATE.toISOString(),
      queue_state: "enqueued",
    };

    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("RESERVED_STATUS");
    expect(result.dispatch_id).toBe(packet.dispatch_id);
    expect(result.error).toContain("auto_executed");
  });
});

// ---------------------------------------------------------------------------
// TC-02-D: routing adapter accepts valid mode="live" packets
// ---------------------------------------------------------------------------

describe("TC-02-D: routing adapter accepts mode=live packets", () => {
  it("routes a fact_find_ready live packet to lp-do-fact-find", () => {
    const packet: LiveDispatchPacket = {
      schema_version: "dispatch.v1",
      dispatch_id: "IDEA-DISPATCH-20260225100000-0002",
      mode: "live",
      business: "HEAD",
      trigger: "artifact_delta",
      artifact_id: "HEAD-SELL-PACK",
      before_sha: "abc0001",
      after_sha: "def0002",
      root_event_id: "HEAD-SELL-PACK:def0002",
      anchor_key: "channel-strategy",
      cluster_key: "head:sell:channel-strategy:HEAD-SELL-PACK:def0002",
      cluster_fingerprint: createHash("sha256")
        .update("HEAD-SELL-PACK:def0002\nchannel-strategy")
        .digest("hex"),
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
      confidence: 0.75,
      evidence_refs: ["docs/business-os/strategy/HEAD/sell-pack.user.md"],
      created_at: FIXED_DATE.toISOString(),
      queue_state: "enqueued",
    };

    const result = routeDispatch(packet) as RouteSuccess;

    expect(result.ok).toBe(true);
    expect(result.route).toBe("lp-do-fact-find");
    expect(result.payload.skill).toBe("lp-do-fact-find");
  });

  it("routes a briefing_ready live packet to lp-do-briefing", () => {
    const packet: LiveDispatchPacket = {
      schema_version: "dispatch.v1",
      dispatch_id: "IDEA-DISPATCH-20260225100000-0003",
      mode: "live",
      business: "HEAD",
      trigger: "artifact_delta",
      artifact_id: "HEAD-MARKET-PACK",
      before_sha: "abc1111",
      after_sha: "def2222",
      root_event_id: "HEAD-MARKET-PACK:def2222",
      anchor_key: "market-intelligence",
      cluster_key: "head:market:market-intelligence:HEAD-MARKET-PACK:def2222",
      cluster_fingerprint: createHash("sha256")
        .update("HEAD-MARKET-PACK:def2222\nmarket-intelligence")
        .digest("hex"),
      lineage_depth: 0,
      area_anchor: "market-intelligence",
      location_anchors: ["docs/business-os/market-research/HEAD/market-pack.user.md"],
      provisional_deliverable_family: "business-artifact",
      current_truth: "HEAD-MARKET-PACK changed",
      next_scope_now: "Understand market-intelligence delta for HEAD",
      adjacent_later: [],
      recommended_route: "lp-do-briefing",
      status: "briefing_ready",
      priority: "P3",
      confidence: 0.5,
      evidence_refs: ["docs/business-os/market-research/HEAD/market-pack.user.md"],
      created_at: FIXED_DATE.toISOString(),
      queue_state: "enqueued",
    };

    const result = routeDispatch(packet) as RouteSuccess;

    expect(result.ok).toBe(true);
    expect(result.route).toBe("lp-do-briefing");
    expect(result.payload.skill).toBe("lp-do-briefing");
  });

  it("end-to-end: live orchestrator output packets route cleanly through adapter", () => {
    const result = runLiveOrchestrator({
      mode: "live",
      events: [makeValidEvent()],
      clock: () => FIXED_DATE,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const packet of result.dispatched) {
      const routeResult = routeDispatch(packet);
      expect(routeResult.ok).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// TC-02-E: routing adapter still rejects truly invalid modes
// ---------------------------------------------------------------------------

describe("TC-02-E: routing adapter rejects truly invalid modes", () => {
  it("rejects mode='invalid' with INVALID_MODE error", () => {
    const packet = {
      schema_version: "dispatch.v1" as const,
      dispatch_id: "IDEA-DISPATCH-20260225100000-0099",
      mode: "invalid" as "trial",
      business: "HEAD",
      trigger: "artifact_delta" as const,
      artifact_id: "HEAD-SELL-PACK",
      before_sha: "abc0001",
      after_sha: "def0002",
      root_event_id: "HEAD-SELL-PACK:def0002",
      anchor_key: "channel-strategy",
      cluster_key: "head:sell:channel-strategy",
      cluster_fingerprint: "abc",
      lineage_depth: 0,
      area_anchor: "channel-strategy",
      location_anchors: ["docs/path.md"] as [string, ...string[]],
      provisional_deliverable_family: "business-artifact" as const,
      current_truth: "changed",
      next_scope_now: "investigate",
      adjacent_later: [] as string[],
      recommended_route: "lp-do-fact-find" as const,
      status: "fact_find_ready" as const,
      priority: "P2" as const,
      confidence: 0.75,
      evidence_refs: ["docs/path.md"] as [string, ...string[]],
      created_at: FIXED_DATE.toISOString(),
      queue_state: "enqueued" as const,
    };

    const result = routeDispatch(packet) as RouteError;

    expect(result.ok).toBe(false);
    expect(result.code).toBe("INVALID_MODE");
    expect(result.error).toContain("invalid");
  });
});
