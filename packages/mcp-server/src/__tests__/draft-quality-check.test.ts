/** @jest-environment node */

import { readFileSync } from "fs";
import { join } from "path";

import handleDraftQualityTool from "../tools/draft-quality-check";

function parseResult(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as {
    passed: boolean;
    failed_checks: string[];
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

describe("draft_quality_check", () => {
  const baseActionPlan = {
    language: "EN" as const,
    intents: {
      questions: [{ text: "What time is check-in?" }],
    },
    workflow_triggers: {
      booking_monitor: true,
    },
    scenario: {
      category: "faq",
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
      actionPlan: baseActionPlan,
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
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Check-in is at 3pm. https://example.com",
        bodyHtml: "<p>Check-in is at 3pm</p>",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_signature");
  });

  it("TC-04b: HTML signature block satisfies signature check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Check-in is at 3pm. https://example.com",
        bodyHtml:
          "<p>Check-in is at 3pm</p><img alt=\"Cristiana's Signature\"><img alt=\"Peter's Signature\">",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).not.toContain("missing_signature");
  });

  it("TC-05: missing html/plaintext triggers failed check", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Check-in is at 3pm. https://example.com Best regards, Hostel Brikette",
      },
    });
    const payload = parseResult(result);
    expect(payload.failed_checks).toContain("missing_html");
  });

  it("TC-06: length rule yields warning", async () => {
    const result = await handleDraftQualityTool("draft_quality_check", {
      actionPlan: baseActionPlan,
      draft: {
        bodyPlain: "Short. Best regards, Hostel Brikette https://example.com",
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
        workflow_triggers: { booking_monitor: false },
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
        workflow_triggers: { booking_monitor: false },
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
        workflow_triggers: { booking_monitor: false },
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

describe("draft_quality_check TASK-04 template normalization", () => {
  it("TC-04-01: reference-required templates all contain canonical https references", () => {
    const templates = loadStoredTemplates();
    const required = templates.filter(
      (template) => template.reference_scope === "reference_required"
    );

    expect(required).toHaveLength(41);

    for (const template of required) {
      const fullText = `${template.subject}\n${template.body}`;
      expect(template.canonical_reference_url).toMatch(/^https:\/\//);
      expect(fullText.includes(template.canonical_reference_url ?? "")).toBe(true);
      expect(/https?:\/\//i.test(fullText)).toBe(true);
    }
  });

  it("TC-04-02: optional/excluded templates are explicitly tagged by metadata", () => {
    const templates = loadStoredTemplates();
    const optional = templates.filter(
      (template) => template.reference_scope === "reference_optional_excluded"
    );
    const withMissingScope = templates.filter((template) => !template.reference_scope);

    expect(templates).toHaveLength(53);
    expect(optional).toHaveLength(12);
    expect(withMissingScope).toHaveLength(0);

    for (const template of optional) {
      expect(template.template_id).toMatch(/^T\d{2}$/);
      expect(template.normalization_batch).toMatch(/^[A-D]$/);
    }
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
        workflow_triggers: { booking_monitor: false },
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
        workflow_triggers: { booking_monitor: false },
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
        workflow_triggers: { booking_monitor: false },
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
        workflow_triggers: { booking_monitor: false },
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
        workflow_triggers: { booking_monitor: false },
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
        workflow_triggers: { booking_monitor: false },
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
        workflow_triggers: { booking_monitor: false },
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
        workflow_triggers: { booking_monitor: false },
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
