import itFixture from "../__fixtures__/draft-pipeline/IT-01.json";
import mltFixture from "../__fixtures__/draft-pipeline/MLT-01.json";
import ppFixture from "../__fixtures__/draft-pipeline/PP-01.json";
import sglCheckInFixture from "../__fixtures__/draft-pipeline/SGL-01.json";
import sglCancellationFixture from "../__fixtures__/draft-pipeline/SGL-04.json";
import { runQualityChecks } from "../draft-core/quality-check";

describe("runQualityChecks", () => {
  it("preserves mandatory and prohibited policy enforcement for policy-sensitive categories", () => {
    const result = runQualityChecks({
      actionPlan: {
        language: "EN",
        intents: {
          questions: [{ text: "What is the cancellation policy?", evidence: "What is the cancellation policy" }],
          requests: [],
          confirmations: [],
        },
        workflow_triggers: {
          booking_action_required: true,
          booking_context: true,
          prepayment: false,
          terms_and_conditions: true,
        },
        scenario: { category: "cancellation", confidence: 0.9 },
        scenarios: [{ category: "cancellation", confidence: 0.9 }],
        actionPlanVersion: "1.1.0",
      },
      draft: {
        bodyPlain:
          "We can make an exception and issue a full refund. Best regards, Hostel Brikette https://hostel-positano.com/en/terms#s17-a1",
        bodyHtml: "<p>We can make an exception and issue a full refund.</p>",
      },
      policyDecision: {
        mandatoryContent: [
          "As this is a non-refundable booking, we are unable to offer a refund under the booking terms.",
        ],
        prohibitedContent: ["we can make an exception", "full refund"],
        toneConstraints: ["professional", "empathetic", "firm"],
        reviewTier: "mandatory-review",
        templateConstraints: {
          allowedCategories: ["cancellation"],
        },
      },
    });

    expect(result.failed_checks).toContain("missing_policy_mandatory_content");
    expect(result.failed_checks).toContain("policy_prohibited_content");
  });

  it("warns on wrong-language output for the Italian fixture", () => {
    const result = runQualityChecks({
      actionPlan: {
        language: "IT",
        intents: {
          questions: [{ text: "La colazione e inclusa?", evidence: "La colazione e inclusa" }],
          requests: [],
          confirmations: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
          prepayment: false,
          terms_and_conditions: false,
        },
        scenario: { category: "faq", confidence: 0.7 },
        scenarios: [{ category: "faq", confidence: 0.7 }],
        actionPlanVersion: "1.1.0",
      },
      draft: {
        bodyPlain:
          "Breakfast is included for direct bookings. Best regards, Hostel Brikette",
        bodyHtml: "<p>Breakfast is included for direct bookings.</p>",
      },
    });

    expect(itFixture.id).toBe("IT-01");
    expect(result.warnings).toContain("language_mismatch");
  });

  it("exposes the five required parity fixtures with comparison metadata", () => {
    const fixtures = [
      sglCheckInFixture,
      sglCancellationFixture,
      mltFixture,
      ppFixture,
      itFixture,
    ];

    expect(fixtures.map((fixture) => fixture.id)).toEqual([
      "SGL-01",
      "SGL-04",
      "MLT-01",
      "PP-01",
      "IT-01",
    ]);
    for (const fixture of fixtures) {
      expect(fixture.expected.comparison_fields).toEqual([
        "interpreted_language",
        "dominant_scenario_category",
        "selected_template_subject",
        "selected_template_category",
        "answered_question_set",
        "quality_result",
        "branded_html_present",
      ]);
    }
  });

  it("populates failed_check_details for missing mandatory policy content", () => {
    const result = runQualityChecks({
      actionPlan: {
        language: "EN",
        intents: {
          questions: [{ text: "What is the cancellation policy?", evidence: "What is the cancellation policy" }],
          requests: [],
          confirmations: [],
        },
        workflow_triggers: {
          booking_action_required: true,
          booking_context: true,
          prepayment: false,
          terms_and_conditions: true,
        },
        scenario: { category: "cancellation", confidence: 0.9 },
        scenarios: [{ category: "cancellation", confidence: 0.9 }],
        actionPlanVersion: "1.1.0",
      },
      draft: {
        bodyPlain:
          "We can make an exception and issue a full refund. Best regards, Hostel Brikette https://hostel-positano.com/en/terms#s17-a1",
        bodyHtml: "<p>We can make an exception and issue a full refund.</p>",
      },
      policyDecision: {
        mandatoryContent: [
          "As this is a non-refundable booking, we are unable to offer a refund under the booking terms.",
        ],
        prohibitedContent: ["we can make an exception", "full refund"],
        toneConstraints: ["professional", "empathetic", "firm"],
        reviewTier: "mandatory-review",
        templateConstraints: {
          allowedCategories: ["cancellation"],
        },
      },
    });

    expect(result.failed_check_details["missing_policy_mandatory_content"]).toEqual([
      "As this is a non-refundable booking, we are unable to offer a refund under the booking terms.",
    ]);
    expect(result.failed_check_details["policy_prohibited_content"]).toEqual(
      expect.arrayContaining(["we can make an exception", "full refund"]),
    );
  });

  it("populates failed_check_details for prohibited claims", () => {
    const result = runQualityChecks({
      actionPlan: {
        language: "EN",
        intents: { questions: [], requests: [], confirmations: [] },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
          prepayment: false,
          terms_and_conditions: false,
        },
        scenario: { category: "faq", confidence: 0.8 },
        scenarios: [{ category: "faq", confidence: 0.8 }],
        actionPlanVersion: "1.1.0",
      },
      draft: {
        bodyPlain: "Availability confirmed and we will charge now. Best regards, Hostel Brikette",
        bodyHtml: "<p>Availability confirmed.</p>",
      },
    });

    expect(result.failed_checks).toContain("prohibited_claims");
    expect(result.failed_check_details["prohibited_claims"]).toEqual(
      expect.arrayContaining(["availability confirmed", "we will charge now"]),
    );
  });

  it("populates failed_check_details for unanswered questions", () => {
    const result = runQualityChecks({
      actionPlan: {
        language: "EN",
        intents: {
          questions: [
            { text: "What time is check-in?", evidence: "What time is check-in" },
            { text: "Is breakfast included?", evidence: "Is breakfast included" },
          ],
          requests: [],
          confirmations: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
          prepayment: false,
          terms_and_conditions: false,
        },
        scenario: { category: "faq", confidence: 0.8 },
        scenarios: [{ category: "faq", confidence: 0.8 }],
        actionPlanVersion: "1.1.0",
      },
      draft: {
        bodyPlain: "Check-in starts at 15:00 and reception opens from 07:30. Best regards, Hostel Brikette",
        bodyHtml: "<p>Check-in starts at 15:00.</p>",
      },
    });

    expect(result.failed_checks).toContain("unanswered_questions");
    expect(result.failed_check_details["unanswered_questions"]).toEqual(
      expect.arrayContaining(["Is breakfast included?"]),
    );
  });

  it("returns empty failed_check_details when all checks pass", () => {
    const result = runQualityChecks({
      actionPlan: {
        language: "EN",
        intents: {
          questions: [{ text: "What time is check-in?", evidence: "What time is check-in" }],
          requests: [],
          confirmations: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
          prepayment: false,
          terms_and_conditions: false,
        },
        scenario: { category: "faq", confidence: 0.8 },
        scenarios: [{ category: "faq", confidence: 0.8 }],
        actionPlanVersion: "1.1.0",
      },
      draft: {
        bodyPlain:
          "Check-in starts at 15:00 and breakfast is included for direct bookings. Best regards, Hostel Brikette",
        bodyHtml: "<p>Check-in starts at 15:00 and breakfast is included for direct bookings.</p>",
      },
    });

    expect(result.passed).toBe(true);
    expect(result.failed_check_details).toEqual({});
  });

  it("ensures failed_check_details keys are a subset of failed_checks", () => {
    const result = runQualityChecks({
      actionPlan: {
        language: "EN",
        intents: {
          questions: [{ text: "What is the cancellation policy?", evidence: "What is the cancellation policy" }],
          requests: [],
          confirmations: [],
        },
        workflow_triggers: {
          booking_action_required: true,
          booking_context: true,
          prepayment: false,
          terms_and_conditions: true,
        },
        scenario: { category: "cancellation", confidence: 0.9 },
        scenarios: [{ category: "cancellation", confidence: 0.9 }],
        actionPlanVersion: "1.1.0",
      },
      draft: {
        bodyPlain:
          "We can make an exception and issue a full refund. Best regards, Hostel Brikette https://hostel-positano.com/en/terms#s17-a1",
        bodyHtml: "<p>We can make an exception and issue a full refund.</p>",
      },
      policyDecision: {
        mandatoryContent: [
          "As this is a non-refundable booking, we are unable to offer a refund under the booking terms.",
        ],
        prohibitedContent: ["we can make an exception", "full refund"],
        toneConstraints: ["professional", "empathetic", "firm"],
        reviewTier: "mandatory-review",
        templateConstraints: {
          allowedCategories: ["cancellation"],
        },
      },
    });

    const detailKeys = Object.keys(result.failed_check_details);
    for (const key of detailKeys) {
      expect(result.failed_checks).toContain(key);
    }
  });

  it("returns question coverage breakdown for multi-question drafts", () => {
    const result = runQualityChecks({
      actionPlan: {
        language: "EN",
        intents: {
          questions: [
            { text: "What time is check-in?", evidence: "What time is check-in" },
            { text: "Is breakfast included?", evidence: "Is breakfast included" },
          ],
          requests: [],
          confirmations: [],
        },
        workflow_triggers: {
          booking_action_required: false,
          booking_context: false,
          prepayment: false,
          terms_and_conditions: false,
        },
        scenario: { category: "faq", confidence: 0.8 },
        scenarios: [{ category: "faq", confidence: 0.8 }],
        actionPlanVersion: "1.1.0",
      },
      draft: {
        bodyPlain:
          "Check-in starts at 15:00 and breakfast is included for direct bookings. Best regards, Hostel Brikette",
        bodyHtml: "<p>Check-in starts at 15:00 and breakfast is included for direct bookings.</p>",
      },
    });

    expect(result.failed_checks).not.toContain("unanswered_questions");
    expect(result.question_coverage).toHaveLength(2);
    expect(result.question_coverage.every((entry) => entry.status === "covered")).toBe(true);
  });
});
