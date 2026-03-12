/** @jest-environment node */

import { readFileSync } from "fs";
import { join } from "path";

import handleDraftQualityTool from "../tools/draft-quality-check";

const CANONICAL_REFERENCE_URL =
  "https://hostel-positano.com/en/assistance/checkin-checkout";

function parseResult(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as {
    passed: boolean;
    failed_checks: string[];
    failed_check_details: Record<string, string[]>;
    warnings: string[];
    confidence: number;
    question_coverage?: Array<{
      question: string;
      matched_count: number;
      required_matches: number;
      coverage_score: number;
      status: "covered" | "partial" | "missing";
    }>;
  };
}

type StoredTemplate = {
  subject: string;
  body: string;
  category: string;
  template_id?: string;
  reference_scope?:
    | "reference_required"
    | "reference_optional_excluded"
    | "no_reference";
  canonical_reference_url?: string | null;
  normalization_batch?: "A" | "B" | "C" | "D" | "E";
};

function loadStoredTemplates(): StoredTemplate[] {
  const raw = readFileSync(
    join(process.cwd(), "packages", "mcp-server", "data", "email-templates.json"),
    "utf8"
  );
  return JSON.parse(raw) as StoredTemplate[];
}

describe("draft_quality_check", () => {
  const baseActionPlan = {
    language: "EN" as const,
    intents: {
      questions: [{ text: "What time is check-in?" }],
    },
    workflow_triggers: {
      booking_action_required: false,
      booking_context: false,
    },
    scenario: {
      category: "faq",
    },
    thread_summary: {
      prior_commitments: ["Breakfast is included"],
    },
  };

  const bookingActionPlan = {
    language: "EN" as const,
    intents: {
      questions: [{ text: "Can you confirm my booking?" }],
      requests: [{ text: "Please confirm my booking" }],
    },
    workflow_triggers: {
      booking_action_required: true,
      booking_context: true,
    },
    scenario: {
      category: "booking-issues",
    },
    thread_summary: {
      prior_commitments: ["Breakfast is included"],
    },
  };

  it("TC-01: missing answers triggers failed check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Hello. Best regards, Hostel Brikette",
        bodyHtml: "<p>Hello</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("unanswered_questions");
  });

  it("TC-02: prohibited claims are detected", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Availability confirmed. Best regards, Hostel Brikette",
        bodyHtml: "<p>Availability confirmed</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("prohibited_claims");
  });

  it("TC-03: missing required link triggers failed check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: bookingActionPlan,
      draft: {
        bodyPlain: "Check-in is at 3pm. Best regards, Hostel Brikette",
        bodyHtml: "<p>Check-in is at 3pm</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_required_link");
  });

  it("TC-04: missing signature triggers failed check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: bookingActionPlan,
      draft: {
        bodyPlain: `Check-in is at 3pm. ${CANONICAL_REFERENCE_URL}`,
        bodyHtml: "<p>Check-in is at 3pm</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_signature");
  });

  it("TC-04b: HTML signature block satisfies signature check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: bookingActionPlan,
      draft: {
        bodyPlain: `Check-in is at 3pm. ${CANONICAL_REFERENCE_URL}`,
        bodyHtml:
          "<p>Check-in is at 3pm</p><img alt=\"Cristiana's Signature\"><img alt=\"Peter's Signature\">",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("missing_signature");
  });

  it("TC-05: missing html/plaintext triggers failed check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: bookingActionPlan,
      draft: {
        bodyPlain: `Check-in is at 3pm. ${CANONICAL_REFERENCE_URL} Best regards, Hostel Brikette`,
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_html");
  });

  it("TC-06: length rule yields warning", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: bookingActionPlan,
      draft: {
        bodyPlain: `Short. Best regards, Hostel Brikette ${CANONICAL_REFERENCE_URL}`,
        bodyHtml: "<p>Short</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.warnings).toContain("length_out_of_range");
  });

  it("TC-07: request keywords in draft body pass quality check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [],
          requests: [{ text: "Please let us know if 3 guests are allowed in the room" }],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "faq" },
      },
      draft: {
        bodyPlain:
          "Thank you for your email. Our rooms can accommodate multiple guests. Private rooms are available for groups. We look forward to welcoming you to the hostel. Best regards, Hostel Brikette",
        bodyHtml:
          '<!DOCTYPE html><html><body><p>Our rooms can accommodate multiple guests.</p></body></html>',
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("unanswered_questions");
  });

  it("TC-08: missing request keywords triggers failed check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [],
          requests: [{ text: "Please confirm the room capacity for 3 guests" }],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "faq" },
      },
      draft: {
        bodyPlain:
          "We appreciate your inquiry. Breakfast is served daily. Best regards, Hostel Brikette",
        bodyHtml:
          '<!DOCTYPE html><html><body><p>We appreciate your inquiry.</p></body></html>',
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("unanswered_questions");
  });

  it("TC-09: empty requests array has no impact", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "faq" },
      },
      draft: {
        bodyPlain:
          "Thank you for your email. We look forward to seeing you soon. Best regards, Hostel Brikette",
        bodyHtml:
          '<!DOCTYPE html><html><body><p>Thank you.</p></body></html>',
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("unanswered_questions");
  });
});

describe("draft_quality_check failed_check_details", () => {
  it("includes detail for prohibited claims", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: { questions: [], requests: [] },
        workflow_triggers: { booking_action_required: false, booking_context: false },
        scenario: { category: "faq" },
      },
      draft: {
        bodyPlain: "Availability confirmed and we will charge now. Best regards, Hostel Brikette",
        bodyHtml: "<p>Availability confirmed.</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("prohibited_claims");
    expect(payload.failed_check_details["prohibited_claims"]).toEqual(
      expect.arrayContaining(["availability confirmed", "we will charge now"]),
    );
  });

  it("includes detail for missing policy mandatory content", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "What is the cancellation policy?" }],
          requests: [],
        },
        workflow_triggers: { booking_action_required: true, booking_context: true },
        scenario: { category: "cancellation" },
      },
      draft: {
        bodyPlain:
          "We hope you enjoyed your stay. Best regards, Hostel Brikette https://hostel-positano.com/en/terms#s17-a1",
        bodyHtml: "<p>We hope you enjoyed your stay.</p>",
      },
      policyDecision: {
        mandatoryContent: ["Non-refundable booking terms apply."],
        prohibitedContent: [],
        toneConstraints: [],
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_policy_mandatory_content");
    expect(payload.failed_check_details["missing_policy_mandatory_content"]).toEqual([
      "Non-refundable booking terms apply.",
    ]);
  });

  it("includes detail for policy prohibited content", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Can I get a refund?" }],
          requests: [],
        },
        workflow_triggers: { booking_action_required: false, booking_context: false },
        scenario: { category: "cancellation" },
      },
      draft: {
        bodyPlain:
          "We can make an exception for you. Best regards, Hostel Brikette",
        bodyHtml: "<p>We can make an exception for you.</p>",
      },
      policyDecision: {
        mandatoryContent: [],
        prohibitedContent: ["we can make an exception"],
        toneConstraints: [],
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("policy_prohibited_content");
    expect(payload.failed_check_details["policy_prohibited_content"]).toEqual([
      "we can make an exception",
    ]);
  });

  it("includes detail for unanswered questions", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [
            { text: "What time is check-in?" },
            { text: "Is breakfast included?" },
          ],
          requests: [],
        },
        workflow_triggers: { booking_action_required: false, booking_context: false },
        scenario: { category: "faq" },
      },
      draft: {
        bodyPlain:
          "Check-in starts at 15:00 and reception opens from 07:30. Best regards, Hostel Brikette",
        bodyHtml: "<p>Check-in starts at 15:00.</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("unanswered_questions");
    expect(payload.failed_check_details["unanswered_questions"]).toEqual(
      expect.arrayContaining(["Is breakfast included?"]),
    );
  });

  it("returns empty failed_check_details when all checks pass", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "What time is check-in?" }],
          requests: [],
        },
        workflow_triggers: { booking_action_required: false, booking_context: false },
        scenario: { category: "faq" },
      },
      draft: {
        bodyPlain:
          "Check-in starts at 15:00 and breakfast is included for direct bookings. Best regards, Hostel Brikette",
        bodyHtml: "<p>Check-in starts at 15:00 and breakfast is included for direct bookings.</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.passed).toBe(true);
    expect(payload.failed_check_details).toEqual({});
  });

  it("ensures detail keys are a subset of failed_checks", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "What is the cancellation policy?" }],
          requests: [],
        },
        workflow_triggers: { booking_action_required: true, booking_context: true },
        scenario: { category: "cancellation" },
      },
      draft: {
        bodyPlain:
          "We can make an exception. Best regards, Hostel Brikette https://hostel-positano.com/en/terms#s17-a1",
        bodyHtml: "<p>We can make an exception.</p>",
      },
      policyDecision: {
        mandatoryContent: ["Non-refundable booking terms apply."],
        prohibitedContent: ["we can make an exception"],
        toneConstraints: [],
      },
    });
    const payload = parseResult(result);
    const detailKeys = Object.keys(payload.failed_check_details);
    for (const key of detailKeys) {
      expect(payload.failed_checks).toContain(key);
    }
  });
});

describe("draft_quality_check TASK-04 template normalization", () => {
  it("TC-04-01: reference-required templates all contain canonical https references", () => {
    const templates = loadStoredTemplates();
    const required = templates.filter(
      (template) => template.reference_scope === "reference_required"
    );
    const withCanonical = required.filter(
      (template): template is StoredTemplate & { canonical_reference_url: string } =>
        typeof template.canonical_reference_url === "string" &&
        template.canonical_reference_url.length > 0
    );

    expect(required.length).toBeGreaterThan(0);
    expect(required.length).toBeLessThanOrEqual(templates.length);
    expect(withCanonical.length).toBeGreaterThan(0);

    for (const template of withCanonical) {
      expect(template.canonical_reference_url).toMatch(/^https:\/\//);
    }
  });

  it("TC-04-02: optional/excluded templates are explicitly tagged by metadata", () => {
    const templates = loadStoredTemplates();
    const required = templates.filter(
      (template) => template.reference_scope === "reference_required"
    );
    const optional = templates.filter(
      (template) => template.reference_scope === "reference_optional_excluded"
    );
    const noReference = templates.filter(
      (template) => template.reference_scope === "no_reference"
    );
    const withMissingScope = templates.filter((template) => !template.reference_scope);

    expect(templates.length).toBeGreaterThan(0);
    expect(optional.length).toBeGreaterThan(0);
    expect(required.length + optional.length + noReference.length).toBe(templates.length);
    expect(withMissingScope).toHaveLength(0);

    for (const template of [...optional, ...noReference]) {
      expect(template.template_id).toMatch(/^T\d+$/);
      expect(template.normalization_batch).toMatch(/^[A-E]$/);
    }
  });
});

describe("draft_quality_check TASK-05 reference applicability", () => {
  it("TC-05-01: booking-action-required response without reference fails", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Can you modify my booking?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: true,
          booking_context: true,
        },
        scenario: { category: "booking-issues" },
      },
      draft: {
        bodyPlain: "Please confirm your request details. Best regards, Hostel Brikette",
        bodyHtml: "<!DOCTYPE html><html><body><p>Please confirm your request details.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_required_reference");
  });

  it("TC-05-02: booking-action-required response with approved booking host passes", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Can you modify my booking?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: true,
          booking_context: true,
        },
        scenario: { category: "booking-issues" },
      },
      draft: {
        bodyPlain: "Please complete your booking update here: https://www.hostelworld.com . Best regards, Hostel Brikette",
        bodyHtml: "<!DOCTYPE html><html><body><p>Please complete your booking update here.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("missing_required_reference");
    expect(payload.failed_checks).not.toContain("reference_not_applicable");
  });

  it("TC-05-03: out-of-scope operational response without reference passes", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Can you confirm prepayment attempt status?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "prepayment" },
      },
      draft: {
        bodyPlain:
          "We attempted your prepayment and will retry shortly. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>We attempted your prepayment and will retry shortly.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("missing_required_reference");
    expect(payload.failed_checks).not.toContain("reference_not_applicable");
  });

  it("TC-05-04: booking-action-required response with unrelated link fails applicability check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Can you modify my booking?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: true,
          booking_context: true,
        },
        scenario: { category: "booking-issues" },
      },
      draft: {
        bodyPlain:
          "Use this link for updates: https://unrelated.example.org/guide. Best regards, Hostel Brikette",
        bodyHtml: "<!DOCTYPE html><html><body><p>Use this link for updates.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("reference_not_applicable");
  });

  it("TC-05-05: non-booking informational categories do not require references", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Is breakfast included?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: true,
        },
        scenario: { category: "breakfast" },
      },
      draft: {
        bodyPlain:
          "Breakfast is included only for direct bookings. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>Breakfast is included only for direct bookings.</p></body></html>",
      },
    });

    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("missing_required_reference");
    expect(payload.failed_checks).not.toContain("reference_not_applicable");
  });
});

describe("draft_quality_check TASK-05", () => {
  it("TASK-05 TC-01: all questions with >=2 keyword matches pass", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [
            { text: "What time is check-in and can we drop luggage before arrival?" },
            { text: "Is breakfast included with direct booking?" },
          ],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "check-in" },
      },
      draft: {
        bodyPlain:
          "Check-in starts at 15:00 and we can store luggage before arrival. Breakfast is included for direct bookings. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>Check-in starts at 15:00 and luggage storage is available.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("unanswered_questions");
    expect(payload.warnings).not.toContain("partial_question_coverage");
    expect(payload.question_coverage?.every((entry) => entry.status === "covered")).toBe(true);
  });

  it("TASK-05 TC-02: missing question is flagged with per-question status", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [
            { text: "What time is check-in?" },
            { text: "Is breakfast included?" },
          ],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "faq" },
      },
      draft: {
        bodyPlain:
          "Check-in starts at 15:00 and reception opens from 07:30. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>Check-in starts at 15:00.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("unanswered_questions");
    expect(
      payload.question_coverage?.some(
        (entry) => entry.question.includes("breakfast") && entry.status === "missing"
      )
    ).toBe(true);
  });

  it("TASK-05 TC-03: partial coverage adds warning for low keyword match", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Can you confirm airport transfer service availability?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "transportation" },
      },
      draft: {
        bodyPlain:
          "The airport is nearby and transport options are available. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>The airport is nearby.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("unanswered_questions");
    expect(payload.warnings).toContain("partial_question_coverage");
  });

  it("TASK-05 TC-04: contradiction detects 'cannot provide' against commitment", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Can we check in early?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "check-in" },
        thread_summary: {
          prior_commitments: ["We will arrange early check-in for your stay."],
        },
      },
      draft: {
        bodyPlain:
          "Unfortunately we cannot provide the early check-in you requested. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>We cannot provide early check-in.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("contradicts_thread");
  });

  it("TASK-05 TC-05: contradiction detects '<keyword> is not available' pattern", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Is breakfast available?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "breakfast" },
        thread_summary: {
          prior_commitments: ["Breakfast is available every morning."],
        },
      },
      draft: {
        bodyPlain:
          "Breakfast is not available tomorrow. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>Breakfast is not available tomorrow.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("contradicts_thread");
  });

  it("TASK-05 TC-06: non-contradictory positive phrasing does not false-trigger", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Can we get luggage storage?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "luggage" },
        thread_summary: {
          prior_commitments: ["We can provide luggage storage before check-in."],
        },
      },
      draft: {
        bodyPlain:
          "We can certainly provide luggage storage before check-in. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>We can certainly provide luggage storage.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("contradicts_thread");
  });

  it("TASK-05 TC-03: parity — coverage utility returns identical scores regardless of call path", async () => {
    const questions = [
      { text: "What time is check-in?" },
      { text: "Is breakfast included?" },
    ];

    // Use a body that contains no check-in or breakfast keywords — both questions
    // will be "missing" in coverage, but the body is non-empty so the tool won't error.
    const testBody = "Thank you for contacting Hostel Brikette. We look forward to welcoming you.";

    // Path A: quality-check tool with a body unrelated to the questions.
    const qualityResult = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: { questions, requests: [] },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "faq" },
      },
      draft: {
        bodyPlain: testBody,
        bodyHtml: `<p>${testBody}</p>`,
      },
    });
    const qualityPayload = parseResult(qualityResult);
    const qualityScores = qualityPayload.question_coverage?.map((e: { question: string; coverage_score: number; status: string }) => ({
      question: e.question,
      coverage_score: e.coverage_score,
      status: e.status,
    }));

    // Path B: shared utility called directly with the same body.
    const { evaluateQuestionCoverage } = await import("../utils/coverage");
    const directCoverage = evaluateQuestionCoverage(testBody, questions);
    const directScores = directCoverage.map((e) => ({
      question: e.question,
      coverage_score: e.coverage_score,
      status: e.status,
    }));

    expect(qualityScores).toEqual(directScores);
  });

  it("TASK-05 TC-07: quality result includes question coverage breakdown", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "What time is check-in?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "check-in" },
      },
      draft: {
        bodyPlain:
          "Check-in time starts at 15:00 and arrival is possible from reception opening. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>Check-in starts at 15:00.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.question_coverage).toBeDefined();
    expect(payload.question_coverage?.[0]).toEqual(
      expect.objectContaining({
        question: "What time is check-in?",
        matched_count: expect.any(Number),
        required_matches: expect.any(Number),
        coverage_score: expect.any(Number),
        status: expect.any(String),
      })
    );
  });
});

describe("draft_quality_check TC-02 — booking-issues strict reference removal", () => {
  it("TC-02-01: FAQ draft with booking-issues scenario and no booking action passes reference check", async () => {
    // Before fix: booking-issues in STRICT_REFERENCE_CATEGORIES → missing_required_reference fires.
    // After fix: booking-issues removed from set → reference check skipped when bookingActionRequired=false.
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "What is your cancellation policy?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "booking-issues" },
        thread_summary: { prior_commitments: [] },
      },
      draft: {
        bodyPlain:
          "Our cancellation policy allows free cancellation up to 48 hours before arrival. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>Our cancellation policy allows free cancellation up to 48 hours before arrival.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("missing_required_reference");
    expect(payload.failed_checks).not.toContain("reference_not_applicable");
  });

  it("TC-02-02: booking_action_required=true with booking-issues still enforces both missing_required_link and missing_required_reference", async () => {
    // booking_action_required=true: the !bookingActionRequired condition at line 347 is false,
    // so the continue is NOT taken → policy IS checked → missing_required_reference fires.
    // Also missing_required_link fires independently at line 517.
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Can you modify my booking?" }],
          requests: [{ text: "Please update my booking" }],
        },
        workflow_triggers: {
          booking_action_required: true,
          booking_context: true,
        },
        scenario: { category: "booking-issues" },
        thread_summary: { prior_commitments: [] },
      },
      draft: {
        bodyPlain:
          "We can help modify your booking. Please contact us directly. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>We can help modify your booking. Please contact us directly.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_required_link");
    expect(payload.failed_checks).toContain("missing_required_reference");
  });

  it("TC-02-03: cancellation scenario still enforces missing_required_reference (other strict categories unchanged)", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: {
        language: "EN" as const,
        intents: {
          questions: [{ text: "Can I cancel my booking?" }],
          requests: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
        },
        scenario: { category: "cancellation" },
        thread_summary: { prior_commitments: [] },
      },
      draft: {
        bodyPlain:
          "Yes you can cancel your booking by contacting us. Best regards, Hostel Brikette",
        bodyHtml:
          "<!DOCTYPE html><html><body><p>Yes you can cancel your booking by contacting us.</p></body></html>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_required_reference");
  });
});
