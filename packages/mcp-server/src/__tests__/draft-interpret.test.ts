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
    const en = await handleDraftInterpretTool("draft_interpret", { body: "I agree to the terms." });
    expect(parseResult(en).agreement.status).toBe("confirmed");
    const it = await handleDraftInterpretTool("draft_interpret", { body: "Accetto." });
    expect(parseResult(it).agreement.status).toBe("confirmed");
    const es = await handleDraftInterpretTool("draft_interpret", { body: "De acuerdo." });
    expect(parseResult(es).agreement.status).toBe("confirmed");
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
