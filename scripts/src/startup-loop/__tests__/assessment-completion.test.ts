import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

import {
  type AssessmentCompletionResult,
  scanAssessmentCompletion,
} from "../assessment/assessment-completion-scanner";

let tempDir = "";

async function writeFile(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}

const MINIMAL_CONTENT = `---\nType: Test\n---\n# Test`;

beforeEach(async () => {
  tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "assessment-completion-test-")
  );
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});

describe("scanAssessmentCompletion", () => {
  const strategyRoot = () => path.join(tempDir, "strategy");
  const assessmentDir = (biz: string) =>
    path.join(strategyRoot(), biz, "assessment");
  const workbenchDir = (biz: string) =>
    path.join(assessmentDir(biz), "naming-workbench");

  describe("happy path - multi-stage business", () => {
    it("TC-01: detects completion for multiple assessment stages", async () => {
      const biz = "HBAG";
      const root = assessmentDir(biz);

      // ASSESSMENT-01 (Problem Statement)
      await writeFile(
        path.join(root, "2026-02-10-problem-statement.user.md"),
        MINIMAL_CONTENT
      );
      // ASSESSMENT-02 (Solution Profiling)
      await writeFile(
        path.join(root, "2026-02-12-solution-profile-results.user.md"),
        MINIMAL_CONTENT
      );
      // ASSESSMENT-06 (Distribution Profiling)
      await writeFile(
        path.join(root, "2026-02-14-launch-distribution-plan.user.md"),
        MINIMAL_CONTENT
      );
      // ASSESSMENT-08 (Current Situation)
      await writeFile(
        path.join(root, "2026-02-16-operator-context.user.md"),
        MINIMAL_CONTENT
      );
      // ASSESSMENT-10 (Brand Profiling)
      await writeFile(
        path.join(root, "2026-02-18-brand-profile.user.md"),
        MINIMAL_CONTENT
      );
      // ASSESSMENT-11 (Brand Identity)
      await writeFile(
        path.join(root, "2026-02-20-brand-identity-dossier.user.md"),
        MINIMAL_CONTENT
      );
      // ASSESSMENT-14 (Logo Brief)
      await writeFile(
        path.join(root, "2026-02-22-logo-brief.user.md"),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      const completeStages = results.filter((r) => r.status === "complete");
      expect(completeStages).toHaveLength(7);

      const stageIds = completeStages.map((r) => r.stage_id).sort();
      expect(stageIds).toEqual([
        "ASSESSMENT-01",
        "ASSESSMENT-02",
        "ASSESSMENT-06",
        "ASSESSMENT-08",
        "ASSESSMENT-10",
        "ASSESSMENT-11",
        "ASSESSMENT-14",
      ]);

      // Verify each has the expected date
      const a01 = results.find((r) => r.stage_id === "ASSESSMENT-01")!;
      expect(a01.status).toBe("complete");
      expect(a01.artifact_date).toBe("2026-02-10");
      expect(a01.artifact_path).toContain("problem-statement.user.md");

      const a10 = results.find((r) => r.stage_id === "ASSESSMENT-10")!;
      expect(a10.status).toBe("complete");
      expect(a10.artifact_date).toBe("2026-02-18");
    });
  });

  describe("empty and non-existent directories", () => {
    it("TC-02: empty assessment directory returns not_found for file-based stages and no_artifact_pattern for ASSESSMENT-09", async () => {
      const biz = "TEST";
      // Create the assessment directory but leave it empty
      await fs.mkdir(assessmentDir(biz), { recursive: true });

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      // Should have one result per stage
      expect(results).toHaveLength(14);

      const notFound = results.filter((r) => r.status === "not_found");
      const noPattern = results.filter(
        (r) => r.status === "no_artifact_pattern"
      );

      // ASSESSMENT-09 is the only no_artifact_pattern
      expect(noPattern).toHaveLength(1);
      expect(noPattern[0].stage_id).toBe("ASSESSMENT-09");

      // Remaining 13 stages are not_found
      expect(notFound).toHaveLength(13);

      // All not_found should have null paths/dates
      for (const r of notFound) {
        expect(r.artifact_path).toBeNull();
        expect(r.artifact_date).toBeNull();
      }
    });

    it("TC-03: non-existent strategyRoot without businesses override returns empty array", () => {
      const results = scanAssessmentCompletion({
        strategyRoot: path.join(tempDir, "nonexistent"),
      });

      expect(results).toEqual([]);
    });

    it("TC-04: non-existent strategyRoot with businesses override returns all not_found/no_artifact_pattern", () => {
      const results = scanAssessmentCompletion({
        strategyRoot: path.join(tempDir, "nonexistent"),
        businesses: ["TEST"],
      });

      expect(results).toHaveLength(14);

      for (const r of results) {
        expect(["not_found", "no_artifact_pattern"]).toContain(r.status);
        expect(r.business).toBe("TEST");
      }

      const a09 = results.find((r) => r.stage_id === "ASSESSMENT-09")!;
      expect(a09.status).toBe("no_artifact_pattern");
    });
  });

  describe("date extraction", () => {
    it("TC-05: extracts date from dated filename prefix", async () => {
      const biz = "TEST";
      await writeFile(
        path.join(assessmentDir(biz), "2026-02-21-brand-profile.user.md"),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      const a10 = results.find((r) => r.stage_id === "ASSESSMENT-10")!;
      expect(a10.status).toBe("complete");
      expect(a10.artifact_date).toBe("2026-02-21");
    });

    it("TC-06: extracts date from frontmatter when filename has no date prefix", async () => {
      const biz = "TEST";
      const content = `---\nlast_updated: 2026-01-15\n---\n# Content`;
      await writeFile(
        path.join(assessmentDir(biz), "current-problem-framing.user.md"),
        content
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      const a01 = results.find((r) => r.stage_id === "ASSESSMENT-01")!;
      expect(a01.status).toBe("complete");
      expect(a01.artifact_date).toBe("2026-01-15");
    });

    it("TC-13: multiple matching files - most recent dated filename wins", async () => {
      const biz = "TEST";
      await writeFile(
        path.join(
          assessmentDir(biz),
          "2026-02-17-brand-identity-dossier.user.md"
        ),
        MINIMAL_CONTENT
      );
      await writeFile(
        path.join(
          assessmentDir(biz),
          "2026-02-21-brand-identity-dossier.user.md"
        ),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      const a11 = results.find((r) => r.stage_id === "ASSESSMENT-11")!;
      expect(a11.status).toBe("complete");
      expect(a11.artifact_date).toBe("2026-02-21");
      expect(a11.artifact_path).toContain("2026-02-21");
    });
  });

  describe("ASSESSMENT-09 special case", () => {
    it("TC-07: always returns no_artifact_pattern regardless of files present", async () => {
      const biz = "TEST";
      // Even with files in the assessment directory, ASSESSMENT-09 has no patterns
      await writeFile(
        path.join(assessmentDir(biz), "intake-form.user.md"),
        MINIMAL_CONTENT
      );
      await writeFile(
        path.join(assessmentDir(biz), "2026-02-15-intake.user.md"),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      const a09 = results.find((r) => r.stage_id === "ASSESSMENT-09")!;
      expect(a09.status).toBe("no_artifact_pattern");
      expect(a09.artifact_path).toBeNull();
      expect(a09.artifact_date).toBeNull();
      expect(a09.stage_name).toBe("Intake");
    });
  });

  describe("conditional stages", () => {
    it("TC-08: ASSESSMENT-05 and ASSESSMENT-15 have conditional=true", async () => {
      const biz = "TEST";
      // ASSESSMENT-05 (Name Selection Spec) - exact match in assessment root
      await writeFile(
        path.join(assessmentDir(biz), "name-selection-spec.md"),
        MINIMAL_CONTENT
      );
      // ASSESSMENT-15 (Packaging Brief) - dated suffix match
      await writeFile(
        path.join(assessmentDir(biz), "2026-02-28-packaging-brief.user.md"),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      const a05 = results.find((r) => r.stage_id === "ASSESSMENT-05")!;
      expect(a05.status).toBe("complete");
      expect(a05.conditional).toBe(true);

      const a15 = results.find((r) => r.stage_id === "ASSESSMENT-15")!;
      expect(a15.status).toBe("complete");
      expect(a15.conditional).toBe(true);
      expect(a15.artifact_date).toBe("2026-02-28");

      // Non-conditional stages should have conditional=false
      const a01 = results.find((r) => r.stage_id === "ASSESSMENT-01")!;
      expect(a01.conditional).toBe(false);
    });
  });

  describe("naming-workbench patterns", () => {
    it("TC-09: ASSESSMENT-04 detects candidate-names in naming-workbench", async () => {
      const biz = "TEST";
      await writeFile(
        path.join(
          workbenchDir(biz),
          "2026-02-20-candidate-names.user.md"
        ),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      const a04 = results.find((r) => r.stage_id === "ASSESSMENT-04")!;
      expect(a04.status).toBe("complete");
      expect(a04.artifact_date).toBe("2026-02-20");
      expect(a04.artifact_path).toContain("naming-workbench");
    });

    it("TC-10: ASSESSMENT-04 not_found when naming-workbench has no matching files", async () => {
      const biz = "TEST";
      // File exists but does not match any ASSESSMENT-04 pattern
      await writeFile(
        path.join(workbenchDir(biz), "rdap-check.md"),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      const a04 = results.find((r) => r.stage_id === "ASSESSMENT-04")!;
      expect(a04.status).toBe("not_found");
      expect(a04.artifact_path).toBeNull();
    });

    it("TC-11: ASSESSMENT-05 detects naming-generation-spec in naming-workbench", async () => {
      const biz = "TEST";
      await writeFile(
        path.join(
          workbenchDir(biz),
          "2026-02-22-naming-generation-spec.md"
        ),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      const a05 = results.find((r) => r.stage_id === "ASSESSMENT-05")!;
      expect(a05.status).toBe("complete");
      expect(a05.artifact_date).toBe("2026-02-22");
      expect(a05.artifact_path).toContain("naming-workbench");
      expect(a05.conditional).toBe(true);
    });

    it("TC-12: ASSESSMENT-13 detects product-naming-shortlist in naming-workbench", async () => {
      const biz = "TEST";
      await writeFile(
        path.join(
          workbenchDir(biz),
          "product-naming-shortlist-2026-02-27.user.md"
        ),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      const a13 = results.find((r) => r.stage_id === "ASSESSMENT-13")!;
      expect(a13.status).toBe("complete");
      expect(a13.artifact_path).toContain("naming-workbench");
      expect(a13.artifact_path).toContain("product-naming-shortlist");
    });

    it("TC-15: ASSESSMENT-04 detects naming-shortlist pattern in naming-workbench", async () => {
      const biz = "TEST";
      await writeFile(
        path.join(
          workbenchDir(biz),
          "naming-shortlist-2026-02-26.user.md"
        ),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      const a04 = results.find((r) => r.stage_id === "ASSESSMENT-04")!;
      expect(a04.status).toBe("complete");
      expect(a04.artifact_path).toContain("naming-shortlist");
    });
  });

  describe("file filtering", () => {
    it("TC-14: .html and .agent.md files are ignored by the scanner", async () => {
      const biz = "TEST";
      // .html file should be ignored
      await writeFile(
        path.join(assessmentDir(biz), "2026-02-20-brand-profile.user.html"),
        "<html><body>test</body></html>"
      );
      // .agent.md file should be ignored
      await writeFile(
        path.join(assessmentDir(biz), "2026-02-20-brand-profile.agent.md"),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      // ASSESSMENT-10 (Brand Profiling) should NOT be complete
      const a10 = results.find((r) => r.stage_id === "ASSESSMENT-10")!;
      expect(a10.status).toBe("not_found");
      expect(a10.artifact_path).toBeNull();
    });
  });

  describe("result structure", () => {
    it("every result has required fields with correct types", async () => {
      const biz = "TEST";
      await writeFile(
        path.join(assessmentDir(biz), "2026-02-10-problem-statement.user.md"),
        MINIMAL_CONTENT
      );

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [biz],
      });

      expect(results.length).toBeGreaterThan(0);

      for (const r of results) {
        expect(r).toHaveProperty("business");
        expect(r).toHaveProperty("stage_id");
        expect(r).toHaveProperty("stage_name");
        expect(r).toHaveProperty("status");
        expect(r).toHaveProperty("conditional");
        expect(typeof r.business).toBe("string");
        expect(typeof r.stage_id).toBe("string");
        expect(typeof r.stage_name).toBe("string");
        expect(["complete", "not_found", "no_artifact_pattern"]).toContain(
          r.status
        );
        expect(typeof r.conditional).toBe("boolean");

        if (r.status === "complete") {
          expect(typeof r.artifact_path).toBe("string");
        } else {
          expect(r.artifact_path).toBeNull();
        }
      }
    });

    it("results are sorted by business then stage_id", async () => {
      const bizA = "AAA";
      const bizB = "BBB";
      await fs.mkdir(assessmentDir(bizA), { recursive: true });
      await fs.mkdir(assessmentDir(bizB), { recursive: true });

      const results = scanAssessmentCompletion({
        strategyRoot: strategyRoot(),
        businesses: [bizB, bizA],
      });

      // All AAA results should come before all BBB results
      const firstBbIdx = results.findIndex((r) => r.business === "BBB");
      const lastAaIdx = results.length - 1 - [...results].reverse().findIndex((r) => r.business === "AAA");

      expect(lastAaIdx).toBeLessThan(firstBbIdx);

      // Within each business, stage_ids should be sorted
      const aaaStages = results
        .filter((r) => r.business === "AAA")
        .map((r) => r.stage_id);
      const aaaSorted = [...aaaStages].sort();
      expect(aaaStages).toEqual(aaaSorted);
    });
  });
});
