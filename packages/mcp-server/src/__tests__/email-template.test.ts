/** @jest-environment node */

import { generateEmailHtml } from "../utils/email-template";

describe("generateEmailHtml", () => {
  const baseOptions = {
    recipientName: "Maria",
    bodyText: "Thanks for reaching out.\n\nWe are happy to help.",
    includeBookingLink: true,
    subject: "Test Subject",
  };

  it("renders table-based layout with branded yellow scheme", () => {
    const html = generateEmailHtml(baseOptions);

    expect(html).toContain("<table");
    expect(html).toContain("#ffc107");
    expect(html).toContain("#fff3cd");
    expect(html).toContain("#856404");
  });

  it("includes logo picture with AVIF fallback and alt text", () => {
    const html = generateEmailHtml(baseOptions);

    expect(html).toContain("<picture>");
    expect(html).toContain("type=\"image/avif\"");
    expect(html).toContain("Hostel Icon");
  });

  it("renders dual signatures with images and alt text", () => {
    const html = generateEmailHtml(baseOptions);

    expect(html).toContain("Cristiana's Signature");
    expect(html).toContain("Peter's Signature");
    expect(html).not.toContain("With warm regards,");
    expect(html).not.toContain("Peter Cowling</div>");
    expect(html).not.toContain("Cristiana Marzano Cowling</div>");
  });

  it("includes social links and terms link in footer", () => {
    const html = generateEmailHtml(baseOptions);

    expect(html).toContain("instagram.com");
    expect(html).toContain("tiktok.com");
    expect(html).toContain("hostel-positano.com");
    expect(html).toContain("Terms and conditions");
  });

  it("uses a single personalized greeting when body already starts with Dear Guest", () => {
    const html = generateEmailHtml({
      ...baseOptions,
      recipientName: "Dedra",
      bodyText: "Dear Guest,\n\nThanks for your message.\n\nBest regards,\nHostel Brikette",
    });

    const dearDedraCount = (html.match(/Dear Dedra,/g) || []).length;
    const dearGuestCount = (html.match(/Dear Guest,/g) || []).length;
    expect(dearDedraCount).toBe(1);
    expect(dearGuestCount).toBe(0);
  });

  it("preserves a custom greeting from body and does not duplicate it", () => {
    const html = generateEmailHtml({
      ...baseOptions,
      recipientName: "Maria",
      bodyText: "Dear Alessia,\n\nThanks for your message.\n\nBest regards,\nHostel Brikette",
    });

    const dearAlessiaCount = (html.match(/Dear Alessia,/g) || []).length;
    const dearMariaCount = (html.match(/Dear Maria,/g) || []).length;
    expect(dearAlessiaCount).toBe(1);
    expect(dearMariaCount).toBe(0);
  });
});
