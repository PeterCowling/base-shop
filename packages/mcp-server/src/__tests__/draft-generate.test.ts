/** @jest-environment node */

import { readFileSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";

import { handleBriketteResourceRead } from "../resources/brikette-knowledge.js";
import { handleDraftGuideRead } from "../resources/draft-guide.js";
import { handleVoiceExamplesRead } from "../resources/voice-examples.js";
import { clearTemplateCache, handleDraftGenerateTool } from "../tools/draft-generate";
import { ingestUnknownAnswerEntries } from "../tools/reviewed-ledger.js";

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

jest.mock("../tools/gmail.js", () => ({
  appendTelemetryEvent: jest.fn(),
}));

jest.mock("../tools/reviewed-ledger.js", () => ({
  ingestUnknownAnswerEntries: jest.fn(async () => ({
    path: "/tmp/reviewed-learning-ledger.jsonl",
    created: [],
    duplicates: [],
  })),
  // TASK-02/TASK-01: new imports added to draft-generate.ts
  readActiveFaqPromotions: jest.fn(async () => []),
  hashQuestion: jest.fn((q: string) => `mock-hash-${q.slice(0, 8)}`),
}));

const readFileMock = readFile as jest.Mock;
const handleBriketteResourceReadMock = handleBriketteResourceRead as jest.Mock;
const handleDraftGuideReadMock = handleDraftGuideRead as jest.Mock;
const handleVoiceExamplesReadMock = handleVoiceExamplesRead as jest.Mock;
const ingestUnknownAnswerEntriesMock = ingestUnknownAnswerEntries as jest.Mock;

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

type StoredTemplate = {
  subject: string;
  body: string;
  category: string;
  template_id?: string;
  reference_scope?: "reference_required" | "reference_optional_excluded";
  canonical_reference_url?: string | null;
  normalization_batch?: "A" | "B" | "C" | "D";
};

function loadStoredTemplates(): StoredTemplate[] {
  const raw = readFileSync(
    join(process.cwd(), "packages", "mcp-server", "data", "email-templates.json"),
    "utf8"
  );
  return JSON.parse(raw) as StoredTemplate[];
}

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
  ingestUnknownAnswerEntriesMock.mockResolvedValue({
    path: "/tmp/reviewed-learning-ledger.jsonl",
    created: [],
    duplicates: [],
  });
}

describe("draft_generate tool", () => {
  beforeEach(() => {
    setupDraftGenerateMocks();
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

  it("TC-02b: selects agreement template for confirmed agreement-only replies", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Agreement Received",
          body: "Thank you, we have received your agreement to the terms and conditions for your reservation.\r\n\r\nNext step from our side: we will process the payment and send confirmation shortly.\r\n\r\nNo further action is needed right now. If payment does not go through, we will be in touch to let you know.",
          category: "general",
        },
        {
          subject: "Transportation to Hostel Brikette",
          body: "Dear Guest,\r\n\r\nThanks for your email.\r\n\r\nWe have detailed travel guides on our website.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "transportation",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Agree!",
        intents: {
          questions: [],
          requests: [],
          confirmations: [],
        },
        agreement: {
          status: "confirmed",
          confidence: 90,
          evidence_spans: [{ text: "Agree", position: 0, is_negated: false }],
          requires_human_confirmation: false,
          detected_language: "EN",
          additional_content: false,
        },
      },
      subject: "Re: Your Hostel Brikette Reservation",
      recipientName: "Gianna Chiavarone",
    });

    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    expect(payload.template_used.subject).toBe("Agreement Received");
    expect(payload.draft.bodyPlain).toContain("we have received your agreement");
    expect(payload.draft.bodyHtml).not.toContain("Book Direct &amp; Save");
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


  it("TC-07: composite body does not append plaintext signature boilerplate", async () => {
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
    // Sign-off is rendered by HTML template, not appended in plaintext content.
    const regardsMatches = body.toLowerCase().match(/regards/g) || [];
    expect(regardsMatches.length).toBe(0);
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
    expect(payload.draft.bodyPlain).not.toContain("Best regards,");
  });
});

describe("draft_generate tool TASK-01", () => {
  beforeEach(setupDraftGenerateMocks);

  it("TASK-01 TC-01: faq generation avoids artificial length padding", async () => {
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
    expect(wordCount).toBeGreaterThan(0);
    expect(wordCount).toBeLessThan(50);
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

  it("TASK-01 TC-03: policy generation avoids auto-injected generic boilerplate", async () => {
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
    expect(body).toContain("per our policy");
    expect(body).not.toContain("please check live availability on our website");
    expect(body).not.toContain("answered each of your questions");
    expect(body).not.toContain("happy to help");
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

describe("draft_generate tool TASK-05", () => {
  beforeEach(setupDraftGenerateMocks);

  it("TC-05-02: generate output includes preliminary_coverage with per-question entries", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Check-in times",
          body: "Check-in starts at 3:00 PM. Best regards, Hostel Brikette",
          category: "check-in",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "What time is check-in and is breakfast included?",
        intents: {
          questions: [
            { text: "What time is check-in?" },
            { text: "Is breakfast included?" },
          ],
          requests: [],
          confirmations: [],
        },
        scenario: {
          category: "check-in",
          confidence: 0.85,
        },
      },
      subject: "Check-in and breakfast",
    });
    if ("isError" in result && result.isError) {
      throw new Error((result as { content: Array<{ text: string }> }).content[0].text);
    }

    const payload = JSON.parse((result as { content: Array<{ text: string }> }).content[0].text);

    expect(payload.preliminary_coverage).toBeDefined();
    expect(payload.preliminary_coverage.coverage).toBeInstanceOf(Array);
    expect(payload.preliminary_coverage.coverage).toHaveLength(2);

    for (const entry of payload.preliminary_coverage.coverage) {
      expect(entry).toHaveProperty("question");
      expect(entry).toHaveProperty("matched_count");
      expect(entry).toHaveProperty("required_matches");
      expect(entry).toHaveProperty("coverage_score");
      expect(entry).toHaveProperty("status");
      expect(entry.status).toBe("missing");
      expect(entry.matched_count).toBe(0);
    }

    expect(payload.preliminary_coverage.questions_with_no_template_match).toEqual(
      expect.arrayContaining(["What time is check-in?", "Is breakfast included?"])
    );
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

describe("draft_generate tool TASK-06 — per-question composite ranking", () => {
  beforeEach(setupDraftGenerateMocks);

  it("TC-06-01: two questions mapping to same template deduplicate to composite: false", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Luggage Storage — Before Check-in",
          body: "Dear Guest,\r\n\r\nFree luggage storage on your arrival day.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "luggage",
        },
      ])
    );

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Can we store luggage? Where do we leave our bags?",
        intents: {
          questions: [
            { text: "Can we store luggage?" },
            { text: "Where do we leave our bags?" },
          ],
          requests: [],
          confirmations: [],
        },
      },
      subject: "Luggage question",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    expect(payload.composite).toBe(false);
  });

  it("TC-06-02: two questions mapping to distinct templates produce composite: true", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Breakfast — Eligibility and Hours",
          body: "Dear Guest,\r\n\r\nBreakfast is served daily from 8:00 AM to 10:30 AM.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "breakfast",
        },
        {
          subject: "WiFi Information",
          body: "Dear Guest,\r\n\r\nComplimentary WiFi is available throughout the hostel.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
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
    expect(payload.composite).toBe(true);
    const body = payload.draft.bodyPlain.toLowerCase();
    expect(body).toContain("breakfast");
    expect(body).toContain("wifi");
  });

  it("TC-06-03: composite body has exactly one greeting and no trailing signature", async () => {
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
    const dearCount = (body.match(/\bDear\b/gi) ?? []).length;
    const signatureCount = (body.match(/\bBest regards\b/gi) ?? []).length;
    expect(dearCount).toBe(1);
    expect(signatureCount).toBe(0);
  });
});

describe("draft_generate tool TASK-08 — variable-data guardrail", () => {
  beforeEach(setupDraftGenerateMocks);

  it("TC-08-03: strips inline service pricing phrase from draft body", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "Luggage Storage — After Checkout",
          body: "Dear Guest,\r\n\r\nAfter checkout, luggage storage is free until 3:30 PM. Porter service is available at a cost of €15 per bag.\r\n\r\nBest regards,\r\n\r\nPeter Cowling\r\nOwner",
          category: "luggage",
        },
      ])
    );
    handleDraftGuideReadMock.mockResolvedValue({
      contents: [
        {
          uri: "brikette://draft-guide",
          mimeType: "application/json",
          text: JSON.stringify({
            content_rules: {
              never: ["Never quote specific service prices inline without noting they may vary."],
              always: [],
              if: [],
            },
          }),
        },
      ],
    });

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Can you store our bags after checkout?",
        intents: {
          questions: [{ text: "Can you store our bags after checkout?" }],
          requests: [],
          confirmations: [],
        },
        scenario: { category: "luggage", confidence: 0.9 },
      },
      subject: "Luggage storage after checkout",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    expect(payload.draft.bodyPlain).not.toContain("at a cost of €");
  });
});

describe("draft_generate tool TASK-07 — knowledge gap-fill injection", () => {
  beforeEach(setupDraftGenerateMocks);

  it("TC-07-01: uncovered question gets knowledge snippet injected into bodyPlain with sources_used injected:true", async () => {
    // Template body has no breakfast content — question will be uncovered after assembly
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "General inquiry",
          body: "Thank you for contacting us. We will be happy to assist. Best regards, Hostel Brikette",
          category: "general",
        },
      ])
    );
    // FAQ has relevant breakfast answer
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
                    id: "breakfast-window",
                    question: "When is breakfast served?",
                    answer: "Breakfast is served from 08:00 to 10:30 daily.",
                  },
                ],
              }),
            },
          ],
        };
      }
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ items: [] }) }],
      };
    });

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "What time is breakfast served?",
        intents: {
          questions: [{ text: "What time is breakfast served?" }],
          requests: [],
          confirmations: [],
        },
        scenario: { category: "breakfast", confidence: 0.8 },
      },
      subject: "Breakfast hours inquiry",
    });
    if ("isError" in result && result.isError) throw new Error(result.content[0].text);

    const payload = JSON.parse(result.content[0].text);
    // Injected snippet text must appear in bodyPlain (citation markers stripped)
    expect(payload.draft.bodyPlain).toContain("Breakfast is served from 08:00 to 10:30 daily.");
    // sources_used must be present with at least one injected entry
    expect(payload.sources_used).toBeDefined();
    const injectedEntry = (payload.sources_used as Array<{ injected: boolean; citation: string }>)
      .find((e) => e.injected);
    expect(injectedEntry).toBeDefined();
    expect(injectedEntry?.citation).toContain("breakfast");
  });

  it("TC-08-06: promoted FAQ entries remain consumable by draft generation", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "General inquiry",
          body: "Thank you for contacting us. We will be happy to assist. Best regards, Hostel Brikette",
          category: "general",
        },
      ]),
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
                    question: "Can I store luggage before check-in?",
                    answer: "Yes, luggage storage is available before check-in.",
                    source: "reviewed-ledger",
                    promoted_key: "faq:q-luggage-before-checkin",
                  },
                ],
              }),
            },
          ],
        };
      }
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ items: [] }) }],
      };
    });

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Can I store luggage before check-in?",
        intents: {
          questions: [{ text: "Can I store luggage before check-in?" }],
          requests: [],
          confirmations: [],
        },
        scenario: { category: "luggage", confidence: 0.8 },
      },
      subject: "Luggage before check-in",
    });
    if ("isError" in result && result.isError) throw new Error(result.content[0].text);

    const payload = JSON.parse(result.content[0].text);
    expect(payload.draft.bodyPlain).toContain("Yes, luggage storage is available before check-in.");
    expect(
      (payload.sources_used as Array<{ injected: boolean }>).some((entry) => entry.injected),
    ).toBe(true);
  });

  it("TC-07-02: no matching snippet produces sources_used with no injected:true entries", async () => {
    // Template body doesn't mention wifi — question will be uncovered
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "General inquiry",
          body: "Thank you for contacting us. Best regards, Hostel Brikette",
          category: "general",
        },
      ])
    );
    // All URIs return empty items — no matching snippets
    handleBriketteResourceReadMock.mockResolvedValue({
      contents: [{ uri: "brikette://faq", mimeType: "application/json", text: JSON.stringify({ items: [] }) }],
    });

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Does the hostel have wifi internet available?",
        intents: {
          questions: [{ text: "Does the hostel have wifi internet available?" }],
          requests: [],
          confirmations: [],
        },
        scenario: { category: "wifi", confidence: 0.8 },
      },
      subject: "Wifi availability",
    });
    if ("isError" in result && result.isError) throw new Error(result.content[0].text);

    const payload = JSON.parse(result.content[0].text);
    expect(payload.sources_used).toBeDefined();
    const anyInjected = (payload.sources_used as Array<{ injected: boolean }>).some((e) => e.injected);
    expect(anyInjected).toBe(false);
  });

  it("TC-07-03: pricing/menu URI excluded from injection even when content matches (allowlist enforced)", async () => {
    // Template body doesn't cover breakfast pricing
    readFileMock.mockResolvedValue(
      JSON.stringify([
        {
          subject: "General inquiry",
          body: "Thank you for contacting us. Best regards, Hostel Brikette",
          category: "general",
        },
      ])
    );
    // Only pricing/menu has matching content — safe URIs return empty
    handleBriketteResourceReadMock.mockImplementation(async (uri: string) => {
      if (uri === "brikette://pricing/menu") {
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({
                breakfast: { price: "€12 per person", note: "Breakfast costs €12 per person." },
              }),
            },
          ],
        };
      }
      return {
        contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ items: [] }) }],
      };
    });

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "How much does breakfast cost per person?",
        intents: {
          questions: [{ text: "How much does breakfast cost per person?" }],
          requests: [],
          confirmations: [],
        },
        scenario: { category: "breakfast", confidence: 0.8 },
      },
      subject: "Breakfast pricing",
    });
    if ("isError" in result && result.isError) throw new Error(result.content[0].text);

    const payload = JSON.parse(result.content[0].text);
    // Pricing content must NOT be injected — allowlist blocks brikette://pricing/menu
    expect(payload.draft.bodyPlain).not.toContain("€12 per person");
    expect(payload.sources_used).toBeDefined();
    const anyInjected = (payload.sources_used as Array<{ injected: boolean }>).some((e) => e.injected);
    expect(anyInjected).toBe(false);
  });

  it("TC-07-04: template fallback captures unknown question into reviewed ledger", async () => {
    readFileMock.mockResolvedValue(JSON.stringify([]));
    ingestUnknownAnswerEntriesMock.mockResolvedValue({
      path: "/tmp/reviewed-learning-ledger.jsonl",
      created: [
        {
          question_hash: "hash-unknown-1",
        },
      ],
      duplicates: [],
    });

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Do you have parking nearby?",
        intents: {
          questions: [{ text: "Do you have parking nearby?" }],
          requests: [],
          confirmations: [],
        },
        scenario: { category: "transportation", confidence: 0.8 },
      },
      subject: "Parking question",
    });
    if ("isError" in result && result.isError) throw new Error(result.content[0].text);

    const payload = JSON.parse(result.content[0].text);
    expect(ingestUnknownAnswerEntriesMock).toHaveBeenCalledTimes(1);
    expect(ingestUnknownAnswerEntriesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourcePath: "queue",
        scenarioCategory: "transportation",
        language: "EN",
        questions: ["Do you have parking nearby?"],
      }),
    );
    expect(payload.learning_ledger).toEqual(
      expect.objectContaining({
        created: 1,
        duplicates: 0,
        question_hashes: ["hash-unknown-1"],
      }),
    );
  });

  it("TC-07-05: duplicate unknown capture reports idempotent duplicate count", async () => {
    readFileMock.mockResolvedValue(JSON.stringify([]));
    ingestUnknownAnswerEntriesMock.mockResolvedValue({
      path: "/tmp/reviewed-learning-ledger.jsonl",
      created: [],
      duplicates: [
        {
          question_hash: "hash-unknown-1",
        },
      ],
    });

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "Can I check in at 1am?",
        intents: {
          questions: [{ text: "Can I check in at 1am?" }],
          requests: [],
          confirmations: [],
        },
        scenario: { category: "check-in", confidence: 0.8 },
      },
      subject: "Late check-in",
    });
    if ("isError" in result && result.isError) throw new Error(result.content[0].text);

    const payload = JSON.parse(result.content[0].text);
    expect(payload.learning_ledger).toEqual(
      expect.objectContaining({
        created: 0,
        duplicates: 1,
      }),
    );
  });
});

describe("draft_generate tool TASK-04 template normalization", () => {
  beforeEach(setupDraftGenerateMocks);

  it("TC-04-03: normalized reference-required templates still produce policy-safe drafts", async () => {
    const templates = loadStoredTemplates();
    const cancellationTemplate = templates.find(
      (template) => template.subject === "Cancellation Request — Medical Hardship"
    );

    expect(cancellationTemplate).toBeDefined();
    expect(cancellationTemplate?.reference_scope).toBe("reference_required");
    expect(cancellationTemplate?.canonical_reference_url).toMatch(/^https:\/\//);

    readFileMock.mockResolvedValue(JSON.stringify(templates));

    const result = await handleDraftGenerateTool("draft_generate", {
      actionPlan: {
        ...baseActionPlan,
        normalized_text: "We need to cancel due to medical hardship. What are our options?",
        intents: {
          questions: [{ text: "Can we cancel due to medical hardship?" }],
          requests: [],
          confirmations: [],
        },
        scenario: {
          category: "cancellation",
          confidence: 0.94,
        },
      },
      subject: "Cancellation request",
      recipientName: "Giulia",
    });
    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const payload = JSON.parse(result.content[0].text);
    const bodyLower = payload.draft.bodyPlain.toLowerCase();

    const usedTemplate = templates.find(
      (template) => template.subject === payload.template_used.subject
    );
    expect(usedTemplate?.reference_scope).toBe("reference_required");
    expect(usedTemplate?.canonical_reference_url).toMatch(/^https:\/\//);
    expect(payload.quality.failed_checks).not.toContain("prohibited_claims");
    expect(bodyLower).toContain("per the cancellation policy");
    expect(bodyLower).not.toContain("availability is confirmed");
    expect(bodyLower).not.toContain("we will charge now");
  });
});
