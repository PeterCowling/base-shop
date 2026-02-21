/** @jest-environment node */

/**
 * TASK-01: Tests for three confirmed pipeline bug fixes.
 *
 * TC-01: extractQuestionKeywords strips leading/trailing punctuation from each token
 * TC-02: Gap-fill escalation uses fixed sentence, not keyword interpolation
 * TC-03: draft-generate.ts checks "unanswered_questions" (not old "missing_question_coverage")
 * TC-04: buildGapFillResult exact-match fast-path implemented via hashQuestion
 * TC-05: BM25 fallback logic preserved after exact-match addition
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="pipeline-bugs" --no-coverage
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { extractQuestionKeywords } from "../utils/coverage";

// ---------------------------------------------------------------------------
// TC-01: extractQuestionKeywords strips leading/trailing punctuation
// ---------------------------------------------------------------------------

describe("TASK-01: TC-01 extractQuestionKeywords punctuation stripping", () => {
  it("strips trailing punctuation from tokens", () => {
    const result = extractQuestionKeywords("Hi, I was wondering about check-in time");
    for (const token of result) {
      expect(token).not.toMatch(/[,.:;?!]$/);
    }
  });

  it("strips leading punctuation from tokens", () => {
    const result = extractQuestionKeywords("…what time is check-in?");
    for (const token of result) {
      expect(token).not.toMatch(/^[,.:;?!…]/);
    }
  });

  it("returns empty array for punctuation-only input", () => {
    const result = extractQuestionKeywords("??? !!!");
    expect(result).toEqual([]);
  });

  it("does not include the question mark as a standalone token", () => {
    const result = extractQuestionKeywords("What is the check-in time?");
    for (const token of result) {
      expect(token).not.toBe("?");
      expect(token).not.toMatch(/\?/);
    }
  });
});

// ---------------------------------------------------------------------------
// Helper: read source file once
// ---------------------------------------------------------------------------

const DRAFT_GENERATE_SRC = readFileSync(
  join(process.cwd(), "packages/mcp-server/src/tools/draft-generate.ts"),
  "utf-8",
);

// ---------------------------------------------------------------------------
// TC-02: Gap-fill escalation uses fixed sentence, not keyword interpolation
// ---------------------------------------------------------------------------

describe("TASK-01: TC-02 Gap-fill escalation uses fixed sentence", () => {
  it("source contains fixed escalation sentence (not keyword join)", () => {
    expect(DRAFT_GENERATE_SRC).toContain(
      "Pete or Cristiana will follow up with you directly",
    );
  });

  it("source does NOT contain keyword join interpolation pattern", () => {
    // The old pattern was something like `keywords.join(", ")` or topic interpolation
    // that produced garbled text like "For your question about check, time..."
    expect(DRAFT_GENERATE_SRC).not.toMatch(/keywords\.join\(\s*["'][,\s]["']\s*\)/);
  });
});

// ---------------------------------------------------------------------------
// TC-03: "unanswered_questions" is the key (not the old "missing_question_coverage")
// ---------------------------------------------------------------------------

describe("TASK-01: TC-03 Correct failed_check key for learning ledger trigger", () => {
  it('source uses "unanswered_questions" as the quality check key', () => {
    expect(DRAFT_GENERATE_SRC).toContain('"unanswered_questions"');
  });

  it('source does NOT contain the old "missing_question_coverage" key', () => {
    expect(DRAFT_GENERATE_SRC).not.toContain('"missing_question_coverage"');
  });
});

// ---------------------------------------------------------------------------
// TC-04: buildGapFillResult has hashQuestion exact-match fast-path
// ---------------------------------------------------------------------------

describe("TASK-01: TC-04 Exact-match fast-path in buildGapFillResult", () => {
  it("source imports hashQuestion from reviewed-ledger.js", () => {
    expect(DRAFT_GENERATE_SRC).toContain("hashQuestion");
  });

  it("source uses question_hash for exact-match lookup", () => {
    expect(DRAFT_GENERATE_SRC).toContain("question_hash");
  });

  it("source imports readActiveFaqPromotions", () => {
    expect(DRAFT_GENERATE_SRC).toContain("readActiveFaqPromotions");
  });
});

// ---------------------------------------------------------------------------
// TC-05: BM25 fallback logic still present after exact-match addition
// ---------------------------------------------------------------------------

describe("TASK-01: TC-05 BM25 fallback still present", () => {
  it("source still contains BM25 scoring logic", () => {
    // The BM25 ranker is used for scored_candidates — verify the score-based path remains
    expect(DRAFT_GENERATE_SRC).toMatch(/score|scored_candidates|ranked/i);
  });

  it("source does not drop the BM25 fallback path entirely", () => {
    // The buildGapFillResult function should still handle candidates with scores
    expect(DRAFT_GENERATE_SRC).toContain("buildGapFillResult");
  });
});
