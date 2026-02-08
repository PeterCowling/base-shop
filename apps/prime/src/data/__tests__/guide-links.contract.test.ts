import { composeAssistantAnswer, validateAssistantLinks } from "../../lib/assistant/answerComposer";

describe("guide links contract", () => {
  it("TC-01: assistant transport answer links are allowlisted and non-empty", () => {
    const answer = composeAssistantAnswer("How do I get around Positano?");
    expect(answer.links.length).toBeGreaterThan(0);
    expect(validateAssistantLinks(answer.links)).toBe(true);
  });

  it("TC-02: local activities answer deep-links into guide topic", () => {
    const answer = composeAssistantAnswer("What activities are nearby?");
    expect(answer.links.some((link) => link.href.includes("/positano-guide?topic=activities"))).toBe(true);
  });
});
