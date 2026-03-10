import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  backfillSyntheticDispatch,
  projectSyntheticDispatchNarrative,
} from "../ideas/lp-do-ideas-synthetic-dispatch-narrative.js";

describe("lp-do-ideas-synthetic-dispatch-narrative", () => {
  let repoRoot: string;

  beforeEach(async () => {
    repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "synthetic-dispatch-narrative-"));
  });

  afterEach(async () => {
    await fs.rm(repoRoot, { recursive: true, force: true });
  });

  it("backfills repo maturity synthetic dispatch stubs from evidence refs", () => {
    const dispatch = {
      dispatch_id: "DISPATCH-REPO-001",
      artifact_id: "BOS-BOS-REPO_MATURITY_SIGNALS",
      area_anchor: "bos-repo-maturity-signals",
      current_truth: "BOS-BOS-REPO_MATURITY_SIGNALS changed (bootstr → b2e8a4f)",
      next_scope_now: "Investigate implications of bos-repo-maturity-signals delta for BOS",
      why: "Assess bos-repo-maturity-signals implications from BOS-BOS-REPO_MATURITY_SIGNALS delta for BOS.",
      intended_outcome: {
        type: "operational",
        statement: "Produce a validated routing outcome and scoped next action for bos-repo-maturity-signals.",
        source: "auto",
      },
      evidence_refs: [
        "repo-maturity-score:65",
        "repo-maturity-level:Level-3-Reliable",
        "repo-maturity-critical-control:no_ci_pipeline",
        "repo-maturity-critical-control:no_codeowners",
      ],
    };

    const result = backfillSyntheticDispatch(dispatch, { rootDir: repoRoot });
    expect(result.changed).toBe(true);
    expect(result.dispatch.area_anchor).toContain("repo maturity controls missing");
    expect(result.dispatch.current_truth).toContain("Repo maturity is 65");
    expect(result.dispatch.current_truth).toContain("no ci pipeline");
    expect(result.dispatch.next_scope_now).toContain("Close the missing repo controls");
  });

  it("builds agent-session narrative from preserved artifact findings when transcripts are unavailable", async () => {
    const artifactPath = path.join(
      repoRoot,
      "docs/business-os/startup-loop/ideas/trial/agent-session-findings.latest.json",
    );
    await fs.mkdir(path.dirname(artifactPath), { recursive: true });
    await fs.writeFile(
      artifactPath,
      JSON.stringify(
        {
          findings: [
            {
              session_id: "session-1",
              updated_at: "2026-03-09T10:00:00.000Z",
              transcript_path: "/tmp/session-1.jsonl",
              findings: ["Upload button fails silently when the API times out."],
            },
          ],
        },
        null,
        2,
      ),
      "utf8",
    );

    const narrative = projectSyntheticDispatchNarrative(
      {
        artifact_id: "BOS-BOS-AGENT_SESSION_FINDINGS",
        evidence_refs: [
          "agent-session-artifact:docs/business-os/startup-loop/ideas/trial/agent-session-findings.latest.json",
          "session:session-1",
        ],
      },
      { rootDir: repoRoot, transcriptsRoot: path.join(repoRoot, "missing-transcripts") },
    );

    expect(narrative).not.toBeNull();
    expect(narrative?.kind).toBe("agent_session");
    expect(narrative?.current_truth).toContain("Upload button fails silently");
    expect(narrative?.why).toContain("walkthrough/testing activity");
  });

  it("summarizes codebase structural synthetic dispatches from changed file evidence", () => {
    const narrative = projectSyntheticDispatchNarrative(
      {
        artifact_id: "BOS-BOS-CODEBASE_STRUCTURAL_SIGNALS",
        evidence_refs: [
          "git-diff:M:apps/brikette/src/app/[lang]/private-rooms/page.tsx",
          "git-diff:A:apps/brikette/src/app/[lang]/private-rooms/apartment/page.tsx",
          "git-diff:M:apps/brikette/src/middleware.ts",
          "git-diff:M:packages/ui/src/organisms/RoomsSection.tsx",
        ],
      },
      { rootDir: repoRoot },
    );

    expect(narrative).not.toBeNull();
    expect(narrative?.kind).toBe("codebase_structural");
    expect(narrative?.current_truth).toContain("Brikette private rooms");
    expect(narrative?.next_scope_now).toContain("touched surfaces");
  });
});

