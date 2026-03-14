import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { loadOperatorActionRegistryItems } from "../../../../../scripts/src/startup-loop/build/operator-actions-registry.ts";
import { mkdirWithinRoot, writeFileWithinRoot } from "../safe-fs";

import { appendProcessImprovementsOperatorActionDecisionEvent } from "./operator-actions-ledger";
import {
  deriveProcessImprovementsIdeaKey,
  isProcessImprovementsOperatorActionItem,
  loadProcessImprovementsProjection,
  type ProcessImprovementsDecisionState,
  projectOperatorActionItems,
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

describe("process improvements queue projection", () => {
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
        itemType: "process_improvement",
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
      const operatorActionsPath = path.join(
        repoRoot,
        "docs/business-os/startup-loop/operator-actions.json"
      );
      await mkdirWithinRoot(repoRoot, path.dirname(operatorActionsPath), {
        recursive: true,
      });
      await writeFileWithinRoot(
        repoRoot,
        operatorActionsPath,
        JSON.stringify(
          {
            items: [
              {
                id: "HEAD-BLK-01",
                business: "HEAD",
                kind: "blocker",
                title: "Resolve launch blocker",
                summary: "A structured operator action should load alongside queue items.",
                owner: "Pete",
                due_at: "2026-02-27",
                state: "open",
                source_path:
                  "docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md",
              },
            ],
          },
          null,
          2
        ),
        "utf-8"
      );
      await appendProcessImprovementsOperatorActionDecisionEvent(
        {
          actionId: "HEAD-BLK-01",
          business: "HEAD",
          sourcePath:
            "docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md",
          decision: "done",
          actorId: "pete",
          actorName: "Pete",
          decidedAt: "2026-03-11T12:00:00.000Z",
        },
        repoRoot
      );

      const result = await loadProcessImprovementsProjection({
        repoRoot,
        env: {},
      });

      expect(result.queueMode).toBe("trial");
      expect(result.queueSourcePath).toBe(
        PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH
      );
      expect(result.operatorActionsSourcePath).toBe(
        "docs/business-os/startup-loop/operator-actions.json"
      );
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          itemType: "process_improvement",
          dispatchId: "DISPATCH-9",
          business: "PLAT",
          title: "Projection loads from queue state",
          recommendedRoute: "lp-do-plan",
          status: "plan_ready",
        })
      );
      expect(result.items[1]).toEqual(
        expect.objectContaining({
          itemType: "operator_action",
          actionId: "HEAD-BLK-01",
          actionKind: "blocker",
          business: "HEAD",
          title: "Resolve launch blocker",
          owner: "Pete",
          isOverdue: true,
          decisionState: {
            decision: "done",
            decidedAt: "2026-03-11T12:00:00.000Z",
            snoozeUntil: undefined,
          },
        })
      );
      expect(result.recentActions).toEqual([
        expect.objectContaining({
          itemKey: "HEAD-BLK-01",
          decision: "done",
          business: "HEAD",
          itemType: "operator_action",
        }),
      ]);
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-06B: ranks one mixed active worklist before deferred and resolved items", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "process-improvements-unified-ranking-")
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
                dispatch_id: "DISPATCH-P1",
                business: "PLAT",
                area_anchor: "Queue P1 item",
                why: "Highest-priority queue backlog.",
                queue_state: "enqueued",
                priority: "P1",
                confidence: 0.91,
                created_at: "2026-03-10T09:30:00.000Z",
              },
              {
                dispatch_id: "DISPATCH-P2",
                business: "PLAT",
                area_anchor: "Deferred queue item",
                why: "Waiting until next week.",
                queue_state: "enqueued",
                priority: "P2",
                confidence: 0.72,
                created_at: "2026-03-10T08:30:00.000Z",
              },
            ],
          },
          null,
          2
        ),
        "utf-8"
      );

      const operatorActionsPath = path.join(
        repoRoot,
        "docs/business-os/startup-loop/operator-actions.json"
      );
      await mkdirWithinRoot(repoRoot, path.dirname(operatorActionsPath), {
        recursive: true,
      });
      await writeFileWithinRoot(
        repoRoot,
        operatorActionsPath,
        JSON.stringify(
          {
            items: [
              {
                id: "HEAD-BLK-01",
                business: "HEAD",
                kind: "blocker",
                title: "Resolve launch blocker",
                summary: "This should outrank all queue backlog.",
                owner: "Pete",
                due_at: "2020-01-01",
                state: "open",
                source_path:
                  "docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md",
              },
              {
                id: "HEAD-GATE-01",
                business: "HEAD",
                kind: "stage_gate",
                title: "Approve naming gate",
                summary: "This should sit behind the overdue blocker.",
                owner: "Pete",
                state: "pending",
                source_path:
                  "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
              },
              {
                id: "HEAD-NEXT-01",
                business: "HEAD",
                kind: "next_step",
                title: "Snoozed operator follow-up",
                summary: "This should leave the active list.",
                owner: "Pete",
                state: "open",
                source_path:
                  "docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md",
              },
              {
                id: "HEAD-DONE-01",
                business: "HEAD",
                kind: "decision_waiting",
                title: "Completed operator action",
                summary: "Resolved actions should fall to the end.",
                owner: "Pete",
                state: "open",
                source_path:
                  "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
              },
            ],
          },
          null,
          2
        ),
        "utf-8"
      );

      const deferredIdeaKey = deriveProcessImprovementsIdeaKey(
        PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH,
        "DISPATCH-P2"
      );
      const projection = await loadProcessImprovementsProjection({
        repoRoot,
        env: {},
        decisionStates: new Map([
          [
            deferredIdeaKey,
            {
              decision: "defer",
              decidedAt: "2026-03-11T12:00:00.000Z",
              deferUntil: "2999-01-01T00:00:00.000Z",
            },
          ],
        ]),
        operatorActionDecisionStates: new Map([
          [
            "HEAD-NEXT-01",
            {
              decision: "snooze",
              decidedAt: "2026-03-11T12:00:00.000Z",
              snoozeUntil: "2999-01-01T00:00:00.000Z",
            },
          ],
          [
            "HEAD-DONE-01",
            {
              decision: "done",
              decidedAt: "2026-03-11T12:00:00.000Z",
            },
          ],
        ]),
      });

      expect(projection.items.map((item) => item.itemKey)).toEqual([
        "HEAD-BLK-01",
        "HEAD-GATE-01",
        deriveProcessImprovementsIdeaKey(
          PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH,
          "DISPATCH-P1"
        ),
        deferredIdeaKey,
        "HEAD-NEXT-01",
        "HEAD-DONE-01",
      ]);

      expect(projection.items.map((item) => item.statusGroup)).toEqual([
        "active",
        "active",
        "active",
        "deferred",
        "deferred",
        "resolved",
      ]);
      expect(projection.items[0]).toEqual(
        expect.objectContaining({
          itemType: "operator_action",
          priorityReason: "Overdue blocker",
          isOverdue: true,
        })
      );
      expect(projection.items[2]).toEqual(
        expect.objectContaining({
          itemType: "process_improvement",
          priority: "P1",
          stateLabel: "Awaiting decision",
        })
      );
      expect(projection.items[3]).toEqual(
        expect.objectContaining({
          itemType: "process_improvement",
          stateLabel: "Deferred",
          availableActions: expect.arrayContaining([
            expect.objectContaining({ decision: "defer", label: "Defer" }),
          ]),
        })
      );
      expect(projection.items[4]).toEqual(
        expect.objectContaining({
          itemType: "operator_action",
          stateLabel: "Snoozed",
          availableActions: expect.arrayContaining([
            expect.objectContaining({ decision: "done", label: "Mark done" }),
          ]),
        })
      );
      expect(projection.items[5]).toEqual(
        expect.objectContaining({
          itemType: "operator_action",
          stateLabel: "Done",
          availableActions: [],
        })
      );
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

});

describe("process improvements queue projection — decisionBrief and evidenceRefs (TASK-12)", () => {
  it("TC-NEW-01: emits decisionBrief on every projected queue item with expected fields", () => {
    const sourcePath = PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH;

    const items = projectProcessImprovementsInboxItems(
      {
        dispatches: [
          {
            dispatch_id: "DISPATCH-BRIEF-1",
            business: "BRIK",
            area_anchor: "Operator inbox is passive and misses urgent items",
            why: "The current report is static and does not prompt action.",
            queue_state: "enqueued",
            priority: "P1",
            recommended_route: "lp-do-build",
            confidence: 0.85,
          },
        ],
      },
      sourcePath,
      "trial",
      new Map()
    );

    expect(items).toHaveLength(1);
    const brief = items[0].decisionBrief;
    expect(brief).toBeDefined();
    expect(brief!.problem).toBeTruthy();
    expect(brief!.whyNow).toBeTruthy();
    expect(brief!.businessBenefit).toBeTruthy();
    expect(brief!.expectedNextStep).toBeTruthy();
    expect(brief!.confidenceExplainer).toBeTruthy();
    // lp-do-build route maps to "Work starts immediately once you approve."
    expect(brief!.expectedNextStep).toContain("immediately");
  });

  it("TC-NEW-02: emits evidenceRefs from evidence_refs field on queue dispatch", () => {
    const sourcePath = PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH;
    const evidenceRefs = [
      "operator-stated: customer reported bug",
      "coverage-hint: security",
    ];

    const items = projectProcessImprovementsInboxItems(
      {
        dispatches: [
          {
            dispatch_id: "DISPATCH-EVID-1",
            business: "BRIK",
            area_anchor: "Security coverage gap",
            why: "No coverage for auth flows.",
            queue_state: "enqueued",
            evidence_refs: evidenceRefs,
          },
        ],
      },
      sourcePath,
      "trial",
      new Map()
    );

    expect(items).toHaveLength(1);
    expect(items[0].evidenceRefs).toEqual(evidenceRefs);
  });

  it("TC-NEW-03: decisionBrief falls back safely when dispatch has minimal fields", () => {
    const sourcePath = PROCESS_IMPROVEMENTS_TRIAL_QUEUE_STATE_PATH;

    const items = projectProcessImprovementsInboxItems(
      {
        dispatches: [
          {
            dispatch_id: "DISPATCH-MINIMAL-1",
            queue_state: "enqueued",
          },
        ],
      },
      sourcePath,
      "trial",
      new Map()
    );

    expect(items).toHaveLength(1);
    const brief = items[0].decisionBrief;
    expect(brief).toBeDefined();
    expect(brief!.businessBenefit.length).toBeGreaterThan(0);
    expect(brief!.expectedNextStep.length).toBeGreaterThan(0);
  });
});

describe("process improvements operator-action projection", () => {
  it("TC-07: projects canonical operator-action items from the structured source contract", () => {
    const items = projectOperatorActionItems(
      {
        items: [
          {
            id: "HEAD-72H-01",
            business: "HEAD",
            kind: "next_step",
            title: "Confirm stock date",
            summary: "Visibility-only operator action.",
            owner: "Pete",
            state: "open",
            source_path:
              "docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md",
          },
        ],
      },
      "docs/business-os/startup-loop/operator-actions.json",
      new Map([
        [
          "HEAD-72H-01",
          {
            decision: "snooze",
            decidedAt: "2026-03-11T12:00:00.000Z",
            snoozeUntil: "2026-03-18T12:00:00.000Z",
          },
        ],
      ])
    );

    expect(items).toEqual([
      expect.objectContaining({
        itemType: "operator_action",
        actionId: "HEAD-72H-01",
        actionKind: "next_step",
        title: "Confirm stock date",
        owner: "Pete",
        stateLabel: "Open",
        isOverdue: false,
        decisionState: {
          decision: "snooze",
          decidedAt: "2026-03-11T12:00:00.000Z",
          snoozeUntil: "2026-03-18T12:00:00.000Z",
        },
      }),
    ]);
  });

  it("TC-08: app operator-action projection matches the canonical registry source IDs", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "process-improvements-operator-action-parity-")
    );

    try {
      const operatorActionsPath = path.join(
        repoRoot,
        "docs/business-os/startup-loop/operator-actions.json"
      );
      await mkdirWithinRoot(repoRoot, path.dirname(operatorActionsPath), {
        recursive: true,
      });
      await writeFileWithinRoot(
        repoRoot,
        operatorActionsPath,
        JSON.stringify(
          {
            items: [
              {
                id: "HEAD-GATE-01",
                business: "HEAD",
                kind: "stage_gate",
                title: "DISCOVERY-04 Naming",
                summary: "Naming decision pending.",
                owner: "Pete",
                state: "pending",
                source_path:
                  "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
              },
              {
                id: "HEAD-BLK-01",
                business: "HEAD",
                kind: "blocker",
                title: "Confirm stock date",
                summary: "Need the launch stock date.",
                owner: "Pete",
                due_at: "2026-03-03",
                state: "open",
                source_path:
                  "docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md",
              },
              {
                id: "HEAD-72H-01",
                business: "HEAD",
                kind: "next_step",
                title: "Lock stock date",
                summary: "Publish the inventory cap rule.",
                owner: "Pete",
                state: "open",
                source_path:
                  "docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md",
              },
            ],
          },
          null,
          2
        ),
        "utf-8"
      );

      const projection = await loadProcessImprovementsProjection({
        repoRoot,
        env: {},
      });
      const registryItems = loadOperatorActionRegistryItems(repoRoot, "HEAD");

      const projectedIds = projection.items
        .filter(isProcessImprovementsOperatorActionItem)
        .map((item) => item.actionId)
        .sort();

      const registryIds = registryItems.map((item) => item.actionId).sort();

      expect(projectedIds).toEqual(registryIds);
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });
});
