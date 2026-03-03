import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import { runMetricsRollup } from "../lp-do-ideas-metrics-runner.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  const { randomBytes } = require("node:crypto") as typeof import("node:crypto");
  const dir = join(tmpdir(), `metrics-runner-test-${randomBytes(4).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeTelemetry(dir: string, lines: object[]): string {
  const filePath = join(dir, "telemetry.jsonl");
  writeFileSync(filePath, lines.map((l) => JSON.stringify(l)).join("\n") + "\n", "utf-8");
  return filePath;
}

function writeQueueState(dir: string, entries: object[]): string {
  const filePath = join(dir, "queue-state.json");
  const state = {
    schema_version: "queue-state.v1",
    mode: "trial",
    business: "HEAD",
    generated_at: "2026-02-25T00:00:00.000Z",
    entries,
  };
  writeFileSync(filePath, JSON.stringify(state, null, 2) + "\n", "utf-8");
  return filePath;
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

function makeCycleSnapshot(overrides: Partial<Record<string, unknown>> = {}): object {
  return {
    cycle_id: "cycle-tc07-001",
    phase: "P2",
    mode: "enforced",
    root_event_ids: ["root-1", "root-2"],
    candidate_count: 3,
    admitted_cluster_count: 2,
    suppression_reason_counts: {
      cooldown_non_material: 1,
    },
    ...overrides,
  };
}

function makeQueueEntry(overrides: Partial<Record<string, unknown>> = {}): object {
  return {
    dispatch_id: "IDEA-DISPATCH-20260220000000-0001",
    queue_state: "enqueued",
    dispatched_at: "2026-02-20T00:00:00.000Z",
    packet: {
      schema_version: "dispatch.v1",
      dispatch_id: "IDEA-DISPATCH-20260220000000-0001",
      mode: "trial",
      business: "HEAD",
      trigger: "artifact_delta",
      artifact_id: "HEAD-SELL-PACK",
      before_sha: "abc001",
      after_sha: "def002",
      root_event_id: "HEAD-SELL-PACK:def002",
      anchor_key: "channel-strategy",
      cluster_key: "head:channel-strategy:HEAD-SELL-PACK:def002",
      cluster_fingerprint: "aabbcc001122",
      lineage_depth: 0,
      area_anchor: "channel-strategy",
      location_anchors: ["docs/business-os/strategy/HEAD/sell-pack.user.md"],
      provisional_deliverable_family: "business-artifact",
      current_truth: "HEAD-SELL-PACK changed",
      next_scope_now: "Investigate",
      adjacent_later: [],
      recommended_route: "lp-do-fact-find",
      status: "fact_find_ready",
      priority: "P2",
      confidence: 0.8,
      evidence_refs: ["docs/business-os/strategy/HEAD/sell-pack.user.md"],
      created_at: "2026-02-20T00:00:00.000Z",
      queue_state: "enqueued",
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("runMetricsRollup", () => {
  it("TC-07-A: rollup against fixture telemetry and queue returns valid IdeasMetricsRollup", () => {
    const dir = makeTmpDir();

    const telemetryPath = writeTelemetry(dir, [
      makeCycleSnapshot({
        cycle_id: "cycle-tc07-001",
        phase: "P2",
        mode: "enforced",
        root_event_ids: ["root-1", "root-2"],
        candidate_count: 3,
        admitted_cluster_count: 2,
        suppression_reason_counts: { cooldown_non_material: 1 },
      }),
      makeCycleSnapshot({
        cycle_id: "cycle-tc07-002",
        phase: "P3",
        mode: "enforced",
        root_event_ids: ["root-3"],
        candidate_count: 2,
        admitted_cluster_count: 1,
        suppression_reason_counts: { duplicate_event: 1 },
      }),
    ]);

    const queueStatePath = writeQueueState(dir, [
      makeQueueEntry({
        dispatch_id: "IDEA-DISPATCH-20260220000000-0001",
        queue_state: "enqueued",
        dispatched_at: "2026-02-20T00:00:00.000Z",
        packet: {
          schema_version: "dispatch.v1",
          dispatch_id: "IDEA-DISPATCH-20260220000000-0001",
          mode: "trial",
          business: "HEAD",
          trigger: "artifact_delta",
          artifact_id: "HEAD-SELL-PACK",
          before_sha: "abc001",
          after_sha: "def002",
          root_event_id: "root-1",
          anchor_key: "channel-strategy",
          cluster_key: "head:channel-strategy:HEAD-SELL-PACK:def002",
          cluster_fingerprint: "aabbcc001122",
          lineage_depth: 0,
          area_anchor: "channel-strategy",
          location_anchors: ["docs/business-os/strategy/HEAD/sell-pack.user.md"],
          provisional_deliverable_family: "business-artifact",
          current_truth: "changed",
          next_scope_now: "investigate",
          adjacent_later: [],
          recommended_route: "lp-do-fact-find",
          status: "fact_find_ready",
          priority: "P2",
          confidence: 0.8,
          evidence_refs: ["docs/business-os/strategy/HEAD/sell-pack.user.md"],
          created_at: "2026-02-20T00:00:00.000Z",
          queue_state: "enqueued",
        },
      }),
      makeQueueEntry({
        dispatch_id: "IDEA-DISPATCH-20260220000000-0002",
        queue_state: "processed",
        dispatched_at: "2026-02-20T00:00:00.000Z",
        packet: {
          schema_version: "dispatch.v1",
          dispatch_id: "IDEA-DISPATCH-20260220000000-0002",
          mode: "trial",
          business: "HEAD",
          trigger: "artifact_delta",
          artifact_id: "HEAD-MARKET-PACK",
          before_sha: "aaa001",
          after_sha: "bbb002",
          root_event_id: "root-3",
          anchor_key: "market-analysis",
          cluster_key: "head:market-analysis:HEAD-MARKET-PACK:bbb002",
          cluster_fingerprint: "ddeecc001122",
          lineage_depth: 0,
          area_anchor: "market-analysis",
          location_anchors: ["docs/business-os/strategy/HEAD/market-pack.user.md"],
          provisional_deliverable_family: "business-artifact",
          current_truth: "market changed",
          next_scope_now: "brief this",
          adjacent_later: [],
          recommended_route: "lp-do-briefing",
          status: "briefing_ready",
          priority: "P3",
          confidence: 0.7,
          evidence_refs: ["docs/business-os/strategy/HEAD/market-pack.user.md"],
          created_at: "2026-02-20T00:00:00.000Z",
          queue_state: "processed",
        },
      }),
    ]);

    const result = runMetricsRollup({
      telemetryPath,
      queueStatePath,
      now: new Date("2026-02-25T00:00:00.000Z"),
    });

    expect(result.ready).toBe(true);
    const rollup = result.rollup;

    // Basic structural checks
    expect(rollup.cycle_count).toBe(2);
    expect(rollup.candidate_count).toBe(5);
    expect(rollup.admitted_cluster_count).toBe(3);

    // Lane mix: 1 processed (IMPROVE: briefing_ready), 0 processed DO
    expect(rollup.lane_mix.IMPROVE_completed).toBe(1);
    expect(rollup.lane_mix.DO_completed).toBe(0);

    // Queue age: 1 enqueued DO entry with age 5 days (2026-02-20 → 2026-02-25)
    expect(rollup.queue_age_p95_days.DO).toBe(5);

    // Suppression rollup
    expect(rollup.suppression_reason_totals.cooldown_non_material).toBe(1);
    expect(rollup.suppression_reason_totals.duplicate_event).toBe(1);
  });

  it("TC-07-B: empty telemetry input returns not-ready/zero-cycle result without throwing", () => {
    const dir = makeTmpDir();

    const telemetryPath = writeTelemetry(dir, []);
    const queueStatePath = writeQueueState(dir, []);

    const result = runMetricsRollup({
      telemetryPath,
      queueStatePath,
      now: new Date("2026-02-25T00:00:00.000Z"),
    });

    expect(result.ready).toBe(false);
    if (!result.ready) {
      expect(typeof result.reason).toBe("string");
      expect(result.reason.length).toBeGreaterThan(0);
    }
    // Rollup is still a valid zero-state object
    expect(result.rollup.cycle_count).toBe(0);
    expect(result.rollup.candidate_count).toBe(0);
    expect(result.rollup.admitted_cluster_count).toBe(0);
  });

  it("TC-07-C: missing telemetry file is treated as empty and does not throw", () => {
    const dir = makeTmpDir();
    const telemetryPath = join(dir, "nonexistent-telemetry.jsonl");
    const queueStatePath = join(dir, "nonexistent-queue-state.json");

    let result: ReturnType<typeof runMetricsRollup> | undefined;
    expect(() => {
      result = runMetricsRollup({
        telemetryPath,
        queueStatePath,
        now: new Date("2026-02-25T00:00:00.000Z"),
      });
    }).not.toThrow();

    expect(result).toBeDefined();
    expect(result!.ready).toBe(false);
    if (result && !result.ready) {
      expect(result.reason).toContain(telemetryPath);
    }
    expect(result!.rollup.cycle_count).toBe(0);
  });

  it("TC-07-D: generated_at field is an ISO-8601 string in the output", () => {
    const dir = makeTmpDir();

    const telemetryPath = writeTelemetry(dir, [
      makeCycleSnapshot({
        cycle_id: "cycle-tc07-d-001",
        phase: "P1",
        mode: "shadow",
        root_event_ids: ["root-x"],
        candidate_count: 1,
        admitted_cluster_count: 1,
      }),
    ]);
    const queueStatePath = writeQueueState(dir, []);

    const fixedNow = new Date("2026-02-25T08:30:00.000Z");
    const result = runMetricsRollup({
      telemetryPath,
      queueStatePath,
      now: fixedNow,
    });

    expect(result.ready).toBe(true);
    const { generated_at } = result.rollup;

    // Must be a valid ISO-8601 string
    expect(typeof generated_at).toBe("string");
    const parsed = new Date(generated_at);
    expect(Number.isNaN(parsed.getTime())).toBe(false);

    // Must match the injected clock
    expect(generated_at).toBe(fixedNow.toISOString());
  });
});
