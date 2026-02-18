/**
 * Startup Loop Artifact Contract Lint — Tests
 *
 * Covers VC-12 validation contracts:
 *   VC-01: Lint failure check — at least one intentional path-contract violation
 *          fails with deterministic reason text; compliant paths pass without issue.
 *
 * Task: TASK-12 (startup-loop-marketing-sales-capability-gap-audit)
 */

import { describe, expect, it } from "@jest/globals";

import {
  classifyArtifactType,
  lintStartupLoopArtifactPath,
} from "../contract-lint.js";

// ── classifyArtifactType ─────────────────────────────────────────────────────

describe("classifyArtifactType", () => {
  it("classifies demand-evidence-pack.md as 'dep'", () => {
    expect(
      classifyArtifactType(
        "docs/business-os/startup-baselines/BRIK/demand-evidence-pack.md",
      ),
    ).toBe("dep");
  });

  it("classifies measurement-verification doc as 'measurement-verification'", () => {
    expect(
      classifyArtifactType(
        "docs/business-os/strategy/BRIK/2026-01-15-measurement-verification.user.md",
      ),
    ).toBe("measurement-verification");
  });

  it("returns null for unrelated files", () => {
    expect(classifyArtifactType("docs/business-os/strategy/BRIK/plan.user.md")).toBeNull();
    expect(classifyArtifactType("docs/business-os/startup-baselines/BRIK/other.md")).toBeNull();
    expect(classifyArtifactType("scripts/src/startup-loop/derive-state.ts")).toBeNull();
  });
});

// ── VC-01: lintStartupLoopArtifactPath ───────────────────────────────────────

describe("lintStartupLoopArtifactPath — DEP (VC-01)", () => {
  it("VC-01: compliant DEP path produces no issues", () => {
    const issues = lintStartupLoopArtifactPath({
      filePath:
        "docs/business-os/startup-baselines/BRIK/demand-evidence-pack.md",
    });
    expect(issues).toHaveLength(0);
  });

  it("VC-01: DEP at wrong directory triggers dep_wrong_path violation", () => {
    // Seeded violation: DEP placed under strategy/ instead of startup-baselines/
    const issues = lintStartupLoopArtifactPath({
      filePath:
        "docs/business-os/strategy/BRIK/demand-evidence-pack.md",
    });
    expect(issues.map((i) => i.code)).toContain("dep_wrong_path");
  });

  it("VC-01: dep_wrong_path message includes the offending path", () => {
    const wrongPath = "data/demand-evidence-pack.md";
    const issues = lintStartupLoopArtifactPath({ filePath: wrongPath });
    const issue = issues.find((i) => i.code === "dep_wrong_path");
    expect(issue).toBeDefined();
    if (issue) {
      expect(issue.message).toContain(wrongPath);
      expect(issue.message).toContain("startup-baselines/<BIZ>/demand-evidence-pack.md");
    }
  });

  it("VC-01: dep_wrong_path message is deterministic (same input → same output)", () => {
    const path = "wrong/demand-evidence-pack.md";
    const issues1 = lintStartupLoopArtifactPath({ filePath: path });
    const issues2 = lintStartupLoopArtifactPath({ filePath: path });
    expect(issues1).toEqual(issues2);
  });

  it("VC-01: nested business slug does not create false positives", () => {
    // Only one path segment should be the BIZ — not nested
    const issues = lintStartupLoopArtifactPath({
      filePath:
        "docs/business-os/startup-baselines/BRIK/2026/demand-evidence-pack.md",
    });
    expect(issues.map((i) => i.code)).toContain("dep_wrong_path");
  });

  it("VC-01: Windows-style path separators are handled", () => {
    const issues = lintStartupLoopArtifactPath({
      filePath:
        "docs\\business-os\\startup-baselines\\BRIK\\demand-evidence-pack.md",
    });
    expect(issues).toHaveLength(0);
  });
});

describe("lintStartupLoopArtifactPath — measurement-verification (VC-01)", () => {
  it("VC-01: compliant measurement-verification path produces no issues", () => {
    const issues = lintStartupLoopArtifactPath({
      filePath:
        "docs/business-os/strategy/BRIK/2026-01-15-measurement-verification.user.md",
    });
    expect(issues).toHaveLength(0);
  });

  it("VC-01: measurement-verification at wrong directory triggers violation", () => {
    // Seeded violation: placed in startup-baselines instead of strategy
    const issues = lintStartupLoopArtifactPath({
      filePath:
        "docs/business-os/startup-baselines/BRIK/measurement-verification.user.md",
    });
    expect(issues.map((i) => i.code)).toContain(
      "measurement_verification_wrong_path",
    );
  });

  it("VC-01: measurement_verification_wrong_path message is deterministic", () => {
    const path =
      "docs/business-os/startup-baselines/BRIK/2026-01-15-measurement-verification.user.md";
    const issues1 = lintStartupLoopArtifactPath({ filePath: path });
    const issues2 = lintStartupLoopArtifactPath({ filePath: path });
    expect(issues1).toEqual(issues2);
  });

  it("VC-01: date-prefixed compliant path produces no issues", () => {
    const issues = lintStartupLoopArtifactPath({
      filePath:
        "docs/business-os/strategy/HEAD/2026-02-01-measurement-verification-v2.user.md",
    });
    expect(issues).toHaveLength(0);
  });
});
