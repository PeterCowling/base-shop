import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { mkdirWithinRoot, writeFileWithinRoot } from "../safe-fs";

import {
  deriveProcessImprovementsIdeaKey,
  loadProcessImprovementsProjection,
  type ProcessImprovementsDecisionState,
  projectProcessImprovementsInboxItems,
} from "./projection";
import {
  PROCESS_IMPROVEMENTS_LIVE_QUEUE_STATE_PATH,
  PROCESS_IMPROVEMENTS_QUEUE_MODE_ENV_VAR,
  PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH,
  resolveProcessImprovementsQueuePath,
} from "./queue-path";

describe("process improvements queue path resolver", () => {
  it("TC-01: defaults to the trial queue path", () => {
    expect(resolveProcessImprovementsQueuePath({})).toEqual({
      queueMode: "trial",
      relativePath: PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH,
    });
  });

  it("TC-02: supports explicit live mode", () => {
    expect(
      resolveProcessImprovementsQueuePath({
        [PROCESS_IMPROVEMENTS_QUEUE_MODE_ENV_VAR]: "live",
      })
    ).toEqual({
      queueMode: "live",
      relativePath: PROCESS_IMPROVEMENTS_LIVE_QUEUE_STATE_PATH,
    });
  });

  it("TC-03: rejects invalid queue mode", () => {
    expect(() =>
      resolveProcessImprovementsQueuePath({
        [PROCESS_IMPROVEMENTS_QUEUE_MODE_ENV_VAR]: "staging",
      })
    ).toThrow(
      `Invalid ${PROCESS_IMPROVEMENTS_QUEUE_MODE_ENV_VAR}: staging`
    );
  });
});

describe("process improvements projection", () => {
  it("TC-04: projects only enqueued queue-backed items and overlays decision state", () => {
    const sourcePath = PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH;
    const decisionState: ProcessImprovementsDecisionState = {
      decision: "defer",
      decidedAt: "2026-03-10T12:00:00.000Z",
      deferUntil: "2026-03-17T12:00:00.000Z",
    };
    const ideaKey = deriveProcessImprovementsIdeaKey(sourcePath, "DISPATCH-1");

    const items = projectProcessImprovementsInboxItems(
      {
        dispatches: [
          {
            dispatch_id: "DISPATCH-1",
            business: "BRIK",
            area_anchor: "Improve operator inbox handoff",
            why: "The current report is passive.",
            queue_state: "enqueued",
            status: "fact_find_ready",
            recommended_route: "lp-do-fact-find",
            priority: "P1",
            confidence: 0.91,
            created_at: "2026-03-10T10:00:00.000Z",
            location_anchors: ["apps/business-os/src/app/process-improvements/page.tsx"],
          },
          {
            dispatch_id: "DISPATCH-2",
            area_anchor: "Already processed item",
            queue_state: "processed",
          },
        ],
      },
      sourcePath,
      "trial",
      new Map([[ideaKey, decisionState]])
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(
      expect.objectContaining({
        ideaKey,
        business: "BRIK",
        title: "Improve operator inbox handoff",
        body: "The current report is passive.",
        queueState: "enqueued",
        status: "fact_find_ready",
        recommendedRoute: "lp-do-fact-find",
        queueMode: "trial",
        locationAnchors: [
          "apps/business-os/src/app/process-improvements/page.tsx",
        ],
        decisionState,
      })
    );
  });

  it("TC-05: derives stable queue-backed idea keys from source path and dispatch ID", () => {
    const left = deriveProcessImprovementsIdeaKey(
      PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH,
      "DISPATCH-1"
    );
    const right = deriveProcessImprovementsIdeaKey(
      PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH,
      "DISPATCH-1"
    );
    const different = deriveProcessImprovementsIdeaKey(
      PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH,
      "DISPATCH-2"
    );

    expect(left).toBe(right);
    expect(left).not.toBe(different);
  });

  it("TC-06: loads queue-backed projection from repo state without report JSON", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "process-improvements-projection-")
    );

    try {
      const queuePath = path.join(
        repoRoot,
        PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH
      );
      await mkdirWithinRoot(repoRoot, path.dirname(queuePath), { recursive: true });
      await writeFileWithinRoot(
        repoRoot,
        queuePath,
        JSON.stringify(
          {
            dispatches: [
              {
                dispatch_id: "DISPATCH-9",
                business: "PLAT",
                area_anchor: "Projection loads from queue state",
                current_truth:
                  "The app should stop depending on generated report JSON.",
                why: "Projection must be queue-native.",
                queue_state: "enqueued",
                status: "plan_ready",
                recommended_route: "lp-do-plan",
                created_at: "2026-03-10T09:30:00.000Z",
              },
            ],
          },
          null,
          2
        ),
        "utf-8"
      );

      const result = await loadProcessImprovementsProjection({
        repoRoot,
        env: {},
      });

      expect(result.queueMode).toBe("trial");
      expect(result.sourcePath).toBe(PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          dispatchId: "DISPATCH-9",
          business: "PLAT",
          title: "Projection loads from queue state",
          recommendedRoute: "lp-do-plan",
          status: "plan_ready",
        })
      );
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });
});
