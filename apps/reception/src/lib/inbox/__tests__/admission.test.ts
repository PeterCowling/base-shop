import { classifyForAdmission } from "../admission";

describe("classifyForAdmission", () => {
  it("admits a guest email with a booking question", () => {
    const result = classifyForAdmission({
      fromRaw: "Alice Guest <alice@example.com>",
      subject: "Question about check-in",
      snippet: "Hi, what time is check-in for our booking?",
    });

    expect(result.outcome).toBe("admit");
    expect(result.organizeDecision).toBe("needs_processing");
  });

  it("auto-archives OTA/newsletter style mail", () => {
    const result = classifyForAdmission({
      fromRaw: "Booking.com <noreply@booking.com>",
      subject: "Your booking confirmation",
      snippet: "Reservation confirmed",
      hasListIdHeader: true,
    });

    expect(result.outcome).toBe("auto-archive");
    expect(result.organizeDecision).toBe("promotional");
  });

  it("auto-archives spam-like mail", () => {
    const result = classifyForAdmission({
      fromRaw: "Scam <promo@example.net>",
      subject: "You've won the bitcoin lottery",
      snippet: "urgent transfer required",
    });

    expect(result.outcome).toBe("auto-archive");
    expect(result.organizeDecision).toBe("spam");
  });

  it("routes mixed-signal mail to review later", () => {
    const result = classifyForAdmission({
      fromRaw: "Guest Booking <noreply@booking.com>",
      subject: "Question about reservation?",
      snippet: "Can you confirm check-in time?",
    });

    expect(result.outcome).toBe("review-later");
    expect(result.organizeDecision).toBe("deferred");
  });

  it("auto-archives operational reservation notifications", () => {
    const result = classifyForAdmission({
      fromRaw: "Octorate <noreply@smtp.octorate.com>",
      subject: "New reservation ABC123 confirmed",
      snippet: "Operational reservation notice",
    });

    expect(result.outcome).toBe("auto-archive");
    expect(result.organizeDecision).toBe("booking_reservation");
  });

  it("falls back safely on malformed input", () => {
    const result = classifyForAdmission({});

    expect(result.outcome).toBe("review-later");
    expect(result.organizeDecision).toBe("deferred");
  });
});
