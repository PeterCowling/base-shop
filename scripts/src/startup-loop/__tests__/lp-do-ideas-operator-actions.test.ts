import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import {
  declineQueuedIdea,
  handoffQueuedIdeaToRegularProcess,
} from "../ideas/lp-do-ideas-operator-actions.js";

const FIXED_CLOCK = () => new Date("2026-03-10T12:00:00.000Z");

function buildQueueState(dispatch: Record<string, unknown>) {
  return {
    last_updated: "2026-03-10T11:59:00.000Z",
    counts: {
      enqueued: 1,
      processed: 0,
      declined: 0,
      skipped: 0,
      error: 0,
      suppressed: 0,
      auto_executed: 0,
      completed: 0,
      fact_find_ready: dispatch.status === "fact_find_ready" ? 1 : 0,
      plan_ready: dispatch.status === "plan_ready" ? 1 : 0,
      micro_build_ready: dispatch.status === "micro_build_ready" ? 1 : 0,
      briefing_ready: dispatch.status === "briefing_ready" ? 1 : 0,
      total: 1,
    },
    dispatches: [dispatch],
  };
}

async function writeQueueState(
  repoRoot: string,
  dispatch: Record<string, unknown>
): Promise<string> {
  const relativePath = "docs/business-os/startup-loop/ideas/trial/queue-state.json";
  const absolutePath = path.join(repoRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(
    absolutePath,
    `${JSON.stringify(buildQueueState(dispatch), null, 2)}\n`,
    "utf-8"
  );
  return relativePath;
}

function buildDispatch(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    schema_version: "dispatch.v2",
    dispatch_id: "IDEA-DISPATCH-20260310120000-0001",
    mode: "trial",
    business: "BOS",
    trigger: "operator_idea",
    root_event_id: "operator:BOS:test",
    anchor_key: "process-improvements-operator-app",
    cluster_key: "BOS:operator:process-improvements-operator-app",
    cluster_fingerprint: "process-improvements-operator-app-20260310",
    lineage_depth: 0,
    area_anchor: "Process improvements operator app",
    location_anchors: ["apps/business-os/src/app/process-improvements/page.tsx"],
    provisional_deliverable_family: "multi",
    current_truth: "The operator app does not exist yet.",
    next_scope_now: "Seed the next routed artifact and claim the queue item.",
    adjacent_later: [],
    recommended_route: "lp-do-fact-find",
    status: "fact_find_ready",
    priority: "P1",
    confidence: 0.92,
    evidence_refs: ["apps/business-os/src/app/process-improvements/page.tsx"],
    created_at: "2026-03-10T11:59:00.000Z",
    queue_state: "enqueued",
    why: "The operator needs a real action surface.",
    intended_outcome: {
      type: "operational",
      statement: "Queue-backed process improvements can be actioned from the app.",
      source: "operator",
    },
    ...overrides,
  };
}

describe("lp-do-ideas operator actions", () => {
  it("TC-01: hands off a fact-find-ready dispatch by creating a fact-find artifact and marking it processed", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "lp-do-ideas-operator-actions-")
    );

    try {
      const queueStatePath = await writeQueueState(repoRoot, buildDispatch());

      const result = handoffQueuedIdeaToRegularProcess({
        dispatchId: "IDEA-DISPATCH-20260310120000-0001",
        queueStatePath,
        actorId: "pete",
        actorName: "Pete",
        rootDir: repoRoot,
        clock: FIXED_CLOCK,
      });

      expect(result).toEqual({
        ok: true,
        dispatchId: "IDEA-DISPATCH-20260310120000-0001",
        targetRoute: "lp-do-fact-find",
        targetKind: "fact-find",
        targetSlug: "process-improvements-operator-app",
        targetPath:
          "docs/plans/process-improvements-operator-app/fact-find.md",
        queueStatePath,
        created: true,
      });

      const factFindPath = path.join(
        repoRoot,
        "docs/plans/process-improvements-operator-app/fact-find.md"
      );
      const factFind = await fs.readFile(factFindPath, "utf-8");
      expect(factFind).toContain("Type: Fact-Find");
      expect(factFind).toContain("Dispatch-ID: IDEA-DISPATCH-20260310120000-0001");

      const queue = JSON.parse(
        await fs.readFile(path.join(repoRoot, queueStatePath), "utf-8")
      ) as {
        dispatches: Array<{ queue_state?: string; processed_by?: Record<string, unknown> }>;
      };
      expect(queue.dispatches[0]?.queue_state).toBe("processed");
      expect(queue.dispatches[0]?.processed_by?.target_path).toBe(
        "docs/plans/process-improvements-operator-app/fact-find.md"
      );
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-02: hands off a micro-build-ready dispatch by creating a micro-build artifact", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "lp-do-ideas-operator-actions-build-")
    );

    try {
      const queueStatePath = await writeQueueState(
        repoRoot,
        buildDispatch({
          dispatch_id: "IDEA-DISPATCH-20260310120000-0002",
          anchor_key: "booking-widget-copy-polish",
          area_anchor: "Booking widget copy polish",
          location_anchors: ["apps/brikette/src/components/BookingWidget.tsx"],
          recommended_route: "lp-do-build",
          status: "micro_build_ready",
          evidence_refs: ["apps/brikette/src/components/BookingWidget.tsx"],
        })
      );

      const result = handoffQueuedIdeaToRegularProcess({
        dispatchId: "IDEA-DISPATCH-20260310120000-0002",
        queueStatePath,
        actorId: "pete",
        actorName: "Pete",
        rootDir: repoRoot,
        clock: FIXED_CLOCK,
      });

      expect(result).toEqual({
        ok: true,
        dispatchId: "IDEA-DISPATCH-20260310120000-0002",
        targetRoute: "lp-do-build",
        targetKind: "build",
        targetSlug: "booking-widget-copy-polish",
        targetPath: "docs/plans/booking-widget-copy-polish/micro-build.md",
        queueStatePath,
        created: true,
      });
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-03: declines an enqueued dispatch with first-class queue metadata", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "lp-do-ideas-operator-actions-decline-")
    );

    try {
      const queueStatePath = await writeQueueState(repoRoot, buildDispatch());

      const result = declineQueuedIdea({
        dispatchId: "IDEA-DISPATCH-20260310120000-0001",
        queueStatePath,
        actorId: "pete",
        actorName: "Pete",
        rootDir: repoRoot,
        clock: FIXED_CLOCK,
      });

      expect(result).toEqual({
        ok: true,
        dispatchId: "IDEA-DISPATCH-20260310120000-0001",
        queueStatePath,
        declinedAt: "2026-03-10T12:00:00.000Z",
        skipped: false,
      });

      const queue = JSON.parse(
        await fs.readFile(path.join(repoRoot, queueStatePath), "utf-8")
      ) as {
        counts: Record<string, number>;
        dispatches: Array<{
          queue_state?: string;
          status?: string;
          declined_by?: Record<string, unknown>;
        }>;
      };
      expect(queue.counts.declined).toBe(1);
      expect(queue.dispatches[0]?.queue_state).toBe("declined");
      expect(queue.dispatches[0]?.status).toBe("declined");
      expect(queue.dispatches[0]?.declined_by).toEqual({
        actor_id: "pete",
        actor_name: "Pete",
        declined_at: "2026-03-10T12:00:00.000Z",
        reason: "Declined by operator",
      });
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-04: refuses to overwrite an existing routed artifact", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "lp-do-ideas-operator-actions-conflict-")
    );

    try {
      const queueStatePath = await writeQueueState(repoRoot, buildDispatch());
      const targetPath = path.join(
        repoRoot,
        "docs/plans/process-improvements-operator-app/fact-find.md"
      );
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, "existing\n", "utf-8");

      const result = handoffQueuedIdeaToRegularProcess({
        dispatchId: "IDEA-DISPATCH-20260310120000-0001",
        queueStatePath,
        actorId: "pete",
        actorName: "Pete",
        rootDir: repoRoot,
        clock: FIXED_CLOCK,
      });

      expect(result).toEqual({
        ok: false,
        reason: "conflict",
        error:
          "Target artifact already exists: docs/plans/process-improvements-operator-app/fact-find.md",
      });
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });
});
