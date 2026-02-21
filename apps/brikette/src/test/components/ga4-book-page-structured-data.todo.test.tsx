import "@testing-library/jest-dom";

import React from "react";
import { render } from "@testing-library/react";

// Mock react-i18next — provide mock faq items for FAQPage JSON-LD
jest.mock("react-i18next", () => ({
  useTranslation: (namespace: string) => ({
    t: (key: string, options?: { defaultValue?: string; returnObjects?: boolean }) => {
      if (namespace === "faq" && key === "items" && options?.returnObjects) {
        return [
          { q: "What are check-in times?", a: "Check-in is from 15:30." },
          { q: "Is breakfast included?", a: "Yes, book direct for free breakfast." },
        ];
      }
      return options?.defaultValue ?? key;
    },
    i18n: { language: "en" },
    ready: true,
  }),
}));

// Mock BookStructuredData to avoid rendering the full hotel node (tested separately)
jest.mock("../../components/seo/BookStructuredData", () => ({
  __esModule: true,
  default: ({ lang }: { lang: string }) => (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Hostel",
          "@id": `https://hostel-positano.com/#hotel`,
          name: "Hostel Brikette",
          mainEntityOfPage: `https://hostel-positano.com/${lang}/book`,
        }),
      }}
    />
  ),
}));

const BookPageStructuredData = require("../../components/seo/BookPageStructuredData")
  .default as typeof import("../../components/seo/BookPageStructuredData").default;

describe("/book structured data — TASK-13 contract", () => {
  // TC-BOOK-01: renders Hostel + FAQPage + BreadcrumbList
  it("TC-BOOK-01: renders Hostel + FAQPage + BreadcrumbList JSON-LD scripts", () => {
    const { container } = render(<BookPageStructuredData lang="en" />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');

    const parsed = Array.from(scripts).map((s) => JSON.parse(s.textContent!));

    const hostelNode = parsed.find((d) => d["@type"] === "Hostel");
    expect(hostelNode).toBeDefined();
    expect(hostelNode!["@context"]).toBe("https://schema.org");
    // CRITICAL: no third-party aggregateRating
    expect(hostelNode!.aggregateRating).toBeUndefined();
    expect(hostelNode!.mainEntityOfPage).toContain("/en/book");

    const faqNode = parsed.find((d) => d["@type"] === "FAQPage");
    expect(faqNode).toBeDefined();
    expect(faqNode!["@context"]).toBe("https://schema.org");
    expect(Array.isArray(faqNode!.mainEntity)).toBe(true);
    expect(faqNode!.mainEntity.length).toBeGreaterThanOrEqual(1);
    expect(faqNode!.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: expect.any(String),
      acceptedAnswer: { "@type": "Answer", text: expect.any(String) },
    });

    const breadcrumbNode = parsed.find((d) => d["@type"] === "BreadcrumbList");
    expect(breadcrumbNode).toBeDefined();
    expect(breadcrumbNode!["@context"]).toBe("https://schema.org");
    expect(Array.isArray(breadcrumbNode!.itemListElement)).toBe(true);
    expect(breadcrumbNode!.itemListElement.length).toBeGreaterThanOrEqual(2);
    expect(breadcrumbNode!.itemListElement[breadcrumbNode!.itemListElement.length - 1].item).toContain("/book");
  });

  // TC-BOOK-02: no i18n key leakage for non-EN locales
  it("TC-BOOK-02: no i18n key leakage for non-EN locales (de, es)", () => {
    for (const lang of ["de", "es"] as const) {
      const { container } = render(<BookPageStructuredData lang={lang} />);
      const scripts = container.querySelectorAll('script[type="application/ld+json"]');
      const allJson = Array.from(scripts)
        .map((s) => s.textContent!)
        .join(" ");

      // Raw i18n key patterns should not appear in output
      expect(allJson).not.toMatch(/\{\{.*\}\}/);
      expect(allJson).not.toMatch(/\$t\(/);
    }
  });
});
