/** @jest-environment node */

/**
 * TASK-11: Tests for the draft_refine MCP tool (additive LLM refinement stage).
 *
 * TC-11-01: Successful refinement → refinement_applied: true, refinement_source: 'claude-cli'
 * TC-11-02: API failure → graceful fallback, original draft unchanged, refinement_applied: false
 * TC-11-03: Refined output passes draft_quality_check
 * TC-11-04: Governed runner command is documented in docs/testing-policy.md
 *
 * Run command:
 *   pnpm -w run test:governed -- jest -- --testPathPattern="draft-refine" --no-coverage
 */

import { readFileSync } from "node:fs";

import Anthropic from "@anthropic-ai/sdk";

import { handleDraftQualityTool } from "../tools/draft-quality-check";
import { handleDraftRefineTool } from "../tools/draft-refine";

// ---------------------------------------------------------------------------
// Mock @anthropic-ai/sdk — factory avoids hoisting issues
// ---------------------------------------------------------------------------

jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const MockAnthropic = Anthropic as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseResult<T>(result: { content: Array<{ text: string }> }): T {
  return JSON.parse(result.content[0].text) as T;
}

type RefinePayload = {
  draft: { bodyPlain: string; bodyHtml: string };
  refinement_applied: boolean;
  refinement_source: string;
};

type QualityPayload = {
  passed: boolean;
  failed_checks: string[];
  warnings: string[];
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

const BASE_DRAFT = {
  bodyPlain:
    "Dear guest, thank you for your message. Check-in is from 2:30pm. We look forward to welcoming you. Best regards, Hostel Brikette",
  bodyHtml:
    '<!DOCTYPE html><html><body><p>Dear guest, thank you for your message. Check-in is from 2:30pm. We look forward to welcoming you. Best regards, Hostel Brikette</p></body></html>',
};

const REFINED_BODY_TC01 =
  "Hi there! Thanks for reaching out. Great news — check-in starts at 2:30pm each day. If you happen to arrive earlier, you are welcome to drop your bags with us from 10:30am. We look forward to welcoming you to Hostel Brikette. Warm regards, the Brikette team.";

const REFINED_BODY_TC03 =
  "Dear Alice, thank you so much for reaching out to us at Hostel Brikette! We are excited to welcome you soon. Regarding check-in: our standard check-in time is from 2:30pm. If you arrive earlier, we offer complimentary luggage storage from 10:30am so you can start exploring the city right away. Should you have any other questions, please do not hesitate to ask. We look forward to seeing you very soon. Warm regards, the Brikette team.";

// ---------------------------------------------------------------------------
// TC-11-01: Successful refinement
// ---------------------------------------------------------------------------

describe("TASK-11: TC-11-01 Successful refinement", () => {
  beforeEach(() => {
    MockAnthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: "text", text: REFINED_BODY_TC01 }],
        }),
      },
    }));
  });

  afterEach(() => {
    MockAnthropic.mockReset();
  });

  it("TC-11-01 returns refinement_applied: true and refinement_source: claude-cli", async () => {
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: BASE_ACTION_PLAN,
      draft: BASE_DRAFT,
    });

    const payload = parseResult<RefinePayload>(
      result as { content: Array<{ text: string }> },
    );

    expect(payload.refinement_applied).toBe(true);
    expect(payload.refinement_source).toBe("claude-cli");
    expect(payload.draft.bodyPlain.length).toBeGreaterThan(0);
    // Original HTML is preserved (operator can regenerate if needed)
    expect(payload.draft.bodyHtml).toBe(BASE_DRAFT.bodyHtml);
  });
});

// ---------------------------------------------------------------------------
// TC-11-02: API failure fallback
// ---------------------------------------------------------------------------

describe("TASK-11: TC-11-02 API failure fallback", () => {
  beforeEach(() => {
    MockAnthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockRejectedValue(new Error("API unavailable")),
      },
    }));
  });

  afterEach(() => {
    MockAnthropic.mockReset();
  });

  it("TC-11-02 returns refinement_applied: false with original draft unchanged", async () => {
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: BASE_ACTION_PLAN,
      draft: BASE_DRAFT,
    });

    const payload = parseResult<RefinePayload>(
      result as { content: Array<{ text: string }> },
    );

    expect(payload.refinement_applied).toBe(false);
    expect(payload.refinement_source).toBe("none");
    expect(payload.draft.bodyPlain).toBe(BASE_DRAFT.bodyPlain);
    expect(payload.draft.bodyHtml).toBe(BASE_DRAFT.bodyHtml);
  });
});

// ---------------------------------------------------------------------------
// TC-11-03: Refined output passes draft_quality_check
// ---------------------------------------------------------------------------

describe("TASK-11: TC-11-03 Quality gate passes on refined draft", () => {
  beforeEach(() => {
    MockAnthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: "text", text: REFINED_BODY_TC03 }],
        }),
      },
    }));
  });

  afterEach(() => {
    MockAnthropic.mockReset();
  });

  it("TC-11-03 refined bodyPlain passes draft_quality_check", async () => {
    const refineResult = await handleDraftRefineTool("draft_refine", {
      actionPlan: BASE_ACTION_PLAN,
      draft: BASE_DRAFT,
    });

    const refined = parseResult<RefinePayload>(
      refineResult as { content: Array<{ text: string }> },
    );

    expect(refined.refinement_applied).toBe(true);

    const qualityResult = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: BASE_ACTION_PLAN,
      draft: {
        bodyPlain: refined.draft.bodyPlain,
        bodyHtml: `<!DOCTYPE html><html><body><p>${refined.draft.bodyPlain}</p></body></html>`,
      },
    });

    const quality = parseResult<QualityPayload>(
      qualityResult as { content: Array<{ text: string }> },
    );

    expect(quality.passed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// TC-11-04: Command contract documentation
// ---------------------------------------------------------------------------

describe("TASK-11: TC-11-04 Command contract documented", () => {
  it("TC-11-04 governed runner command is present in docs/testing-policy.md", () => {
    const policy = readFileSync("docs/testing-policy.md", "utf-8");
    expect(policy).toContain("draft-refine");
  });
});
