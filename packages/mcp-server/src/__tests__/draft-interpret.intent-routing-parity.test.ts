/** @jest-environment node */

import handleDraftInterpretTool from "../tools/draft-interpret";

type InterpretPayload = {
  intents: {
    questions: Array<{ text: string }>;
    requests: Array<{ text: string }>;
  };
  intent_routing?: {
    selected: "deterministic" | "legacy";
    fallback_reason?: string;
    deterministic_confidence: number;
    legacy_confidence: number;
  };
};

function parsePayload(result: { content: Array<{ text: string }> }): InterpretPayload {
  return JSON.parse(result.content[0].text) as InterpretPayload;
}

describe("draft_interpret deterministic intent routing parity", () => {
  it("selects deterministic routing for clear multi-signal intent text", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body:
        "Hello, what time is check-in? Please confirm if we can store luggage after checkout.",
      subject: "Arrival details",
    });

    const payload = parsePayload(result as { content: Array<{ text: string }> });

    expect(payload.intent_routing?.selected).toBe("deterministic");
    expect(payload.intents.questions.length).toBeGreaterThanOrEqual(1);
    expect(payload.intents.requests.length).toBeGreaterThanOrEqual(1);
  });

  it("falls back to legacy extraction when deterministic coverage is weaker", async () => {
    const result = await handleDraftInterpretTool("draft_interpret", {
      body: "WiFi?",
      subject: "Quick",
    });

    const payload = parsePayload(result as { content: Array<{ text: string }> });

    expect(payload.intent_routing?.selected).toBe("legacy");
    expect(payload.intent_routing?.fallback_reason).toBe("deterministic_under_extract");
    expect(payload.intents.questions.length).toBe(1);
    expect(payload.intents.questions[0]?.text).toBe("WiFi?");
  });
});
