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
import type { StandingRegistryArtifact } from "../build/lp-do-build-results-review-prefill.js";
import {
  computeVerdict,
  detectStandingUpdates,
  parsePlanTaskStatuses,
  parseStandingRegistry,
  prefillResultsReview,
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
    // All 5 idea categories are None
    const noneCount = (output.match(/— None\./g) || []).length;
    expect(noneCount).toBe(5);
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
  it("returns 5 None lines", () => {
    const lines = scanIdeaCategories();
    expect(lines.length).toBe(5);
    for (const line of lines) {
      expect(line).toContain("None.");
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
