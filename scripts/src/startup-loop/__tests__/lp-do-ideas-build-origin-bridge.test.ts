import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  runBuildOriginSignalsBridge,
  validateBuildOriginDispatchPacket,
} from "../ideas/lp-do-ideas-build-origin-bridge.js";
import { parseQueueState } from "../ideas/lp-do-ideas-queue-state-file.js";
import type { TrialDispatchPacketV2 } from "../ideas/lp-do-ideas-trial.js";

function makeTmpDir(): string {
  const dir = path.join(tmpdir(), `build-origin-bridge-${randomBytes(4).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

function readQueue(queueStatePath: string) {
  const parsed = parseQueueState(readFileSync(queueStatePath, "utf8"));
  if ("error" in parsed) {
    throw new Error(parsed.error);
  }
  return parsed;
}

describe("lp-do-ideas-build-origin-bridge", () => {
  it("TC-01: merges duplicate sidecars into one operator_idea queue admission with build_origin provenance", () => {
    const rootDir = makeTmpDir();
    const planDir = path.join(rootDir, "docs", "plans", "test-feature");
    mkdirSync(planDir, { recursive: true });

    writeJson(path.join(planDir, "results-review.signals.json"), {
      schema_version: "results-review.signals.v1",
      generated_at: "2026-03-10T09:00:00.000Z",
      plan_slug: "test-feature",
      review_cycle_key: "test-feature",
      source_path: "docs/plans/test-feature/results-review.user.md",
      build_origin_status: "ready",
      failures: [],
      items: [
        {
          type: "idea",
          business: "BRIK",
          title: "Post-authoring sidecar extraction as a reusable loop process",
          body: "This came up again during build review.",
          suggested_action: "Create a guarded implementation plan for the queue bridge.",
          source: "results-review.user.md",
          date: "2026-03-10T09:00:00.000Z",
          path: "docs/plans/test-feature/results-review.user.md",
          idea_key: "legacy-key",
          review_cycle_key: "test-feature",
          canonical_title: "Post-authoring sidecar extraction as a reusable loop process",
          build_signal_id: "signal-123",
          recurrence_key: "recur-123",
          build_origin_status: "ready",
          priority_tier: "P2",
          urgency: "U2",
          effort: "M",
          reason_code: "RULE_P2_OPERATOR_EXCEPTION",
        },
      ],
    });

    writeJson(path.join(planDir, "pattern-reflection.entries.json"), {
      schema_version: "pattern-reflection.entries.v1",
      generated_at: "2026-03-10T09:05:00.000Z",
      plan_slug: "test-feature",
      review_cycle_key: "test-feature",
      source_path: "docs/plans/test-feature/pattern-reflection.user.md",
      build_origin_status: "ready",
      failures: [],
      entries: [
        {
          review_cycle_key: "test-feature",
          canonical_title: "Post-authoring sidecar extraction as a reusable loop process",
          pattern_summary: "Post-authoring sidecar extraction as a reusable loop process",
          category: "new-loop-process",
          routing_target: "loop_update",
          occurrence_count: 3,
          evidence_refs: ["docs/plans/_archive/example/results-review.user.md"],
          build_signal_id: "signal-123",
          recurrence_key: "recur-123",
          build_origin_status: "ready",
        },
      ],
    });

    const queueStatePath = path.join(rootDir, "docs", "business-os", "startup-loop", "ideas", "trial", "queue-state.json");
    const telemetryPath = path.join(rootDir, "docs", "business-os", "startup-loop", "ideas", "trial", "telemetry.jsonl");

    const result = runBuildOriginSignalsBridge({
      rootDir,
      planDir,
      queueStatePath,
      telemetryPath,
      business: "BRIK",
      clock: () => new Date("2026-03-10T10:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    expect(result.signals_considered).toBe(1);
    expect(result.signals_admitted).toBe(1);
    expect(result.dispatches_enqueued).toBe(1);

    const queue = readQueue(queueStatePath);
    expect(queue.dispatches).toHaveLength(1);
    const dispatch = queue.dispatches[0] as TrialDispatchPacketV2;
    expect(dispatch.trigger).toBe("operator_idea");
    expect(dispatch.artifact_id).toBeNull();
    expect(dispatch.recommended_route).toBe("lp-do-plan");
    expect(dispatch.status).toBe("plan_ready");
    expect(dispatch.build_origin?.build_signal_id).toBe("signal-123");
    expect(dispatch.build_origin?.merge_state).toBe("merged_cross_sidecar");
    expect(dispatch.build_origin?.primary_source).toBe("pattern-reflection.entries.json");
    expect(dispatch.build_origin?.source_presence).toEqual({
      results_review_signal: true,
      pattern_reflection_entry: true,
    });
    expect(dispatch.build_origin?.gap_case?.source_kind).toBe("build_origin");
    expect(dispatch.build_origin?.gap_case?.runtime_binding.candidate_id).toMatch(/^cand-/);
    expect(dispatch.build_origin?.prescription?.source).toBe("build_origin");
    expect(dispatch.build_origin?.prescription?.required_route).toBe("lp-do-plan");
  });

  it("TC-02: rerun suppresses duplicate queue admission by canonical cluster fingerprint", () => {
    const rootDir = makeTmpDir();
    const planDir = path.join(rootDir, "docs", "plans", "test-feature");
    mkdirSync(planDir, { recursive: true });

    writeJson(path.join(planDir, "results-review.signals.json"), {
      schema_version: "results-review.signals.v1",
      generated_at: "2026-03-10T09:00:00.000Z",
      plan_slug: "test-feature",
      review_cycle_key: "test-feature",
      source_path: "docs/plans/test-feature/results-review.user.md",
      build_origin_status: "ready",
      failures: [],
      items: [
        {
          type: "idea",
          business: "BRIK",
          title: "Queue-backed build origin bridge",
          body: "Direct queue path is still missing.",
          source: "results-review.user.md",
          date: "2026-03-10T09:00:00.000Z",
          path: "docs/plans/test-feature/results-review.user.md",
          idea_key: "legacy-key",
          review_cycle_key: "test-feature",
          canonical_title: "Queue-backed build origin bridge",
          build_signal_id: "signal-456",
          recurrence_key: "recur-456",
          build_origin_status: "ready",
        },
      ],
    });

    const queueStatePath = path.join(rootDir, "docs", "business-os", "startup-loop", "ideas", "trial", "queue-state.json");
    const telemetryPath = path.join(rootDir, "docs", "business-os", "startup-loop", "ideas", "trial", "telemetry.jsonl");

    const first = runBuildOriginSignalsBridge({
      rootDir,
      planDir,
      queueStatePath,
      telemetryPath,
      business: "BRIK",
      clock: () => new Date("2026-03-10T10:00:00.000Z"),
    });
    const second = runBuildOriginSignalsBridge({
      rootDir,
      planDir,
      queueStatePath,
      telemetryPath,
      business: "BRIK",
      clock: () => new Date("2026-03-10T10:05:00.000Z"),
    });

    expect(first.dispatches_enqueued).toBe(1);
    expect(second.dispatches_enqueued).toBe(0);
    expect(second.suppressed).toBe(1);
    expect(readQueue(queueStatePath).dispatches).toHaveLength(1);
  });

  it("TC-03: invalid route/status mismatch is rejected before queue admission", () => {
    const packet: TrialDispatchPacketV2 = {
      schema_version: "dispatch.v2",
      dispatch_id: "IDEA-DISPATCH-20260310100000-0001",
      mode: "trial",
      business: "BRIK",
      trigger: "operator_idea",
      artifact_id: null,
      before_sha: null,
      after_sha: "signal-789",
      root_event_id: "build-origin:test-feature:signal-789",
      anchor_key: "queue-bridge",
      cluster_key: "build-origin:brik:test-feature:queue-bridge",
      cluster_fingerprint: "signal-789",
      lineage_depth: 0,
      area_anchor: "Queue bridge",
      location_anchors: ["docs/plans/test-feature/results-review.user.md"],
      provisional_deliverable_family: "multi",
      current_truth: "Queue bridge is missing",
      next_scope_now: "Plan it",
      adjacent_later: [],
      recommended_route: "lp-do-fact-find",
      status: "plan_ready",
      priority: "P2",
      confidence: 0.8,
      evidence_refs: ["docs/plans/test-feature/results-review.user.md"],
      created_at: "2026-03-10T10:00:00.000Z",
      queue_state: "enqueued",
      why: "Auto-generated",
      intended_outcome: {
        type: "operational",
        statement: "Produce a plan.",
        source: "auto",
      },
    };

    const validation = validateBuildOriginDispatchPacket(packet);
    expect(validation.ok).toBe(false);
    expect(validation.code).toBe("ROUTE_STATUS_MISMATCH");
  });
});
