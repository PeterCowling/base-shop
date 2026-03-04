/** @jest-environment node */

type RefineResultPayload = {
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
    workflow_triggers: { booking_monitor: false },
  },
  draft_id: "test-draft-id-fail-closed",
  originalBodyPlain: "Check-in is from 2:30pm. Best regards, Hostel Brikette",
  refinedBodyPlain:
    "Dear guest, check-in is available from 2:30pm daily. Warm regards, Hostel Brikette",
};

function parsePayload(result: { content: Array<{ text: string }> }): RefineResultPayload {
  return JSON.parse(result.content[0].text) as RefineResultPayload;
}

describe("draft_refine quality gate hardening (fail-closed)", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("fails closed when draft_quality_check returns an error result", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async () => ({
        isError: true,
        content: [{ type: "text", text: "Error: synthetic quality failure" }],
      })),
    }));

    jest.doMock("../utils/signal-events.js", () => ({
      ...jest.requireActual("../utils/signal-events.js"),
      appendJsonlEvent: jest.fn(() => Promise.resolve()),
    }));

    const { handleDraftRefineTool } = await import("../tools/draft-refine");
    const result = await handleDraftRefineTool("draft_refine", BASE_ARGS);
    const payload = parsePayload(result as { content: Array<{ text: string }> });

    expect(payload.quality.passed).toBe(false);
    expect(payload.quality.failed_checks).toContain("quality_gate_error");
  });

  it("fails closed when draft_quality_check returns malformed payload", async () => {
    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async () => ({
        content: [{ type: "text", text: "not-json" }],
      })),
    }));

    jest.doMock("../utils/signal-events.js", () => ({
      ...jest.requireActual("../utils/signal-events.js"),
      appendJsonlEvent: jest.fn(() => Promise.resolve()),
    }));

    const { handleDraftRefineTool } = await import("../tools/draft-refine");
    const result = await handleDraftRefineTool("draft_refine", BASE_ARGS);
    const payload = parsePayload(result as { content: Array<{ text: string }> });

    expect(payload.quality.passed).toBe(false);
    expect(payload.quality.failed_checks).toContain("quality_gate_parse_error");
  });
});
