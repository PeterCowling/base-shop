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

  it("auto-archives obvious vendor promotional subjects even without a known OTA domain", () => {
    const result = classifyForAdmission({
      fromRaw: "Pest Control Napoli <info@servizi-example.it>",
      subject: "🌡️ Il caldo arriva, gli infestanti anche. Proteggiti ora",
      snippet: "Soluzioni professionali di disinfestazione per la tua struttura.",
    });

    expect(result.outcome).toBe("auto-archive");
    expect(result.organizeDecision).toBe("promotional");
  });

  it("auto-archives Google review notifications", () => {
    const result = classifyForAdmission({
      fromRaw: "Google Business Profile <maps-noreply@google.com>",
      subject: "Ann left a review for Brikette Hostel",
      snippet: "See what Ann wrote about your property.",
    });

    expect(result.outcome).toBe("auto-archive");
    expect(result.organizeDecision).toBe("promotional");
  });

  it("auto-archives Amalfi district infopoint mail", () => {
    const result = classifyForAdmission({
      fromRaw: "Distretto Costa d'Amalfi <infopoint@distrettocostadamalfi.it>",
      subject: "Local tourism update",
      snippet: "Please find the latest district information.",
    });

    expect(result.outcome).toBe("auto-archive");
    expect(result.organizeDecision).toBe("promotional");
  });

  it("auto-archives IKEA sender mail", () => {
    const result = classifyForAdmission({
      fromRaw: "IKEA <ikea@news.email.ikea.it>",
      subject: "Le ultime novita IKEA",
      snippet: "Scopri le nuove offerte e idee per la casa.",
    });

    expect(result.outcome).toBe("auto-archive");
    expect(result.organizeDecision).toBe("promotional");
  });

  it("auto-archives 'A customer saved their research' subject lines", () => {
    const result = classifyForAdmission({
      fromRaw: "Platform Notification <updates@example.com>",
      subject: "A customer saved their research",
      snippet: "A customer saved their research for later.",
    });

    expect(result.outcome).toBe("auto-archive");
    expect(result.organizeDecision).toBe("promotional");
  });

  it("auto-archives SEO outreach from personal senders", () => {
    const result = classifyForAdmission({
      fromRaw: "Parker Sanchez <parkersanchez9dx@gmail.com>",
      subject: "Quick question",
      snippet: "Would you like to increase your website traffic? Our SEO strategies can help you rank higher and attract more customers.",
    });

    expect(result.outcome).toBe("auto-archive");
    expect(result.organizeDecision).toBe("promotional");
  });

  it("auto-archives influencer stay-swap outreach", () => {
    const result = classifyForAdmission({
      fromRaw: "Travel Creator <creator@example.com>",
      subject: "Collaboration idea",
      snippet: "I am an influencer and would love a free stay in exchange for photos and a feature on my blog and YouTube channel.",
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
