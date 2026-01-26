
import "@testing-library/jest-dom";

import {
  buildFaqJsonLd,
  faqEntriesToJsonLd,
  normalizeFaqEntries,
} from "@/utils/buildFaqJsonLd";

describe("buildFaqJsonLd", () => {
  it("normalizes mixed FAQ shapes and drops invalid entries", () => {
    const raw = [
      { q: "How long?", a: ["About 10 minutes."] },
      { question: "" },
      { question: "Where?", answer: "At the dock" },
    ];

    expect(normalizeFaqEntries(raw)).toEqual([
      { question: "How long?", answer: ["About 10 minutes."] },
      { question: "Where?", answer: ["At the dock"] },
    ]);
  });

  it("serializes entries into FAQPage JSON-LD and handles empty input", () => {
    const entries = [{ question: "How long?", answer: ["About 10 minutes."] }];
    const json = faqEntriesToJsonLd("en", "https://example.com", entries);
    expect(json).toEqual(expect.objectContaining({ "@type": "FAQPage" }));
    expect(json?.mainEntity[0].acceptedAnswer.text).toContain("About 10 minutes.");
    expect(faqEntriesToJsonLd("en", "https://example.com", [])).toBeNull();
  });

  it("provides a wrapper that pipes through normalization", () => {
    const raw = [{ q: "When?", a: ["Summer"] }];
    const json = buildFaqJsonLd("en", "https://example.com", raw);
    expect(json?.mainEntity[0].name).toContain("When?");
    expect(json?.mainEntity[0].acceptedAnswer.text).toContain("Summer");
  });
});
