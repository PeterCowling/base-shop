import path from "node:path";
import { fileURLToPath } from "node:url";

import path from "node:path";
import { fileURLToPath } from "node:url";

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FaqResource, FaqResourceImporter } from "@/utils/faq";

const supportedLanguages = ["en", "es", "it", "zz"];

vi.mock("@/config", () => ({
  isSupportedLanguage: (lang: string) => ["en", "es", "it"].includes(lang),
}));

vi.mock("@/i18n.config", () => ({
  i18nConfig: {
    supportedLngs: supportedLanguages,
  },
}));

const defineFaqMock = (lang: string, resource: FaqResource | undefined) => {
  vi.doMock(`@/locales/${lang}/faq.json`, () => ({
    __esModule: true,
    default: resource,
  }));
};

describe("parseFaqResource", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("normalizes FAQ entries and skips incomplete ones", async () => {
    const mod = await import("@/utils/faq");
    const result = mod.parseFaqResource(
      {
        items: [
          {
            id: " faq-1 ",
            question: "  What is check-in time?  ",
            answer: "  After 2pm  ",
            sourceUrl: "  https://example.com  ",
            sourceLabel: "  Learn more  ",
          },
          {
            id: "missing",
            question: "",
            answer: "No question",
          },
        ],
      },
      {
        items: [
          {
            id: "fallback",
            question: "Fallback question",
            answer: "Fallback answer",
          },
        ],
      },
    );

    expect(result).toEqual([
      {
        id: "faq-1",
        question: "What is check-in time?",
        answer: "After 2pm",
        sourceUrl: "https://example.com",
        sourceLabel: "Learn more",
      },
    ]);
  });

  it("falls back to secondary resource when primary has no items", async () => {
    const mod = await import("@/utils/faq");
    const result = mod.parseFaqResource(undefined, {
      items: [
        {
          question: "When is breakfast?",
          answer: "Every morning",
        },
      ],
    });

    expect(result).toEqual([
      {
        id: "faq-1",
        question: "When is breakfast?",
        answer: "Every morning",
      },
    ]);
  });
});

describe("loadFaqEntries", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    defineFaqMock("es", {
      items: [
        {
          id: "faq-1",
          question: "",
          answer: "",
        },
      ],
    });
    defineFaqMock("it", {
      items: [
        {
          id: "faq-1",
          question: "Cosa devo portare?",
          answer: "Scarpe comode",
        },
      ],
    });
  });

  it("builds machine-layer FAQ entries for supported languages", async () => {
    defineFaqMock("en", {
      items: [
        {
          id: "faq-1",
          question: "What should I pack?",
          answer: "Comfortable shoes",
        },
      ],
    });
    const mod = await import("@/utils/faq");

    const result = await mod.loadFaqEntries();

    expect(result).toEqual([
      {
        id: "faq-1",
        q: {
          en: "What should I pack?",
          es: "What should I pack?",
          it: "Cosa devo portare?",
        },
        a: {
          en: "Comfortable shoes",
          es: "Comfortable shoes",
          it: "Scarpe comode",
        },
      },
    ]);
  });

  it("throws when English translations are missing", async () => {
    const mod = await import("@/utils/faq");

    await expect(mod.loadFaqEntries(makeImporter({ en: { items: [] } }))).rejects.toThrow(
      "English FAQ translations are required",
    );
  });
});