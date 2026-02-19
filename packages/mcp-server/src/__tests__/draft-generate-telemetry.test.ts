/** @jest-environment node */

import { readFile } from "fs/promises";

import { handleBriketteResourceRead } from "../resources/brikette-knowledge.js";
import { handleDraftGuideRead } from "../resources/draft-guide.js";
import { handleVoiceExamplesRead } from "../resources/voice-examples.js";
import { clearTemplateCache, handleDraftGenerateTool } from "../tools/draft-generate";
import { appendTelemetryEvent } from "../tools/gmail.js";

jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
}));

jest.mock("../resources/brikette-knowledge.js", () => ({
  handleBriketteResourceRead: jest.fn(async () => ({
    contents: [{ uri: "brikette://faq", mimeType: "application/json", text: JSON.stringify({ ok: true }) }],
  })),
}));

jest.mock("../resources/draft-guide.js", () => ({
  handleDraftGuideRead: jest.fn(async () => ({
    contents: [{ uri: "brikette://draft-guide", mimeType: "application/json", text: "{}" }],
  })),
}));

jest.mock("../resources/voice-examples.js", () => ({
  handleVoiceExamplesRead: jest.fn(async () => ({
    contents: [{ uri: "brikette://voice-examples", mimeType: "application/json", text: "{}" }],
  })),
}));

jest.mock("../tools/gmail.js", () => ({
  appendTelemetryEvent: jest.fn(),
}));

const readFileMock = readFile as jest.Mock;
const handleBriketteResourceReadMock = handleBriketteResourceRead as jest.Mock;
const handleDraftGuideReadMock = handleDraftGuideRead as jest.Mock;
const handleVoiceExamplesReadMock = handleVoiceExamplesRead as jest.Mock;
const appendTelemetryEventMock = appendTelemetryEvent as jest.Mock;

describe("draft_generate telemetry", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    clearTemplateCache();
    handleBriketteResourceReadMock.mockResolvedValue({
      contents: [{ uri: "brikette://faq", mimeType: "application/json", text: JSON.stringify({ ok: true }) }],
    });
    handleDraftGuideReadMock.mockResolvedValue({
      contents: [{ uri: "brikette://draft-guide", mimeType: "application/json", text: "{}" }],
    });
    handleVoiceExamplesReadMock.mockResolvedValue({
      contents: [{ uri: "brikette://voice-examples", mimeType: "application/json", text: "{}" }],
    });
  });

  it("TC-03-01: emits fallback telemetry with reason/classification when no template is selected", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Unrelated template",
          body: "This template should not match the question.",
          category: "transportation",
        },
      ]),
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        normalized_text: "Can I bring my surfboard to the rooftop pool?",
        language: "EN",
        intents: {
          questions: [{ text: "Can I bring my surfboard to the rooftop pool?" }],
          requests: [],
          confirmations: [],
        },
        agreement: {
          status: "none",
          confidence: 0,
          evidence_spans: [],
          requires_human_confirmation: false,
          detected_language: "EN",
          additional_content: false,
        },
        workflow_triggers: {
          booking_monitor: false,
          prepayment: false,
          terms_and_conditions: false,
        },
        scenario: {
          category: "faq",
          confidence: 0.8,
        },
      },
      subject: "Specific equipment question",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text) as { draft: { bodyPlain: string } };
    expect(payload.draft.bodyPlain).toContain(
      "Thanks for your email. We will review your request and respond shortly.",
    );
    expect(appendTelemetryEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event_key: "email_fallback_detected",
        source_path: "queue",
        reason: "template-selection-none",
        classification: "template_fallback",
      }),
    );
  });
});
