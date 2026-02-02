/** @jest-environment node */

import handleDraftInterpretTool from "../tools/draft-interpret";

function parseResult(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as {
    normalized_text: string;
    language: string;
    intents: { questions: Array<{ text: string }>; requests: Array<{ text: string }>; confirmations: Array<{ text: string }> };
    agreement: { status: string; confidence: number; requires_human_confirmation: boolean; additional_content: boolean };
    scenario: { category: string; confidence: number };
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
