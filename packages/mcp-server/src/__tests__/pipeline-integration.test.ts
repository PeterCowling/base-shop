/** @jest-environment node */

/**
 * TASK-18: Integration test suite for the email autodraft pipeline.
 *
 * Runs anonymized email scenarios through the full three-stage pipeline:
 *   draft_interpret → draft_generate → draft_quality_check
 *
 * Measures: classification accuracy, quality gate pass rate, agreement detection.
 */

import { handleDraftGenerateTool } from "../tools/draft-generate";
import handleDraftInterpretTool from "../tools/draft-interpret";
import handleDraftQualityTool from "../tools/draft-quality-check";

// ---------------------------------------------------------------------------
// Mocks – only knowledge resources need mocking (they'd normally read MCP data
// that isn't available in a test context). Templates, ranker, quality check,
// and HTML generation all run against real local files.
// ---------------------------------------------------------------------------

jest.mock("../resources/brikette-knowledge.js", () => ({
  handleBriketteResourceRead: jest.fn(async (uri: string) => ({
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify({
          faq: [
            { q: "What time is check-in?", a: "Check-in is from 2:30pm." },
            { q: "Is breakfast included?", a: "Breakfast is served 8-10am." },
          ],
          policies: {
            cancellation: "Non-refundable bookings cannot be cancelled.",
            alcohol: "Outside alcohol is not permitted on premises.",
            age: "Age restrictions apply during peak season.",
          },
        }),
      },
    ],
  })),
}));

jest.mock("../resources/draft-guide.js", () => ({
  handleDraftGuideRead: jest.fn(async () => ({
    contents: [
      {
        uri: "brikette://draft-guide",
        mimeType: "application/json",
        text: "{}",
      },
    ],
  })),
}));

jest.mock("../resources/voice-examples.js", () => ({
  handleVoiceExamplesRead: jest.fn(async () => ({
    contents: [
      {
        uri: "brikette://voice-examples",
        mimeType: "application/json",
        text: "{}",
      },
    ],
  })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type InterpretResult = {
  normalized_text: string;
  language: string;
  intents: {
    questions: Array<{ text: string }>;
    requests: Array<{ text: string }>;
    confirmations: Array<{ text: string }>;
  };
  agreement: {
    status: string;
    confidence: number;
    requires_human_confirmation: boolean;
    additional_content: boolean;
  };
  workflow_triggers: {
    prepayment: boolean;
    terms_and_conditions: boolean;
    booking_monitor: boolean;
  };
  scenario: { category: string; confidence: number };
  thread_summary?: {
    prior_commitments: string[];
    open_questions: string[];
    resolved_questions: string[];
    tone_history: string;
    guest_name: string;
    language_used: string;
    previous_response_count: number;
  };
};

type GenerateResult = {
  draft: { bodyPlain: string; bodyHtml: string };
  answered_questions: string[];
  template_used: {
    subject: string | null;
    category: string | null;
    confidence: number;
    selection: string;
  };
  knowledge_sources: string[];
  quality: { passed: boolean; failed_checks: string[]; warnings: string[] };
};

type QualityResult = {
  passed: boolean;
  failed_checks: string[];
  warnings: string[];
  confidence: number;
};

function parseResult<T>(result: { content: Array<{ text: string }> }): T {
  return JSON.parse(result.content[0].text) as T;
}

// ---------------------------------------------------------------------------
// Test Fixtures – Anonymized email scenarios based on baseline patterns
// ---------------------------------------------------------------------------

type TestFixture = {
  id: string;
  description: string;
  from: string;
  subject: string;
  body: string;
  threadContext?: {
    messages: Array<{ from: string; date: string; snippet: string }>;
  };
  expectedCategory: string;
  expectedAgreement?: string;
  requiresResponse: boolean;
  scenarioType: string;
};

const fixtures: TestFixture[] = [
  // ======================== FAQ ========================
  {
    id: "FAQ-01",
    description: "Check-in time inquiry",
    from: "Jane Smith <jane@example.com>",
    subject: "Check-in question",
    body: "Hi there, what time is check-in? We are arriving by train around noon.",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "faq",
  },
  {
    id: "FAQ-02",
    description: "Room availability and pricing",
    from: "Guest Two <guest2@example.com>",
    subject: "Private room",
    body: "Hi there, I am wanting to book the superior double bed private ensuite from the 29th of June. I was wondering if we are able to have 3 guests in the room. Please let us know if this is allowed. Thank you!",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "faq",
  },
  {
    id: "FAQ-03",
    description: "Transportation question",
    from: "Alex Johnson <alex@example.com>",
    subject: "Getting to the hostel",
    body: "Hello, how do we get to the hostel from Naples? Is there a bus or do we need a taxi?",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "faq",
  },
  {
    id: "FAQ-04",
    description: "Room view and availability follow-up",
    from: "Guest Two <guest2@example.com>",
    subject: "Re: Private room",
    body: "Okay great! Does room 9 have a view? And is it available from the 29th of June to 4th of July? Online it isn't coming up, thanks!",
    threadContext: {
      messages: [
        {
          from: "Guest Two <guest2@example.com>",
          date: "Mon, 01 Jan 2026 10:00:00 +0000",
          snippet:
            "I am wanting to book the superior double bed private ensuite. Can we have 3 guests?",
        },
        {
          from: "Hostel Brikette <info@hostel-positano.com>",
          date: "Mon, 01 Jan 2026 12:00:00 +0000",
          snippet:
            "We can offer room 9 with 3 beds. It has a courtyard view. Check availability on our website.",
        },
      ],
    },
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "faq",
  },
  {
    id: "FAQ-05",
    description: "Breakfast and luggage storage inquiry",
    from: "Maria Garcia <maria@example.com>",
    subject: "Questions about our stay",
    body: "Hello! Is breakfast included in our booking? Also, can we store luggage after checkout? And do you have WiFi?",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "faq",
  },
  {
    id: "FAQ-06",
    description: "Late arrival question",
    from: "Tom Wilson <tom@example.com>",
    subject: "Late check-in",
    body: "Hi, our flight arrives at 11pm. Is it possible to check in that late? What should we do?",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "faq",
  },

  // ======================== POLICY ========================
  {
    id: "POL-01",
    description: "Room consolidation request",
    from: "Laura P <laura@example.com>",
    subject: "Room change request",
    body: "Hello, so excited we have just booked for 3 adults split up but if you get a cancellation could you please put us together? Thank you for reading.",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "policy",
  },
  {
    id: "POL-02",
    description: "Adding extra guest to room",
    from: "Laura P <laura@example.com>",
    subject: "Adding person to room",
    body: "Can we add one more person into our room? How much will it be?",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "policy",
  },
  {
    id: "POL-03",
    description: "Age restriction inquiry",
    from: "Older Traveler <traveler@example.com>",
    subject: "Age policy question",
    body: "Hi, I am 45 years old and would like to book a bed. Do you have an age restriction? I saw some hostels do.",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "policy",
  },

  // ======================== PAYMENT ========================
  {
    id: "PAY-01",
    description: "Payment follow-up (card worked?)",
    from: "Guest Three <guest3@example.com>",
    subject: "Re: Your Reservation",
    body: "Hi, just following up from this email and if this card has worked. Thank you.",
    threadContext: {
      messages: [
        {
          from: "Guest Three <guest3@example.com>",
          date: "Mon, 01 Jan 2026 08:00:00 +0000",
          snippet: "Here are my new card details: 4564 xxxx xxxx xxxx",
        },
        {
          from: "Hostel Brikette <info@hostel-positano.com>",
          date: "Mon, 01 Jan 2026 10:00:00 +0000",
          snippet:
            "We will try the payment again with the new card details you provided.",
        },
      ],
    },
    expectedCategory: "payment",
    requiresResponse: true,
    scenarioType: "payment",
  },
  {
    id: "PAY-02",
    description: "Change credit card details",
    from: "Guest Four <guest4@example.com>",
    subject: "Card details",
    body: "Hi, I would like to change my credit card details for the reservation. The old card has expired. Can you send me a link?",
    expectedCategory: "payment",
    requiresResponse: true,
    scenarioType: "payment",
  },
  {
    id: "PAY-03",
    description: "Bank transfer inquiry",
    from: "Guest Five <guest5@example.com>",
    subject: "Payment question",
    body: "Hello, can I pay by bank transfer instead of credit card? My card keeps getting declined for international transactions.",
    expectedCategory: "payment",
    requiresResponse: true,
    scenarioType: "payment",
  },

  // ======================== CANCELLATION ========================
  {
    id: "CAN-01",
    description: "Cancel non-refundable booking",
    from: "Guest Six <guest6@example.com>",
    subject: "Cancel booking",
    body: "Hi, I need to cancel my booking due to a family emergency. I understand it was non-refundable but is there anything that can be done? The booking reference is ABC123.",
    expectedCategory: "cancellation",
    requiresResponse: true,
    scenarioType: "cancellation",
  },
  {
    id: "CAN-02",
    description: "Why was booking cancelled inquiry",
    from: "Guest Seven <guest7@example.com>",
    subject: "Booking cancelled?",
    body: "Why was my booking cancelled? I did not request this. Can you reinstate it please?",
    expectedCategory: "cancellation",
    requiresResponse: true,
    scenarioType: "cancellation",
  },

  // ======================== AGREEMENT ========================
  {
    id: "AGR-01",
    description: "Simple agree response (standalone 'Agree' — NOT detected, see GAP-01)",
    from: "Guest Eight <guest8@example.com>",
    subject: "Re: Your Reservation",
    body: "Agree.\n\nKind regards\nGuest Eight",
    expectedCategory: "general",
    // GAP-01: Standalone "Agree" (no pronoun) is NOT matched by the current
    // regex patterns which require "I agree", "we agree", or "agreed".
    // Real-world emails (Sophie Drake, Daniel Schmidt) use this form.
    expectedAgreement: "none",
    requiresResponse: true,
    scenarioType: "agreement",
  },
  {
    id: "AGR-02",
    description: "Agreement with follow-up question (mixed response)",
    from: "Guest Nine <guest9@example.com>",
    subject: "Re: Terms and Conditions",
    body: "I agree to the terms, but what time is check-in?",
    expectedCategory: "general",
    expectedAgreement: "likely",
    requiresResponse: true,
    scenarioType: "agreement",
  },
  {
    id: "AGR-03",
    description: "Agreement confirmation follow-up (meta-discussion, not active agreement)",
    from: "Guest Ten <guest10@example.com>",
    subject: "Re: Your Reservation",
    body: "Dear Hostel Brikette Team,\n\nI sent an email yesterday with 'agree' to accept the terms and conditions. Since I received the below email again today, I just wanted to make sure this was received and no further action on my side is required.\n\nLooking forward to my stay.\n\nBest regards\nGuest Ten",
    expectedCategory: "policy",
    // Correctly "none": guest is ASKING ABOUT a previous agreement, not
    // actively agreeing now. The word "agree" appears in quoted context.
    expectedAgreement: "none",
    requiresResponse: true,
    scenarioType: "agreement",
  },
  {
    id: "AGR-04",
    description: "Negated agreement",
    from: "Guest Eleven <guest11@example.com>",
    subject: "Re: Terms and Conditions",
    body: "I don't agree with these terms. The cancellation policy seems unfair. Can we discuss?",
    expectedCategory: "cancellation",
    expectedAgreement: "none",
    requiresResponse: true,
    scenarioType: "agreement",
  },
  {
    id: "AGR-05",
    description: "Ambiguous yes response",
    from: "Guest Twelve <guest12@example.com>",
    subject: "Re: Your Reservation",
    body: "Yes.",
    expectedCategory: "general",
    expectedAgreement: "unclear",
    requiresResponse: true,
    scenarioType: "agreement",
  },

  // ======================== PREPAYMENT ========================
  {
    id: "PRE-01",
    description: "Prepayment first attempt context",
    from: "Guest Thirteen <guest13@example.com>",
    subject: "Re: Prepayment",
    body: "Hi, I checked with my bank and they said they will allow the international payment now. Please try again. Thank you.",
    expectedCategory: "payment",
    requiresResponse: true,
    scenarioType: "prepayment",
  },

  // ======================== BREAKFAST ========================
  {
    id: "BRK-01",
    description: "Breakfast eligibility question",
    from: "Breakfast Guest <breakfast@example.com>",
    subject: "Breakfast included?",
    body: "Hi, is breakfast included in our booking? What time is it served?",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "breakfast",
  },
  {
    id: "BRK-02",
    description: "OTA breakfast question",
    from: "OTA Guest <ota@example.com>",
    subject: "Breakfast for Hostelworld booking",
    body: "I booked through Hostelworld. Do I get breakfast? If not, can I add it?",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "breakfast",
  },

  // ======================== LUGGAGE ========================
  {
    id: "LUG-01",
    description: "Luggage storage before check-in",
    from: "Early Arrival <early@example.com>",
    subject: "Luggage storage",
    body: "We arrive at 9am. Can we store our bags somewhere before check-in?",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "luggage",
  },
  {
    id: "LUG-02",
    description: "Late luggage pickup after checkout",
    from: "Late Departure <late@example.com>",
    subject: "Bags after checkout",
    body: "Our ferry doesn't leave until 7pm. Can we collect our bags that late? Is there an extra fee?",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "luggage",
  },

  // ======================== WIFI ========================
  {
    id: "WIFI-01",
    description: "WiFi availability and speed",
    from: "Remote Worker <worker@example.com>",
    subject: "Internet at hostel",
    body: "Do you have WiFi? I need to do some work calls. Is the connection reliable?",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "wifi",
  },

  // ======================== BOOKING CHANGES ========================
  {
    id: "CHG-01",
    description: "Date change request",
    from: "Date Changer <changer@example.com>",
    subject: "Change booking dates",
    body: "Hi, can I change my reservation from July 10-12 to July 15-17? The original dates no longer work for us.",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "booking-changes",
  },

  // ======================== CHECKOUT ========================
  {
    id: "CO-01",
    description: "Late checkout request",
    from: "Late Guest <latecheck@example.com>",
    subject: "Late checkout",
    body: "Is it possible to check out at noon instead of 10am? We have a late flight.",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "checkout",
  },

  // ======================== HOUSE RULES ========================
  {
    id: "HR-01",
    description: "Visitor policy question",
    from: "Social Guest <visitor@example.com>",
    subject: "Can friends visit?",
    body: "My friend is staying at another hotel in Positano. Can they come hang out at the hostel bar with me?",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "house-rules",
  },

  // ======================== MODIFICATION ========================
  {
    id: "MOD-01",
    description: "Extra night request",
    from: "Guest Via Booking <guest@booking.com>",
    subject: "Extension request",
    body: "Hello! Just figured I should have booked 3 nights instead of 2. I tried to update it on the reservation but it said the day was not available. Is there something we can do?",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "modification",
  },

  // ======================== ITALIAN ========================
  {
    id: "IT-01",
    description: "Italian inquiry",
    from: "Marco Rossi <marco@example.it>",
    subject: "Informazioni",
    body: "Ciao, vorrei sapere se la colazione è inclusa nel prezzo. Grazie per l'aiuto.",
    expectedCategory: "faq",
    requiresResponse: true,
    scenarioType: "faq",
  },
  {
    id: "IT-02",
    description: "Italian agreement",
    from: "Lucia Bianchi <lucia@example.it>",
    subject: "Re: Prenotazione",
    body: "Accetto le condizioni. Grazie.",
    expectedCategory: "general",
    expectedAgreement: "confirmed",
    requiresResponse: true,
    scenarioType: "agreement",
  },

  // ======================== SYSTEM (NO RESPONSE) ========================
  {
    id: "SYS-01",
    description: "Octorate new reservation",
    from: "Octorate <noreply@smtp.octorate.com>",
    subject:
      "NEW RESERVATION 5326571789_6061107686 Booking 2026-05-13 - 2026-05-15",
    body: "NEW RESERVATION 5326571789_6061107686 Booking 2026-05-13 - 2026-05-15 hostel brikette positano ID 109293514:3554717 ROOMS OTA, Non Refundable, Room 7",
    expectedCategory: "faq",
    requiresResponse: false,
    scenarioType: "system",
  },
  {
    id: "SYS-02",
    description: "Octorate cancellation notification",
    from: "Octorate <noreply@smtp.octorate.com>",
    subject: "NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30",
    body: "NEW CANCELLATION 6896451364_5972003394 Booking 2026-08-30 - 2026-09-01 hostel brikette positano ID 109293508:27778396 ROOMS OTA, Refundable, Room 10",
    expectedCategory: "cancellation",
    requiresResponse: false,
    scenarioType: "system",
  },
  {
    id: "SYS-03",
    description: "Hostelworld booking confirmation",
    from: "Market Support <support@hostelworld.com>",
    subject: "Hostelworld Confirmed Booking",
    body: "Hostelworld Confirmed Booking - Hostel Brikette, Positano. Your booking has been confirmed.",
    expectedCategory: "faq",
    requiresResponse: false,
    scenarioType: "system",
  },
  {
    id: "SYS-04",
    description: "Google Workspace invoice",
    from: "Google Payments <payments-noreply@google.com>",
    subject: "Google Workspace: Your invoice is available",
    body: "Your Google Workspace monthly invoice is available. The balance will be automatically charged.",
    expectedCategory: "general",
    requiresResponse: false,
    scenarioType: "system",
  },
  {
    id: "SYS-05",
    description: "Marketing newsletter",
    from: "IKEA <ikea@news.email.ikea.it>",
    subject: "Fino a 50% di sconto",
    body: "Ancora per poco: fino al 50% di sconto su mobili selezionati.",
    expectedCategory: "general",
    requiresResponse: false,
    scenarioType: "system",
  },
];

// ======================== TESTS ========================

// Split into separate top-level describes to stay under max-lines-per-function

describe("TASK-18: Stage 1 — Interpretation", () => {
  describe("Interpretation", () => {
    it("should interpret all fixtures without errors", async () => {
      for (const fixture of fixtures) {
        const result = await handleDraftInterpretTool("draft_interpret", {
          body: fixture.body,
          subject: fixture.subject,
          threadContext: fixture.threadContext,
        });
        const payload = parseResult<InterpretResult>(result);
        expect(payload.normalized_text).toBeDefined();
        expect(payload.language).toBeDefined();
        expect(payload.scenario.category).toBeDefined();
        expect(payload.scenario.confidence).toBeGreaterThan(0);
      }
    });

    it("should detect language correctly", async () => {
      const itFixture = fixtures.find((f) => f.id === "IT-01")!;
      const result = await handleDraftInterpretTool("draft_interpret", {
        body: itFixture.body,
      });
      expect(parseResult<InterpretResult>(result).language).toBe("IT");

      const enFixture = fixtures.find((f) => f.id === "FAQ-01")!;
      const enResult = await handleDraftInterpretTool("draft_interpret", {
        body: enFixture.body,
      });
      expect(parseResult<InterpretResult>(enResult).language).toBe("EN");
    });

    it("should extract questions from multi-question emails", async () => {
      const multiQ = fixtures.find((f) => f.id === "FAQ-05")!;
      const result = await handleDraftInterpretTool("draft_interpret", {
        body: multiQ.body,
      });
      const payload = parseResult<InterpretResult>(result);
      expect(payload.intents.questions.length).toBeGreaterThanOrEqual(2);
    });

    it("should build thread summary when thread context provided", async () => {
      const threadFixture = fixtures.find((f) => f.id === "FAQ-04")!;
      const result = await handleDraftInterpretTool("draft_interpret", {
        body: threadFixture.body,
        subject: threadFixture.subject,
        threadContext: threadFixture.threadContext,
      });
      const payload = parseResult<InterpretResult>(result);
      expect(payload.thread_summary).toBeDefined();
      expect(payload.thread_summary!.previous_response_count).toBeGreaterThan(
        0
      );
    });
  });

});

describe("TASK-18: Stage 1b — Agreement Detection", () => {
  describe("Agreement Detection", () => {
    const agreementFixtures = fixtures.filter(
      (f) => f.expectedAgreement !== undefined
    );

    it.each(agreementFixtures.map((f) => [f.id, f.description, f]))(
      "%s: %s",
      async (_id, _desc, fixture) => {
        const f = fixture as TestFixture;
        const result = await handleDraftInterpretTool("draft_interpret", {
          body: f.body,
          subject: f.subject,
        });
        const payload = parseResult<InterpretResult>(result);
        expect(payload.agreement.status).toBe(f.expectedAgreement);
      }
    );

    it("AGR-02 should flag additional_content for mixed response", async () => {
      const mixed = fixtures.find((f) => f.id === "AGR-02")!;
      const result = await handleDraftInterpretTool("draft_interpret", {
        body: mixed.body,
      });
      const payload = parseResult<InterpretResult>(result);
      expect(payload.agreement.additional_content).toBe(true);
    });

    it("AGR-05 should require human confirmation for ambiguous yes", async () => {
      const ambiguous = fixtures.find((f) => f.id === "AGR-05")!;
      const result = await handleDraftInterpretTool("draft_interpret", {
        body: ambiguous.body,
      });
      const payload = parseResult<InterpretResult>(result);
      expect(payload.agreement.requires_human_confirmation).toBe(true);
    });
  });

});

describe("TASK-18: Stage 2+3 — Full Pipeline", () => {
  describe("Full Pipeline (generate + quality gate)", () => {
    const customerFixtures = fixtures.filter(
      (f) => f.requiresResponse && f.scenarioType !== "system"
    );

    const results: Array<{
      id: string;
      scenarioType: string;
      category: string;
      qualityPassed: boolean;
      failedChecks: string[];
      warnings: string[];
      templateUsed: string | null;
      templateConfidence: number;
    }> = [];

    afterAll(() => {
      // Log aggregated results for the test report
      const byScenario = new Map<
        string,
        { total: number; passed: number; failed: string[][] }
      >();
      for (const r of results) {
        const entry = byScenario.get(r.scenarioType) ?? {
          total: 0,
          passed: 0,
          failed: [],
        };
        entry.total++;
        if (r.qualityPassed) entry.passed++;
        else entry.failed.push(r.failedChecks);
        byScenario.set(r.scenarioType, entry);
      }

      console.info("\n=== TASK-18 Integration Test Results ===");
      console.info(`Total customer scenarios: ${customerFixtures.length}`);
      console.info(`Quality gate pass rate: ${results.filter((r) => r.qualityPassed).length}/${results.length}`);
      console.info("\nBy scenario type:");
      for (const [type, data] of byScenario) {
        const rate = ((data.passed / data.total) * 100).toFixed(0);
        console.info(`  ${type}: ${data.passed}/${data.total} (${rate}%)`);
        if (data.failed.length > 0) {
          console.info(
            `    Failed checks: ${[...new Set(data.failed.flat())].join(", ")}`
          );
        }
      }
      console.info("=== End Results ===\n");
    });

    it.each(customerFixtures.map((f) => [f.id, f.description, f]))(
      "%s: %s — full pipeline",
      async (_id, _desc, fixture) => {
        const f = fixture as TestFixture;

        // Stage 1: Interpret
        const interpretResult = await handleDraftInterpretTool(
          "draft_interpret",
          {
            body: f.body,
            subject: f.subject,
            threadContext: f.threadContext,
          }
        );
        const actionPlan = parseResult<InterpretResult>(interpretResult);
        expect(actionPlan.normalized_text).toBeDefined();

        // Stage 2: Generate
        const generateResult = await handleDraftGenerateTool("draft_generate", {
          actionPlan,
          subject: f.subject,
          recipientName: f.from.split("<")[0].trim(),
        });

        // Handle potential generate errors
        if ("isError" in generateResult && generateResult.isError) {
          const errText = (generateResult as { content: Array<{ text: string }> })
            .content[0].text;
          // Record as failed
          results.push({
            id: f.id,
            scenarioType: f.scenarioType,
            category: actionPlan.scenario.category,
            qualityPassed: false,
            failedChecks: [`generate_error: ${errText}`],
            warnings: [],
            templateUsed: null,
            templateConfidence: 0,
          });
          // Still expect the generate to succeed
          expect(errText).toBeUndefined();
          return;
        }

        const generated = parseResult<GenerateResult>(
          generateResult as { content: Array<{ text: string }> }
        );

        // Verify draft structure
        expect(generated.draft.bodyPlain).toBeDefined();
        expect(generated.draft.bodyPlain.length).toBeGreaterThan(0);
        expect(generated.draft.bodyHtml).toContain("<!DOCTYPE html>");

        // Record results
        results.push({
          id: f.id,
          scenarioType: f.scenarioType,
          category: actionPlan.scenario.category,
          qualityPassed: generated.quality.passed,
          failedChecks: generated.quality.failed_checks,
          warnings: generated.quality.warnings,
          templateUsed: generated.template_used.subject,
          templateConfidence: generated.template_used.confidence,
        });
      }
    );
  });

});

describe("TASK-18: Critical Error Checks", () => {
  describe("Critical Error Checks", () => {
    it("should never include prohibited claims in generated drafts", async () => {
      const prohibited = [
        "availability confirmed",
        "we will charge now",
        "guaranteed availability",
      ];

      const customerFixtures = fixtures.filter(
        (f) => f.requiresResponse && f.scenarioType !== "system"
      );

      for (const fixture of customerFixtures) {
        const interpretResult = await handleDraftInterpretTool(
          "draft_interpret",
          { body: fixture.body, subject: fixture.subject }
        );
        const actionPlan = parseResult<InterpretResult>(interpretResult);

        const generateResult = await handleDraftGenerateTool("draft_generate", {
          actionPlan,
          subject: fixture.subject,
        });

        if ("isError" in generateResult && generateResult.isError) continue;

        const generated = parseResult<GenerateResult>(
          generateResult as { content: Array<{ text: string }> }
        );
        const bodyLower = generated.draft.bodyPlain.toLowerCase();

        for (const phrase of prohibited) {
          expect(bodyLower).not.toContain(phrase);
        }
      }
    });

    it("should always include a signature in generated drafts", async () => {
      const customerFixtures = fixtures.filter(
        (f) => f.requiresResponse && f.scenarioType !== "system"
      );

      for (const fixture of customerFixtures) {
        const interpretResult = await handleDraftInterpretTool(
          "draft_interpret",
          { body: fixture.body, subject: fixture.subject }
        );
        const actionPlan = parseResult<InterpretResult>(interpretResult);

        const generateResult = await handleDraftGenerateTool("draft_generate", {
          actionPlan,
          subject: fixture.subject,
        });

        if ("isError" in generateResult && generateResult.isError) continue;

        const generated = parseResult<GenerateResult>(
          generateResult as { content: Array<{ text: string }> }
        );
        const bodyLower = generated.draft.bodyPlain.toLowerCase();

        expect(
          bodyLower.includes("regards") ||
            bodyLower.includes("hostel brikette") ||
            bodyLower.includes("brikette")
        ).toBe(true);
      }
    });

    it("should always output both plaintext and HTML", async () => {
      const customerFixtures = fixtures.filter(
        (f) => f.requiresResponse && f.scenarioType !== "system"
      );

      for (const fixture of customerFixtures) {
        const interpretResult = await handleDraftInterpretTool(
          "draft_interpret",
          { body: fixture.body, subject: fixture.subject }
        );
        const actionPlan = parseResult<InterpretResult>(interpretResult);

        const generateResult = await handleDraftGenerateTool("draft_generate", {
          actionPlan,
          subject: fixture.subject,
        });

        if ("isError" in generateResult && generateResult.isError) continue;

        const generated = parseResult<GenerateResult>(
          generateResult as { content: Array<{ text: string }> }
        );

        expect(generated.draft.bodyPlain.length).toBeGreaterThan(0);
        expect(generated.draft.bodyHtml.length).toBeGreaterThan(0);
        expect(generated.draft.bodyHtml).toContain("<!DOCTYPE html>");
      }
    });

    it("agreement detection: 0% false positive rate", async () => {
      // Emails that should NOT be detected as agreement
      const nonAgreementBodies = [
        "What time is check-in?",
        "Can we add one more person?",
        "I need to cancel my booking.",
        "How much does breakfast cost?",
        "I don't agree with the policy.",
        "The payment failed again.",
      ];

      for (const body of nonAgreementBodies) {
        const result = await handleDraftInterpretTool("draft_interpret", {
          body,
        });
        const payload = parseResult<InterpretResult>(result);
        expect(payload.agreement.status).not.toBe("confirmed");
      }
    });
  });

});

describe("TASK-18: Quality Gate Standalone", () => {
  describe("Quality Gate Standalone Verification", () => {
    it("rejects draft with prohibited claims", async () => {
      const result = await handleDraftQualityTool("draft_quality_check", {
        actionPlan: {
          language: "EN",
          intents: { questions: [] },
          workflow_triggers: { booking_monitor: false },
          scenario: { category: "faq" },
          thread_summary: { prior_commitments: [] },
        },
        draft: {
          bodyPlain:
            "Availability confirmed for your dates. Best regards, Hostel Brikette",
          bodyHtml: "<p>Availability confirmed for your dates.</p>",
        },
      });
      const payload = parseResult<QualityResult>(result);
      expect(payload.passed).toBe(false);
      expect(payload.failed_checks).toContain("prohibited_claims");
    });

    it("passes well-formed FAQ draft", async () => {
      const result = await handleDraftQualityTool("draft_quality_check", {
        actionPlan: {
          language: "EN",
          intents: { questions: [{ text: "What time is check-in?" }] },
          workflow_triggers: { booking_monitor: false },
          scenario: { category: "faq" },
          thread_summary: { prior_commitments: [] },
        },
        draft: {
          bodyPlain:
            "Thank you for your email. Check-in time starts at 2:30 pm. Although official check-in time begins at 2:30 pm, we are pleased to accommodate guests from 10:30 am onwards on check-in day. Upon arrival, we will facilitate a smooth pre-check-in process including bag drop, WiFi access, and use of our bar and terrace. Best regards, Hostel Brikette",
          bodyHtml:
            '<!DOCTYPE html><html><body><p>Thank you for your email. Check-in time starts at 2:30 pm.</p></body></html>',
        },
      });
      const payload = parseResult<QualityResult>(result);
      expect(payload.failed_checks).not.toContain("unanswered_questions");
      expect(payload.failed_checks).not.toContain("prohibited_claims");
      expect(payload.failed_checks).not.toContain("missing_signature");
    });
  });
});
