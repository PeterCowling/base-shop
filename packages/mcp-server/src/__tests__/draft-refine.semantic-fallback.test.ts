/** @jest-environment node */

type RefineResultPayload = {
  draft: {
    bodyPlain: string;
  };
  refinement_applied: boolean;
  refinement_source: "claude-cli" | "codex" | "none";
  quality: {
    passed: boolean;
    failed_checks: string[];
  };
};

function parsePayload(result: { content: Array<{ text: string }> }): RefineResultPayload {
  return JSON.parse(result.content[0].text) as RefineResultPayload;
}

const BASE_ACTION_PLAN = {
  language: "EN" as const,
  intents: {
    questions: [{ text: "Can you confirm check-in details?" }],
    requests: [],
  },
  scenario: { category: "faq" },
  workflow_triggers: {
    booking_action_required: false,
    booking_context: false,
  },
};

describe("draft_refine semantic/policy fail-safe fallback", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("falls back to baseline when candidate fails with contradicts_thread", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async (_name: string, args: { draft: { bodyPlain: string } }) => {
        const isBaseline = args.draft.bodyPlain.includes("As committed");
        const payload = isBaseline
          ? { passed: true, failed_checks: [], warnings: [] }
          : { passed: false, failed_checks: ["contradicts_thread"], warnings: [] };
        return {
          content: [{ type: "text", text: JSON.stringify(payload) }],
        };
      }),
    }));

    jest.doMock("../utils/signal-events.js", () => ({
      ...jest.requireActual("../utils/signal-events.js"),
      appendJsonlEvent: jest.fn(() => Promise.resolve()),
    }));

    const { handleDraftRefineTool } = await import("../tools/draft-refine");
    const baselineBody = "As committed in our prior message, check-in opens at 2:30pm.\n\nBest regards,\nHostel Brikette";
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: BASE_ACTION_PLAN,
      draft_id: "semantic-fallback-contradiction",
      refinement_mode: "external",
      originalBodyPlain: baselineBody,
      refinedBodyPlain: "Actually, we cannot honor what we promised earlier.",
    });

    const payload = parsePayload(result as { content: Array<{ text: string }> });
    expect(payload.refinement_applied).toBe(false);
    expect(payload.refinement_source).toBe("none");
    expect(payload.quality.passed).toBe(true);
    expect(payload.draft.bodyPlain).toBe(baselineBody);
  });

  it("falls back to baseline when candidate fails with missing_policy_mandatory_content", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async (_name: string, args: { draft: { bodyPlain: string } }) => {
        const isBaseline = args.draft.bodyPlain.includes("per house policy");
        const payload = isBaseline
          ? { passed: true, failed_checks: [], warnings: [] }
          : {
              passed: false,
              failed_checks: ["missing_policy_mandatory_content"],
              warnings: [],
            };
        return {
          content: [{ type: "text", text: JSON.stringify(payload) }],
        };
      }),
    }));

    jest.doMock("../utils/signal-events.js", () => ({
      ...jest.requireActual("../utils/signal-events.js"),
      appendJsonlEvent: jest.fn(() => Promise.resolve()),
    }));

    const { handleDraftRefineTool } = await import("../tools/draft-refine");
    const baselineBody = "Late arrivals are accepted until midnight per house policy.\n\nBest regards,\nHostel Brikette";
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: BASE_ACTION_PLAN,
      draft_id: "semantic-fallback-policy",
      refinement_mode: "external",
      originalBodyPlain: baselineBody,
      refinedBodyPlain: "Late arrivals are fine.",
    });

    const payload = parsePayload(result as { content: Array<{ text: string }> });
    expect(payload.refinement_applied).toBe(false);
    expect(payload.refinement_source).toBe("none");
    expect(payload.quality.passed).toBe(true);
    expect(payload.draft.bodyPlain).toBe(baselineBody);
  });
});
