/** @jest-environment node */

import handleDraftInterpretTool from "../tools/draft-interpret";

function parseResult(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as {
    normalized_text: string;
    language: string;
    intents: { questions: Array<{ text: string }>; requests: Array<{ text: string }>; confirmations: Array<{ text: string }> };
    agreement: { status: string };
    scenario: { category: string; confidence: number };
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
});
