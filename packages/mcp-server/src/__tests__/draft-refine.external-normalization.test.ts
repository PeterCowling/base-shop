/** @jest-environment node */

type RefineResultPayload = {
  draft: {
    bodyPlain: string;
  };
  refinement_applied: boolean;
  refinement_source: "claude-cli" | "codex" | "none";
};

function parsePayload(result: { content: Array<{ text: string }> }): RefineResultPayload {
  return JSON.parse(result.content[0].text) as RefineResultPayload;
}

describe("draft_refine external deterministic normalization", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("normalizes external candidate text before parity evaluation", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async () => ({
        content: [{ type: "text", text: JSON.stringify({ passed: true, failed_checks: [], warnings: [] }) }],
      })),
    }));

    jest.doMock("../utils/signal-events.js", () => ({
      ...jest.requireActual("../utils/signal-events.js"),
      appendJsonlEvent: jest.fn(() => Promise.resolve()),
    }));

    const { handleDraftRefineTool } = await import("../tools/draft-refine");
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: {
        language: "EN",
        intents: { questions: [{ text: "What time is check-in?" }], requests: [] },
        scenario: { category: "faq" },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
      },
      draft_id: "external-normalization-01",
      refinement_mode: "external",
      originalBodyPlain: "Check-in is from 2:30pm. Best regards, Hostel Brikette",
      refinedBodyPlain: "Check-in is from 2:30pm.   \r\n\r\n\r\nBest regards,\r\nHostel Brikette   ",
    });

    const payload = parsePayload(result as { content: Array<{ text: string }> });
    expect(payload.refinement_applied).toBe(true);
    expect(payload.refinement_source).toBe("claude-cli");
    expect(payload.draft.bodyPlain).toBe("Check-in is from 2:30pm.\n\nBest regards,\nHostel Brikette");
  });
});
