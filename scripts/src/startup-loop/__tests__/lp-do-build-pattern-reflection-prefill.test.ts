/**
 * Tests for lp-do-build-pattern-reflection-prefill.ts
 *
 * Covers TASK-02 TC-01 through TC-06 from plan build-completion-deterministic-lifts.
 */

import * as fs from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import {
  applyRoutingDecisionTree,
  deriveRecurrenceKey,
  prefillPatternReflection,
  scanArchiveForRecurrences,
} from "../build/lp-do-build-pattern-reflection-prefill.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(tmpdir(), "pattern-reflection-prefill-test-"));
});

afterEach(() => {
  if (tmpDir) {
    rmSync(tmpDir, { force: true, recursive: true });
  }
});

function writeArchiveReview(archiveDir: string, slug: string, ideasContent: string): void {
  const dir = path.join(archiveDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "results-review.user.md"),
    [
      "# Results Review",
      "",
      "## Observed Outcomes",
      "- done",
      "",
      "## Standing Updates",
      "- none",
      "",
      "## New Idea Candidates",
      ideasContent,
      "",
      "## Standing Expansion",
      "- none",
      "",
    ].join("\n"),
    "utf-8",
  );
}

// ---------------------------------------------------------------------------
// TC-01: 0 non-None idea candidates → empty-state artifact
// ---------------------------------------------------------------------------
describe("TC-01: empty ideas → empty-state artifact", () => {
  it("produces entries: [] and None identified in both sections", () => {
    const output = prefillPatternReflection({
      featureSlug: "test-slug",
      currentIdeas: [],
      archiveDir: tmpDir,
      generatedAt: "2026-03-04T00:00:00Z",
    });

    expect(output).toContain("entries: []");
    expect(output).toContain("None identified.");
    // Both Patterns and Access Declarations
    const noneCount = (output.match(/None identified\./g) || []).length;
    expect(noneCount).toBe(2);
  });

  it("produces empty-state when ideas are all None placeholders", () => {
    const output = prefillPatternReflection({
      featureSlug: "test-slug",
      currentIdeas: [{ title: "None." }, { title: "none" }],
      archiveDir: tmpDir,
      generatedAt: "2026-03-04T00:00:00Z",
    });

    expect(output).toContain("entries: []");
  });
});

// ---------------------------------------------------------------------------
// TC-02: 2 ideas, each in 1 prior archive → occurrence_count: 2, defer
// ---------------------------------------------------------------------------
describe("TC-02: ideas with 1 prior archive match", () => {
  it("counts occurrences from archive and routes to defer", () => {
    const archiveDir = path.join(tmpDir, "archive");
    writeArchiveReview(archiveDir, "old-plan", "- First idea title\n- Second idea title");

    const output = prefillPatternReflection({
      featureSlug: "test-slug",
      currentIdeas: [
        { title: "First idea title" },
        { title: "Second idea title" },
      ],
      archiveDir,
      generatedAt: "2026-03-04T00:00:00Z",
    });

    expect(output).toContain("occurrence_count: 2");
    expect(output).toContain("routing_target: defer");
    // Should not contain loop_update or skill_proposal
    expect(output).not.toContain("routing_target: loop_update");
    expect(output).not.toContain("routing_target: skill_proposal");
  });
});

// ---------------------------------------------------------------------------
// TC-03: deterministic category with occurrence_count >= 3 → loop_update
// ---------------------------------------------------------------------------
describe("TC-03: routing decision tree — deterministic threshold", () => {
  it("returns loop_update for deterministic at count 3", () => {
    expect(applyRoutingDecisionTree("deterministic", 3)).toBe("loop_update");
  });

  it("returns loop_update for deterministic at count 5", () => {
    expect(applyRoutingDecisionTree("deterministic", 5)).toBe("loop_update");
  });

  it("returns defer for deterministic at count 2", () => {
    expect(applyRoutingDecisionTree("deterministic", 2)).toBe("defer");
  });

  it("returns defer for deterministic at count 1", () => {
    expect(applyRoutingDecisionTree("deterministic", 1)).toBe("defer");
  });
});

// ---------------------------------------------------------------------------
// TC-04: ad_hoc category with occurrence_count >= 2 → skill_proposal
// ---------------------------------------------------------------------------
describe("TC-04: routing decision tree — ad_hoc threshold", () => {
  it("returns skill_proposal for ad_hoc at count 2", () => {
    expect(applyRoutingDecisionTree("ad_hoc", 2)).toBe("skill_proposal");
  });

  it("returns skill_proposal for ad_hoc at count 10", () => {
    expect(applyRoutingDecisionTree("ad_hoc", 10)).toBe("skill_proposal");
  });

  it("returns defer for ad_hoc at count 1", () => {
    expect(applyRoutingDecisionTree("ad_hoc", 1)).toBe("defer");
  });
});

// ---------------------------------------------------------------------------
// TC-05: YAML frontmatter fields
// ---------------------------------------------------------------------------
describe("TC-05: YAML frontmatter includes required fields", () => {
  it("includes schema_version, feature_slug, generated_at, and entries", () => {
    const output = prefillPatternReflection({
      featureSlug: "test-slug",
      currentIdeas: [{ title: "An idea", category: "ad_hoc" }],
      archiveDir: tmpDir,
      generatedAt: "2026-03-04T00:00:00Z",
    });

    expect(output.startsWith("---")).toBe(true);
    expect(output).toContain("schema_version: pattern-reflection.v1");
    expect(output).toContain("feature_slug: test-slug");
    expect(output).toContain("generated_at: 2026-03-04T00:00:00Z");
    expect(output).toContain("entries:");
  });
});

// ---------------------------------------------------------------------------
// TC-06: Full integration — deterministic idea with 3 archive matches
// ---------------------------------------------------------------------------
describe("TC-06: integration with archive recurrence and routing", () => {
  it("produces correct entry for deterministic idea with 3 archive matches", () => {
    const archiveDir = path.join(tmpDir, "archive");
    // Create 3 archive entries each containing the same idea title
    writeArchiveReview(archiveDir, "plan-a", "- Automate deployment pipeline");
    writeArchiveReview(archiveDir, "plan-b", "- Automate deployment pipeline");
    writeArchiveReview(archiveDir, "plan-c", "- Automate deployment pipeline");

    const output = prefillPatternReflection({
      featureSlug: "test-slug",
      currentIdeas: [
        { title: "Automate deployment pipeline", category: "deterministic" },
      ],
      archiveDir,
      generatedAt: "2026-03-04T00:00:00Z",
    });

    // 1 current + 3 archive = 4 occurrences
    expect(output).toContain("occurrence_count: 4");
    expect(output).toContain("category: deterministic");
    expect(output).toContain("routing_target: loop_update");
    // Body should have pattern line
    expect(output).toContain("Automate deployment pipeline");
  });
});

// ---------------------------------------------------------------------------
// Unit tests: deriveRecurrenceKey
// ---------------------------------------------------------------------------
describe("deriveRecurrenceKey", () => {
  it("returns same key for identical titles", () => {
    const a = deriveRecurrenceKey("Hello World");
    const b = deriveRecurrenceKey("Hello World");
    expect(a).toBe(b);
  });

  it("returns same key regardless of casing", () => {
    const a = deriveRecurrenceKey("Hello World");
    const b = deriveRecurrenceKey("hello world");
    expect(a).toBe(b);
  });

  it("returns same key with extra whitespace collapsed", () => {
    const a = deriveRecurrenceKey("hello  world");
    const b = deriveRecurrenceKey("hello world");
    expect(a).toBe(b);
  });

  it("returns same key with leading/trailing whitespace trimmed", () => {
    const a = deriveRecurrenceKey("  hello world  ");
    const b = deriveRecurrenceKey("hello world");
    expect(a).toBe(b);
  });

  it("returns different keys for different titles", () => {
    const a = deriveRecurrenceKey("foo");
    const b = deriveRecurrenceKey("bar");
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// Unit tests: scanArchiveForRecurrences
// ---------------------------------------------------------------------------
describe("scanArchiveForRecurrences", () => {
  it("returns count 1 for each idea when archive dir does not exist", () => {
    const ideas = [{ title: "idea one" }, { title: "idea two" }];
    const result = scanArchiveForRecurrences(
      path.join(tmpDir, "nonexistent"),
      ideas,
    );

    for (const idea of ideas) {
      const key = deriveRecurrenceKey(idea.title);
      expect(result.has(key)).toBe(true);
      expect(result.get(key)!.count).toBe(1);
      expect(result.get(key)!.refs.length).toBe(0);
    }
  });

  it("skips None-placeholder bullets in archive", () => {
    const archiveDir = path.join(tmpDir, "archive");
    writeArchiveReview(archiveDir, "old-plan", "- None.\n- Real idea here");

    const ideas = [{ title: "Real idea here" }];
    const result = scanArchiveForRecurrences(archiveDir, ideas);
    const key = deriveRecurrenceKey("Real idea here");
    // 1 from current + 1 from archive = 2
    expect(result.get(key)!.count).toBe(2);
  });

  it("skips archive files without New Idea Candidates section", () => {
    const archiveDir = path.join(tmpDir, "archive");
    const dir = path.join(archiveDir, "no-ideas");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "results-review.user.md"),
      "# Results Review\n\n## Observed Outcomes\n- stuff\n",
      "utf-8",
    );

    const ideas = [{ title: "Some idea" }];
    const result = scanArchiveForRecurrences(archiveDir, ideas);
    const key = deriveRecurrenceKey("Some idea");
    // Only 1 from current, nothing from archive
    expect(result.get(key)!.count).toBe(1);
  });

  it("populates evidence refs with archive file paths", () => {
    const archiveDir = path.join(tmpDir, "archive");
    writeArchiveReview(archiveDir, "plan-x", "- Matching idea");

    const ideas = [{ title: "Matching idea" }];
    const result = scanArchiveForRecurrences(archiveDir, ideas);
    const key = deriveRecurrenceKey("Matching idea");
    expect(result.get(key)!.refs.length).toBe(1);
    expect(result.get(key)!.refs[0]).toContain("plan-x/results-review.user.md");
  });
});

// ---------------------------------------------------------------------------
// HTML comment stripping
// ---------------------------------------------------------------------------
describe("scanArchiveForRecurrences: HTML comment numbered lists ignored", () => {
  it("does not treat numbered items inside HTML comments as ideas", () => {
    const archiveDir = path.join(tmpDir, "archive");
    const dir = path.join(archiveDir, "with-comments");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "results-review.user.md"),
      [
        "# Results Review",
        "",
        "## New Idea Candidates",
        "<!-- Scan categories:",
        "  1. New standing data source — external feed",
        "  2. New skill — recurring workflow",
        "-->",
        "- New standing data source — None.",
        "- New skill — None.",
        "",
      ].join("\n"),
      "utf-8",
    );

    const ideas = [{ title: "Unrelated idea" }];
    const result = scanArchiveForRecurrences(archiveDir, ideas);
    const key = deriveRecurrenceKey("Unrelated idea");
    // Only 1 from current, nothing from archive (comment items + None items all filtered)
    expect(result.get(key)!.count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Routing edge cases
// ---------------------------------------------------------------------------
describe("applyRoutingDecisionTree edge cases", () => {
  it("returns defer for access_gap regardless of count", () => {
    expect(applyRoutingDecisionTree("access_gap", 1)).toBe("defer");
    expect(applyRoutingDecisionTree("access_gap", 5)).toBe("defer");
    expect(applyRoutingDecisionTree("access_gap", 100)).toBe("defer");
  });

  it("returns defer for unclassified regardless of count", () => {
    expect(applyRoutingDecisionTree("unclassified", 1)).toBe("defer");
    expect(applyRoutingDecisionTree("unclassified", 5)).toBe("defer");
    expect(applyRoutingDecisionTree("unclassified", 100)).toBe("defer");
  });
});
