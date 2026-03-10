import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "@jest/globals";

import {
  DEFAULT_CORE_TRIAD_BUDGET_MANIFEST_PATH,
  loadCoreTriadSkillBudgetManifest,
  validateCoreTriadSkillBudgets,
} from "../diagnostics/core-triad-size-budget-validator";

async function writeText(root: string, relativePath: string, content: string): Promise<void> {
  const absolute = path.join(root, relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, content, "utf8");
}

function skillContent(lineCount: number): string {
  return Array.from({ length: lineCount }, (_, index) => `line-${index + 1}`).join("\n") + "\n";
}

async function writeTriadSkills(root: string, counts: Record<string, number>): Promise<void> {
  await Promise.all(
    Object.entries(counts).map(([skill, lineCount]) =>
      writeText(root, `.claude/skills/${skill}/SKILL.md`, skillContent(lineCount)),
    ),
  );
}

async function writeManifest(root: string, budgets: unknown[]): Promise<void> {
  await writeText(
    root,
    DEFAULT_CORE_TRIAD_BUDGET_MANIFEST_PATH,
    JSON.stringify(
      {
        schema_version: "core-triad-skill-budgets.v1",
        generated_at: "2026-03-09T00:00:00.000Z",
        threshold_source: ".claude/skills/meta-loop-efficiency/SKILL.md",
        budgets,
      },
      null,
      2,
    ),
  );
}

let tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.map((root) => fs.rm(root, { recursive: true, force: true })));
  tempRoots = [];
});

describe("core triad size budget validator", () => {
  it("returns warnings when files exceed target under an active waiver", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "triad-budget-"));
    tempRoots.push(root);

    await writeTriadSkills(root, {
      "lp-do-fact-find": 205,
      "lp-do-plan": 210,
      "lp-do-build": 215,
    });
    await writeManifest(root, [
      {
        skill: "lp-do-fact-find",
        skill_md_path: ".claude/skills/lp-do-fact-find/SKILL.md",
        target_lines: 200,
        allowed_lines: 205,
        waiver_reason: "Temporary waiver",
        waiver_owner: "workflow maintainers",
        waiver_expires_on: "2026-12-31",
      },
      {
        skill: "lp-do-plan",
        skill_md_path: ".claude/skills/lp-do-plan/SKILL.md",
        target_lines: 200,
        allowed_lines: 210,
        waiver_reason: "Temporary waiver",
        waiver_owner: "workflow maintainers",
        waiver_expires_on: "2026-12-31",
      },
      {
        skill: "lp-do-build",
        skill_md_path: ".claude/skills/lp-do-build/SKILL.md",
        target_lines: 200,
        allowed_lines: 215,
        waiver_reason: "Temporary waiver",
        waiver_owner: "workflow maintainers",
        waiver_expires_on: "2026-12-31",
      },
    ]);

    const result = validateCoreTriadSkillBudgets({
      rootDir: root,
      now: new Date("2026-03-09T00:00:00.000Z"),
    });

    expect(result.failures).toHaveLength(0);
    expect(result.warnings).toHaveLength(3);
    expect(result.checks.map((check) => check.status)).toEqual(["warn", "warn", "warn"]);
  });

  it("fails when a skill grows beyond its allowed limit", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "triad-budget-"));
    tempRoots.push(root);

    await writeTriadSkills(root, {
      "lp-do-fact-find": 206,
      "lp-do-plan": 200,
      "lp-do-build": 200,
    });
    await writeManifest(root, [
      {
        skill: "lp-do-fact-find",
        skill_md_path: ".claude/skills/lp-do-fact-find/SKILL.md",
        target_lines: 200,
        allowed_lines: 205,
        waiver_reason: "Temporary waiver",
        waiver_owner: "workflow maintainers",
        waiver_expires_on: "2026-12-31",
      },
      {
        skill: "lp-do-plan",
        skill_md_path: ".claude/skills/lp-do-plan/SKILL.md",
        target_lines: 200,
        allowed_lines: 200,
      },
      {
        skill: "lp-do-build",
        skill_md_path: ".claude/skills/lp-do-build/SKILL.md",
        target_lines: 200,
        allowed_lines: 200,
      },
    ]);

    const result = validateCoreTriadSkillBudgets({
      rootDir: root,
      now: new Date("2026-03-09T00:00:00.000Z"),
    });

    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.skill).toBe("lp-do-fact-find");
    expect(result.failures[0]?.detail).toContain("exceed allowed_lines 205");
  });

  it("fails when a waiver has expired and the skill is still above target", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "triad-budget-"));
    tempRoots.push(root);

    await writeTriadSkills(root, {
      "lp-do-fact-find": 205,
      "lp-do-plan": 200,
      "lp-do-build": 200,
    });
    await writeManifest(root, [
      {
        skill: "lp-do-fact-find",
        skill_md_path: ".claude/skills/lp-do-fact-find/SKILL.md",
        target_lines: 200,
        allowed_lines: 205,
        waiver_reason: "Temporary waiver",
        waiver_owner: "workflow maintainers",
        waiver_expires_on: "2026-03-01",
      },
      {
        skill: "lp-do-plan",
        skill_md_path: ".claude/skills/lp-do-plan/SKILL.md",
        target_lines: 200,
        allowed_lines: 200,
      },
      {
        skill: "lp-do-build",
        skill_md_path: ".claude/skills/lp-do-build/SKILL.md",
        target_lines: 200,
        allowed_lines: 200,
      },
    ]);

    const result = validateCoreTriadSkillBudgets({
      rootDir: root,
      now: new Date("2026-03-09T00:00:00.000Z"),
    });

    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.detail).toContain("Waiver expired on 2026-03-01");
  });

  it("rejects manifests that omit a triad skill", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "triad-budget-"));
    tempRoots.push(root);

    await writeManifest(root, [
      {
        skill: "lp-do-fact-find",
        skill_md_path: ".claude/skills/lp-do-fact-find/SKILL.md",
        target_lines: 200,
        allowed_lines: 205,
        waiver_reason: "Temporary waiver",
        waiver_owner: "workflow maintainers",
        waiver_expires_on: "2026-12-31",
      },
      {
        skill: "lp-do-plan",
        skill_md_path: ".claude/skills/lp-do-plan/SKILL.md",
        target_lines: 200,
        allowed_lines: 200,
      },
    ]);

    expect(() =>
      loadCoreTriadSkillBudgetManifest({
        rootDir: root,
      }),
    ).toThrow("missing budget entry for lp-do-build");
  });
});
