import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "@jest/globals";

import {
  type AuditOptions,
  buildAuditReport,
  type GitReader,
} from "../diagnostics/meta-loop-efficiency-audit";

async function writeText(root: string, relativePath: string, content: string): Promise<void> {
  const absolute = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, content, "utf8");
}

class MockGitReader implements GitReader {
  constructor(
    private readonly revisions: Record<string, Record<string, string>>,
    private readonly headSha = "current1",
  ) {}

  headShortSha(_rootDir: string): string {
    return this.headSha;
  }

  listFilesAtRev(_rootDir: string, rev: string, prefix: string): string[] {
    return Object.keys(this.revisions[rev] ?? {})
      .filter((file) => file.startsWith(prefix))
      .sort();
  }

  readTextAtRev(_rootDir: string, rev: string, relativePath: string): string | null {
    return this.revisions[rev]?.[relativePath] ?? null;
  }
}

function makeAuditOptions(rootDir: string, git: GitReader): AuditOptions {
  return {
    rootDir,
    threshold: 40,
    artifactsDir: "docs/business-os/platform-capability",
    dryRun: true,
    git,
  };
}

let tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => fs.rm(root, { recursive: true, force: true })));
  tempRoots = [];
});

describe("meta-loop-efficiency audit", () => {
  it("emits H4 and H5 findings using the previous audit git snapshot", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-loop-eff-"));
    tempRoots.push(root);

    await writeText(
      root,
      ".claude/skills/lp-do-plan/SKILL.md",
      `---
name: lp-do-plan
---

# Skill

regex
schema
validation contract
sort
dedupe
threshold
parse
normalize
map
filter
`,
    );
    await writeText(
      root,
      ".claude/skills/lp-channels/SKILL.md",
      Array.from({ length: 20 }, () => "line").join("\n") + "\n",
    );
    await writeText(
      root,
      ".claude/skills/lp-channels/modules/channel-strategy.md",
      Array.from({ length: 35 }, () => "module line").join("\n") + "\n",
    );
    await writeText(
      root,
      "docs/business-os/platform-capability/skill-efficiency-audit-2026-03-04-1143.md",
      [
        "scan_timestamp: 2026-03-04 12:55",
        "threshold: 200 lines",
        "scope: lp-*, startup-loop, draft-outreach",
        "git_sha: prev1234",
        "previous_artifact: skill-efficiency-audit-2026-02-18-1357.md",
        "skills_scanned: 2",
        "",
        "# Skill Efficiency Audit",
      ].join("\n"),
    );

    const git = new MockGitReader({
      prev1234: {
        ".claude/skills/lp-do-plan/SKILL.md": "---\nname: lp-do-plan\n---\nplain prose only\n",
        ".claude/skills/lp-channels/SKILL.md":
          Array.from({ length: 50 }, () => "previous line").join("\n") + "\n",
      },
    });

    const report = buildAuditReport(makeAuditOptions(root, git));

    expect(report.text).toContain("List 3 — Deterministic extraction and anti-gaming");
    expect(report.h4Findings.map((row) => row.skill)).toContain("lp-do-plan");
    expect(report.h5Findings.map((row) => row.skill)).toContain("lp-channels");
    expect(report.text).toContain("previous_artifact: skill-efficiency-audit-2026-03-04-1143.md");
  });

  it("falls back cleanly when no previous artifact exists", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "meta-loop-eff-"));
    tempRoots.push(root);

    await writeText(
      root,
      ".claude/skills/lp-readiness/SKILL.md",
      "simple content\n",
    );

    const report = buildAuditReport(makeAuditOptions(root, new MockGitReader({})));

    expect(report.previousArtifact).toBeNull();
    expect(report.h5Findings).toHaveLength(0);
    expect(report.text).toContain("previous_artifact: none");
  });
});
