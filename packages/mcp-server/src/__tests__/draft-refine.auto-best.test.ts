/** @jest-environment node */

type RefineResultPayload = {
  draft: {
    bodyPlain: string;
  };
  refinement_source: "claude-cli" | "codex" | "none";
  quality: {
    passed: boolean;
    failed_checks: string[];
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
    workflow_triggers: { booking_monitor: false },
  },
  draft_id: "test-draft-id-auto-best",
  refinement_mode: "auto_best" as const,
  originalBodyPlain: "Check-in is from 2:30pm.",
  refinedBodyPlain: "Check-in is from 2:30pm. Best regards, Hostel Brikette",
};

function parsePayload(result: { content: Array<{ text: string }> }): RefineResultPayload {
  return JSON.parse(result.content[0].text) as RefineResultPayload;
}

describe("draft_refine auto_best mode", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("prefers deterministic candidate when quality is not worse", async () => {
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
    const result = await handleDraftRefineTool("draft_refine", BASE_ARGS);
    const payload = parsePayload(result as { content: Array<{ text: string }> });

    expect(payload.refinement_source).toBe("codex");
  });

  it("uses auto_best as the default mode", async () => {
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

    const { refinement_mode: _ignore, ...argsWithoutMode } = BASE_ARGS;
    const { handleDraftRefineTool } = await import("../tools/draft-refine");
    const result = await handleDraftRefineTool("draft_refine", argsWithoutMode);
    const payload = parsePayload(result as { content: Array<{ text: string }> });

    expect(payload.refinement_source).toBe("codex");
  });

  it("falls back to external candidate when deterministic quality is worse", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async (_name: string, args: { draft: { bodyPlain: string } }) => {
        const isDeterministic = args.draft.bodyPlain.includes("Best regards,");
        const payload = isDeterministic
          ? { passed: false, failed_checks: ["deterministic_fail"], warnings: [] }
          : { passed: true, failed_checks: [], warnings: [] };
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

    expect(payload.refinement_source).toBe("claude-cli");
    expect(payload.quality.passed).toBe(true);
  });

  it("falls back to baseline when selected auto_best candidate is worse than original", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async (_name: string, args: { draft: { bodyPlain: string } }) => {
        const isBaseline = args.draft.bodyPlain === BASE_ARGS.originalBodyPlain;
        const payload = isBaseline
          ? { passed: true, failed_checks: [], warnings: [] }
          : { passed: false, failed_checks: ["candidate_worse_than_baseline"], warnings: [] };
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

    expect(payload.refinement_source).toBe("none");
    expect(payload.quality.passed).toBe(true);
    expect(payload.draft.bodyPlain).toBe(BASE_ARGS.originalBodyPlain);
  });
});
