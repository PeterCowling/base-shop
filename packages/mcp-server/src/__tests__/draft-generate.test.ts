/** @jest-environment node */

import { readFile } from "fs/promises";

import { handleBriketteResourceRead } from "../resources/brikette-knowledge.js";
import { handleDraftGuideRead } from "../resources/draft-guide.js";
import { handleVoiceExamplesRead } from "../resources/voice-examples.js";
import { clearTemplateCache, handleDraftGenerateTool } from "../tools/draft-generate";

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

const draftGuideFixture = {
  length_calibration: {
    faq: { min_words: 50, max_words: 100 },
    policy: { min_words: 100, max_words: 150 },
    cancellation: { min_words: 80, max_words: 140 },
    general: { min_words: 80, max_words: 140 },
  },
  content_rules: {
    always: [
      "Answer every guest question directly.",
      "Confirm what you can and link to the website for live availability.",
      "Keep tone professional and warm.",
    ],
    if: [
      "If policy questions, cite policy summary and link to policies.",
      "If cancellation, explain policy and required actions.",
    ],
    never: [
      "Never confirm availability.",
      "Never state that a card will be charged immediately.",
      "Never include internal notes or instructions.",
    ],
  },
  tone_triggers: {
    faq: "Friendly and concise",
    policy: "Clear and precise",
    cancellation: "Direct but respectful",
  },
};

const voiceExamplesFixture = {
  scenarios: {
    faq: {
      tone: "Friendly and concise",
      bad_examples: ["Availability is confirmed for your dates."],
      phrases_to_avoid: ["Availability is confirmed", "We will charge now"],
      preferred_phrases: ["Please check live availability on our website", "Happy to help"],
    },
    policy: {
      tone: "Clear and precise",
      bad_examples: ["Rules are rules and there's nothing we can do."],
      phrases_to_avoid: ["Nothing we can do"],
      preferred_phrases: ["Per our policy", "Please note"],
    },
    cancellation: {
      tone: "Direct but respectful",
      bad_examples: ["We don't do refunds."],
      phrases_to_avoid: ["We don't do refunds"],
      preferred_phrases: ["Per the cancellation policy", "Let us know if we can help"],
    },
  },
  global_phrases_to_avoid: ["Availability confirmed", "We will charge now", "Internal note"],
};

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

function setupDraftGenerateMocks(): void {
  jest.resetAllMocks();
  clearTemplateCache();
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
        text: JSON.stringify(draftGuideFixture),
      },
    ],
  });
  handleVoiceExamplesReadMock.mockResolvedValue({
    contents: [
      {
        uri: "brikette://voice-examples",
        mimeType: "application/json",
        text: JSON.stringify(voiceExamplesFixture),
      },
    ],
  });
}

describe("draft_generate tool", () => {
  beforeEach(setupDraftGenerateMocks);

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

  it("TC-05: single-question email uses single template (no composite)", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Breakfast — Eligibility and Hours",
          body: "Dear Guest,\r\n\r\nThank you for your question about breakfast.\r\n\r\nBreakfast is served daily from 8:00 AM to 10:30 AM.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "breakfast",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Is breakfast included?",
        intents: {
          questions: [{ text: "Is breakfast included?" }],
          requests: [],
          confirmations: [],
        },
      },
      subject: "Breakfast question",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    expect(payload.composite).toBe(false);
  });

  it("TC-06: multi-topic email produces composite body from multiple templates", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Breakfast — Eligibility and Hours",
          body: "Dear Guest,\r\n\r\nThank you for your question about breakfast.\r\n\r\nBreakfast is served daily from 8:00 AM to 10:30 AM.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "breakfast",
        },
        {
          subject: "Luggage Storage — Before Check-in",
          body: "Dear Guest,\r\n\r\nThank you for your email.\r\n\r\nYes, we offer free luggage storage on your arrival day.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "luggage",
        },
        {
          subject: "WiFi Information",
          body: "Dear Guest,\r\n\r\nThank you for your question.\r\n\r\nComplimentary WiFi is available throughout the hostel.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "wifi",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Is breakfast included? Can we store luggage? Do you have WiFi?",
        intents: {
          questions: [
            { text: "Is breakfast included?" },
            { text: "Can we store luggage?" },
            { text: "Do you have WiFi?" },
          ],
          requests: [],
          confirmations: [],
        },
      },
      subject: "Questions about our stay",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    expect(payload.composite).toBe(true);
    // Body should contain content from multiple templates
    const body = payload.draft.bodyPlain.toLowerCase();
    expect(body).toContain("breakfast");
    expect(body).toContain("luggage");
    expect(body).toContain("wifi");
  });

  it("TC-07: composite body has exactly one signature", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Breakfast — Eligibility and Hours",
          body: "Dear Guest,\r\n\r\nBreakfast is served daily.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "breakfast",
        },
        {
          subject: "WiFi Information",
          body: "Dear Guest,\r\n\r\nComplimentary WiFi is available.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "wifi",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Is breakfast included? Do you have WiFi?",
        intents: {
          questions: [
            { text: "Is breakfast included?" },
            { text: "Do you have WiFi?" },
          ],
          requests: [],
          confirmations: [],
        },
      },
      subject: "Questions",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    const body = payload.draft.bodyPlain;
    // Count occurrences of "regards" — should appear exactly once (at end)
    const regardsMatches = body.toLowerCase().match(/regards/g) || [];
    expect(regardsMatches.length).toBe(1);
  });

  it("TC-08: availability intent prefers booking-issues availability template", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Arriving before check-in time",
          body: "Dear Guest,\r\n\r\nCheck-in starts at 2:30 pm.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "faq",
        },
        {
          subject: "Booking inquiry and live availability",
          body: "Dear Guest,\r\n\r\nThank you for your message. Please check live availability on our website for current options and rates.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "booking-issues",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Hello, do you have availability from March 13 to March 19?",
        intents: {
          questions: [{ text: "Do you have availability from March 13 to March 19?" }],
          requests: [],
          confirmations: [],
        },
        scenario: {
          category: "faq",
          confidence: 0.6,
        },
      },
      subject: "Visiting your city for a quiet family stay",
      recipientName: "Dedra",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    expect(payload.template_used.subject).toBe("Booking inquiry and live availability");
    expect(payload.template_used.category).toBe("booking-issues");
    expect(payload.draft.bodyPlain).toContain("Dear Dedra,");
    expect(payload.draft.bodyPlain).not.toContain("Check-in starts at 2:30 pm");
  });

  it("TC-09: truncation avoids dangling promotional fragments", async () => {
    handleDraftGuideReadMock.mockResolvedValue({
      contents: [
        {
          uri: "brikette://draft-guide",
          mimeType: "application/json",
          text: JSON.stringify({
            ...draftGuideFixture,
            length_calibration: {
              ...draftGuideFixture.length_calibration,
              faq: { min_words: 10, max_words: 18 },
            },
          }),
        },
      ],
    });

    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Booking inquiry and live availability",
          body: "Dear Guest,\r\n\r\nThank you for your email. Please check live availability on our website for current options. We can assist with next steps after you review dates.\r\n\r\n*Amenities Available Before check-in include luggage storage and lounge access when space allows and staff are available.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "faq",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Can you confirm options?",
        intents: {
          questions: [{ text: "Can you confirm options?" }],
          requests: [],
          confirmations: [],
        },
      },
      subject: "Question",
      recipientName: "Dedra",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    expect(payload.draft.bodyPlain).not.toContain("*Amenities Available Before");
    expect(payload.draft.bodyPlain).not.toMatch(/[\s,:;*_-]+\n\nBest regards,/);
  });
});

describe("draft_generate tool TASK-01", () => {
  beforeEach(setupDraftGenerateMocks);

  it("TASK-01 TC-01: faq generation respects guide length calibration", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Check-in times",
          body: "Check-in starts at 2:30 pm.",
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
    const wordCount = payload.draft.bodyPlain.trim().split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeGreaterThanOrEqual(50);
    expect(wordCount).toBeLessThanOrEqual(100);
  });

  it("TASK-01 TC-02: cancellation generation uses preferred phrases and avoids bad phrases", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Cancellation request",
          body: "We don't do refunds. Availability is confirmed for your dates.",
          category: "cancellation",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        scenario: {
          category: "cancellation",
          confidence: 0.9,
        },
      },
      subject: "Cancel booking",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    const body = payload.draft.bodyPlain.toLowerCase();
    expect(body).toContain("per the cancellation policy");
    expect(body).not.toContain("we don't do refunds");
    expect(body).not.toContain("availability is confirmed for your dates");
  });

  it("TASK-01 TC-03: policy generation enforces always-rules guidance", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Policy clarification",
          body: "Please note: pets are not allowed.",
          category: "policy",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        intents: {
          questions: [{ text: "Can I bring my pet?" }],
          requests: [],
          confirmations: [],
        },
        scenario: {
          category: "policy",
          confidence: 0.9,
        },
      },
      subject: "Pet policy",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    const body = payload.draft.bodyPlain.toLowerCase();
    expect(body).toContain("please check live availability on our website");
    expect(body).toContain("answered each of your questions");
    expect(body).toContain("happy to help");
  });

  it("TASK-01 TC-04: generation respects never-rules guardrails", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Booking options",
          body: "Availability is confirmed. We will charge now. Internal note: ask manager.",
          category: "faq",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: baseActionPlan,
      subject: "Availability",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    const body = payload.draft.bodyPlain.toLowerCase();
    expect(body).not.toContain("availability is confirmed");
    expect(body).not.toContain("we will charge");
    expect(body).not.toContain("internal note");
  });
});

describe("draft_generate tool TASK-02", () => {
  beforeEach(setupDraftGenerateMocks);

  it("TASK-02 TC-01: FAQ summaries include cited snippets instead of count placeholders", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Check-in time",
          body: "Check-in starts at 3:00 PM.",
          category: "faq",
        },
      ])
    );
    handleBriketteResourceReadMock.mockImplementation(async (uri: string) => {
      if (uri === "brikette://faq") {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({
                items: [
                  {
                    id: "check-in-window",
                    question: "What time is check-in?",
                    answer: "Check-in is from 15:00 until 22:30 at reception.",
                  },
                  {
                    id: "breakfast-window",
                    question: "When is breakfast served?",
                    answer: "Breakfast is served from 08:00 until 10:30.",
                  },
                ],
              }),
            },
          ],
        };
      }
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({}) }],
      };
    });

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: baseActionPlan,
      subject: "Check-in time",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    const faqSummary = payload.knowledge_summaries.find(
      (entry: { uri: string; summary: string }) => entry.uri === "brikette://faq"
    );
    expect(faqSummary).toBeDefined();
    expect(faqSummary.summary).toContain("[faq:check-in-window]");
    expect(faqSummary.summary).toContain("Check-in is from 15:00 until 22:30");
    expect(faqSummary.summary).not.toContain("items:");
  });

  it("TASK-02 TC-02: cancellation summaries favor policy snippets over unrelated FAQ content", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Cancellation policy",
          body: "Please review cancellation terms.",
          category: "cancellation",
        },
      ])
    );
    handleBriketteResourceReadMock.mockImplementation(async (uri: string) => {
      if (uri === "brikette://policies") {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({
                summary: {
                  cancellation: "Non-refundable bookings are not eligible for refunds.",
                  checkIn: { regular: "15:00 - 22:30" },
                },
                faqItems: [
                  {
                    id: "cancel-terms",
                    question: "Can I cancel my booking?",
                    answer: "If non-refundable, cancellation does not include a refund.",
                  },
                  {
                    id: "breakfast-info",
                    question: "Is breakfast included?",
                    answer: "Breakfast is served from 08:00 to 10:30.",
                  },
                ],
              }),
            },
          ],
        };
      }
      if (uri === "brikette://faq") {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({
                items: [
                  {
                    id: "breakfast-info",
                    question: "Is breakfast included?",
                    answer: "Breakfast is served from 08:00 to 10:30.",
                  },
                ],
              }),
            },
          ],
        };
      }
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({}) }],
      };
    });

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "I want to cancel and request a refund.",
        intents: {
          questions: [{ text: "Can I cancel and get a refund?" }],
          requests: [{ text: "Please cancel my reservation." }],
          confirmations: [],
        },
        scenario: {
          category: "cancellation",
          confidence: 0.92,
        },
      },
      subject: "Cancellation and refund request",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    const policySummary = payload.knowledge_summaries.find(
      (entry: { uri: string; summary: string }) => entry.uri === "brikette://policies"
    );
    expect(policySummary).toBeDefined();
    expect(policySummary.summary.toLowerCase()).toContain("non-refundable bookings");
    expect(policySummary.summary).toContain("[policies:faq:cancel-terms]");
    expect(policySummary.summary.toLowerCase()).not.toContain("breakfast is served");
  });

  it("TASK-02 TC-03: each resource summary is capped at 500 words", async () => {
    const longAnswer = `Cancellation policy details ${"non-refundable bookings remain subject to terms ".repeat(220)}`;
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Cancellation policy",
          body: "Please review cancellation terms.",
          category: "cancellation",
        },
      ])
    );
    handleBriketteResourceReadMock.mockImplementation(async (uri: string) => {
      if (uri === "brikette://faq") {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({
                items: [
                  {
                    id: "long-cancellation-policy",
                    question: "Can I cancel and get a refund?",
                    answer: longAnswer,
                  },
                ],
              }),
            },
          ],
        };
      }
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({}) }],
      };
    });

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "I want to cancel and request a refund.",
        intents: {
          questions: [{ text: "Can I cancel and get a refund?" }],
          requests: [],
          confirmations: [],
        },
        scenario: {
          category: "cancellation",
          confidence: 0.92,
        },
      },
      subject: "Cancellation and refund request",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    const faqSummary = payload.knowledge_summaries.find(
      (entry: { uri: string; summary: string }) => entry.uri === "brikette://faq"
    );
    expect(faqSummary).toBeDefined();
    const wordCount = faqSummary.summary.trim().split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeLessThanOrEqual(500);
  });

  it("TASK-02 TC-04: irrelevant resources return empty or minimal summaries", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "WiFi information",
          body: "WiFi is available throughout the hostel.",
          category: "wifi",
        },
      ])
    );
    handleBriketteResourceReadMock.mockImplementation(async (uri: string) => {
      if (uri === "brikette://pricing/menu") {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({
                breakfast: {
                  mains: {
                    eggsCombo: 12.5,
                    pancakes: 12.5,
                  },
                },
              }),
            },
          ],
        };
      }
      if (uri === "brikette://faq") {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({
                items: [
                  {
                    id: "wifi-password",
                    question: "Do you have WiFi?",
                    answer: "Yes, complimentary WiFi is available throughout the hostel.",
                  },
                ],
              }),
            },
          ],
        };
      }
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({}) }],
      };
    });

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Do you have WiFi in the rooms?",
        intents: {
          questions: [{ text: "Do you have WiFi in the rooms?" }],
          requests: [],
          confirmations: [],
        },
        scenario: {
          category: "wifi",
          confidence: 0.9,
        },
      },
      subject: "WiFi details",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    const menuSummary = payload.knowledge_summaries.find(
      (entry: { uri: string; summary: string }) => entry.uri === "brikette://pricing/menu"
    );
    expect(menuSummary).toBeDefined();
    expect(menuSummary.summary).toBe("");
  });
});
