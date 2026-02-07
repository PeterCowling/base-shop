
import "@testing-library/jest-dom";

import type { AssistanceKeywordResource } from "@/utils/parseAmaKeywords";
import { parseAssistanceKeywords } from "@/utils/parseAmaKeywords";

describe("parseAssistanceKeywords", () => {
  let fallbackResource: AssistanceKeywordResource;
  let primaryResource: AssistanceKeywordResource;

  beforeEach(() => {
    fallbackResource = {
      entries: [
        {
          type: 2,
          slug: " fallback ",
          humanReadableQuestion: "Fallback question",
          humanReadableAnswer: "Fallback answer",
          s1: "alt",
          link1: "https://fallback.example/one",
          linkText1: "Fallback link",
        },
      ],
    };

    primaryResource = {
      entries: [
        {
          type: 1,
          slug: "  ",
          humanReadableQuestion: "  How do I book?  ",
          humanReadableAnswer: "  Use the booking form.  ",
          s1: " book ",
          s2: "Book",
          s3: "book ",
          s4: "Reserve",
          s6: "reserve",
          link1: " https://example.com/book ",
          linkText1: "  ",
          link2: " https://example.com/help ",
          linkText2: "Help centre",
        },
      ],
    };
  });

  it("normalizes entries and deduplicates synonyms", () => {
    const [entry] = parseAssistanceKeywords(primaryResource, fallbackResource);

    expect(entry).toEqual({
      type: 1,
      slug: "entry-1",
      question: "How do I book?",
      answer: "Use the booking form.",
      synonyms: ["book", "Book", "Reserve", "reserve"],
      links: [
        { href: "https://example.com/book", text: "https://example.com/book" },
        { href: "https://example.com/help", text: "Help centre" },
      ],
    });
  });

  it("falls back to secondary resource when primary is empty", () => {
    const result = parseAssistanceKeywords({ entries: [] }, fallbackResource);

    expect(result).toEqual([
      {
        type: 2,
        slug: "fallback",
        question: "Fallback question",
        answer: "Fallback answer",
        synonyms: ["alt"],
        links: [{ href: "https://fallback.example/one", text: "Fallback link" }],
      },
    ]);
  });

  it("returns an empty array when there are no entries", () => {
    expect(parseAssistanceKeywords(undefined, undefined)).toEqual([]);
  });
});