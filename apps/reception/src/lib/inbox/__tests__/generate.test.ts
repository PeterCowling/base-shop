import { generateDraftCandidate } from "../draft-core/generate";

describe("generateDraftCandidate", () => {
  it("selects a check-in style template and produces branded HTML", () => {
    const result = generateDraftCandidate({
      subject: "Check in time",
      recipientName: "Maria",
      actionPlan: {
        normalized_text: "What time is check-in?",
        language: "EN",
        intents: {
          questions: [{ text: "What time is check-in?", evidence: "What time is check-in" }],
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
          booking_action_required: false,
          booking_context: true,
          prepayment: false,
          terms_and_conditions: false,
        },
        scenario: { category: "check-in", confidence: 0.9 },
        scenarios: [{ category: "check-in", confidence: 0.9 }],
        actionPlanVersion: "1.1.0",
        escalation: { tier: "NONE", triggers: [], confidence: 0 },
        escalation_required: false,
      },
    });

    expect(result.templateUsed.category === "check-in" || result.templateUsed.category === "faq").toBe(true);
    expect(result.draft.bodyHtml).toContain("Cristiana's Signature");
    expect(result.draft.bodyHtml).toContain("Peter's Signature");
    expect(result.draft.bodyPlain).toContain("Dear Maria,");
  });

  it("uses the workflow-specific prepayment template path", () => {
    const result = generateDraftCandidate({
      subject: "Payment failed",
      actionPlan: {
        normalized_text: "My payment failed. What should I do?",
        language: "EN",
        intents: {
          questions: [{ text: "What should I do?", evidence: "What should I do" }],
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
          booking_action_required: false,
          booking_context: true,
          prepayment: true,
          terms_and_conditions: false,
        },
        scenario: { category: "prepayment", confidence: 0.95 },
        scenarios: [{ category: "prepayment", confidence: 0.95 }],
        actionPlanVersion: "1.1.0",
        escalation: { tier: "NONE", triggers: [], confidence: 0 },
        escalation_required: false,
      },
      prepaymentStep: "first",
      prepaymentProvider: "hostelworld",
    });

    expect(result.templateUsed.subject).toBe("Prepayment - 1st Attempt Failed (Hostelworld)");
    expect(result.templateUsed.selection).toBe("auto");
  });

  it("infers the Hostelworld provider from bookingRef when the caller does not supply one", () => {
    const result = generateDraftCandidate({
      subject: "Payment failed",
      bookingRef: "7763-123456789",
      actionPlan: {
        normalized_text: "My payment failed. What should I do?",
        language: "EN",
        intents: {
          questions: [{ text: "What should I do?", evidence: "What should I do" }],
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
          booking_action_required: false,
          booking_context: true,
          prepayment: true,
          terms_and_conditions: false,
        },
        scenario: { category: "prepayment", confidence: 0.95 },
        scenarios: [{ category: "prepayment", confidence: 0.95 }],
        actionPlanVersion: "1.1.0",
        escalation: { tier: "NONE", triggers: [], confidence: 0 },
        escalation_required: false,
      },
      prepaymentStep: "first",
    });

    expect(result.templateUsed.subject).toBe("Prepayment - 1st Attempt Failed (Hostelworld)");
    expect(result.templateUsed.selection).toBe("auto");
  });

  it("returns a best-effort draft for ambiguous input without throwing", () => {
    const result = generateDraftCandidate({
      subject: "Question",
      actionPlan: {
        normalized_text: "Can you help?",
        language: "EN",
        intents: {
          questions: [{ text: "Can you help?", evidence: "Can you help" }],
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
          booking_action_required: false,
          booking_context: false,
          prepayment: false,
          terms_and_conditions: false,
        },
        scenario: { category: "general", confidence: 0.6 },
        scenarios: [{ category: "general", confidence: 0.6 }],
        actionPlanVersion: "1.1.0",
        escalation: { tier: "NONE", triggers: [], confidence: 0 },
        escalation_required: false,
      },
    });

    expect(result.draft.bodyPlain.length).toBeGreaterThan(0);
    expect(result.draft.bodyHtml).toContain("<html");
    expect(["ready", "needs_follow_up"]).toContain(result.deliveryStatus);
  });
});
