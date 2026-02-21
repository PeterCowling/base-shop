/** @jest-environment node */

import { readFileSync } from "fs";
import { join } from "path";

import { generateEmailHtml } from "../utils/email-template";

type StoredTemplate = { subject: string; body: string; category: string };
function loadStoredTemplates(): StoredTemplate[] {
  const raw = readFileSync(
    join(process.cwd(), "packages", "mcp-server", "data", "email-templates.json"),
    "utf8"
  );
  return JSON.parse(raw) as StoredTemplate[];
}

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

describe("new template category coverage (TASK-03)", () => {
  const EXPECTED_NEW_TEMPLATES: Array<{ subject: string; category: string }> = [
    { subject: "Bar and Terrace \u2014 Hours and Access", category: "faq" },
    { subject: "Parking \u2014 Not Available, Nearby Options", category: "transportation" },
    { subject: "Pets \u2014 Policy", category: "policies" },
    { subject: "City Tax \u2014 What to Expect at Check-in", category: "check-in" },
    { subject: "Private Room vs Dormitory \u2014 Comparison", category: "booking-issues" },
    { subject: "Things to Do in Positano", category: "activities" },
    { subject: "Receipt / Invoice Request", category: "payment" },
    { subject: "Group Booking \u2014 How It Works", category: "booking-issues" },
    { subject: "Out of Hours Check-In Instructions", category: "check-in" },
    { subject: "Arriving by Bus", category: "transportation" },
  ];

  it("all 10 new templates exist in email-templates.json with correct categories", () => {
    const templates = loadStoredTemplates();
    const bySubject = new Map(templates.map((t) => [t.subject, t]));
    for (const expected of EXPECTED_NEW_TEMPLATES) {
      const found = bySubject.get(expected.subject);
      expect(found).toBeDefined();
      if (found) {
        expect(found.category).toBe(expected.category);
      }
    }
  });

  it("city tax template is categorised as check-in (not policies)", () => {
    const templates = loadStoredTemplates();
    const cityTax = templates.find((t) => t.subject === "City Tax \u2014 What to Expect at Check-in");
    expect(cityTax?.category).toBe("check-in");
    expect(cityTax?.category).not.toBe("policies");
  });

  it("new templates produce valid HTML when passed through generateEmailHtml", () => {
    const templates = loadStoredTemplates();
    for (const expected of EXPECTED_NEW_TEMPLATES) {
      const tmpl = templates.find((t) => t.subject === expected.subject);
      if (!tmpl) continue;
      const html = generateEmailHtml({
        recipientName: "Guest",
        bodyText: tmpl.body,
        subject: tmpl.subject,
      });
      expect(html).toContain("<table");
      expect(html).not.toContain("{{");
      expect(html).not.toContain("[PLACEHOLDER]");
    }
  });
});
