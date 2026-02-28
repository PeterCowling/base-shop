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
  lintBriefingContract,
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

// ── TC-01..TC-04: lintBriefingContract ─────────────────────────────────────

describe("lintBriefingContract — briefing schema checks (TC-01..TC-04)", () => {
  const baseFields = {
    business: "HEAD",
    artifact: "outcome_contract",
    status: "Active",
    owner: "Pete",
    last_updated: "2026-02-19",
    source_of_truth: true,
    depends_on: [],
    decisions: ["DEC-HEAD-01"],
    primary_channel_surface: "own_site_dtc",
    primary_icp: "caregiver_children",
    hero_sku_price_corridor: {
      currency: "EUR",
      min: 18,
      max: 32,
    },
    claim_confidence: {
      "CLAIM-HEAD-001": "High",
    },
  };

  it("TC-01: compliant fixture set produces no issues", () => {
    const issues = lintBriefingContract({
      artifacts: [
        {
          artifactPath: "docs/business-os/contracts/HEAD/outcome-contract.user.md",
          expectedBusiness: "HEAD",
          fields: baseFields,
        },
      ],
    });

    expect(issues).toHaveLength(0);
  });

  it("TC-02: missing required field emits deterministic missing_required_field code", () => {
    const missingDependsOn = { ...baseFields };
    delete (missingDependsOn as Record<string, unknown>).depends_on;

    const issues = lintBriefingContract({
      artifacts: [
        {
          artifactPath: "docs/business-os/startup-baselines/HEAD-2026-02-12assessment-intake-packet.user.md",
          expectedBusiness: "HEAD",
          fields: missingDependsOn,
        },
      ],
    });

    const missing = issues.find((issue) => issue.code === "missing_required_field");
    expect(missing).toBeDefined();
    if (missing) {
      expect(missing.message).toContain("assessment-intake-packet.user.md");
      expect(missing.message).toContain("depends_on");
      expect(missing.severity).toBe("error");
    }
  });

  it("TC-03: legacy status emits invalid_status_taxonomy as warning in preflight mode", () => {
    const issues = lintBriefingContract({
      statusMode: "warn_preflight",
      artifacts: [
        {
          artifactPath: "docs/business-os/strategy/HEAD/plan.user.md",
          expectedBusiness: "HEAD",
          fields: {
            ...baseFields,
            status: "Locked",
          },
        },
      ],
    });

    const statusIssue = issues.find(
      (issue) => issue.code === "invalid_status_taxonomy",
    );
    expect(statusIssue).toBeDefined();
    if (statusIssue) {
      expect(statusIssue.message).toContain("legacy status 'Locked'");
      expect(statusIssue.severity).toBe("warning");
    }
  });

  it("TC-03: legacy status emits invalid_status_taxonomy as error in hard-fail mode", () => {
    const issues = lintBriefingContract({
      statusMode: "hard_fail",
      artifacts: [
        {
          artifactPath: "docs/business-os/strategy/HEAD/plan.user.md",
          expectedBusiness: "HEAD",
          fields: {
            ...baseFields,
            status: "Locked",
          },
        },
      ],
    });

    const statusIssue = issues.find(
      (issue) => issue.code === "invalid_status_taxonomy",
    );
    expect(statusIssue).toBeDefined();
    if (statusIssue) {
      expect(statusIssue.severity).toBe("error");
    }
  });

  it("label mismatch emits deterministic label_mismatch code", () => {
    const issues = lintBriefingContract({
      artifacts: [
        {
          artifactPath: "docs/business-os/startup-loop-output-registry.user.html#head",
          expectedBusiness: "HEAD",
          fields: {
            ...baseFields,
            business: "PET",
          },
        },
      ],
    });

    const mismatch = issues.find((issue) => issue.code === "label_mismatch");
    expect(mismatch).toBeDefined();
    if (mismatch) {
      expect(mismatch.message).toContain("expected slot 'HEAD'");
      expect(mismatch.severity).toBe("error");
    }
  });

  it("TC-04: contradiction fixture emits contradiction_conflict with hard-fail severity", () => {
    const issues = lintBriefingContract({
      contradictionMode: "hard_fail",
      artifacts: [
        {
          artifactPath: "docs/business-os/contracts/HEAD/outcome-contract.user.md",
          expectedBusiness: "HEAD",
          fields: {
            ...baseFields,
            primary_channel_surface: "own_site_dtc",
          },
        },
        {
          artifactPath:
            "docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md",
          expectedBusiness: "HEAD",
          fields: {
            ...baseFields,
            primary_channel_surface: "marketplace",
          },
        },
      ],
    });

    const contradiction = issues.find(
      (issue) => issue.code === "contradiction_conflict",
    );
    expect(contradiction).toBeDefined();
    if (contradiction) {
      expect(contradiction.message).toContain("primary_channel_surface");
      expect(contradiction.severity).toBe("error");
    }
  });

  it("TC-04: contradiction fixture respects warn_preflight severity", () => {
    const issues = lintBriefingContract({
      contradictionMode: "warn_preflight",
      artifacts: [
        {
          artifactPath: "docs/business-os/contracts/HEAD/outcome-contract.user.md",
          expectedBusiness: "HEAD",
          fields: {
            ...baseFields,
            primary_channel_surface: "own_site_dtc",
          },
        },
        {
          artifactPath:
            "docs/business-os/market-research/HEAD/2026-02-12-market-intelligence.user.md",
          expectedBusiness: "HEAD",
          fields: {
            ...baseFields,
            primary_channel_surface: "marketplace",
          },
        },
      ],
    });

    const contradiction = issues.find(
      (issue) => issue.code === "contradiction_conflict",
    );
    expect(contradiction).toBeDefined();
    if (contradiction) {
      expect(contradiction.severity).toBe("warning");
    }
  });
});
