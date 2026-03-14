import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  markDispatchesCompleted,
  parseMarkDispatchesCompletedArgs,
} from "../ideas/lp-do-ideas-queue-state-completion.js";

interface TestDispatch {
  schema_version: "dispatch.v1";
  dispatch_id: string;
  mode: "trial";
  business: string;
  trigger: string;
  area_anchor: string;
  domain: string;
  status: string;
  recommended_route: string;
  queue_state: string;
  priority: "P1" | "P2" | "P3";
  provisional_deliverable_family: string;
  current_truth: string;
  next_scope_now: string;
  evidence_refs: string[];
  created_at: string;
  self_evolving?: {
    candidate_id: string;
    decision_id: string;
    policy_version: string;
    recommended_route_origin: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
    executor_path: string;
    handoff_emitted_at: string;
  };
  processed_by?: {
    target_route?: string;
    target_kind?: string;
    target_slug?: string;
    target_path?: string;
    fact_find_slug: string;
    fact_find_path: string;
    processed_at: string;
    route: string;
  };
  completed_by?: {
    plan_path?: string;
    micro_build_path?: string;
    completed_at: string;
    outcome: string;
    self_evolving?: {
      candidate_id: string;
      decision_id: string;
      dispatch_id: string;
      maturity_due_at: string;
      maturity_status: "pending" | "matured";
      measurement_status:
        | "pending"
        | "verified"
        | "verified_degraded"
        | "missing"
        | "insufficient_sample";
      outcome_event_id: string | null;
      verified_observation_ids: string[];
    };
  };
}

interface QueueStateFixture {
  queue_version: "queue.v1";
  mode: "trial";
  created_at: string;
  last_updated: string;
  counts: {
    enqueued: number;
    processed: number;
    skipped: number;
    error: number;
    suppressed: number;
    auto_executed: number;
    completed: number;
    total: number;
    fact_find_ready: number;
  };
  dispatches: TestDispatch[];
}

const BASE_TIME = "2026-02-25T00:00:00.000Z";

function makeTmpDir(): string {
  const dir = join(tmpdir(), `queue-completion-test-${randomBytes(4).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function makeDispatch(overrides: Partial<TestDispatch> = {}): TestDispatch {
  const suffix = randomBytes(2).toString("hex");
  return {
    schema_version: "dispatch.v1",
    dispatch_id: `IDEA-DISPATCH-20260225-${suffix}`,
    mode: "trial",
    business: "BRIK",
    trigger: "operator_idea",
    area_anchor: "test anchor",
    domain: "PRODUCTS",
    status: "fact_find_ready",
    recommended_route: "lp-do-fact-find",
    queue_state: "auto_executed",
    priority: "P1",
    provisional_deliverable_family: "code-change",
    current_truth: "test",
    next_scope_now: "test",
    evidence_refs: ["operator-stated: test"],
    created_at: BASE_TIME,
    processed_by: {
      fact_find_slug: "my-slug",
      fact_find_path: "docs/plans/my-slug/fact-find.md",
      processed_at: BASE_TIME,
      route: "auto-executed",
    },
    ...overrides,
  };
}

function makeQueueFixture(dispatches: TestDispatch[]): QueueStateFixture {
  return {
    queue_version: "queue.v1",
    mode: "trial",
    created_at: BASE_TIME,
    last_updated: BASE_TIME,
    counts: {
      enqueued: 0,
      processed: 0,
      skipped: 0,
      error: 0,
      suppressed: 0,
      auto_executed: dispatches.filter((d) => d.queue_state === "auto_executed").length,
      completed: dispatches.filter((d) => d.queue_state === "completed").length,
      total: dispatches.length,
      fact_find_ready: dispatches.filter((d) => d.status === "fact_find_ready").length,
    },
    dispatches,
  };
}

function writeFixture(filePath: string, fixture: QueueStateFixture): void {
  writeFileSync(filePath, JSON.stringify(fixture, null, 2) + "\n", "utf-8");
}

function writeBuildRecord(rootDir: string, relativePath: string, content: string): void {
  const filePath = join(rootDir, relativePath);
  mkdirSync(join(filePath, ".."), { recursive: true });
  writeFileSync(filePath, content.trim() + "\n", "utf-8");
}

function readFixture(filePath: string): QueueStateFixture {
  return JSON.parse(readFileSync(filePath, "utf-8")) as QueueStateFixture;
}

describe("markDispatchesCompleted", () => {
  it("TC-00: parses CLI args with queue-state default", () => {
    const parsed = parseMarkDispatchesCompletedArgs([
      "--feature-slug",
      "my-slug",
      "--plan-path",
      "docs/plans/_archive/my-slug/plan.md",
      "--outcome",
      "Feature delivered",
    ]);

    expect(parsed).toEqual({
      queueStatePath: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
      featureSlug: "my-slug",
      planPath: "docs/plans/_archive/my-slug/plan.md",
      outcome: "Feature delivered",
    });
  });

  it("TC-00B: parse throws when required flags are missing", () => {
    expect(() =>
      parseMarkDispatchesCompletedArgs([
        "--feature-slug",
        "my-slug",
        "--outcome",
        "Feature delivered",
      ]),
    ).toThrow("missing_required_flag:--plan-path");
  });

  it("TC-01: marks one matching dispatch as completed", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    writeFixture(queueStatePath, makeQueueFixture([makeDispatch()]));

    const fixedClock = () => new Date("2026-02-26T12:34:56.000Z");
    const result = markDispatchesCompleted({
      queueStatePath,
      featureSlug: "my-slug",
      planPath: "docs/plans/_archive/my-slug/plan.md",
      outcome: "Feature delivered",
      clock: fixedClock,
    });

    expect(result).toEqual({ ok: true, mutated: 1, skipped: 0 });

    const updated = readFixture(queueStatePath);
    const dispatch = updated.dispatches[0];
    expect(dispatch.queue_state).toBe("completed");
    expect(dispatch.status).toBe("completed");
    expect(dispatch.completed_by?.plan_path).toBe("docs/plans/_archive/my-slug/plan.md");
    expect(dispatch.completed_by?.outcome).toBe("Feature delivered");
    expect(dispatch.completed_by?.completed_at).toBe(fixedClock().toISOString());
  });

  it("TC-06A: stamps pending self-evolving completion metadata for deferred measurement", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    writeFixture(
      queueStatePath,
      makeQueueFixture([
        makeDispatch({
          self_evolving: {
            candidate_id: "cand-1",
            decision_id: "decision-1",
            policy_version: "self-evolving-policy.v1",
            recommended_route_origin: "lp-do-plan",
            executor_path: "lp-do-build:container:website-v3",
            handoff_emitted_at: BASE_TIME,
          },
        }),
      ]),
    );

    const fixedClock = () => new Date("2026-02-26T12:34:56.000Z");
    const result = markDispatchesCompleted({
      queueStatePath,
      featureSlug: "my-slug",
      planPath: "docs/plans/_archive/my-slug/plan.md",
      outcome: "Primary KPI improvement shipped",
      rootDir: dir,
      clock: fixedClock,
    });

    expect(result).toEqual({ ok: true, mutated: 1, skipped: 0 });

    const updated = readFixture(queueStatePath);
    expect(updated.dispatches[0]?.completed_by?.self_evolving).toEqual(
      expect.objectContaining({
        candidate_id: "cand-1",
        decision_id: "decision-1",
        dispatch_id: updated.dispatches[0]?.dispatch_id,
        maturity_status: "pending",
        measurement_status: "pending",
      }),
    );
  });

  it("TC-06B: auto-extracts verified self-evolving measurement from build-record", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const planPath = "docs/plans/_archive/my-slug/plan.md";
    writeFixture(
      queueStatePath,
      makeQueueFixture([
        makeDispatch({
          self_evolving: {
            candidate_id: "cand-verified",
            decision_id: "decision-verified",
            policy_version: "self-evolving-policy.v1",
            recommended_route_origin: "lp-do-plan",
            executor_path: "lp-do-build:container:feedback-intel-v1",
            handoff_emitted_at: BASE_TIME,
          },
        }),
      ]),
    );
    writeBuildRecord(
      dir,
      "docs/plans/_archive/my-slug/build-record.user.md",
      `
## Self-Evolving Measurement

- **Status:** verified
- **KPI Name:** reply_rate
- **KPI Value:** 0.42
- **KPI Unit:** ratio
- **Aggregation Method:** rate
- **Sample Size:** 45
- **Baseline Ref:** docs/plans/my-slug/baseline.md
- **Measurement Window:** 2026-02-20/2026-02-26
- **Baseline Window:** 2026-02-13/2026-02-19
- **Post Window:** 2026-02-20/2026-02-26
- **Measured Impact:** 0.08
- **Impact Confidence:** 0.74
- **Regressions Detected:** 0
- **Data Quality Status:** ok
- **Traffic Segment:** all
- **Artifact Refs:** docs/plans/_archive/my-slug/build-record.user.md, docs/plans/my-slug/baseline.md
      `,
    );

    const fixedClock = () => new Date("2026-02-26T12:34:56.000Z");
    const result = markDispatchesCompleted({
      queueStatePath,
      featureSlug: "my-slug",
      planPath,
      outcome: "Verified KPI improvement shipped",
      rootDir: dir,
      clock: fixedClock,
    });

    expect(result).toEqual({ ok: true, mutated: 1, skipped: 0 });

    const updated = readFixture(queueStatePath);
    expect(updated.dispatches[0]?.completed_by?.self_evolving).toEqual(
      expect.objectContaining({
        candidate_id: "cand-verified",
        decision_id: "decision-verified",
        maturity_status: "matured",
        measurement_status: "verified",
      }),
    );
  });

  it("TC-06C: malformed declared self-evolving measurement returns parse_error", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const planPath = "docs/plans/_archive/my-slug/plan.md";
    writeFixture(
      queueStatePath,
      makeQueueFixture([
        makeDispatch({
          self_evolving: {
            candidate_id: "cand-bad",
            decision_id: "decision-bad",
            policy_version: "self-evolving-policy.v1",
            recommended_route_origin: "lp-do-plan",
            executor_path: "lp-do-build:container:feedback-intel-v1",
            handoff_emitted_at: BASE_TIME,
          },
        }),
      ]),
    );
    writeBuildRecord(
      dir,
      "docs/plans/_archive/my-slug/build-record.user.md",
      `
## Self-Evolving Measurement

- **Status:** verified
- **KPI Name:** reply_rate
- **KPI Unit:** ratio
      `,
    );

    const result = markDispatchesCompleted({
      queueStatePath,
      featureSlug: "my-slug",
      planPath,
      outcome: "Should fail",
      rootDir: dir,
      clock: () => new Date("2026-02-26T12:34:56.000Z"),
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected parse_error result");
    }
    expect(result.reason).toBe("parse_error");
    expect(result.error).toContain("build_record_self_evolving_measurement_parse_failed");

    const updated = readFixture(queueStatePath);
    expect(updated.dispatches[0]?.queue_state).toBe("auto_executed");
  });

  it("TC-02: idempotency preserves first completion timestamp", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    writeFixture(queueStatePath, makeQueueFixture([makeDispatch()]));

    const firstClock = () => new Date("2026-02-26T10:00:00.000Z");
    const secondClock = () => new Date("2026-02-27T11:00:00.000Z");

    const first = markDispatchesCompleted({
      queueStatePath,
      featureSlug: "my-slug",
      planPath: "docs/plans/_archive/my-slug/plan.md",
      outcome: "Feature delivered",
      clock: firstClock,
    });
    expect(first).toEqual({ ok: true, mutated: 1, skipped: 0 });

    const second = markDispatchesCompleted({
      queueStatePath,
      featureSlug: "my-slug",
      planPath: "docs/plans/_archive/my-slug/plan-v2.md",
      outcome: "Should not overwrite",
      clock: secondClock,
    });

    expect(second).toEqual({ ok: false, reason: "no_match" });

    const updated = readFixture(queueStatePath);
    expect(updated.dispatches[0].completed_by?.completed_at).toBe(
      firstClock().toISOString(),
    );
  });

  it("TC-03: returns no_match and does not mutate when slug does not match", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    const fixture = makeQueueFixture([
      makeDispatch({
        processed_by: {
          fact_find_slug: "other-slug",
          fact_find_path: "docs/plans/other-slug/fact-find.md",
          processed_at: BASE_TIME,
          route: "auto-executed",
        },
      }),
    ]);
    writeFixture(queueStatePath, fixture);

    const result = markDispatchesCompleted({
      queueStatePath,
      featureSlug: "my-slug",
      planPath: "docs/plans/_archive/my-slug/plan.md",
      outcome: "Feature delivered",
      clock: () => new Date("2026-02-26T12:34:56.000Z"),
    });

    expect(result).toEqual({ ok: false, reason: "no_match" });
    expect(readFixture(queueStatePath)).toEqual(fixture);
  });

  it("TC-03B: matches direct-build processed_by target_slug without fact-find aliases", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    writeFixture(
      queueStatePath,
      makeQueueFixture([
        makeDispatch({
          status: "micro_build_ready",
          recommended_route: "lp-do-build",
          processed_by: {
            target_route: "lp-do-build",
            target_kind: "build",
            target_slug: "my-slug",
            target_path: "docs/plans/my-slug/micro-build.md",
            fact_find_slug: "legacy-unused",
            fact_find_path: "docs/plans/legacy-unused/fact-find.md",
            processed_at: BASE_TIME,
            route: "dispatch-routed",
          },
        }),
      ]),
    );

    const result = markDispatchesCompleted({
      queueStatePath,
      featureSlug: "my-slug",
      planPath: "docs/plans/_archive/my-slug/plan.md",
      outcome: "Micro-build delivered",
      clock: () => new Date("2026-02-26T12:34:56.000Z"),
    });

    expect(result).toEqual({ ok: true, mutated: 1, skipped: 0 });
  });

  it("TC-04: mutates all matching dispatches", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    writeFixture(queueStatePath, makeQueueFixture([makeDispatch(), makeDispatch()]));

    const result = markDispatchesCompleted({
      queueStatePath,
      featureSlug: "my-slug",
      planPath: "docs/plans/_archive/my-slug/plan.md",
      outcome: "Feature delivered",
      clock: () => new Date("2026-02-26T12:34:56.000Z"),
    });

    expect(result).toEqual({ ok: true, mutated: 2, skipped: 0 });

    const updated = readFixture(queueStatePath);
    expect(updated.dispatches.every((dispatch) => dispatch.queue_state === "completed")).toBe(
      true,
    );
  });

  it("TC-05: already-completed dispatch returns no_match", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    writeFixture(
      queueStatePath,
      makeQueueFixture([
        makeDispatch({
          queue_state: "completed",
          status: "completed",
          completed_by: {
            plan_path: "docs/plans/_archive/my-slug/plan.md",
            completed_at: "2026-02-26T09:00:00.000Z",
            outcome: "Already done",
          },
        }),
      ]),
    );

    const result = markDispatchesCompleted({
      queueStatePath,
      featureSlug: "my-slug",
      planPath: "docs/plans/_archive/my-slug/plan.md",
      outcome: "Feature delivered",
      clock: () => new Date("2026-02-27T12:34:56.000Z"),
    });

    expect(result).toEqual({ ok: false, reason: "no_match" });
  });

  it("TC-06: recomputes counts from dispatches after mutation", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");

    const d1 = makeDispatch({ dispatch_id: "IDEA-DISPATCH-1", queue_state: "auto_executed" });
    const d2 = makeDispatch({
      dispatch_id: "IDEA-DISPATCH-2",
      queue_state: "auto_executed",
      processed_by: {
        fact_find_slug: "other-slug",
        fact_find_path: "docs/plans/other-slug/fact-find.md",
        processed_at: BASE_TIME,
        route: "auto-executed",
      },
    });
    const d3 = makeDispatch({
      dispatch_id: "IDEA-DISPATCH-3",
      queue_state: "completed",
      status: "completed",
      processed_by: {
        fact_find_slug: "other-slug",
        fact_find_path: "docs/plans/other-slug/fact-find.md",
        processed_at: BASE_TIME,
        route: "auto-executed",
      },
      completed_by: {
        plan_path: "docs/plans/_archive/other-slug/plan.md",
        completed_at: "2026-02-25T01:00:00.000Z",
        outcome: "Previously completed",
      },
    });

    const fixture = makeQueueFixture([d1, d2, d3]);
    fixture.counts = {
      enqueued: 0,
      processed: 0,
      skipped: 0,
      error: 0,
      suppressed: 0,
      auto_executed: 2,
      completed: 1,
      total: 3,
      fact_find_ready: 2,
    };
    writeFixture(queueStatePath, fixture);

    const result = markDispatchesCompleted({
      queueStatePath,
      featureSlug: "my-slug",
      planPath: "docs/plans/_archive/my-slug/plan.md",
      outcome: "Feature delivered",
      business: "BRIK",
      clock: () => new Date("2026-02-26T12:34:56.000Z"),
    });

    expect(result).toEqual({ ok: true, mutated: 1, skipped: 0 });

    const updated = readFixture(queueStatePath);
    expect(updated.counts.completed).toBe(2);
    expect(updated.counts.auto_executed).toBe(1);
    expect(updated.counts.total).toBe(3);
  });
});
