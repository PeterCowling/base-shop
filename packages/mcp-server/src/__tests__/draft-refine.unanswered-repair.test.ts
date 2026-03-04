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

describe("draft_refine deterministic unanswered-question repair", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("repairs unanswered questions from baseline answer content before fallback", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async (_name: string, args: { draft: { bodyPlain: string } }) => {
        const hasAnswer = args.draft.bodyPlain.includes("2:30pm");
        const hasSignature = /best regards|hostel brikette/i.test(args.draft.bodyPlain);
        const payload = hasAnswer && hasSignature
          ? { passed: true, failed_checks: [], warnings: [] }
          : {
              passed: false,
              failed_checks: [
                ...(hasAnswer ? [] : ["unanswered_questions"]),
                ...(hasSignature ? [] : ["missing_signature"]),
              ],
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
    const result = await handleDraftRefineTool("draft_refine", {
      actionPlan: {
        language: "EN",
        intents: { questions: [{ text: "What time is check-in?" }], requests: [] },
        scenario: { category: "faq" },
        workflow_triggers: { booking_monitor: false },
      },
      draft_id: "unanswered-repair-01",
      refinement_mode: "external",
      originalBodyPlain:
        "Check-in is from 2:30pm every day.\n\nBest regards,\nHostel Brikette",
      refinedBodyPlain:
        "Thanks for your message. We are happy to help.\n\nBest regards,\nHostel Brikette",
    });

    const payload = parsePayload(result as { content: Array<{ text: string }> });
    expect(payload.refinement_applied).toBe(true);
    expect(payload.refinement_source).toBe("claude-cli");
    expect(payload.quality.passed).toBe(true);
    expect(payload.draft.bodyPlain).toContain("2:30pm");
  });
});
