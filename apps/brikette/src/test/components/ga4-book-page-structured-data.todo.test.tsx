import "@testing-library/jest-dom";

// Plan stub (lp-plan): converts to active tests during /lp-build.
// TC-BOOK-01: Book page renders lodging + FAQ + breadcrumb JSON-LD with required fields and no third-party aggregateRating.
// TC-BOOK-02: JSON-LD is stable across renders (snapshot) and does not leak i18n keys.

describe("Plan stub: /book structured data", () => {
  test.todo("TC-BOOK-01: should render valid lodging JSON-LD (no aggregateRating) + FAQPage + BreadcrumbList");
  test.todo("TC-BOOK-02: should not leak i18n keys on /[lang]/book for non-EN locales");
});
