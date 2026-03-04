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

const ACTION_PLAN = {
  language: "EN" as const,
  intents: {
    questions: [{ text: "What time is check-in and where can I view my booking?" }],
    requests: [],
  },
  scenario: { category: "booking-issues" },
  workflow_triggers: { booking_monitor: true },
};

describe("draft_refine deterministic repair matrix and idempotency", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("repairs combined failures and produces stable output on repeated runs", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async (_name: string, args: { draft: { bodyPlain: string } }) => {
        const body = args.draft.bodyPlain.toLowerCase();
        const failed_checks: string[] = [];
        if (!body.includes("2:30pm")) {
          failed_checks.push("unanswered_questions");
        }
        if (!/https?:\/\/\S+/.test(body)) {
          failed_checks.push("missing_required_link");
        }
        if (!/best regards|hostel brikette/.test(body)) {
          failed_checks.push("missing_signature");
        }
        if (
          body.includes("availability confirmed") ||
          body.includes("we will charge now")
        ) {
          failed_checks.push("prohibited_claims");
        }
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              passed: failed_checks.length === 0,
              failed_checks,
              warnings: [],
            }),
          }],
        };
      }),
    }));

    jest.doMock("../utils/signal-events.js", () => ({
      ...jest.requireActual("../utils/signal-events.js"),
      appendJsonlEvent: jest.fn(() => Promise.resolve()),
    }));

    const { handleDraftRefineTool } = await import("../tools/draft-refine");

    const originalBodyPlain =
      "Check-in is from 2:30pm. Track your booking at https://hostelworld.com/booking/ABC123.\n\nBest regards,\nHostel Brikette";
    const dirtyCandidate =
      "Availability confirmed. We will charge now. We can help with your booking.";

    const resultOne = await handleDraftRefineTool("draft_refine", {
      actionPlan: ACTION_PLAN,
      draft_id: "repair-matrix-01",
      refinement_mode: "external",
      originalBodyPlain,
      refinedBodyPlain: dirtyCandidate,
    });
    const payloadOne = parsePayload(resultOne as { content: Array<{ text: string }> });

    expect(payloadOne.refinement_applied).toBe(true);
    expect(payloadOne.refinement_source).toBe("claude-cli");
    expect(payloadOne.quality.passed).toBe(true);
    expect(payloadOne.draft.bodyPlain).toContain("2:30pm");
    expect(payloadOne.draft.bodyPlain).toContain("https://hostelworld.com/booking/ABC123");
    expect(payloadOne.draft.bodyPlain.toLowerCase()).not.toContain("availability confirmed");
    expect(payloadOne.draft.bodyPlain.toLowerCase()).not.toContain("we will charge now");
    expect(payloadOne.draft.bodyPlain).toMatch(/Best regards|Hostel Brikette/);

    const resultTwo = await handleDraftRefineTool("draft_refine", {
      actionPlan: ACTION_PLAN,
      draft_id: "repair-matrix-02",
      refinement_mode: "external",
      originalBodyPlain,
      refinedBodyPlain: dirtyCandidate,
    });
    const payloadTwo = parsePayload(resultTwo as { content: Array<{ text: string }> });

    expect(payloadTwo.quality.passed).toBe(true);
    expect(payloadTwo.draft.bodyPlain).toBe(payloadOne.draft.bodyPlain);
  });
});
