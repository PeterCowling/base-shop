import { afterEach, describe, expect, it } from "@jest/globals";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Plans-lint integration tests (CI-SC-01).
 *
 * Strategy: write temporary fixture plan files, run the lint script via
 * `node --import tsx`, and assert on exit code + stderr output.
 *
 * We test the public contract (exit code + output messages) rather than
 * internal functions, since plans-lint.ts has no exports.
 */

const ROOT = path.resolve(__dirname, "../..");
const LINT_SCRIPT = path.join(ROOT, "scripts/src/plans-lint.ts");

// Create temp directories under docs/ that the linter will scan
const FIXTURE_DIR = path.join(ROOT, "docs/_test-fixtures-plans-lint");
const FIXTURE_ARCHIVE_DIR = path.join(FIXTURE_DIR, "archive");
const FIXTURE_HISTORICAL_DIR = path.join(FIXTURE_DIR, "historical");

function runPlansLint(): { exitCode: number; output: string } {
  try {
    const stdout = execFileSync("node", ["--import", "tsx", LINT_SCRIPT], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
    });
    return { exitCode: 0, output: stdout };
  } catch (err: unknown) {
    const e = err as { status: number; stdout: string; stderr: string };
    return {
      exitCode: e.status ?? 1,
      output: (e.stdout ?? "") + (e.stderr ?? ""),
    };
  }
}

function writeFixture(subdir: string, filename: string, content: string) {
  const dir = path.join(FIXTURE_DIR, subdir);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), content, "utf8");
}

function writeFixtureRoot(filename: string, content: string) {
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  fs.writeFileSync(path.join(FIXTURE_DIR, filename), content, "utf8");
}

function cleanFixtures() {
  fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
}

// Valid active plan template
const VALID_ACTIVE_PLAN = `---
Type: Plan
Status: Active
Domain: CI/Infrastructure
Last-reviewed: 2026-02-09
Relates-to charter: none
---

# Test Plan

## Active tasks
- **TEST-01:** Do the thing
`;

// Active plan missing Status/Domain/Last-reviewed
const MISSING_METADATA_PLAN = `---
Type: Plan
Relates-to charter: none
---

# Test Plan

## Active tasks
- **TEST-01:** Do the thing
`;

// Active plan missing Relates-to charter
const MISSING_CHARTER_PLAN = `---
Type: Plan
Status: Active
Domain: Test
Last-reviewed: 2026-02-09
---

# Test Plan

## Active tasks
- **TEST-01:** Do the thing
`;

// Active plan missing ## Active tasks section
const MISSING_ACTIVE_SECTION_PLAN = `---
Type: Plan
Status: Active
Domain: Test
Last-reviewed: 2026-02-09
Relates-to charter: none
---

# Test Plan

## Summary
Nothing here
`;

// Archive plan missing metadata (should be exempt after fix)
const ARCHIVE_MISSING_METADATA = `---
Type: Plan
---

# Archived Plan

## Active tasks
`;

// Terminal-status plan with empty active tasks
const TERMINAL_STATUS_EMPTY_TASKS = `---
Type: Plan
Status: Historical
Domain: Test
Last-reviewed: 2026-01-01
Relates-to charter: none
---

# Old Plan

## Active tasks
`;

// Active plan with empty active tasks and no explicit prose
const ACTIVE_EMPTY_TASKS = `---
Type: Plan
Status: Active
Domain: Test
Last-reviewed: 2026-02-09
Relates-to charter: none
---

# Plan with no tasks

## Active tasks

## Other section
`;

// Active plan with Relates-to charter: none (valid)
const CHARTER_NONE_PLAN = `---
Type: Plan
Status: Active
Domain: Test
Last-reviewed: 2026-02-09
Relates-to charter: none
---

# Plan with charter none

## Active tasks
- **TEST-01:** Something
`;

describe("plans-lint (CI-SC-01)", () => {
  afterEach(() => {
    cleanFixtures();
  });

  // TC-01: Active plan with all required headers → passes lint
  it("TC-01: active plan with all required headers passes lint", () => {
    writeFixtureRoot("tc01-valid.md", VALID_ACTIVE_PLAN);
    const { exitCode, output } = runPlansLint();
    // Should not mention our fixture file in any warning
    expect(output).not.toContain("tc01-valid.md");
    // Note: exitCode may be 1 from OTHER real plan files that fail,
    // so we only assert our fixture doesn't produce warnings.
  });

  // TC-02: Active plan missing Status header → fails lint
  it("TC-02: active plan missing metadata headers produces error", () => {
    writeFixtureRoot("tc02-missing-meta.md", MISSING_METADATA_PLAN);
    const { output } = runPlansLint();
    expect(output).toContain("tc02-missing-meta.md");
    expect(output).toContain("Plan missing Status/Domain/Last-reviewed header");
  });

  // TC-03: Active plan missing ## Active tasks section → fails lint
  it("TC-03: active plan missing Active tasks section produces error", () => {
    writeFixtureRoot("tc03-no-section.md", MISSING_ACTIVE_SECTION_PLAN);
    const { output } = runPlansLint();
    expect(output).toContain("tc03-no-section.md");
    expect(output).toContain('Plan missing "## Active tasks" section');
  });

  // TC-04: Archive-path plan (/archive/) missing metadata → passes lint (no error)
  it("TC-04: archive-path plan missing metadata produces no error", () => {
    writeFixture("archive", "tc04-archived.md", ARCHIVE_MISSING_METADATA);
    const { output } = runPlansLint();
    expect(output).not.toContain("tc04-archived.md: Plan missing Status/Domain/Last-reviewed");
    expect(output).not.toContain("tc04-archived.md: Plan missing Relates-to charter");
  });

  // TC-05: Historical-path plan (/historical/) missing metadata → passes lint
  it("TC-05: historical-path plan missing metadata produces no error", () => {
    writeFixture("historical", "tc05-historical.md", ARCHIVE_MISSING_METADATA);
    const { output } = runPlansLint();
    expect(output).not.toContain("tc05-historical.md: Plan missing Status/Domain/Last-reviewed");
    expect(output).not.toContain("tc05-historical.md: Plan missing Relates-to charter");
  });

  // TC-06: Terminal-status plan with empty active tasks → passes lint (warning suppressed)
  it("TC-06: terminal-status plan with empty active tasks suppresses warning", () => {
    writeFixtureRoot("tc06-terminal.md", TERMINAL_STATUS_EMPTY_TASKS);
    const { output } = runPlansLint();
    expect(output).not.toContain("tc06-terminal.md");
  });

  // TC-07: Active plan with empty active tasks, no explicit prose → fails lint
  it("TC-07: active plan with empty active tasks produces warning", () => {
    writeFixtureRoot("tc07-empty-tasks.md", ACTIVE_EMPTY_TASKS);
    const { output } = runPlansLint();
    expect(output).toContain("tc07-empty-tasks.md");
    expect(output).toContain('Plan has no tasks under "## Active tasks"');
  });

  // TC-08: Active plan with Relates-to charter: none → passes lint
  it("TC-08: active plan with charter none passes lint", () => {
    writeFixtureRoot("tc08-charter-none.md", CHARTER_NONE_PLAN);
    const { output } = runPlansLint();
    expect(output).not.toContain("tc08-charter-none.md");
  });
});
