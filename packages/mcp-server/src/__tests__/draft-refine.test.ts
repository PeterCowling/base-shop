/** @jest-environment node */

/**
 * TASK-11 v2: Tests for the reworked draft_refine MCP tool (attestation pattern).
 *
 * Claude (CLI) performs the refinement and submits refinedBodyPlain.
 * draft_refine validates quality, attests, and derives bodyHtml — no API calls.
 *
 * TC-01-01: valid refinement (text changed, quality passes) → refinement_applied: true,
 *           refinement_source: 'claude-cli', quality.passed: true, bodyHtml has DOCTYPE
 * TC-01-02: identity check (refinedBodyPlain === originalBodyPlain) → refinement_applied: false
 * TC-01-03: quality failure (adversarial text) → refinement_applied: true, quality.passed: false
 * TC-01-04: old-schema payload (draft field, no refinedBodyPlain) → errorResult migration message
 * TC-01-05: missing refinedBodyPlain (Zod fail) → errorResult
 * TC-01-06: no @anthropic-ai/sdk import in draft-refine.ts source
 * TC-01-07: typecheck + lint — run separately via pnpm --filter @acme/mcp-server
 * TC-01-08: governed runner — this file passing is the contract
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="draft-refine" --no-coverage
 */

import { readFileSync } from "node:fs";

import { handleDraftRefineTool } from "../tools/draft-refine";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseResult<T>(result: { content: Array<{ text: string }> }): T {
  return JSON.parse(result.content[0].text) as T;
}

function isErrorResult(result: unknown): boolean {
  return (
    typeof result === "object" &&
    result !== null &&
    "isError" in result &&
    (result as { isError: boolean }).isError === true
  );
}

function errorText(result: { content: Array<{ text: string }> }): string {
  return result.content[0].text;
}

type RefinePayload = {
  draft: { bodyPlain: string; bodyHtml: string };
  refinement_applied: boolean;
  refinement_source: string;
  quality: { passed: boolean; failed_checks: string[]; warnings: string[] };
};

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const BASE_ACTION_PLAN = {
  language: "EN" as const,
  intents: {
    questions: [{ text: "What time is check-in?" }],
    requests: [],
  },
  scenario: { category: "faq" },
  workflow_triggers: { booking_monitor: false },
};

const ORIGINAL_BODY =
  "Check-in is from 2:30pm. Best regards, Hostel Brikette";

// Quality-passing refined text: covers the question, has signature, no prohibited claims
const REFINED_BODY_PASS =
  "Dear guest, thank you for reaching out to Hostel Brikette. Check-in is available from 2:30pm each day. If you plan to arrive earlier we are happy to offer complimentary luggage storage from 10:30am. We look forward to welcoming you very soon. Warm regards, the Brikette team.";

// Adversarial: contains prohibited claim
const REFINED_BODY_FAIL =
  "Availability confirmed for your dates. We look forward to hosting you. Best regards, Hostel Brikette";

// ---------------------------------------------------------------------------
// TC-01-01: Successful refinement
// ---------------------------------------------------------------------------

describe("TASK-11 v2: TC-01-01 Successful refinement", () => {
  it("returns refinement_applied: true, claude-cli, quality.passed: true, DOCTYPE html", async () => {
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: BASE_ACTION_PLAN,
      originalBodyPlain: ORIGINAL_BODY,
      refinedBodyPlain: REFINED_BODY_PASS,
    });

    const payload = parseResult<RefinePayload>(
      result as { content: Array<{ text: string }> },
    );

    expect(payload.refinement_applied).toBe(true);
    expect(payload.refinement_source).toBe("claude-cli");
    expect(payload.quality.passed).toBe(true);
    expect(payload.draft.bodyPlain).toBe(REFINED_BODY_PASS);
    expect(payload.draft.bodyHtml).toContain("<!DOCTYPE html>");
  });
});

// ---------------------------------------------------------------------------
// TC-01-02: Identity check — no-op refinement
// ---------------------------------------------------------------------------

describe("TASK-11 v2: TC-01-02 Identity check (no-op)", () => {
  it("returns refinement_applied: false when refinedBodyPlain equals originalBodyPlain", async () => {
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: BASE_ACTION_PLAN,
      originalBodyPlain: ORIGINAL_BODY,
      refinedBodyPlain: ORIGINAL_BODY, // same text
    });

    const payload = parseResult<RefinePayload>(
      result as { content: Array<{ text: string }> },
    );

    expect(payload.refinement_applied).toBe(false);
    expect(payload.refinement_source).toBe("none");
    expect(payload.draft.bodyPlain).toBe(ORIGINAL_BODY);
  });
});

// ---------------------------------------------------------------------------
// TC-01-03: Quality failure — adversarial refined text
// ---------------------------------------------------------------------------

describe("TASK-11 v2: TC-01-03 Quality failure (adversarial text)", () => {
  it("returns refinement_applied: true with quality.passed: false and named failed_checks", async () => {
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: BASE_ACTION_PLAN,
      originalBodyPlain: ORIGINAL_BODY,
      refinedBodyPlain: REFINED_BODY_FAIL,
    });

    const payload = parseResult<RefinePayload>(
      result as { content: Array<{ text: string }> },
    );

    // Refinement was applied (Claude submitted it) even though quality failed
    expect(payload.refinement_applied).toBe(true);
    expect(payload.quality.passed).toBe(false);
    expect(payload.quality.failed_checks.length).toBeGreaterThan(0);
    for (const check of payload.quality.failed_checks) {
      expect(check).toMatch(/^[a-z][a-z_]+$/);
    }
  });
});

// ---------------------------------------------------------------------------
// TC-01-04: Old-schema guard
// ---------------------------------------------------------------------------

describe("TASK-11 v2: TC-01-04 Old-schema guard", () => {
  it("returns errorResult with migration message when draft field is present and refinedBodyPlain is absent", async () => {
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: BASE_ACTION_PLAN,
      // old v1 schema shape
      draft: { bodyPlain: ORIGINAL_BODY, bodyHtml: "<p>old</p>" },
    });

    expect(isErrorResult(result)).toBe(true);
    const text = errorText(result as { content: Array<{ text: string }> });
    expect(text).toContain("originalBodyPlain");
    expect(text).toContain("refinedBodyPlain");
  });
});

// ---------------------------------------------------------------------------
// TC-01-05: Missing refinedBodyPlain (Zod parse fail)
// ---------------------------------------------------------------------------

describe("TASK-11 v2: TC-01-05 Missing refinedBodyPlain", () => {
  it("returns errorResult when refinedBodyPlain is absent", async () => {
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: BASE_ACTION_PLAN,
      originalBodyPlain: ORIGINAL_BODY,
      // refinedBodyPlain omitted
    });

    expect(isErrorResult(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-01-06: No @anthropic-ai/sdk import in draft-refine.ts
// ---------------------------------------------------------------------------

describe("TASK-11 v2: TC-01-06 No SDK import in source", () => {
  it("draft-refine.ts source does not import @anthropic-ai/sdk", () => {
    const source = readFileSync(
      "packages/mcp-server/src/tools/draft-refine.ts",
      "utf-8",
    );
    expect(source).not.toContain("@anthropic-ai/sdk");
  });
});
