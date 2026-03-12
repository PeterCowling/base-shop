import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { readFileWithinRoot } from "@/lib/safe-fs";

import {
  appendProcessImprovementsDecisionEvent,
  loadProcessImprovementsDecisionStates,
  PROCESS_IMPROVEMENTS_DECISION_LEDGER_PATH,
  readProcessImprovementsDecisionEvents,
  reduceProcessImprovementsDecisionEvents,
} from "./decision-ledger";

describe("process improvements decision ledger", () => {
  it("TC-01: appends append-only decision events and reads them back", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "process-improvements-ledger-")
    );

    try {
      const event = await appendProcessImprovementsDecisionEvent(
        {
          ideaKey: "idea-1",
          dispatchId: "dispatch-1",
          business: "BRIK",
          decision: "defer",
          actorId: "pete",
          actorName: "Pete",
          decidedAt: "2026-03-10T12:00:00.000Z",
          deferUntil: "2026-03-17T12:00:00.000Z",
        },
        repoRoot
      );

      const events = await readProcessImprovementsDecisionEvents(repoRoot);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(event);
      expect(
        await readFileWithinRoot(
          repoRoot,
          path.join(repoRoot, PROCESS_IMPROVEMENTS_DECISION_LEDGER_PATH),
          "utf-8"
        )
      ).toContain("\"decision\":\"defer\"");
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-02: reduces repeated events for the same idea key deterministically", async () => {
    const reduced = reduceProcessImprovementsDecisionEvents([
      {
        schema_version: "process-improvements.decision.v1",
        event_id: "a",
        idea_key: "idea-1",
        dispatch_id: "dispatch-1",
        business: "BRIK",
        source_path: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
        queue_mode: "trial",
        decision: "defer",
        actor_id: "pete",
        actor_name: "Pete",
        decided_at: "2026-03-10T12:00:00.000Z",
        defer_until: "2026-03-17T12:00:00.000Z",
        execution_result: "pending",
      },
      {
        schema_version: "process-improvements.decision.v1",
        event_id: "b",
        idea_key: "idea-1",
        dispatch_id: "dispatch-1",
        business: "BRIK",
        source_path: "docs/business-os/startup-loop/ideas/trial/queue-state.json",
        queue_mode: "trial",
        decision: "do",
        actor_id: "pete",
        actor_name: "Pete",
        decided_at: "2026-03-10T12:05:00.000Z",
        execution_result: "failed",
        execution_error: "handoff failed",
      },
    ]);

    expect(reduced.get("idea-1")).toEqual({
      decision: "do",
      decidedAt: "2026-03-10T12:05:00.000Z",
      deferUntil: undefined,
      executionResult: "failed",
      executionError: "handoff failed",
    });
  });

  it("TC-03: loads reduced decision state from the append-only ledger", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "process-improvements-ledger-state-")
    );

    try {
      await appendProcessImprovementsDecisionEvent(
        {
          ideaKey: "idea-2",
          dispatchId: "dispatch-2",
          business: "PLAT",
          decision: "do",
          actorId: "pete",
          actorName: "Pete",
          decidedAt: "2026-03-10T09:00:00.000Z",
          executionResult: "pending",
        },
        repoRoot
      );
      await appendProcessImprovementsDecisionEvent(
        {
          ideaKey: "idea-2",
          dispatchId: "dispatch-2",
          business: "PLAT",
          decision: "do",
          actorId: "pete",
          actorName: "Pete",
          decidedAt: "2026-03-10T09:05:00.000Z",
          executionResult: "succeeded",
        },
        repoRoot
      );

      const states = await loadProcessImprovementsDecisionStates({ repoRoot });

      expect(states.get("idea-2")).toEqual({
        decision: "do",
        decidedAt: "2026-03-10T09:05:00.000Z",
        deferUntil: undefined,
        executionResult: "succeeded",
        executionError: undefined,
      });
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-04: rejects malformed defer events before any file write", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "process-improvements-ledger-invalid-")
    );

    try {
      await expect(
        appendProcessImprovementsDecisionEvent(
          {
            ideaKey: "idea-3",
            dispatchId: "dispatch-3",
            business: "PLAT",
            decision: "defer",
            actorId: "pete",
            actorName: "Pete",
          },
          repoRoot
        )
      ).rejects.toThrow("deferUntil is required for defer decisions");

      await expect(
        fs.access(path.join(repoRoot, PROCESS_IMPROVEMENTS_DECISION_LEDGER_PATH))
      ).rejects.toThrow();
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });
});
