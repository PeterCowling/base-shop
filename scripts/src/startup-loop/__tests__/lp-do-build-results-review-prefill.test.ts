/**
 * Tests for lp-do-build-results-review-prefill.ts
 *
 * Covers TASK-01 TC-01 through TC-07 from plan build-completion-deterministic-lifts.
 */

import * as fs from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import type { BuildEvent } from "../build/lp-do-build-event-emitter.js";
import { emitBuildEvent, writeBuildEvent } from "../build/lp-do-build-event-emitter.js";
import { validateResultsReviewContent } from "../build/lp-do-build-reflection-debt.js";
import type {
  DiffEntry,
  StandingRegistryArtifact,
} from "../build/lp-do-build-results-review-prefill.js";
import {
  computeVerdict,
  detectChangedPackages,
  detectNewSkills,
  detectSchemaValidatorAdditions,
  detectStandingUpdates,
  detectStartupLoopContractChanges,
  parsePlanTaskStatuses,
  parseStandingRegistry,
  prefillResultsReview,
  renderObservedOutcomes,
  renderObservedOutcomesStub,
  renderStandingExpansion,
  scanIdeaCategories,
} from "../build/lp-do-build-results-review-prefill.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(tmpdir(), "results-review-prefill-test-"));
});

afterEach(() => {
  if (tmpDir) {
    rmSync(tmpDir, { force: true, recursive: true });
  }
});

function writePlanMd(planDir: string, tasks: Array<{ id: string; status: string }>): void {
  const header = "| Task ID | Type | Description | Confidence | Effort | Status |\n|---|---|---|---|---|---|\n";
  const rows = tasks.map(
    (t) => `| ${t.id} | IMPLEMENT | Task ${t.id} | 85% | M | ${t.status} |`,
  );
  const content = `# Plan\n\n## Task Summary\n${header}${rows.join("\n")}\n`;
  fs.writeFileSync(path.join(planDir, "plan.md"), content, "utf-8");
}

function writeStandingRegistry(
  registryPath: string,
  artifacts: Array<{ artifact_id: string; path: string; active: boolean }>,
): void {
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });
  fs.writeFileSync(registryPath, JSON.stringify({ artifacts }, null, 2), "utf-8");
}

function makeBuildEvent(planDir: string, statement: string): void {
  const event = emitBuildEvent({
    feature_slug: "test-slug",
    build_id: "test-build-001",
    why: "Test reason",
    why_source: "operator",
    intended_outcome: { statement, type: "operational", source: "operator" },
    emitted_at: "2026-03-04T00:00:00Z",
  });
  writeBuildEvent(event, planDir);
}

// ---------------------------------------------------------------------------
// TC-01: All tasks Complete + build-event → verdict Met, 5/5 None, standing updates
// ---------------------------------------------------------------------------
describe("TC-01: all tasks complete with build-event", () => {
  it("produces Met verdict, 5 None categories, and standing update matches", () => {
    const planDir = path.join(tmpDir, "plan");
    fs.mkdirSync(planDir, { recursive: true });

    writePlanMd(planDir, [
      { id: "TASK-01", status: "Complete" },
      { id: "TASK-02", status: "Complete" },
      { id: "TASK-03", status: "Complete" },
    ]);
    makeBuildEvent(planDir, "Reduce token usage by 55%");

    const registryPath = path.join(tmpDir, "registry.json");
    writeStandingRegistry(registryPath, [
      { artifact_id: "art-1", path: "a/file1.ts", active: true },
      { artifact_id: "art-2", path: "b/file2.ts", active: true },
      { artifact_id: "art-3", path: "c/file3.ts", active: true },
    ]);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: ["a/file1.ts", "b/file2.ts"],
      standingRegistryPath: registryPath,
      featureSlug: "test-slug",
      reviewDate: "2026-03-04",
    });

    // Verdict Met
    expect(output).toContain("**Verdict:** Met");
    // Standing updates for matched files
    expect(output).toContain("a/file1.ts: art-1 changed");
    expect(output).toContain("b/file2.ts: art-2 changed");
    expect(output).not.toContain("c/file3.ts");
    // Categories 1 and 2 are always None; categories 3/4/5 depend on signals
    // With these gitDiffFiles (a/file1.ts, b/file2.ts), no SKILL.md/contract/schema signals fire
    expect(output).toContain("New standing data source — None.");
    expect(output).toContain("New open-source package — None.");
    expect(output).toContain("New skill — None.");
    expect(output).toContain("New loop process — None.");
    expect(output).toContain("AI-to-mechanistic — None.");
  });
});

// ---------------------------------------------------------------------------
// TC-02: 2/3 tasks Complete → verdict Partially Met
// ---------------------------------------------------------------------------
describe("TC-02: partial task completion", () => {
  it("produces Partially Met verdict with 2 of 3 rationale", () => {
    const planDir = path.join(tmpDir, "plan");
    fs.mkdirSync(planDir, { recursive: true });

    writePlanMd(planDir, [
      { id: "TASK-01", status: "Complete" },
      { id: "TASK-02", status: "Complete" },
      { id: "TASK-03", status: "Pending" },
    ]);
    makeBuildEvent(planDir, "Reduce token usage by 55%");

    const registryPath = path.join(tmpDir, "registry.json");
    writeStandingRegistry(registryPath, []);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: [],
      standingRegistryPath: registryPath,
      featureSlug: "test-slug",
      reviewDate: "2026-03-04",
    });

    expect(output).toContain("**Verdict:** Partially Met");
    expect(output).toContain("2 of 3");
  });
});

// ---------------------------------------------------------------------------
// TC-03: No build-event.json → placeholder verdict
// ---------------------------------------------------------------------------
describe("TC-03: no build-event present", () => {
  it("uses placeholder for verdict when build-event.json is missing", () => {
    const planDir = path.join(tmpDir, "plan");
    fs.mkdirSync(planDir, { recursive: true });

    writePlanMd(planDir, [
      { id: "TASK-01", status: "Complete" },
    ]);
    // No build-event.json written

    const registryPath = path.join(tmpDir, "registry.json");
    writeStandingRegistry(registryPath, []);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: [],
      standingRegistryPath: registryPath,
      featureSlug: "test-slug",
      reviewDate: "2026-03-04",
    });

    expect(output).toContain("<!-- Pre-filled: LLM should populate verdict -->");
  });
});

// ---------------------------------------------------------------------------
// TC-04: detectStandingUpdates with 2 matching paths
// ---------------------------------------------------------------------------
describe("TC-04: standing updates detection with matches", () => {
  it("lists both matched artifacts", () => {
    const artifacts: StandingRegistryArtifact[] = [
      { artifact_id: "art-1", path: "path/a.json", active: true },
      { artifact_id: "art-2", path: "path/b.json", active: true },
    ];
    const gitDiff = ["path/a.json", "path/b.json", "path/c.json"];

    const result = detectStandingUpdates(gitDiff, artifacts);

    expect(result.matches.length).toBe(2);
    expect(result.lines.some((l) => l.includes("art-1"))).toBe(true);
    expect(result.lines.some((l) => l.includes("art-2"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-05: detectStandingUpdates with no matching paths
// ---------------------------------------------------------------------------
describe("TC-05: standing updates detection with no matches", () => {
  it("returns no-change fallback", () => {
    const artifacts: StandingRegistryArtifact[] = [
      { artifact_id: "art-1", path: "path/a.json", active: true },
    ];
    const gitDiff = ["unrelated/file.ts"];

    const result = detectStandingUpdates(gitDiff, artifacts);

    expect(result.matches.length).toBe(0);
    expect(result.lines[0]).toContain("No standing updates");
  });
});

// ---------------------------------------------------------------------------
// TC-06: Empty gitDiffFiles
// ---------------------------------------------------------------------------
describe("TC-06: empty git diff files", () => {
  it("returns no-change fallback with empty diff list", () => {
    const artifacts: StandingRegistryArtifact[] = [
      { artifact_id: "art-1", path: "path/a.json", active: true },
    ];

    const result = detectStandingUpdates([], artifacts);

    expect(result.matches.length).toBe(0);
    expect(result.lines[0]).toContain("No standing updates");
  });
});

// ---------------------------------------------------------------------------
// TC-07: Output passes validateResultsReviewContent()
// ---------------------------------------------------------------------------
describe("TC-07: output passes validateResultsReviewContent", () => {
  it("produces output with all 4 required sections valid", () => {
    const planDir = path.join(tmpDir, "plan");
    fs.mkdirSync(planDir, { recursive: true });

    writePlanMd(planDir, [
      { id: "TASK-01", status: "Complete" },
    ]);
    makeBuildEvent(planDir, "Test outcome");

    const registryPath = path.join(tmpDir, "registry.json");
    writeStandingRegistry(registryPath, []);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: [],
      standingRegistryPath: registryPath,
      featureSlug: "test-slug",
      reviewDate: "2026-03-04",
    });

    const validation = validateResultsReviewContent(output);
    expect(validation.valid).toBe(true);
    expect(validation.missing_sections.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: sub-routines
// ---------------------------------------------------------------------------

describe("parseStandingRegistry", () => {
  it("returns empty array for missing file", () => {
    const result = parseStandingRegistry(path.join(tmpDir, "nonexistent.json"));
    expect(result.length).toBe(0);
  });

  it("returns only active artifacts", () => {
    const registryPath = path.join(tmpDir, "registry.json");
    writeStandingRegistry(registryPath, [
      { artifact_id: "a1", path: "p1.ts", active: true },
      { artifact_id: "a2", path: "p2.ts", active: false },
      { artifact_id: "a3", path: "p3.ts", active: true },
    ]);
    // Manually add inactive entry (writeStandingRegistry creates all as given)
    const result = parseStandingRegistry(registryPath);
    expect(result.length).toBe(2);
    expect(result[0].artifact_id).toBe("a1");
    expect(result[1].artifact_id).toBe("a3");
  });

  it("returns empty array for malformed JSON", () => {
    const registryPath = path.join(tmpDir, "bad.json");
    fs.writeFileSync(registryPath, "not json", "utf-8");
    const result = parseStandingRegistry(registryPath);
    expect(result.length).toBe(0);
  });
});

describe("parsePlanTaskStatuses", () => {
  it("extracts task statuses from plan table", () => {
    const planDir = path.join(tmpDir, "plan");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [
      { id: "TASK-01", status: "Complete" },
      { id: "TASK-02", status: "Pending" },
    ]);
    const result = parsePlanTaskStatuses(planDir);
    expect(result.length).toBe(2);
    expect(result[0].taskId).toBe("TASK-01");
    expect(result[0].status).toBe("Complete");
    expect(result[1].taskId).toBe("TASK-02");
    expect(result[1].status).toBe("Pending");
  });

  it("handles Complete (date) status format", () => {
    const planDir = path.join(tmpDir, "plan");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [
      { id: "TASK-01", status: "Complete (2026-03-04)" },
    ]);
    const result = parsePlanTaskStatuses(planDir);
    expect(result.length).toBe(1);
    expect(result[0].status).toBe("Complete (2026-03-04)");
  });

  it("returns empty array when plan.md is missing", () => {
    const result = parsePlanTaskStatuses(path.join(tmpDir, "nonexistent"));
    expect(result.length).toBe(0);
  });
});

describe("computeVerdict", () => {
  it("returns Met when all tasks are Complete", () => {
    const event: BuildEvent = emitBuildEvent({
      feature_slug: "s",
      build_id: "b",
      why: "w",
      why_source: "operator",
      intended_outcome: { statement: "s", type: "operational", source: "operator" },
    });
    const result = computeVerdict(event, [
      { taskId: "TASK-01", status: "Complete" },
      { taskId: "TASK-02", status: "Complete" },
    ]);
    expect(result.verdict).toBe("Met");
    expect(result.intendedStatement).toBe("s");
  });

  it("returns Met when all tasks have Complete (date) format", () => {
    const event: BuildEvent = emitBuildEvent({
      feature_slug: "s",
      build_id: "b",
      why: "w",
      why_source: "operator",
      intended_outcome: { statement: "s", type: "operational", source: "operator" },
    });
    const result = computeVerdict(event, [
      { taskId: "TASK-01", status: "Complete (2026-03-04)" },
      { taskId: "TASK-02", status: "Complete (2026-03-04)" },
    ]);
    expect(result.verdict).toBe("Met");
  });

  it("returns Partially Met when some tasks incomplete", () => {
    const event: BuildEvent = emitBuildEvent({
      feature_slug: "s",
      build_id: "b",
      why: "w",
      why_source: "operator",
      intended_outcome: { statement: "s", type: "operational", source: "operator" },
    });
    const result = computeVerdict(event, [
      { taskId: "TASK-01", status: "Complete" },
      { taskId: "TASK-02", status: "Pending" },
    ]);
    expect(result.verdict).toBe("Partially Met");
  });

  it("returns null verdict when no build event", () => {
    const result = computeVerdict(null, [{ taskId: "TASK-01", status: "Complete" }]);
    expect(result.verdict).toBeNull();
  });

  it("returns null verdict when no task statuses", () => {
    const event: BuildEvent = emitBuildEvent({
      feature_slug: "s",
      build_id: "b",
      why: "w",
      why_source: "operator",
      intended_outcome: { statement: "s", type: "operational", source: "operator" },
    });
    const result = computeVerdict(event, []);
    expect(result.verdict).toBeNull();
  });
});

describe("scanIdeaCategories", () => {
  it("returns the HTML comment preamble block (7 lines, no category data lines)", () => {
    const lines = scanIdeaCategories();
    expect(lines.length).toBe(7);
    expect(lines[0]).toContain("<!--");
    expect(lines[lines.length - 1]).toBe("-->");
    // The comment block must not contain any category bullet lines
    for (const line of lines) {
      expect(line).not.toMatch(/^- /);
    }
  });
});

describe("renderObservedOutcomesStub", () => {
  it("returns a placeholder comment", () => {
    const stub = renderObservedOutcomesStub();
    expect(stub).toContain("Pre-filled");
  });
});

describe("renderStandingExpansion", () => {
  it("returns no-expansion line", () => {
    const line = renderStandingExpansion();
    expect(line).toContain("No standing expansion");
  });
});

// ---------------------------------------------------------------------------
// Frontmatter check
// ---------------------------------------------------------------------------
describe("prefillResultsReview frontmatter", () => {
  it("includes correct frontmatter fields", () => {
    const planDir = path.join(tmpDir, "plan");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [{ id: "TASK-01", status: "Complete" }]);

    const registryPath = path.join(tmpDir, "registry.json");
    writeStandingRegistry(registryPath, []);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: [],
      standingRegistryPath: registryPath,
      featureSlug: "my-feature",
      reviewDate: "2026-03-04",
    });

    expect(output).toContain("Feature-Slug: my-feature");
    expect(output).toContain("Review-date: 2026-03-04");
    expect(output).toContain("Status: Draft");
    expect(output).toContain("artifact: results-review");
  });
});

// ---------------------------------------------------------------------------
// TC-01a–e: detectChangedPackages
// ---------------------------------------------------------------------------
describe("detectChangedPackages", () => {
  it("TC-01a: packages and apps paths produce one bullet each", () => {
    const result = detectChangedPackages(["packages/email/src/send.ts", "apps/brikette/page.tsx"]);
    expect(result).toContain("- packages/email: changed");
    expect(result).toContain("- apps/brikette: changed");
    expect(result.length).toBe(2);
  });

  it("TC-01b: duplicate paths under same package deduplicate to one bullet", () => {
    const result = detectChangedPackages(["packages/email/a.ts", "packages/email/b.ts"]);
    expect(result).toEqual(["- packages/email: changed"]);
  });

  it("TC-01c: root-level files produce the fallback line", () => {
    const result = detectChangedPackages(["package.json", "turbo.json"]);
    expect(result).toEqual(["- No package changes detected"]);
  });

  it("TC-01d: empty array returns fallback", () => {
    const result = detectChangedPackages([]);
    expect(result).toEqual(["- No package changes detected"]);
  });

  it("TC-01e: leading slash stripped and package root extracted correctly", () => {
    const result = detectChangedPackages(["/packages/email/foo.ts"]);
    expect(result).toEqual(["- packages/email: changed"]);
  });
});

// ---------------------------------------------------------------------------
// TC-02a–f: detectNewSkills
// ---------------------------------------------------------------------------
describe("detectNewSkills", () => {
  it("TC-02a: status A + SKILL.md path produces populated bullet", () => {
    const diff: DiffEntry[] = [
      { status: "A", path: ".claude/skills/lp-do-new/SKILL.md" },
    ];
    const result = detectNewSkills(diff);
    expect(result.length).toBe(1);
    expect(result[0]).toContain("New skill");
    expect(result[0]).toContain("SKILL.md");
    expect(result[0]).not.toContain("None.");
  });

  it("TC-02b: status M + SKILL.md path returns None (modification not new)", () => {
    const diff: DiffEntry[] = [
      { status: "M", path: ".claude/skills/lp-do-existing/SKILL.md" },
    ];
    const result = detectNewSkills(diff);
    expect(result).toEqual(["- New skill — None."]);
  });

  it("TC-02c: status D + SKILL.md path returns None", () => {
    const diff: DiffEntry[] = [
      { status: "D", path: ".claude/skills/lp-do-old/SKILL.md" },
    ];
    const result = detectNewSkills(diff);
    expect(result).toEqual(["- New skill — None."]);
  });

  it("TC-02d: empty input returns None", () => {
    const result = detectNewSkills([]);
    expect(result).toEqual(["- New skill — None."]);
  });

  it("TC-02e: path under .claude/skills/ but not SKILL.md returns None", () => {
    const diff: DiffEntry[] = [
      { status: "A", path: ".claude/skills/lp-do-build/modules/build-code.md" },
    ];
    const result = detectNewSkills(diff);
    expect(result).toEqual(["- New skill — None."]);
  });

  it("TC-02f: prefillResultsReview without gitDiffWithStatus uses [] and returns None for cat3", () => {
    const planDir = path.join(tmpDir, "plan-02f");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [{ id: "TASK-01", status: "Complete" }]);
    const registryPath = path.join(tmpDir, "registry-02f.json");
    writeStandingRegistry(registryPath, []);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: [],
      standingRegistryPath: registryPath,
      featureSlug: "slug",
      reviewDate: "2026-03-06",
      // gitDiffWithStatus omitted intentionally
    });
    expect(output).toContain("New skill — None.");
  });
});

// ---------------------------------------------------------------------------
// TC-03a–f: detectStartupLoopContractChanges
// ---------------------------------------------------------------------------
describe("detectStartupLoopContractChanges", () => {
  it("TC-03a: contracts/ path produces populated bullet", () => {
    const result = detectStartupLoopContractChanges([
      "docs/business-os/startup-loop/contracts/loop-output-contracts.md",
    ]);
    expect(result.length).toBe(1);
    expect(result[0]).toContain("New loop process");
    expect(result[0]).not.toContain("None.");
  });

  it("TC-03b: specifications/ path produces populated bullet", () => {
    const result = detectStartupLoopContractChanges([
      "docs/business-os/startup-loop/specifications/dispatch-schema.md",
    ]);
    expect(result.length).toBe(1);
    expect(result[0]).toContain("New loop process");
    expect(result[0]).not.toContain("None.");
  });

  it("TC-03c: .claude/skills/lp-do-build/SKILL.md produces populated bullet", () => {
    const result = detectStartupLoopContractChanges([".claude/skills/lp-do-build/SKILL.md"]);
    expect(result.length).toBe(1);
    expect(result[0]).toContain("New loop process");
    expect(result[0]).not.toContain("None.");
  });

  it("TC-03d: ideas/trial/queue-state.json returns None", () => {
    const result = detectStartupLoopContractChanges([
      "docs/business-os/startup-loop/ideas/trial/queue-state.json",
    ]);
    expect(result).toEqual(["- New loop process — None."]);
  });

  it("TC-03e: non-lp-do skill SKILL.md returns None", () => {
    const result = detectStartupLoopContractChanges([".claude/skills/idea-scan/SKILL.md"]);
    expect(result).toEqual(["- New loop process — None."]);
  });

  it("TC-03f: empty input returns None", () => {
    const result = detectStartupLoopContractChanges([]);
    expect(result).toEqual(["- New loop process — None."]);
  });
});

// ---------------------------------------------------------------------------
// TC-04a–f: detectSchemaValidatorAdditions
// ---------------------------------------------------------------------------
describe("detectSchemaValidatorAdditions", () => {
  it("TC-04a: -validator.ts suffix inside startup-loop produces populated bullet", () => {
    const result = detectSchemaValidatorAdditions([
      "scripts/src/startup-loop/build/lp-do-build-reflection-debt-validator.ts",
    ]);
    expect(result.length).toBe(1);
    expect(result[0]).toContain("AI-to-mechanistic");
    expect(result[0]).not.toContain("None.");
  });

  it("TC-04b: .schema.md suffix inside startup-loop produces populated bullet", () => {
    const result = detectSchemaValidatorAdditions([
      "scripts/src/startup-loop/ideas/scan-proposals.schema.md",
    ]);
    expect(result.length).toBe(1);
    expect(result[0]).toContain("AI-to-mechanistic");
    expect(result[0]).not.toContain("None.");
  });

  it("TC-04c: .schema.json suffix inside startup-loop produces populated bullet", () => {
    const result = detectSchemaValidatorAdditions([
      "scripts/src/startup-loop/build/output.schema.json",
    ]);
    expect(result.length).toBe(1);
    expect(result[0]).toContain("AI-to-mechanistic");
    expect(result[0]).not.toContain("None.");
  });

  it("TC-04d: -validator.ts outside startup-loop returns None", () => {
    const result = detectSchemaValidatorAdditions(["apps/brikette/src/lib/password-validator.ts"]);
    expect(result).toEqual(["- AI-to-mechanistic — None."]);
  });

  it("TC-04e: regular .ts file inside startup-loop returns None", () => {
    const result = detectSchemaValidatorAdditions([
      "scripts/src/startup-loop/build/lp-do-build-event-emitter.ts",
    ]);
    expect(result).toEqual(["- AI-to-mechanistic — None."]);
  });

  it("TC-04f: empty input returns None", () => {
    const result = detectSchemaValidatorAdditions([]);
    expect(result).toEqual(["- AI-to-mechanistic — None."]);
  });
});

// ---------------------------------------------------------------------------
// TC-05a–e: parsePlanTaskStatuses (description capture) + renderObservedOutcomes
// ---------------------------------------------------------------------------
describe("parsePlanTaskStatuses — description capture (TC-05)", () => {
  it("TC-05a: plan with 3 Complete tasks returns descriptions", () => {
    const planDir = path.join(tmpDir, "plan-05a");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [
      { id: "TASK-01", status: "Complete" },
      { id: "TASK-02", status: "Complete" },
      { id: "TASK-03", status: "Complete" },
    ]);
    const result = parsePlanTaskStatuses(planDir);
    expect(result.length).toBe(3);
    for (const t of result) {
      expect(typeof t.description).toBe("string");
      expect(t.description!.length).toBeGreaterThan(0);
    }
  });

  it("TC-05b: renderObservedOutcomes emits only Complete tasks + summary", () => {
    const tasks = [
      { taskId: "TASK-01", status: "Complete", description: "First task" },
      { taskId: "TASK-02", status: "Pending", description: "Second task" },
      { taskId: "TASK-03", status: "Complete (2026-03-06)", description: "Third task" },
    ];
    const result = renderObservedOutcomes(tasks);
    expect(result).toContain("TASK-01");
    expect(result).toContain("TASK-03");
    expect(result).not.toContain("TASK-02");
    expect(result).toContain("2 of 3");
  });

  it("TC-05c: renderObservedOutcomes with empty list returns stub placeholder", () => {
    const result = renderObservedOutcomes([]);
    expect(result).toContain("Pre-filled");
  });

  it("TC-05d: description with **bold** markdown is sanitised", () => {
    const tasks = [
      { taskId: "TASK-01", status: "Complete", description: "**Bold title** with `code`" },
    ];
    const result = renderObservedOutcomes(tasks);
    expect(result).toContain("Bold title");
    expect(result).toContain("with code");
    expect(result).not.toContain("**Bold title**");
    expect(result).not.toContain("`code`");
  });

  it("TC-05e: existing parsePlanTaskStatuses tests still pass (no regression)", () => {
    const planDir = path.join(tmpDir, "plan-05e");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [
      { id: "TASK-01", status: "Complete" },
      { id: "TASK-02", status: "Pending" },
    ]);
    const result = parsePlanTaskStatuses(planDir);
    expect(result.length).toBe(2);
    expect(result[0].taskId).toBe("TASK-01");
    expect(result[0].status).toBe("Complete");
    expect(result[1].taskId).toBe("TASK-02");
    expect(result[1].status).toBe("Pending");
  });
});

// ---------------------------------------------------------------------------
// TC-06a–g: prefillResultsReview wiring integration
// ---------------------------------------------------------------------------
describe("prefillResultsReview wiring (TC-06)", () => {
  it("TC-06a: packages change signal → Observed Outcomes contains changed-package bullet", () => {
    const planDir = path.join(tmpDir, "plan-06a");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [{ id: "TASK-01", status: "Complete" }]);
    makeBuildEvent(planDir, "Test outcome");
    const registryPath = path.join(tmpDir, "registry-06a.json");
    writeStandingRegistry(registryPath, []);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: ["packages/email/src/send.ts"],
      standingRegistryPath: registryPath,
      featureSlug: "slug",
      reviewDate: "2026-03-06",
    });

    expect(output).toContain("## Observed Outcomes");
    expect(output).toContain("packages/email: changed");
  });

  it("TC-06b: new SKILL.md signal → category-3 bullet (not None)", () => {
    const planDir = path.join(tmpDir, "plan-06b");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [{ id: "TASK-01", status: "Complete" }]);
    makeBuildEvent(planDir, "Test outcome");
    const registryPath = path.join(tmpDir, "registry-06b.json");
    writeStandingRegistry(registryPath, []);

    const diffWithStatus: DiffEntry[] = [
      { status: "A", path: ".claude/skills/lp-do-brand/SKILL.md" },
    ];

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: [],
      standingRegistryPath: registryPath,
      featureSlug: "slug",
      reviewDate: "2026-03-06",
      gitDiffWithStatus: diffWithStatus,
    });

    expect(output).toContain("lp-do-brand/SKILL.md");
    expect(output).not.toMatch(/New skill — None\./);
  });

  it("TC-06c: startup-loop contract change → category-4 bullet", () => {
    const planDir = path.join(tmpDir, "plan-06c");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [{ id: "TASK-01", status: "Complete" }]);
    makeBuildEvent(planDir, "Test outcome");
    const registryPath = path.join(tmpDir, "registry-06c.json");
    writeStandingRegistry(registryPath, []);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: ["docs/business-os/startup-loop/contracts/loop-output-contracts.md"],
      standingRegistryPath: registryPath,
      featureSlug: "slug",
      reviewDate: "2026-03-06",
    });

    expect(output).toContain("loop-output-contracts.md");
    expect(output).not.toMatch(/New loop process — None\./);
  });

  it("TC-06d: schema/validator addition → category-5 bullet", () => {
    const planDir = path.join(tmpDir, "plan-06d");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [{ id: "TASK-01", status: "Complete" }]);
    makeBuildEvent(planDir, "Test outcome");
    const registryPath = path.join(tmpDir, "registry-06d.json");
    writeStandingRegistry(registryPath, []);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: ["scripts/src/startup-loop/build/new-output-validator.ts"],
      standingRegistryPath: registryPath,
      featureSlug: "slug",
      reviewDate: "2026-03-06",
    });

    expect(output).toContain("new-output-validator.ts");
    expect(output).not.toMatch(/AI-to-mechanistic — None\./);
  });

  it("TC-06e: task completion → Observed Outcomes contains completion bullets", () => {
    const planDir = path.join(tmpDir, "plan-06e");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [
      { id: "TASK-01", status: "Complete" },
      { id: "TASK-02", status: "Complete" },
    ]);
    makeBuildEvent(planDir, "Test outcome");
    const registryPath = path.join(tmpDir, "registry-06e.json");
    writeStandingRegistry(registryPath, []);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: [],
      standingRegistryPath: registryPath,
      featureSlug: "slug",
      reviewDate: "2026-03-06",
    });

    expect(output).toContain("TASK-01: Complete");
    expect(output).toContain("TASK-02: Complete");
    expect(output).toContain("2 of 2 tasks completed");
  });

  it("TC-06f: all signals absent → all categories None, validateResultsReviewContent passes", () => {
    const planDir = path.join(tmpDir, "plan-06f");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [{ id: "TASK-01", status: "Complete" }]);
    makeBuildEvent(planDir, "Test outcome");
    const registryPath = path.join(tmpDir, "registry-06f.json");
    writeStandingRegistry(registryPath, []);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: [],
      standingRegistryPath: registryPath,
      featureSlug: "slug",
      reviewDate: "2026-03-06",
    });

    expect(output).toContain("New standing data source — None.");
    expect(output).toContain("New open-source package — None.");
    expect(output).toContain("New skill — None.");
    expect(output).toContain("New loop process — None.");
    expect(output).toContain("AI-to-mechanistic — None.");

    const validation = validateResultsReviewContent(output);
    expect(validation.valid).toBe(true);
  });

  it("TC-06g: existing TC-01 verdict/standing-updates path still works (no regression)", () => {
    const planDir = path.join(tmpDir, "plan-06g");
    fs.mkdirSync(planDir, { recursive: true });
    writePlanMd(planDir, [
      { id: "TASK-01", status: "Complete" },
      { id: "TASK-02", status: "Complete" },
      { id: "TASK-03", status: "Complete" },
    ]);
    makeBuildEvent(planDir, "Reduce token usage by 55%");
    const registryPath = path.join(tmpDir, "registry-06g.json");
    writeStandingRegistry(registryPath, [
      { artifact_id: "art-1", path: "a/file1.ts", active: true },
      { artifact_id: "art-2", path: "b/file2.ts", active: true },
    ]);

    const output = prefillResultsReview({
      planDir,
      gitDiffFiles: ["a/file1.ts", "b/file2.ts"],
      standingRegistryPath: registryPath,
      featureSlug: "test-slug",
      reviewDate: "2026-03-04",
    });

    expect(output).toContain("**Verdict:** Met");
    expect(output).toContain("a/file1.ts: art-1 changed");
    expect(output).toContain("b/file2.ts: art-2 changed");
  });
});
