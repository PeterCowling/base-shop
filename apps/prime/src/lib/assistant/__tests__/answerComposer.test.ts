import { composeAssistantAnswer, validateAssistantLinks } from "../answerComposer";

describe("assistant answer composer", () => {
  it("TC-01: known transport question returns concise answer plus canonical links", () => {
    const answer = composeAssistantAnswer("How do I get to the hostel from Naples?");
    expect(answer.answerType).toBe("known");
    expect(answer.links.length).toBeGreaterThan(0);
    expect(validateAssistantLinks(answer.links)).toBe(true);
  });

  it("TC-02: unknown question returns safe fallback with escalation link", () => {
    const answer = composeAssistantAnswer("What is your quantum teleportation policy?");
    expect(answer.answerType).toBe("fallback");
    expect(answer.links.length).toBeGreaterThan(0);
    expect(answer.links[0]?.href).toBe("/booking-details");
  });

  it("TC-03: link validation rejects non-allowlisted links", () => {
    expect(
      validateAssistantLinks([
        { label: "unsafe", href: "https://example.com/not-allowed" },
      ]),
    ).toBe(false);
  });
});
