/** @jest-environment node */

import handleDraftInterpretTool from "../tools/draft-interpret";
import { evaluatePolicy } from "../tools/policy-decision";

function buildActionPlan(overrides: Record<string, unknown> = {}) {
  return {
    normalized_text: "Guest asked about check-in time.",
    language: "EN",
    intents: {
      questions: [{ text: "What time is check-in?" }],
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
      confidence: 0.9,
    },
    escalation: {
      tier: "NONE",
      triggers: [],
      confidence: 0,
    },
    ...overrides,
  };
}

describe("PolicyDecision — evaluatePolicy()", () => {
  it("TASK-08 TC-01: applies no-exceptions policy for non-refundable cancellation", () => {
    const decision = evaluatePolicy(
      buildActionPlan({
        normalized_text: "Please cancel my non-refundable booking and refund me.",
        scenario: { category: "cancellation", confidence: 0.92 },
      })
    );

    expect(decision.mandatoryContent.some((line) => /non-refundable/i.test(line))).toBe(true);
    expect(decision.prohibitedContent.some((line) => /refund/i.test(line))).toBe(true);
    expect(decision.toneConstraints).toContain("empathetic");
  });

  it("TASK-08 TC-02: HIGH escalation sets mandatory-review tier", () => {
    const decision = evaluatePolicy(
      buildActionPlan({
        scenario: { category: "payment", confidence: 0.88 },
        escalation: { tier: "HIGH", triggers: ["chargeback_hint"], confidence: 0.82 },
      })
    );

    expect(decision.reviewTier).toBe("mandatory-review");
  });

  it("TASK-08 TC-03: CRITICAL escalation sets owner-alert tier", () => {
    const decision = evaluatePolicy(
      buildActionPlan({
        scenario: { category: "payment", confidence: 0.93 },
        escalation: { tier: "CRITICAL", triggers: ["legal_threat"], confidence: 0.9 },
      })
    );

    expect(decision.reviewTier).toBe("owner-alert");
  });

  it("TASK-08 TC-04: routine FAQ keeps standard policy", () => {
    const decision = evaluatePolicy(buildActionPlan());
    expect(decision.reviewTier).toBe("standard");
    expect(decision.mandatoryContent).toEqual([]);
    expect(decision.prohibitedContent).toEqual([]);
  });

  it("TASK-08 TC-05: refundable cancellation follows refundable path", () => {
    const decision = evaluatePolicy(
      buildActionPlan({
        normalized_text: "I have a refundable booking and want to cancel.",
        scenario: { category: "cancellation", confidence: 0.89 },
      })
    );

    expect(
      decision.mandatoryContent.some((line) =>
        /if your booking is refundable/i.test(line)
      )
    ).toBe(true);
    expect(decision.mandatoryContent.some((line) => /non-refundable/i.test(line))).toBe(false);
  });

  it("TASK-08 TC-06: payment dispute with HIGH escalation adds dispute review language", () => {
    const decision = evaluatePolicy(
      buildActionPlan({
        normalized_text: "I dispute this charge and need an explanation.",
        scenario: { category: "payment", confidence: 0.9 },
        escalation: { tier: "HIGH", triggers: ["chargeback_hint"], confidence: 0.86 },
      })
    );

    expect(decision.reviewTier).toBe("mandatory-review");
    expect(
      decision.mandatoryContent.some((line) => /reviewing this with priority/i.test(line))
    ).toBe(true);
  });

  it("TASK-08 TC-07: legal threat CRITICAL escalation remains owner-alert", () => {
    const decision = evaluatePolicy(
      buildActionPlan({
        normalized_text: "My lawyer will contact you if this is not resolved.",
        scenario: { category: "payment", confidence: 0.91 },
        escalation: { tier: "CRITICAL", triggers: ["legal_threat"], confidence: 0.94 },
      })
    );

    expect(decision.reviewTier).toBe("owner-alert");
  });

  it("TASK-08 TC-08/TC-09: policy output includes mandatory/prohibited arrays and tone constraints", () => {
    const decision = evaluatePolicy(
      buildActionPlan({
        normalized_text: "Please cancel my non-refundable booking.",
        scenario: { category: "cancellation", confidence: 0.9 },
      })
    );

    expect(Array.isArray(decision.mandatoryContent)).toBe(true);
    expect(Array.isArray(decision.prohibitedContent)).toBe(true);
    expect(Array.isArray(decision.toneConstraints)).toBe(true);
    expect(decision.toneConstraints).toEqual(
      expect.arrayContaining(["professional", "empathetic", "firm"])
    );
  });

  it("TASK-08 TC-10: highest escalation tier wins when triggers are mixed", () => {
    const decision = evaluatePolicy(
      buildActionPlan({
        normalized_text: "I dispute this charge and will take legal action.",
        scenario: { category: "payment", confidence: 0.95 },
        escalation: {
          tier: "CRITICAL",
          triggers: ["chargeback_hint", "legal_threat"],
          confidence: 0.95,
        },
      })
    );

    expect(decision.reviewTier).toBe("owner-alert");
  });

  it("TASK-08 TC-11: standard refundable cancellation is not escalated", () => {
    const decision = evaluatePolicy(
      buildActionPlan({
        normalized_text: "I need to cancel my refundable booking.",
        scenario: { category: "cancellation", confidence: 0.86 },
        escalation: { tier: "NONE", triggers: [], confidence: 0 },
      })
    );

    expect(decision.reviewTier).toBe("standard");
  });

  it("TASK-08 TC-12: repeated complaint thread escalates to HIGH and maps to mandatory-review", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      subject: "Still waiting",
      body: "I am still waiting for a clear response. I feel ignored again and need an update.",
      threadContext: {
        messages: [
          { from: "Hostel Brikette <info@hostel-positano.com>", date: "2026-02-01", snippet: "Initial response." },
          { from: "Hostel Brikette <info@hostel-positano.com>", date: "2026-02-02", snippet: "Second response." },
          { from: "Hostel Brikette <info@hostel-positano.com>", date: "2026-02-03", snippet: "Third response." },
        ],
      },
    });

    if ("isError" in result && result.isError) {
      throw new Error(result.content[0].text);
    }

    const actionPlan = JSON.parse(result.content[0].text) as {
      escalation: { tier: "NONE" | "HIGH" | "CRITICAL" };
      [key: string]: unknown;
    };

    expect(actionPlan.escalation.tier).toBe("HIGH");
    const decision = evaluatePolicy(actionPlan);
    expect(decision.reviewTier).toBe("mandatory-review");
  });
});
