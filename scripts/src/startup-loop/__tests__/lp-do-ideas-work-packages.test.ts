import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import { parseQueueState } from "../ideas/lp-do-ideas-queue-state-file.js";
import {
  deriveWorkPackageCandidates,
  markDispatchesProcessed,
} from "../ideas/lp-do-ideas-work-packages.js";

interface TestDispatch {
  dispatch_id: string;
  business: string;
  status: string;
  queue_state: string;
  created_at: string;
  recommended_route: string;
  provisional_deliverable_family: string;
  area_anchor: string;
  location_anchors: string[];
  processed_by?: {
    route: string;
    processed_at: string;
    fact_find_slug: string;
    fact_find_path: string;
  };
}

const BASE_TIME = "2026-03-06T17:00:00.000Z";

function makeTmpDir(): string {
  const dir = join(tmpdir(), `work-package-test-${randomBytes(4).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function makeDispatch(overrides: Partial<TestDispatch> = {}): TestDispatch {
  const suffix = randomBytes(2).toString("hex");
  return {
    dispatch_id: `IDEA-DISPATCH-20260306-${suffix}`,
    business: "BRIK",
    status: "fact_find_ready",
    queue_state: "enqueued",
    created_at: BASE_TIME,
    recommended_route: "lp-do-fact-find",
    provisional_deliverable_family: "code-change",
    area_anchor: "BRIK email logging gap",
    location_anchors: ["packages/mcp-server/src/tools/gmail.ts"],
    ...overrides,
  };
}

function queueFixture(dispatches: TestDispatch[]): string {
  return JSON.stringify(
    {
      last_updated: BASE_TIME,
      counts: {
        enqueued: dispatches.filter((dispatch) => dispatch.queue_state === "enqueued").length,
        processed: dispatches.filter((dispatch) => dispatch.queue_state === "processed").length,
        skipped: 0,
        error: 0,
        suppressed: 0,
        auto_executed: 0,
        completed: 0,
        total: dispatches.length,
        fact_find_ready: dispatches.filter((dispatch) => dispatch.status === "fact_find_ready")
          .length,
      },
      dispatches,
    },
    null,
    2,
  );
}

function readQueue(filePath: string) {
  const parsed = parseQueueState(readFileSync(filePath, "utf-8"));
  if ("error" in parsed) {
    throw new Error(parsed.error);
  }
  return parsed;
}

describe("deriveWorkPackageCandidates", () => {
  it("groups related pending fact-find dispatches under one candidate", () => {
    const queue = readQueueFromString(
      queueFixture([
        makeDispatch({
          dispatch_id: "IDEA-DISPATCH-20260306-0001",
          area_anchor: "BRIK email audit log gap",
          location_anchors: ["packages/mcp-server/src/tools/gmail.ts"],
        }),
        makeDispatch({
          dispatch_id: "IDEA-DISPATCH-20260306-0002",
          area_anchor: "BRIK Gmail label logging gap",
          location_anchors: ["packages/mcp-server/src/tools/gmail-shared.ts"],
        }),
      ]),
    );

    const candidates = deriveWorkPackageCandidates(queue, { business: "BRIK" });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      business: "BRIK",
      location_root: "packages/mcp-server",
      recommended_route: "lp-do-fact-find",
    });
    expect(candidates[0].dispatch_ids).toEqual([
      "IDEA-DISPATCH-20260306-0001",
      "IDEA-DISPATCH-20260306-0002",
    ]);
  });

  it("does not bundle dispatches that land in different location roots", () => {
    const queue = readQueueFromString(
      queueFixture([
        makeDispatch({
          dispatch_id: "IDEA-DISPATCH-20260306-0001",
          location_anchors: ["packages/mcp-server/src/tools/gmail.ts"],
        }),
        makeDispatch({
          dispatch_id: "IDEA-DISPATCH-20260306-0002",
          location_anchors: ["apps/brikette/src/components/booking/BookingCalendarPanel.tsx"],
        }),
      ]),
    );

    expect(deriveWorkPackageCandidates(queue, { business: "BRIK" })).toHaveLength(0);
  });
});

describe("markDispatchesProcessed", () => {
  it("marks all requested dispatches as processed for one fact-find slug", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    writeFileSync(
      queueStatePath,
      queueFixture([
        makeDispatch({ dispatch_id: "IDEA-DISPATCH-20260306-0001" }),
        makeDispatch({ dispatch_id: "IDEA-DISPATCH-20260306-0002" }),
      ]) + "\n",
      "utf-8",
    );

    const fixedClock = () => new Date("2026-03-06T18:00:00.000Z");
    const result = markDispatchesProcessed({
      queueStatePath,
      dispatchIds: ["IDEA-DISPATCH-20260306-0001", "IDEA-DISPATCH-20260306-0002"],
      featureSlug: "email-logging-observability",
      factFindPath: "docs/plans/email-logging-observability/fact-find.md",
      clock: fixedClock,
    });

    expect(result).toEqual({ ok: true, mutated: 2, skipped: 0 });

    const queue = readQueue(queueStatePath);
    expect(queue.dispatches[0].queue_state).toBe("processed");
    expect(queue.dispatches[1].queue_state).toBe("processed");
    expect(queue.dispatches[0].processed_by?.fact_find_slug).toBe("email-logging-observability");
    expect(queue.counts?.processed).toBe(2);
    expect(queue.counts?.enqueued).toBe(0);
  });

  it("is idempotent when the same slug/path is written twice", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    writeFileSync(
      queueStatePath,
      queueFixture([
        makeDispatch({
          dispatch_id: "IDEA-DISPATCH-20260306-0001",
          queue_state: "processed",
          processed_by: {
            route: "dispatch-routed",
            processed_at: "2026-03-06T18:00:00.000Z",
            fact_find_slug: "email-logging-observability",
            fact_find_path: "docs/plans/email-logging-observability/fact-find.md",
          },
        }),
      ]) + "\n",
      "utf-8",
    );

    const result = markDispatchesProcessed({
      queueStatePath,
      dispatchIds: ["IDEA-DISPATCH-20260306-0001"],
      featureSlug: "email-logging-observability",
      factFindPath: "docs/plans/email-logging-observability/fact-find.md",
      clock: () => new Date("2026-03-06T19:00:00.000Z"),
    });

    expect(result).toEqual({ ok: true, mutated: 0, skipped: 1 });
    const queue = readQueue(queueStatePath);
    expect(queue.dispatches[0].processed_by?.processed_at).toBe("2026-03-06T18:00:00.000Z");
  });

  it("fails closed on a conflicting processed_by assignment", () => {
    const dir = makeTmpDir();
    const queueStatePath = join(dir, "queue-state.json");
    writeFileSync(
      queueStatePath,
      queueFixture([
        makeDispatch({
          dispatch_id: "IDEA-DISPATCH-20260306-0001",
          queue_state: "processed",
          processed_by: {
            route: "dispatch-routed",
            processed_at: "2026-03-06T18:00:00.000Z",
            fact_find_slug: "other-slug",
            fact_find_path: "docs/plans/other-slug/fact-find.md",
          },
        }),
      ]) + "\n",
      "utf-8",
    );

    const result = markDispatchesProcessed({
      queueStatePath,
      dispatchIds: ["IDEA-DISPATCH-20260306-0001"],
      featureSlug: "email-logging-observability",
      factFindPath: "docs/plans/email-logging-observability/fact-find.md",
      clock: () => new Date("2026-03-06T19:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("conflict");
    }
  });
});

function readQueueFromString(raw: string) {
  const parsed = parseQueueState(raw);
  if ("error" in parsed) {
    throw new Error(parsed.error);
  }
  return parsed;
}
