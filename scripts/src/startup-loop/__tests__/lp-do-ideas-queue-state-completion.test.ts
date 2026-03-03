import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import { markDispatchesCompleted } from "../ideas/lp-do-ideas-queue-state-completion.js";

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
  processed_by?: {
    fact_find_slug: string;
    fact_find_path: string;
    processed_at: string;
    route: string;
  };
  completed_by?: {
    plan_path: string;
    completed_at: string;
    outcome: string;
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

function readFixture(filePath: string): QueueStateFixture {
  return JSON.parse(readFileSync(filePath, "utf-8")) as QueueStateFixture;
}

describe("markDispatchesCompleted", () => {
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
