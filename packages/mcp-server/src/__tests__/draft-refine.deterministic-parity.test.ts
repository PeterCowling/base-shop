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
    warnings: string[];
  };
};

const BASE_ARGS = {
  actionPlan: {
    language: "EN" as const,
    intents: {
      questions: [{ text: "What time is check-in?" }],
      requests: [],
    },
    scenario: { category: "faq" },
    workflow_triggers: {
      booking_action_required: false,
      booking_context: false,
    },
  },
  draft_id: "test-draft-id-deterministic-parity",
  refinement_mode: "deterministic_only" as const,
  originalBodyPlain: "Check-in is from 2:30pm.",
};

function parsePayload(result: { content: Array<{ text: string }> }): RefineResultPayload {
  return JSON.parse(result.content[0].text) as RefineResultPayload;
}

describe("draft_refine deterministic parity guard", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("falls back to baseline output when deterministic candidate quality is worse", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async (_name: string, args: { draft: { bodyPlain: string } }) => {
        const isDeterministicCandidate = args.draft.bodyPlain.includes("Best regards");
        const payload = isDeterministicCandidate
          ? {
              passed: false,
              failed_checks: ["synthetic_parity_fail"],
              warnings: [],
            }
          : {
              passed: true,
              failed_checks: [],
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
    const result = await handleDraftRefineTool("draft_refine", BASE_ARGS);
    const payload = parsePayload(result as { content: Array<{ text: string }> });

    expect(payload.refinement_applied).toBe(false);
    expect(payload.refinement_source).toBe("none");
    expect(payload.quality.passed).toBe(true);
    expect(payload.draft.bodyPlain).toBe(BASE_ARGS.originalBodyPlain);
  });
});
