/** @jest-environment node */

import { readFile } from "fs/promises";

import { handleBriketteResourceRead } from "../resources/brikette-knowledge.js";
import { handleDraftGuideRead } from "../resources/draft-guide.js";
import { handleVoiceExamplesRead } from "../resources/voice-examples.js";
import { handleDraftGenerateTool } from "../tools/draft-generate";

jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
}));

jest.mock("../resources/brikette-knowledge.js", () => ({
  handleBriketteResourceRead: jest.fn(async (uri: string) => ({
    contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ ok: true }) }],
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

const readFileMock = readFile as jest.Mock;
const handleBriketteResourceReadMock = handleBriketteResourceRead as jest.Mock;
const handleDraftGuideReadMock = handleDraftGuideRead as jest.Mock;
const handleVoiceExamplesReadMock = handleVoiceExamplesRead as jest.Mock;

const baseActionPlan = {
  normalized_text: "Check-in time",
  language: "EN",
  intents: {
    questions: [{ text: "What time is check in?" }],
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
    booking_monitor: true,
    prepayment: false,
    terms_and_conditions: false,
  },
  scenario: {
    category: "faq",
    confidence: 0.8,
  },
};

describe("draft_generate tool", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    handleBriketteResourceReadMock.mockResolvedValue({
      contents: [
        {
          uri: "brikette://faq",
          mimeType: "application/json",
          text: JSON.stringify({ ok: true }),
        },
      ],
    });
    handleDraftGuideReadMock.mockResolvedValue({
      contents: [
        {
          uri: "brikette://draft-guide",
          mimeType: "application/json",
          text: "{}",
        },
      ],
    });
    handleVoiceExamplesReadMock.mockResolvedValue({
      contents: [
        {
          uri: "brikette://voice-examples",
          mimeType: "application/json",
          text: "{}",
        },
      ],
    });
  });

  it("TC-01/05: uses template ranker output and tracks answered questions", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Arriving before check-in time",
          body: "Check-in starts at 2:30 pm. Best regards, Hostel Brikette",
          category: "faq",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: baseActionPlan,
      subject: "Check-in time",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    expect(payload.template_used.subject).toBe("Arriving before check-in time");
    expect(payload.answered_questions).toEqual([
      "What time is check in?",
    ]);
  });

  it("TC-02/03/04: includes knowledge sources, HTML output, and quality results", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Arriving before check-in time",
          body: "Check-in starts at 2:30 pm. Best regards, Hostel Brikette",
          category: "faq",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: baseActionPlan,
      subject: "Check-in time",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    expect(payload.knowledge_sources.length).toBeGreaterThan(0);
    expect(payload.draft.bodyPlain.length).toBeGreaterThan(0);
    expect(payload.draft.bodyHtml).toContain("<!DOCTYPE html>");
    expect(payload.quality).toHaveProperty("passed");
  });
});
