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

describe("draft_refine deterministic signature repair", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("repairs missing signature deterministically before parity fallback", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async (_name: string, args: { draft: { bodyPlain: string } }) => {
        const hasSignature = /best regards|hostel brikette/i.test(args.draft.bodyPlain);
        const payload = hasSignature
          ? { passed: true, failed_checks: [], warnings: [] }
          : { passed: false, failed_checks: ["missing_signature"], warnings: [] };
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
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
      },
      draft_id: "signature-repair-01",
      refinement_mode: "external",
      originalBodyPlain: "Check-in is from 2:30pm. Best regards, Hostel Brikette",
      refinedBodyPlain: "Check-in is from 2:30pm.",
    });

    const payload = parsePayload(result as { content: Array<{ text: string }> });
    expect(payload.refinement_applied).toBe(true);
    expect(payload.refinement_source).toBe("claude-cli");
    expect(payload.quality.passed).toBe(true);
    expect(payload.draft.bodyPlain).toContain("Best regards");
  });
});
