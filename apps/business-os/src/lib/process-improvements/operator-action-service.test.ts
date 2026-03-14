import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it, jest } from "@jest/globals";

import {
  mkdirWithinRoot,
  readFileWithinRoot,
  writeFileWithinRoot,
} from "@/lib/safe-fs";

import { performProcessImprovementsOperatorActionDecision } from "./operator-action-service";
import { appendProcessImprovementsOperatorActionDecisionEvent } from "./operator-actions-ledger";

let repoRoot = "";

jest.mock("@/lib/get-repo-root", () => ({
  getRepoRoot: () => repoRoot,
}));

async function writeOperatorActionsFixture(root: string): Promise<void> {
  const absolutePath = path.join(
    root,
    "docs/business-os/startup-loop/operator-actions.json"
  );
  await mkdirWithinRoot(root, path.dirname(absolutePath), { recursive: true });
  await writeFileWithinRoot(
    root,
    absolutePath,
    JSON.stringify(
      {
        items: [
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
        ],
      },
      null,
      2
    ),
    "utf-8"
  );
}

describe("process improvements operator-action service", () => {
  it("TC-01: appends a durable done decision for a canonical operator action", async () => {
    repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "process-improvements-operator-action-service-")
    );

    try {
      await writeOperatorActionsFixture(repoRoot);

      const result = await performProcessImprovementsOperatorActionDecision({
        decision: "done",
        actionId: "HEAD-BLK-01",
        actor: {
          id: "pete",
          name: "Pete",
          email: "pete@business-os.local",
          role: "admin",
        },
        now: new Date("2026-03-11T12:00:00.000Z"),
      });

      expect(result).toEqual({
        ok: true,
        decision: "done",
        actionId: "HEAD-BLK-01",
        sourcePath:
          "docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md",
        snoozeUntil: undefined,
      });

      const ledger = await readFileWithinRoot(
        repoRoot,
        path.join(
          repoRoot,
          "docs/business-os/process-improvements/operator-action-decisions.jsonl"
        ),
        "utf-8"
      );
      expect(ledger).toContain("\"decision\":\"done\"");
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-02: rejects repeated completion of an already-done operator action", async () => {
    repoRoot = await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "process-improvements-operator-action-service-conflict-"
      )
    );

    try {
      await writeOperatorActionsFixture(repoRoot);
      await appendProcessImprovementsOperatorActionDecisionEvent(
        {
          actionId: "HEAD-BLK-01",
          business: "HEAD",
          sourcePath:
            "docs/business-os/startup-baselines/HEAD/2026-02-12-assessment-intake-packet.user.md",
          decision: "done",
          actorId: "pete",
          actorName: "Pete",
          decidedAt: "2026-03-11T11:00:00.000Z",
        },
        repoRoot
      );

      const result = await performProcessImprovementsOperatorActionDecision({
        decision: "done",
        actionId: "HEAD-BLK-01",
        actor: {
          id: "pete",
          name: "Pete",
          email: "pete@business-os.local",
          role: "admin",
        },
      });

      expect(result).toEqual({
        ok: false,
        reason: "conflict",
        error: "Operator action HEAD-BLK-01 has already been completed.",
      });
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("TC-03: returns no_match when the action is absent from the canonical source", async () => {
    repoRoot = await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "process-improvements-operator-action-service-missing-"
      )
    );

    try {
      await writeOperatorActionsFixture(repoRoot);

      const result = await performProcessImprovementsOperatorActionDecision({
        decision: "snooze",
        actionId: "HEAD-BLK-99",
        actor: {
          id: "pete",
          name: "Pete",
          email: "pete@business-os.local",
          role: "admin",
        },
      });

      expect(result).toEqual({
        ok: false,
        reason: "no_match",
        error:
          "Operator action HEAD-BLK-99 is no longer available in the inbox.",
      });
    } finally {
      await fs.rm(repoRoot, { recursive: true, force: true });
    }
  });
});
