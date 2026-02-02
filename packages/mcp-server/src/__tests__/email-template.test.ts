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
    expect(html).toContain("Cristiana Marzano Cowling");
    expect(html).toContain("Peter Cowling");
  });

  it("includes social links and terms link in footer", () => {
    const html = generateEmailHtml(baseOptions);

    expect(html).toContain("instagram.com");
    expect(html).toContain("tiktok.com");
    expect(html).toContain("hostel-positano.com");
    expect(html).toContain("Terms and conditions");
  });
});
