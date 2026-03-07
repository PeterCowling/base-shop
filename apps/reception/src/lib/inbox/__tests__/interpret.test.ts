import { interpretDraftMessage } from "../draft-core/interpret";

describe("interpretDraftMessage", () => {
  it("detects Italian inquiries", () => {
    const plan = interpretDraftMessage({
      body: "Ciao, grazie per l'aiuto. A che ora e il check-in?",
      subject: "Domanda arrivo",
    });

    expect(plan.language).toBe("IT");
  });

  it("extracts multiple guest questions", () => {
    const plan = interpretDraftMessage({
      body: "Hi, what time is check-in? Do you have luggage storage after checkout?",
      subject: "Two questions",
    });

    expect(plan.intents.questions).toHaveLength(2);
    expect(plan.intents.questions.map((item) => item.text)).toEqual([
      "Hi, what time is check-in?",
      "Do you have luggage storage after checkout?",
    ]);
  });

  it("summarizes supplied thread context", () => {
    const plan = interpretDraftMessage({
      body: "Thanks, can you confirm again if breakfast is included?",
      threadContext: {
        messages: [
          {
            from: "Alice Guest <alice@example.com>",
            date: "2026-03-05T10:00:00.000Z",
            snippet: "Hi, is breakfast included?",
          },
          {
            from: "Brikette Hostel <info@hostel-positano.com>",
            date: "2026-03-05T10:30:00.000Z",
            snippet: "Hi Alice, yes, breakfast is included and we can help with check-in.",
          },
          {
            from: "Alice Guest <alice@example.com>",
            date: "2026-03-05T11:00:00.000Z",
            snippet: "Thanks! What time is check-in?",
          },
        ],
      },
    });

    expect(plan.thread_summary).toEqual(
      expect.objectContaining({
        guest_name: "Alice Guest",
        previous_response_count: 1,
        open_questions: ["What time is check-in?"],
      }),
    );
  });

  it("fails safely on malformed input", () => {
    expect(() =>
      interpretDraftMessage({
        body: 42 as unknown as string,
        threadContext: { messages: [{ from: "bad" }] as never[] },
      }),
    ).not.toThrow();

    const plan = interpretDraftMessage({
      body: 42 as unknown as string,
      threadContext: { messages: [{ from: "bad" }] as never[] },
    });

    expect(plan.normalized_text).toBe("");
    expect(plan.language).toBe("UNKNOWN");
    expect(plan.scenario.category).toBe("general");
  });
});
