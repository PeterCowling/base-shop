import { interpretDraftMessage } from "../draft-core/interpret";
import { normalizeThread } from "../draft-core/interpret-thread";

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

  it("strips Booking.com relay boilerplate from the normalized guest message", () => {
    const normalized = normalizeThread(
      [
        "Hello, can I leave my luggage after checkout?",
        "",
        "Reply --> https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/messaging/inbox.html?product_id=6078502124",
        "Reservation details",
        "Guest name: Matilda Urcuyo",
        "Check-in: Mon 15 Jun 2026",
        "This e-mail was sent by Booking.com",
        "[email_opened_tracking_pixel?lang=en-gb&type=to_hotel_free_text]",
      ].join("\n"),
    );

    expect(normalized).toBe("Hello, can I leave my luggage after checkout?");
  });

  it("strips Booking.com relay preamble before the actual guest message", () => {
    const normalized = normalizeThread(
      "##- Please type your reply above this line -## Confirmation number: 6433019070 You have a new message from a guest Isabella Jane Grano said: Re: Your Hostel Brikette Reservation Hi there, I just wanted to emphasize that Isabella is the guest staying there.",
    );

    expect(normalized).toBe("Hi there, I just wanted to emphasize that Isabella is the guest staying there.");
  });

  it("strips the Booking.com generated subject prefix before a short thank-you reply", () => {
    const normalized = normalizeThread(
      "##- Please type your reply above this line -## Confirmation number: 6078502124 You have a new message from a guest Matilda Urcuyo said: Re: We received this message from Matilda Urcuyo Thank you!!! Reply --> https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/messaging/inbox.html?product_id=6078502124 Reservation details Guest name: Matilda Urcuyo This e-mail was sent by Booking.com",
    );

    expect(normalized).toBe("Thank you!!!");
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
