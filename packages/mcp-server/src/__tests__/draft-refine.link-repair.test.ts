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

describe("draft_refine deterministic link repair", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("repairs missing required link deterministically before baseline fallback", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async (_name: string, args: { draft: { bodyPlain: string } }) => {
        const hasLink = /https?:\/\/\S+/i.test(args.draft.bodyPlain);
        const hasSignature = /best regards|hostel brikette/i.test(args.draft.bodyPlain);
        const payload = hasLink && hasSignature
          ? { passed: true, failed_checks: [], warnings: [] }
          : {
              passed: false,
              failed_checks: [
                ...(hasLink ? [] : ["missing_required_link"]),
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
        intents: { questions: [{ text: "How do I check booking status?" }], requests: [] },
        scenario: { category: "booking-issues" },
        workflow_triggers: { booking_monitor: true },
      },
      draft_id: "link-repair-01",
      refinement_mode: "external",
      originalBodyPlain:
        "Track your booking here: https://hostelworld.com/booking/ABC123\n\nBest regards,\nHostel Brikette",
      refinedBodyPlain: "We can help check your booking status.",
    });

    const payload = parsePayload(result as { content: Array<{ text: string }> });
    expect(payload.refinement_applied).toBe(true);
    expect(payload.refinement_source).toBe("claude-cli");
    expect(payload.quality.passed).toBe(true);
    expect(payload.draft.bodyPlain).toContain("https://hostelworld.com/booking/ABC123");
    expect(payload.draft.bodyPlain).toContain("Best regards");
  });
});
