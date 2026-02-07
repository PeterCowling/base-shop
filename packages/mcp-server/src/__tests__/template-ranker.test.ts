/** @jest-environment node */

import { rankTemplates } from "../utils/template-ranker";

const templates = [
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
    subject: "Transportation to Hostel Brikette",
    body: "Directions via bus, ferry, or taxi.",
    category: "transportation",
  },
];

describe("template ranker", () => {
  it("applies hard rules for prepayment templates", () => {
    const result = rankTemplates(templates, {
      subject: "Payment failed",
      body: "Card declined",
      categoryHint: "prepayment",
      prepaymentStep: "first",
      prepaymentProvider: "hostelworld",
    });

    expect(result.selection).toBe("auto");
    expect(result.candidates[0]?.template.subject).toBe(
      "Prepayment - 1st Attempt Failed (Hostelworld)"
    );
  });

  it("returns top-3 BM25 candidates with confidence and evidence", () => {
    const result = rankTemplates(templates, {
      subject: "Check in time",
      body: "What time is check in?",
    });

    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates.length).toBeLessThanOrEqual(3);
    expect(result.candidates[0]?.template.subject).toBe(
      "Arriving before check-in time"
    );
    expect(result.candidates[0]?.confidence).toBeGreaterThan(0);
    expect(result.candidates[0]?.evidence.length).toBeGreaterThan(0);
  });

  it("maps confidence thresholds to auto/suggest/none", () => {
    const suggest = rankTemplates(templates, {
      subject: "Check in time breakfast",
      body: "What time is check in?",
    });

    expect(suggest.selection).toBe("suggest");

    const none = rankTemplates(templates, {
      subject: "Unrelated question breakfast lunch dinner",
      body: "Totally different topic",
    });

    expect(none.selection).toBe("none");
  });

  it("expands synonyms to improve ranking", () => {
    const result = rankTemplates(templates, {
      subject: "Arrival time",
      body: "Can we arrive early?",
    });

    expect(result.candidates[0]?.template.subject).toBe(
      "Arriving before check-in time"
    );
  });
});
