/** @jest-environment node */

import handleDraftInterpretTool from "../tools/draft-interpret";

function parseResult(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as {
    normalized_text: string;
    language: string;
    intents: { questions: Array<{ text: string }>; requests: Array<{ text: string }>; confirmations: Array<{ text: string }> };
    agreement: { status: string; confidence: number; requires_human_confirmation: boolean; additional_content: boolean };
    scenario: { category: string; confidence: number };
    escalation: { tier: string; triggers: string[]; confidence: number };
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
}

describe("draft_interpret", () => {
  it("TC-01: normalizes thread content", async () => {
    const body = "Hello!\n\nCan we add one more person?\n\nOn Jan 1, 2026, Pete wrote:\n> Old reply\n";
    const result = await handleDraftInterpretTool("draft_interpret", { body });
    const payload = parseResult(result);
    expect(payload.normalized_text).toContain("Can we add one more person?");
    expect(payload.normalized_text).not.toContain("Old reply");
  });

  it("TC-02: detects language", async () => {
    const itResult = await handleDraftInterpretTool("draft_interpret", { body: "Ciao, grazie per l'aiuto" });
    expect(parseResult(itResult).language).toBe("IT");

    const esResult = await handleDraftInterpretTool("draft_interpret", { body: "Hola, gracias por la ayuda" });
    expect(parseResult(esResult).language).toBe("ES");

    const enResult = await handleDraftInterpretTool("draft_interpret", { body: "Hello, thanks for your help" });
    expect(parseResult(enResult).language).toBe("EN");
  });

  it("TC-03: extracts intents", async () => {
    const body = "Can we add one more person? Please confirm availability. Yes, confirmed.";
    const result = await handleDraftInterpretTool("draft_interpret", { body });
    const payload = parseResult(result);
    expect(payload.intents.questions.length).toBeGreaterThan(0);
    expect(payload.intents.requests.length).toBeGreaterThan(0);
    expect(payload.intents.confirmations.length).toBeGreaterThan(0);
  });

  it("TC-04: classifies scenario with confidence", async () => {
    const body = "We tried payment but the card failed.";
    const result = await handleDraftInterpretTool("draft_interpret", { body });
    const payload = parseResult(result);
    expect(payload.scenario.category).toBe("payment");
    expect(payload.scenario.confidence).toBeGreaterThan(0);
  });

  it("TC-04b: classifies availability inquiries as booking-issues", async () => {
    const body = "Hello, do you have availability from March 13 to March 19 for 2 adults?";
    const result = await handleDraftInterpretTool("draft_interpret", { body });
    const payload = parseResult(result);
    expect(payload.scenario.category).toBe("booking-issues");
    expect(payload.scenario.confidence).toBeGreaterThan(0.8);
  });

  it("TC-05: agreement status none when no agreement phrases", async () => {
    const body = "Can you share availability for next weekend?";
    const result = await handleDraftInterpretTool("draft_interpret", { body });
    const payload = parseResult(result);
    expect(payload.agreement.status).toBe("none");
  });

  it("TC-06: output is JSON", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", { body: "Hello" });
    const payload = parseResult(result);
    expect(payload.normalized_text).toBeDefined();
  });

  it("TC-09: agreement detection explicit phrases", async () => {
    const short = await handleDraftInterpretTool("draft_interpret", { body: "Agree!" });
    expect(parseResult(short).agreement.status).toBe("confirmed");
    const en = await handleDraftInterpretTool("draft_interpret", { body: "I agree to the terms." });
    expect(parseResult(en).agreement.status).toBe("confirmed");
    const it = await handleDraftInterpretTool("draft_interpret", { body: "Accetto." });
    expect(parseResult(it).agreement.status).toBe("confirmed");
    const es = await handleDraftInterpretTool("draft_interpret", { body: "De acuerdo." });
    expect(parseResult(es).agreement.status).toBe("confirmed");
  });

  it("TC-09b: mention of past agreement does not auto-confirm", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "I sent an email yesterday with 'agree' to accept the terms.",
    });
    const payload = parseResult(result);
    expect(payload.agreement.status).toBe("none");
  });

  it("TC-09c: quoted reply header does not count as additional content for explicit agreement", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: `Agree!

On Fri, Jan 16, 2026 at 02:42 Hostel Positano Team <hostelpositano@gmail.com>
wrote:
> quoted previous message`,
    });
    const payload = parseResult(result);
    expect(payload.normalized_text).toBe("Agree!");
    expect(payload.agreement.status).toBe("confirmed");
    expect(payload.agreement.additional_content).toBe(false);
  });

  it("TC-10: agreement detection negation and ambiguity", async () => {
    const neg = await handleDraftInterpretTool("draft_interpret", { body: "I don't agree." });
    const negPayload = parseResult(neg);
    expect(negPayload.agreement.status).toBe("none");

    const unclear = await handleDraftInterpretTool("draft_interpret", { body: "Yes." });
    const unclearPayload = parseResult(unclear);
    expect(unclearPayload.agreement.status).toBe("unclear");
    expect(unclearPayload.agreement.requires_human_confirmation).toBe(true);
  });

  it("TC-11: additional content flagged", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "I agree, but what time is check-in?",
    });
    const payload = parseResult(result);
    expect(payload.agreement.additional_content).toBe(true);
  });

  it("TC-07: summarizes thread context", async () => {
    const threadContext = {
      messages: [
        {
          from: "Guest One <guest@example.com>",
          date: "Mon, 01 Jan 2026 10:00:00 +0000",
          snippet: "Hello, can we add one more person?",
        },
        {
          from: "Hostel Brikette <info@hostel-positano.com>",
          date: "Mon, 01 Jan 2026 12:00:00 +0000",
          snippet: "We can add another guest for €20 per night.",
        },
        {
          from: "Guest One <guest@example.com>",
          date: "Tue, 02 Jan 2026 09:00:00 +0000",
          snippet: "Thanks! Also, what time is check-in?",
        },
      ],
    };
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "Thanks! Also, what time is check-in?",
      threadContext,
    });
    const payload = parseResult(result);
    expect(payload.thread_summary?.prior_commitments).toContain(
      "We can add another guest for €20 per night."
    );
    expect(payload.thread_summary?.open_questions).toContain("Also, what time is check-in?");
    expect(payload.thread_summary?.resolved_questions).toContain("Hello, can we add one more person?");
    expect(payload.thread_summary?.guest_name).toBe("Guest One");
    expect(payload.thread_summary?.previous_response_count).toBe(1);
  });

  it("TC-08: tone history detects mixed tone", async () => {
    const threadContext = {
      messages: [
        {
          from: "Guest Two <guest2@example.com>",
          date: "Mon, 01 Jan 2026 10:00:00 +0000",
          snippet: "Dear team, could you help?",
        },
        {
          from: "Hostel Brikette <info@hostel-positano.com>",
          date: "Mon, 01 Jan 2026 11:00:00 +0000",
          snippet: "Hi! Sure thing.",
        },
      ],
    };
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "Thanks!",
      threadContext,
    });
    const payload = parseResult(result);
    expect(payload.thread_summary?.tone_history).toBe("mixed");
  });
});

describe("draft_interpret TASK-04 multi-scenario", () => {
  it("TC-04-01: legacy consumer path — singular scenario field always present", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "What time is check-in?",
    });
    const payload = JSON.parse(result.content[0].text) as {
      scenario: { category: string; confidence: number };
    };
    expect(payload.scenario).toBeDefined();
    expect(payload.scenario.category).toBeDefined();
    expect(payload.scenario.confidence).toBeGreaterThan(0);
  });

  it("TC-04-02: multi-question input yields ordered scenarios[] with deterministic confidence ordering", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "Is breakfast included? Can we store our luggage? Do you have WiFi?",
    });
    const payload = JSON.parse(result.content[0].text) as {
      scenario: { category: string; confidence: number };
      scenarios?: Array<{ category: string; confidence: number }>;
      actionPlanVersion?: string;
    };
    expect(payload.scenarios).toBeDefined();
    expect(Array.isArray(payload.scenarios)).toBe(true);
    expect(payload.scenarios!.length).toBeGreaterThanOrEqual(2);
    expect(payload.actionPlanVersion).toBe("1.1.0");
    const confidences = payload.scenarios!.map((s) => s.confidence);
    for (let i = 1; i < confidences.length; i++) {
      expect(confidences[i]).toBeLessThanOrEqual(confidences[i - 1]);
    }
    expect(payload.scenario.category).toBe(payload.scenarios![0].category);
  });

  it("TC-04-03: hard-rule dominance — cancellation is always scenarios[0]", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "I need to cancel my booking, request a refund for the card payment, and also ask about breakfast.",
    });
    const payload = JSON.parse(result.content[0].text) as {
      scenario: { category: string };
      scenarios?: Array<{ category: string; confidence: number }>;
    };
    expect(payload.scenarios).toBeDefined();
    expect(payload.scenarios!.length).toBeGreaterThanOrEqual(2);
    expect(payload.scenarios![0].category).toBe("cancellation");
    expect(payload.scenario.category).toBe("cancellation");
  });

  it("TC-04-03b: hard-rule dominance — prepayment is always scenarios[0] when present", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "Please send the prepayment link. I also have a card payment question and want to confirm my check-in time.",
    });
    const payload = JSON.parse(result.content[0].text) as {
      scenario: { category: string };
      scenarios?: Array<{ category: string; confidence: number }>;
    };
    expect(payload.scenarios).toBeDefined();
    expect(payload.scenarios![0].category).toBe("prepayment");
    expect(payload.scenario.category).toBe("prepayment");
  });
});

describe("draft_interpret TASK-03 escalation", () => {
  it("TASK-03 TC-01: refund + dispute escalates to HIGH", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "I want a refund and I am disputing this cancellation charge.",
    });
    const payload = parseResult(result);
    expect(payload.escalation.tier).toBe("HIGH");
    expect(payload.escalation.triggers).toContain("cancellation_refund_dispute");
  });

  it("TASK-03 TC-02: legal threat escalates to CRITICAL", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "If this is not resolved I will contact my lawyer and take legal action.",
    });
    const payload = parseResult(result);
    expect(payload.escalation.tier).toBe("CRITICAL");
    expect(payload.escalation.triggers).toContain("legal_threat");
  });

  it("TASK-03 TC-03: chargeback hint escalates to HIGH", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "I will start a chargeback with my bank for this payment.",
    });
    const payload = parseResult(result);
    expect(payload.escalation.tier).toBe("HIGH");
    expect(payload.escalation.triggers).toContain("chargeback_hint");
  });

  it("TASK-03 TC-04: routine FAQ remains NONE", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "What time is check-in?",
    });
    const payload = parseResult(result);
    expect(payload.escalation.tier).toBe("NONE");
    expect(payload.escalation.triggers).toEqual([]);
  });

  it("TASK-03 TC-05: platform escalation threat is CRITICAL", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "I will contact Booking.com and open a formal complaint.",
    });
    const payload = parseResult(result);
    expect(payload.escalation.tier).toBe("CRITICAL");
    expect(payload.escalation.triggers).toContain("platform_escalation_threat");
  });

  it("TASK-03 TC-06: vulnerable circumstance is HIGH", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "We had a medical emergency and need help with this cancellation.",
    });
    const payload = parseResult(result);
    expect(payload.escalation.tier).toBe("HIGH");
    expect(payload.escalation.triggers).toContain("vulnerable_circumstance");
  });

  it("TASK-03 TC-07: multiple HIGH triggers stay HIGH", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "I need a refund, this is a dispute, and I will start a chargeback.",
    });
    const payload = parseResult(result);
    expect(payload.escalation.tier).toBe("HIGH");
    expect(payload.escalation.triggers).toEqual(
      expect.arrayContaining(["cancellation_refund_dispute", "chargeback_hint"])
    );
  });

  it("TASK-03 TC-08: CRITICAL trigger dominates mixed trigger set", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "I want a refund and will contact my lawyer.",
    });
    const payload = parseResult(result);
    expect(payload.escalation.tier).toBe("CRITICAL");
    expect(payload.escalation.triggers).toEqual(
      expect.arrayContaining(["cancellation_refund_dispute", "legal_threat"])
    );
  });

  it("TASK-03 TC-09: repeated complaint with 3+ prior staff responses is HIGH", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "I am still waiting and this is unacceptable.",
      threadContext: {
        messages: [
          {
            from: "Hostel Brikette <info@hostel-positano.com>",
            date: "Mon, 01 Jan 2026 09:00:00 +0000",
            snippet: "We are checking your request.",
          },
          {
            from: "Hostel Brikette <info@hostel-positano.com>",
            date: "Mon, 01 Jan 2026 12:00:00 +0000",
            snippet: "We will send an update soon.",
          },
          {
            from: "Hostel Brikette <info@hostel-positano.com>",
            date: "Tue, 02 Jan 2026 08:00:00 +0000",
            snippet: "Thanks for your patience while we verify details.",
          },
        ],
      },
    });
    const payload = parseResult(result);
    expect(payload.thread_summary?.previous_response_count).toBe(3);
    expect(payload.escalation.tier).toBe("HIGH");
    expect(payload.escalation.triggers).toContain("repeated_complaint");
  });

  it("TASK-03 TC-10: standard scenario returns valid plan with escalation NONE", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "Do you offer luggage storage before check-in?",
      subject: "Luggage storage question",
    });
    const payload = parseResult(result);
    expect(payload.scenario.category).toBeDefined();
    expect(payload.escalation.tier).toBe("NONE");
    expect(payload.escalation.confidence).toBe(0);
  });
});

describe("draft_interpret TASK-08 — expanded request extraction", () => {
  it("TC-08-01a: captures 'I was wondering' phrasing as a request", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "I was wondering if breakfast is included for direct bookings.",
    });
    const payload = parseResult(result);
    expect(payload.intents.requests.length).toBeGreaterThan(0);
    const texts = payload.intents.requests.map((r) => r.text.toLowerCase());
    expect(texts.some((t) => t.includes("wondering"))).toBe(true);
  });

  it("TC-08-01b: captures 'we need' phrasing as a request", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "We need to store our bags before check-in.",
    });
    const payload = parseResult(result);
    expect(payload.intents.requests.length).toBeGreaterThan(0);
    const texts = payload.intents.requests.map((r) => r.text.toLowerCase());
    expect(texts.some((t) => t.includes("need"))).toBe(true);
  });

  it("TC-08-01c: captures 'would it be possible' phrasing as a request", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "Would it be possible to arrange an early check-in?",
    });
    const payload = parseResult(result);
    expect(payload.intents.requests.length).toBeGreaterThan(0);
    const texts = payload.intents.requests.map((r) => r.text.toLowerCase());
    expect(texts.some((t) => t.includes("possible"))).toBe(true);
  });

  it("TC-08-01d: dedup prevents identical extractions from overlapping patterns", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "Please could you confirm our booking details?",
    });
    const payload = parseResult(result);
    const texts = payload.intents.requests.map((r) => r.text.toLowerCase().trim());
    const uniqueTexts = [...new Set(texts)];
    expect(uniqueTexts.length).toBe(texts.length);
  });

  it("TC-08-02: snippet-only thread context populates resolved_questions for answered question", async () => {
    const threadContext = {
      messages: [
        {
          from: "Guest <guest@example.com>",
          date: "Mon, 01 Jan 2026 10:00:00 +0000",
          snippet: "Is breakfast included for direct bookings?",
        },
        {
          from: "Hostel Brikette <info@hostel-positano.com>",
          date: "Mon, 01 Jan 2026 12:00:00 +0000",
          snippet: "Yes, breakfast is included for direct bookings.",
        },
        {
          from: "Guest <guest@example.com>",
          date: "Tue, 02 Jan 2026 08:00:00 +0000",
          snippet: "Great, and what time is check-in?",
        },
      ],
    };
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "Great, and what time is check-in?",
      threadContext,
    });
    const payload = parseResult(result);
    expect(payload.thread_summary?.resolved_questions.some(
      (q) => q.toLowerCase().includes("breakfast"),
    )).toBe(true);
    expect(payload.thread_summary?.open_questions.some(
      (q) => q.toLowerCase().includes("check-in") || q.toLowerCase().includes("check in"),
    )).toBe(true);
  });
});
