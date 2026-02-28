import * as fs from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  emitReflectionDebt,
  getBuildRecordPath,
  getReflectionDebtArtifactPath,
  getResultsReviewPath,
  readReflectionDebtLedger,
  type ReflectionDebtLedger,
  validateResultsReviewContent,
} from "../lp-do-build-reflection-debt.js";

// TC-06 imports: warn_sections field for Intended Outcome Check (TASK-06)
import type { ReflectionMinimumValidation } from "../lp-do-build-reflection-debt.js";

function readLedgerFromArtifact(
  artifactPath: string,
  featureSlug: string,
): ReflectionDebtLedger {
  const content = fs.readFileSync(artifactPath, "utf-8");
  expect(content).toContain("reflection-debt.v1");
  return readReflectionDebtLedger(artifactPath, featureSlug, new Date("2026-02-25T00:00:00.000Z"));
}

function writeBuildRecord(
  rootDir: string,
  featureSlug: string,
  buildId: string,
): string {
  const buildRecordPath = getBuildRecordPath(featureSlug, rootDir);
  fs.mkdirSync(path.dirname(buildRecordPath), { recursive: true });
  fs.writeFileSync(
    buildRecordPath,
    `---
artifact: build-record
build-id: ${buildId}
---

# Build Record

Build completed for ${featureSlug}.
`,
    "utf-8",
  );
  return buildRecordPath;
}

describe("lp-do-build-reflection-debt", () => {
  let rootDir: string;
  const featureSlug = "reflection-debt-contract";
  const buildId = "reflection-debt-contract:2026-02-25";
  const now = new Date("2026-02-25T12:00:00.000Z");

  beforeEach(() => {
    rootDir = mkdtempSync(path.join(tmpdir(), "reflection-debt-test-"));
    writeBuildRecord(rootDir, featureSlug, buildId);
  });

  afterEach(() => {
    if (rootDir) {
      rmSync(rootDir, { force: true, recursive: true });
    }
  });

  it("VC-09-01: minimum payload validation fails when Standing Expansion decision is missing", () => {
    const validation = validateResultsReviewContent(`
# Results Review

## Observed Outcomes
Users completed checkout on mobile.

## Standing Updates
No standing updates: no durable changes observed.

## New Idea Candidates
None.
`);

    expect(validation.valid).toBe(false);
    expect(validation.missing_sections).toEqual(["Standing Expansion"]);
    expect(validation.section_state["Standing Expansion"]).toEqual({
      present: false,
      valid: false,
    });
  });

  it("VC-09-02: missing reflection emits one deterministic debt item and replay is idempotent", () => {
    const artifactPath = getReflectionDebtArtifactPath(featureSlug, rootDir);

    const first = emitReflectionDebt({
      feature_slug: featureSlug,
      build_id: buildId,
      root_dir: rootDir,
      now,
      owner_scope: "agent/codex",
      business_scope: "HBAG",
    });

    expect(first.ok).toBe(true);
    expect(first.action).toBe("created");
    expect(first.debt_id).toBe(`reflection-debt:${buildId}`);
    expect(fs.existsSync(artifactPath)).toBe(true);

    const firstLedger = readLedgerFromArtifact(artifactPath, featureSlug);
    expect(firstLedger.items).toHaveLength(1);
    expect(firstLedger.items[0].status).toBe("open");
    expect(firstLedger.items[0].lane).toBe("IMPROVE");
    expect(firstLedger.items[0].minimum_reflection.missing_sections).toEqual([
      "Observed Outcomes",
      "Standing Updates",
      "New Idea Candidates",
      "Standing Expansion",
    ]);

    const second = emitReflectionDebt({
      feature_slug: featureSlug,
      build_id: buildId,
      root_dir: rootDir,
      now,
      owner_scope: "agent/codex",
      business_scope: "HBAG",
    });

    expect(second.ok).toBe(true);
    expect(second.action).toBe("noop");

    const secondLedger = readLedgerFromArtifact(artifactPath, featureSlug);
    expect(secondLedger.items).toHaveLength(1);
    expect(secondLedger.items[0].debt_id).toBe(`reflection-debt:${buildId}`);
  });

  it("VC-09-03: once minimum reflection payload is present, debt resolves without duplicates", () => {
    emitReflectionDebt({
      feature_slug: featureSlug,
      build_id: buildId,
      root_dir: rootDir,
      now,
      owner_scope: "agent/codex",
      business_scope: "HBAG",
    });

    const reviewPath = getResultsReviewPath(featureSlug, rootDir);
    fs.mkdirSync(path.dirname(reviewPath), { recursive: true });
    fs.writeFileSync(
      reviewPath,
      `---
Status: Complete
Feature-Slug: ${featureSlug}
Review-date: 2026-02-25
artifact: results-review
---

# Results Review

## Observed Outcomes
Conversion improved by 14% after launch.

## Standing Updates
No standing updates: changes are not yet persistent.

## New Idea Candidates
None.

## Standing Expansion
No standing expansion: existing standing domains already cover observed outcomes.
`,
      "utf-8",
    );

    const result = emitReflectionDebt({
      feature_slug: featureSlug,
      build_id: buildId,
      root_dir: rootDir,
      now: new Date("2026-02-25T16:30:00.000Z"),
      owner_scope: "agent/codex",
      business_scope: "HBAG",
    });

    expect(result.ok).toBe(true);
    expect(result.action).toBe("resolved");

    const artifactPath = getReflectionDebtArtifactPath(featureSlug, rootDir);
    const ledger = readLedgerFromArtifact(artifactPath, featureSlug);
    expect(ledger.items).toHaveLength(1);
    expect(ledger.items[0].status).toBe("resolved");
    expect(ledger.items[0].resolved_at).toBe("2026-02-25T16:30:00.000Z");
    expect(ledger.items[0].minimum_reflection.missing_sections).toEqual([]);
  });

  it("VC-09-04: missing build record fails closed and emits no debt artifact", () => {
    const isolatedRoot = mkdtempSync(path.join(tmpdir(), "reflection-debt-missing-build-"));
    try {
      expect(() =>
        emitReflectionDebt({
          feature_slug: featureSlug,
          build_id: buildId,
          root_dir: isolatedRoot,
          now,
          owner_scope: "agent/codex",
          business_scope: "HBAG",
        }),
      ).toThrow(/build-record\.user\.md is required/i);

      const artifactPath = getReflectionDebtArtifactPath(featureSlug, isolatedRoot);
      expect(fs.existsSync(artifactPath)).toBe(false);
    } finally {
      rmSync(isolatedRoot, { force: true, recursive: true });
    }
  });
});

// ---------------------------------------------------------------------------
// TC-06: Intended Outcome Check — warn mode (TASK-06)
// ---------------------------------------------------------------------------

const FULL_FOUR_SECTION_REVIEW = `
# Results Review

## Observed Outcomes
Conversion improved by 14% after launch.

## Standing Updates
No standing updates: changes are not yet persistent.

## New Idea Candidates
None.

## Standing Expansion
No standing expansion: existing standing domains already cover observed outcomes.
`;

const FULL_FIVE_SECTION_REVIEW_MET = `
# Results Review

## Observed Outcomes
Conversion improved by 14% after launch.

## Standing Updates
No standing updates: changes are not yet persistent.

## New Idea Candidates
None.

## Standing Expansion
No standing expansion: existing standing domains already cover observed outcomes.

## Intended Outcome Check
- Intended: ≥10% improvement in DTC booking conversion within 30 days
- Observed: 14% improvement — target met
- Verdict: Met
- Notes: Ahead of target at 30-day mark.
`;

const FULL_FIVE_SECTION_REVIEW_PARTIALLY_MET = `
# Results Review

## Observed Outcomes
Some improvement but not fully measured.

## Standing Updates
No standing updates: changes are not yet persistent.

## New Idea Candidates
None.

## Standing Expansion
No standing expansion: existing standing domains already cover observed outcomes.

## Intended Outcome Check
- Intended: ≥10% improvement in DTC booking conversion within 30 days
- Observed: 6% improvement — below target
- Verdict: Partially Met
- Notes: Below target; recommend extending measurement window.
`;

const REVIEW_WITH_INVALID_INTENDED_OUTCOME_CHECK = `
# Results Review

## Observed Outcomes
Conversion improved.

## Standing Updates
No standing updates: changes are not yet persistent.

## New Idea Candidates
None.

## Standing Expansion
No standing expansion: existing standing domains already cover observed outcomes.

## Intended Outcome Check
- Intended: ≥10% improvement
- Observed: not yet measured
- Verdict: <verdict>
- Notes: placeholder text.
`;

describe("TC-06: Intended Outcome Check — warn mode (TASK-06)", () => {
  // TC-06-A: All 4 existing sections + valid Intended Outcome Check → valid: true, warn_sections: []
  it("TC-06-A: all 5 sections valid (verdict=Met) → valid: true, warn_sections: []", () => {
    const result = validateResultsReviewContent(FULL_FIVE_SECTION_REVIEW_MET);

    expect(result.valid).toBe(true);
    expect(result.missing_sections).toEqual([]);
    // warn_sections should be empty when Intended Outcome Check is valid
    expect((result as ReflectionMinimumValidation).warn_sections ?? []).toEqual([]);
  });

  // TC-06-A (variant): Partially Met is also a valid verdict
  it("TC-06-A (variant): all 5 sections valid (verdict=Partially Met) → valid: true", () => {
    const result = validateResultsReviewContent(FULL_FIVE_SECTION_REVIEW_PARTIALLY_MET);

    expect(result.valid).toBe(true);
    expect(result.missing_sections).toEqual([]);
  });

  // TC-06-B: All 4 existing sections but missing Intended Outcome Check →
  //          valid: true (warn mode), warn_sections: ["Intended Outcome Check"]
  it("TC-06-B: missing Intended Outcome Check (4/5 sections) → valid: true (warn mode), warn_sections warns", () => {
    const result = validateResultsReviewContent(FULL_FOUR_SECTION_REVIEW) as ReflectionMinimumValidation;

    // Existing 4 sections pass → valid: true
    expect(result.valid).toBe(true);
    // warn_sections includes Intended Outcome Check (warn mode, not hard gate)
    expect(result.warn_sections).toBeDefined();
    expect(result.warn_sections!.includes("Intended Outcome Check")).toBe(true);
  });

  // TC-06-D: Intended Outcome Check section present but no verdict keyword →
  //          warn/fail depending on mode (currently warn mode)
  it("TC-06-D: Intended Outcome Check with placeholder verdict → reported in warn_sections", () => {
    const result = validateResultsReviewContent(REVIEW_WITH_INVALID_INTENDED_OUTCOME_CHECK) as ReflectionMinimumValidation;

    // valid: true because Intended Outcome Check is in warn mode, not hard gate
    expect(result.valid).toBe(true);
    // But warn_sections should flag the placeholder verdict
    expect(result.warn_sections).toBeDefined();
    expect(result.warn_sections!.includes("Intended Outcome Check")).toBe(true);
  });
});
