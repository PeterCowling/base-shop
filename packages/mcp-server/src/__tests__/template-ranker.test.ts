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
  {
    subject: "Breakfast — Eligibility and Hours",
    body: "Breakfast is served daily from 8:00 AM to 10:30 AM for direct bookings.",
    category: "breakfast",
  },
  {
    subject: "Luggage Storage — Before Check-in",
    body: "Free luggage storage from 10:30 AM on arrival day.",
    category: "luggage",
  },
  {
    subject: "WiFi Information",
    body: "Complimentary WiFi available from check-in to checkout.",
    category: "wifi",
  },
  {
    subject: "Booking Change — Date Modification",
    body: "Date changes subject to availability.",
    category: "booking-changes",
  },
  {
    subject: "Checkout Reminder",
    body: "Checkout is by 10:00 AM. Luggage storage available until 3:30 PM.",
    category: "checkout",
  },
  {
    subject: "Quiet Hours Reminder",
    body: "Quiet hours from 11:45 PM to 8:00 AM.",
    category: "house-rules",
  },
  {
    subject: "Luggage Storage — After Checkout",
    body: "After checkout, luggage storage free until 3:30 PM. Porter service available at a cost of €15 per bag.",
    category: "luggage",
  },
  {
    subject: "Age Restriction",
    body: "Our age restriction policy applies during peak seasons to maintain a comfortable environment.",
    category: "policies",
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

  it("ranks breakfast template for food/meal queries", () => {
    const result = rankTemplates(templates, {
      subject: "Is breakfast included?",
      body: "We wanted to know about the morning meal.",
    });

    expect(result.candidates[0]?.template.category).toBe("breakfast");
  });

  it("ranks luggage template for bag storage queries", () => {
    const result = rankTemplates(templates, {
      subject: "Luggage storage",
      body: "Is there luggage storage at the hostel?",
    });

    expect(result.candidates[0]?.template.category).toBe("luggage");
  });

  it("ranks wifi template for internet queries", () => {
    const result = rankTemplates(templates, {
      subject: "Internet",
      body: "Do you have wifi at the hostel?",
    });

    expect(result.candidates[0]?.template.category).toBe("wifi");
  });

  it("ranks booking-changes template for modification queries", () => {
    const result = rankTemplates(templates, {
      subject: "Change dates",
      body: "I need to modify my booking dates.",
    });

    expect(result.candidates[0]?.template.category).toBe("booking-changes");
  });

  it("ranks checkout template for departure queries", () => {
    const result = rankTemplates(templates, {
      subject: "Checkout reminder",
      body: "When is checkout? Do we return the keycard at reception?",
    });

    expect(result.candidates[0]?.template.category).toBe("checkout");
  });

  it("ranks house-rules template for quiet hours queries", () => {
    const result = rankTemplates(templates, {
      subject: "Noise",
      body: "What are the quiet hours?",
    });

    expect(result.candidates[0]?.template.category).toBe("house-rules");
  });

  it("expands fee synonym to match cost in template body", () => {
    const result = rankTemplates(templates, {
      subject: "Extra fee",
      body: "Is there an extra fee for late luggage pickup?",
    });

    expect(result.candidates[0]?.template.category).toBe("luggage");
  });

  it("expands age synonym to match restriction in template body", () => {
    const result = rankTemplates(templates, {
      subject: "Age policy",
      body: "Do you have an age limit?",
    });

    expect(result.candidates[0]?.template.category).toBe("policies");
  });
});
