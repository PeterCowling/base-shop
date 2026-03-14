import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "@jest/globals";

import { readFileWithinRoot } from "@/lib/safe-fs";

import {
  appendProcessImprovementsOperatorActionDecisionEvent,
  loadProcessImprovementsOperatorActionDecisionStates,
  PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH,
  readProcessImprovementsOperatorActionDecisionEvents,
  reduceProcessImprovementsOperatorActionDecisionEvents,
} from "./operator-actions-ledger";

describe("process improvements operator-action ledger", () => {
  it("TC-01: appends append-only operator-action decision events and reads them back", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "process-improvements-operator-action-ledger-")
    );

    try {
      const event = await appendProcessImprovementsOperatorActionDecisionEvent(
        {
          actionId: "HEAD-BLK-01",
          business: "HEAD",
          sourcePath:
            "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
          decision: "snooze",
          actorId: "pete",
          actorName: "Pete",
          decidedAt: "2026-03-11T12:00:00.000Z",
          snoozeUntil: "2026-03-18T12:00:00.000Z",
        },
        repoRoot
      );

      const events =
        await readProcessImprovementsOperatorActionDecisionEvents(repoRoot);

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(event);
      expect(
        await readFileWithinRoot(
          repoRoot,
          path.join(repoRoot, PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH),
          "utf-8"
        )
      ).toContain("\"decision\":\"snooze\"");
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-02: reduces repeated operator-action events deterministically", () => {
    const reduced = reduceProcessImprovementsOperatorActionDecisionEvents([
      {
        schema_version: "process-improvements.operator-action-decision.v1",
        event_id: "a",
        action_id: "HEAD-BLK-01",
        business: "HEAD",
        source_path:
          "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
        decision: "snooze",
        actor_id: "pete",
        actor_name: "Pete",
        decided_at: "2026-03-11T12:00:00.000Z",
        snooze_until: "2026-03-18T12:00:00.000Z",
      },
      {
        schema_version: "process-improvements.operator-action-decision.v1",
        event_id: "b",
        action_id: "HEAD-BLK-01",
        business: "HEAD",
        source_path:
          "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
        decision: "done",
        actor_id: "pete",
        actor_name: "Pete",
        decided_at: "2026-03-11T12:05:00.000Z",
      },
    ]);

    expect(reduced.get("HEAD-BLK-01")).toEqual({
      decision: "done",
      decidedAt: "2026-03-11T12:05:00.000Z",
      snoozeUntil: undefined,
    });
  });

  it("TC-03: loads reduced operator-action decision state from the append-only ledger", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "process-improvements-operator-action-ledger-state-"
      )
    );

    try {
      await appendProcessImprovementsOperatorActionDecisionEvent(
        {
          actionId: "HEAD-BLK-01",
          business: "HEAD",
          sourcePath:
            "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
          decision: "snooze",
          actorId: "pete",
          actorName: "Pete",
          decidedAt: "2026-03-11T12:00:00.000Z",
          snoozeUntil: "2026-03-18T12:00:00.000Z",
        },
        repoRoot
      );
      await appendProcessImprovementsOperatorActionDecisionEvent(
        {
          actionId: "HEAD-BLK-01",
          business: "HEAD",
          sourcePath:
            "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
          decision: "done",
          actorId: "pete",
          actorName: "Pete",
          decidedAt: "2026-03-11T12:05:00.000Z",
        },
        repoRoot
      );

      const states = await loadProcessImprovementsOperatorActionDecisionStates({
        repoRoot,
      });

      expect(states.get("HEAD-BLK-01")).toEqual({
        decision: "done",
        decidedAt: "2026-03-11T12:05:00.000Z",
        snoozeUntil: undefined,
      });
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-04: rejects malformed snooze events before any file write", async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "process-improvements-operator-action-ledger-invalid-"
      )
    );

    try {
      await expect(
        appendProcessImprovementsOperatorActionDecisionEvent(
          {
            actionId: "HEAD-BLK-01",
            business: "HEAD",
            sourcePath:
              "docs/business-os/strategy/HEAD/assessment/naming-workbench/2026-02-20-candidate-names.user.md",
            decision: "snooze",
            actorId: "pete",
            actorName: "Pete",
          },
          repoRoot
        )
      ).rejects.toThrow("snoozeUntil is required for snooze decisions");

      await expect(
        fs.access(
          path.join(repoRoot, PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH)
        )
      ).rejects.toThrow();
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });
});
