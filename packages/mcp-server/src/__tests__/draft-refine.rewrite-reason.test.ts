/** @jest-environment node */

describe("draft_refine deterministic rewrite_reason inference", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("infers rewrite_reason when caller provides none", async () => {
    const appendJsonlEventMock = jest.fn(() => Promise.resolve());

    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async () => ({
        content: [{ type: "text", text: JSON.stringify({ passed: true, failed_checks: [], warnings: [] }) }],
      })),
    }));

    jest.doMock("../utils/signal-events.js", () => ({
      ...jest.requireActual("../utils/signal-events.js"),
      appendJsonlEvent: appendJsonlEventMock,
    }));

    const { handleDraftRefineTool } = await import("../tools/draft-refine");
    await handleDraftRefineTool("draft_refine", {
      actionPlan: {
        language: "EN",
        intents: { questions: [{ text: "What time is check-in?" }], requests: [] },
        scenario: { category: "faq" },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
      },
      draft_id: "rewrite-reason-infer",
      refinement_mode: "external",
      rewrite_reason: "none",
      originalBodyPlain: "Check-in is from 2:30pm. Best regards, Hostel Brikette",
      refinedBodyPlain: "Check-in starts at 2:30pm daily. Best regards, Hostel Brikette",
    });

    expect(appendJsonlEventMock).toHaveBeenCalled();
    const emitted = appendJsonlEventMock.mock.calls[0][1] as { rewrite_reason: string };
    expect(emitted.rewrite_reason).not.toBe("none");
  });

  it("preserves explicit caller rewrite_reason", async () => {
    const appendJsonlEventMock = jest.fn(() => Promise.resolve());

    jest.doMock("../tools/draft-quality-check.js", () => ({
      __esModule: true,
      handleDraftQualityTool: jest.fn(async () => ({
        content: [{ type: "text", text: JSON.stringify({ passed: true, failed_checks: [], warnings: [] }) }],
      })),
    }));

    jest.doMock("../utils/signal-events.js", () => ({
      ...jest.requireActual("../utils/signal-events.js"),
      appendJsonlEvent: appendJsonlEventMock,
    }));

    const { handleDraftRefineTool } = await import("../tools/draft-refine");
    await handleDraftRefineTool("draft_refine", {
      actionPlan: {
        language: "EN",
        intents: { questions: [{ text: "What time is check-in?" }], requests: [] },
        scenario: { category: "faq" },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
      },
      draft_id: "rewrite-reason-preserve",
      refinement_mode: "external",
      rewrite_reason: "style",
      originalBodyPlain: "Check-in is from 2:30pm. Best regards, Hostel Brikette",
      refinedBodyPlain: "Check-in starts at 2:30pm daily. Best regards, Hostel Brikette",
    });

    expect(appendJsonlEventMock).toHaveBeenCalled();
    const emitted = appendJsonlEventMock.mock.calls[0][1] as { rewrite_reason: string };
    expect(emitted.rewrite_reason).toBe("style");
  });
});
