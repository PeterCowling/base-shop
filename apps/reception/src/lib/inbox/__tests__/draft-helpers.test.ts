import { evaluateQuestionCoverage } from "../draft-core/coverage";
import { stripLegacySignatureBlock } from "../draft-core/email-signature";
import { generateEmailHtml } from "../draft-core/email-template";
import { evaluatePolicy } from "../draft-core/policy-decision";
import {
  type EmailTemplate,
  PER_QUESTION_FLOOR,
  rankTemplates,
  rankTemplatesPerQuestion,
} from "../draft-core/template-ranker";

const templates: EmailTemplate[] = [
  {
    subject: "Prepayment - 1st Attempt Failed (Hostelworld)",
    body: "We attempted to run the payment but it failed.",
    category: "prepayment",
  },
  {
    subject: "Cancellation of Non-Refundable Booking",
    body: "We can cancel your booking but the policy is non-refundable.",
    category: "cancellation",
  },
  {
    subject: "Arriving before check-in time",
    body: "Check-in time begins at 2:30 pm, early arrival is possible.",
    category: "check-in",
  },
  {
    subject: "Breakfast - Eligibility and Hours",
    body: "Breakfast is served daily from 8:00 AM to 10:30 AM for direct bookings.",
    category: "breakfast",
  },
  {
    subject: "Luggage Storage - After Checkout",
    body: "After checkout, luggage storage free until 3:30 PM. Porter service available at a cost of EUR 15 per bag.",
    category: "luggage",
  },
  {
    subject: "WiFi Information",
    body: "Complimentary WiFi available from check-in to checkout.",
    category: "wifi",
  },
  {
    subject: "Age Restriction",
    body: "Our age restriction policy applies during peak seasons to maintain a comfortable environment.",
    category: "policies",
  },
];

describe("draft helper layer", () => {
  it("loads priors-backed ranker logic without MCP path imports and selects hard-rule prepayment templates", () => {
    const result = rankTemplates(templates, {
      subject: "Payment failed",
      body: "Card declined",
      categoryHint: "prepayment",
      prepaymentStep: "first",
      prepaymentProvider: "hostelworld",
    });

    expect(result.selection).toBe("auto");
    expect(result.candidates[0]?.template.subject).toBe(
      "Prepayment - 1st Attempt Failed (Hostelworld)",
    );
  });

  it("reports covered, partial, and missing outcomes", () => {
    const covered = evaluateQuestionCoverage("Breakfast is included and WiFi is free.", [
      { text: "Is breakfast included?" },
    ]);
    const partial = evaluateQuestionCoverage("We have quiet hours.", [
      { text: "What are the quiet hours policy details?" },
    ]);
    const missing = evaluateQuestionCoverage("Thanks for reaching out.", [
      { text: "Do you have luggage storage?" },
    ]);

    expect(covered[0]?.status).toBe("covered");
    expect(partial[0]?.status).toBe("partial");
    expect(missing[0]?.status).toBe("missing");
  });

  it("renders branded HTML and strips legacy signatures", () => {
    const html = generateEmailHtml({
      recipientName: "Maria",
      bodyText: "Dear Guest,\n\nCheck-in starts at 2:30 PM.",
      subject: "Check-in information",
    });
    const stripped = stripLegacySignatureBlock(
      "Check-in starts at 2:30 PM.\n\nWarm regards,\n\nPeter Cowling\nOwner",
    );

    expect(html).toContain("Dear Maria,");
    expect(html).toContain("Cristiana's Signature");
    expect(html).toContain("Peter's Signature");
    expect(stripped).toBe("Check-in starts at 2:30 PM.");
  });

  it("preserves mandatory and prohibited policy behavior for cancellation and payment", () => {
    const cancellation = evaluatePolicy({
      normalized_text: "Please cancel my non-refundable booking and refund me.",
      scenario: { category: "cancellation", confidence: 0.9 },
      escalation: { tier: "NONE", triggers: [], confidence: 0 },
      intents: { questions: [], requests: [], confirmations: [] },
    });
    const payment = evaluatePolicy({
      normalized_text: "I dispute this payment charge.",
      scenario: { category: "payment", confidence: 0.9 },
      escalation: { tier: "HIGH", triggers: ["chargeback_hint"], confidence: 0.85 },
      intents: { questions: [], requests: [], confirmations: [] },
    });

    expect(cancellation.mandatoryContent.some((line) => /non-refundable/i.test(line))).toBe(true);
    expect(cancellation.prohibitedContent.some((line) => /refund/i.test(line))).toBe(true);
    expect(payment.mandatoryContent.some((line) => /secure payment process/i.test(line))).toBe(true);
    expect(payment.reviewTier).toBe("mandatory-review");
  });

  it("ranks per question without cross-contamination and enforces the floor", () => {
    const result = rankTemplatesPerQuestion(
      [
        { text: "Is breakfast included?" },
        { text: "Can we store luggage?" },
        { text: "Do you have WiFi?" },
      ],
      templates,
    );
    const lowSignal = rankTemplatesPerQuestion([{ text: "Do you have a rooftop pool?" }], templates);

    expect(result[0]?.candidates[0]?.template.category).toBe("breakfast");
    expect(result[1]?.candidates[0]?.template.category).toBe("luggage");
    expect(result[2]?.candidates[0]?.template.category).toBe("wifi");
    expect(PER_QUESTION_FLOOR).toBe(25);
    expect(lowSignal[0]?.candidates).toHaveLength(0);
  });
});
