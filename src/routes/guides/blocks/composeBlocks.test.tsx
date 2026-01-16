// src/routes/guides/blocks/composeBlocks.test.tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { isValidElement } from "react";

import type { GuideManifestEntry } from "../guide-manifest";
import type { GuideSeoTemplateContext } from "../guide-seo/types";
import type { GuideKey } from "@/routes.guides-helpers";
import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import { composeBlocks } from "./composeBlocks";
import { renderWithProviders } from "@tests/renderers";

const { getGuideResourceMock } = vi.hoisted(() => ({
  getGuideResourceMock: vi.fn(),
}));

vi.mock("../utils/getGuideResource", () => ({
  __esModule: true,
  default: (...args: unknown[]) => getGuideResourceMock(...args),
}));

vi.mock("@/routes/guides/utils/getGuideResource", () => ({
  __esModule: true,
  default: (...args: unknown[]) => getGuideResourceMock(...args),
}));

vi.mock("/src/routes/guides/utils/getGuideResource.ts", () => ({
  __esModule: true,
  default: (...args: unknown[]) => getGuideResourceMock(...args),
}));

function createManifest(
  blocks: GuideManifestEntry["blocks"],
  overrides: Partial<GuideManifestEntry> = {},
): GuideManifestEntry {
  return {
    key: "luggageStorage" as GuideKey,
    slug: "test-guide",
    contentKey: "testGuide",
    status: "draft",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: [],
    relatedGuides: [],
    blocks,
    checklist: [],
    ...overrides,
  };
}

function createContext(
  overrides: Partial<GuideSeoTemplateContext> = {},
  translations: Record<string, string> = {},
): GuideSeoTemplateContext {
  const translateGuides = ((key: string, options?: { returnObjects?: boolean }) => {
    const value = translations[key];
    if (options?.returnObjects) {
      return Array.isArray(value) ? value : [];
    }
    return value ?? key;
  }) as unknown as GenericContentTranslator;

  return {
    lang: "en",
    guideKey: "luggageStorage" as GuideKey,
    metaKey: "luggageStorage",
    hasLocalizedContent: true,
    translator: translateGuides,
    translateGuides,
    sections: [],
    intro: ["Intro paragraph one", "Intro paragraph two"],
    faqs: [],
    toc: [],
    ogImage: { url: "https://example.com/og.jpg", width: 1200, height: 630 },
    article: { title: "Sample Title", description: "Sample description" },
    canonicalUrl: "https://example.com/en/guides/sample",
    ...overrides,
  };
}

describe("composeBlocks", () => {
  beforeEach(() => {
    getGuideResourceMock.mockReset();
  });

  it("creates a hero article lead with resolved alt text", () => {
    const manifest = createManifest([
      {
        type: "hero",
        options: {
          image: "/img/hero.jpg",
          altKey: "content.testGuide.heroAlt",
          introLimit: 1,
        },
      },
    ]);
    const context = createContext({}, { "content.testGuide.heroAlt": "Translated hero alt" });
    const { template } = composeBlocks(manifest);
    expect(template.articleLead).toBeDefined();
    const node = template.articleLead?.(context as GuideSeoTemplateContext);
    expect(isValidElement(node)).toBe(true);
    const { getByAltText, queryByText } = renderWithProviders(<>{node}</>);
    expect(getByAltText("Translated hero alt")).toBeInTheDocument();
    expect(queryByText("Intro paragraph two")).not.toBeInTheDocument();
  });

  it("enables generic content rendering with custom options", () => {
    const manifest = createManifest([
      { type: "genericContent", options: { showToc: true, faqHeadingLevel: 3 } },
    ]);
    const { template } = composeBlocks(manifest);
    expect(template.renderGenericContent).toBe(true);
    expect(template.genericContentOptions?.showToc).toBe(true);
    expect(template.genericContentOptions?.faqHeadingLevel).toBe(3);
  });

  it("normalises FAQ fallback entries", () => {
    getGuideResourceMock.mockImplementation((_lang: string, key: string) => {
      if (key === "content.testGuide.faqs") {
        return [
          { q: "Question", a: ["Answer"] },
          { question: "Second question", answer: ["First", "Second"] },
          { q: "", a: [] },
        ];
      }
      return undefined;
    });
    const manifest = createManifest([{ type: "faq", options: { fallbackKey: "testGuide" } }]);
    const { template } = composeBlocks(manifest);
    expect(typeof template.guideFaqFallback).toBe("function");
    const faqs = template.guideFaqFallback?.("en");
    expect(faqs).toEqual([
      { q: "Question", a: ["Answer"] },
      { q: "Second question", a: ["First", "Second"] },
    ]);
  });

  it("provides service schema additional scripts", () => {
    const manifest = createManifest([
      { type: "serviceSchema", options: { serviceTypeKey: "content.testGuide.serviceType" } },
    ]);
    const context = createContext({}, { "content.testGuide.serviceType": "Guided tours" });
    const { template, warnings } = composeBlocks(manifest);
    expect(warnings).toHaveLength(0);
    expect(typeof template.additionalScripts).toBe("function");
    const node = template.additionalScripts?.(context as GuideSeoTemplateContext);
    expect(isValidElement(node)).toBe(true);
    // ServiceStructuredData renders a <script> element; ensure data attribute exists
    const { getByText } = render(<MemoryRouter>{node}</MemoryRouter>);
    expect(
      getByText(
        (_content, element) => element?.tagName === "SCRIPT" && element.getAttribute("type") === "application/ld+json",
      ),
    ).toBeDefined();
  });

  it("merges alsoHelpful configuration", () => {
    const manifest = createManifest([
      {
        type: "alsoHelpful",
        options: { tags: ["transport", "positano"], includeRooms: true, excludeGuide: ["porterServices"] },
      },
    ]);
    const { template } = composeBlocks(manifest);
    expect(template.alsoHelpful).toEqual({
      tags: ["transport", "positano"],
      includeRooms: true,
      excludeGuide: ["porterServices"],
    });
  });
});