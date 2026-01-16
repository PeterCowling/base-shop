import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import type { GuideSeoTemplateContext, NormalisedSection, TocItem } from "@/routes/guides/guide-seo/types";

const getFixedTMock = vi.hoisted(() =>
  vi.fn(() => (key: string) => {
    if (key === "content.etiquetteItalyAmalfi.toc.title") return "Outline";
    return key;
  }),
);

vi.mock("@/i18n", () => ({
  default: {
    getFixedT: getFixedTMock,
  },
}));

vi.mock("@/routes/guides/guide-seo/components/StructuredToc", () => ({
  default: ({ title }: { title?: string }) => (
    <div data-testid="structured-toc" data-title={title ?? ""} />
  ),
}));

vi.mock("@/routes/guides/guide-seo/utils/toc", () => ({
  normalizeTocForDisplay: (items: TocItem[]) => (Array.isArray(items) ? items : []),
  computeStructuredTocItems: () => [],
  resolveFaqTitle: () => ({ title: "", suppressed: true }),
}));

vi.mock("@/utils/debug", () => ({ debugGuide: () => {} }));
vi.mock("@/utils/errors", () => ({ logError: () => {} }));

import StructuredTocBlock from "@/routes/guides/guide-seo/components/StructuredTocBlock";

const makeTranslator = (entries: Record<string, unknown> = {}) => {
  return (key: string, options?: Record<string, unknown>) => {
    if (key in entries) return entries[key];
    if (options?.["returnObjects"]) return [];
    return key;
  };
};

const makeContext = (
  guideKey: GuideSeoTemplateContext["guideKey"],
  overrides: Partial<GuideSeoTemplateContext> = {},
): GuideSeoTemplateContext => ({
  lang: "en",
  guideKey,
  metaKey: guideKey,
  hasLocalizedContent: true,
  translator: ((key: string) => key) as GuideSeoTemplateContext["translator"],
  translateGuides: ((key: string) => key) as GuideSeoTemplateContext["translateGuides"],
  translateGuidesEn: ((key: string) => key) as GuideSeoTemplateContext["translateGuidesEn"],
  sections: [],
  intro: [],
  faqs: [],
  toc: [],
  ogImage: { url: "", width: 0, height: 0 },
  article: { title: "", description: "" },
  canonicalUrl: "/",
  ...overrides,
});

const baseItems: TocItem[] = [{ href: "#one", label: "One" }];

describe("StructuredTocBlock policy map", () => {
  beforeEach(() => {
    cleanup();
    getFixedTMock.mockClear();
  });

  it.each(["capriDayTrip", "offSeasonLongStay", "walkingTourAudio"])(
    "suppresses template ToC for %s",
    (guideKey) => {
      render(
        <StructuredTocBlock
          itemsBase={baseItems}
          context={makeContext(guideKey as GuideSeoTemplateContext["guideKey"])}
          tGuides={makeTranslator()}
          guideKey={guideKey as GuideSeoTemplateContext["guideKey"]}
          sections={[]}
          faqs={[]}
          renderGenericContent={false}
          hasLocalizedContent={true}
          showTocWhenUnlocalized={true}
        />,
      );

      expect(screen.queryByTestId("structured-toc")).toBeNull();
    },
  );

  it.each(["positanoTravelGuide", "etiquetteItalyAmalfi"])(
    "suppresses template ToC when unlocalized for %s",
    (guideKey) => {
      render(
        <StructuredTocBlock
          itemsBase={baseItems}
          context={makeContext(guideKey as GuideSeoTemplateContext["guideKey"], { hasLocalizedContent: false })}
          tGuides={makeTranslator()}
          guideKey={guideKey as GuideSeoTemplateContext["guideKey"]}
          sections={[]}
          faqs={[]}
          renderGenericContent={false}
          hasLocalizedContent={false}
          showTocWhenUnlocalized={true}
        />,
      );

      expect(screen.queryByTestId("structured-toc")).toBeNull();
    },
  );

  it.each(["workExchangeItaly", "etiquetteItalyAmalfi"])(
    "allows template ToC with GenericContent for %s when structured content exists",
    (guideKey) => {
      const sections: NormalisedSection[] = [{ id: "s1", title: "Section", body: ["Body"] }];
      render(
        <StructuredTocBlock
          itemsBase={baseItems}
          context={makeContext(guideKey as GuideSeoTemplateContext["guideKey"], { sections })}
          tGuides={makeTranslator()}
          guideKey={guideKey as GuideSeoTemplateContext["guideKey"]}
          sections={sections}
          faqs={[]}
          renderGenericContent={true}
          hasLocalizedContent={true}
          showTocWhenUnlocalized={true}
        />,
      );

      expect(screen.queryByTestId("structured-toc")).not.toBeNull();
    },
  );

  it.each([
    { guideKey: "weekend48Positano", intro: "Weekend intro", title: "Day one" },
    { guideKey: "sevenDayNoCar", intro: "Seven-day intro", title: "Day two" },
  ])("renders minimal localized content when GenericContent is suppressed", ({ guideKey, intro, title }) => {
    const sections: NormalisedSection[] = [{ id: "s1", title, body: ["Body"] }];
    render(
      <StructuredTocBlock
        itemsBase={baseItems}
        context={makeContext(guideKey as GuideSeoTemplateContext["guideKey"], {
          intro: [intro],
          sections,
          hasLocalizedContent: true,
        })}
        tGuides={makeTranslator()}
        guideKey={guideKey as GuideSeoTemplateContext["guideKey"]}
        sections={sections}
        faqs={[]}
        renderGenericContent={false}
        hasLocalizedContent={true}
        showTocWhenUnlocalized={true}
      />,
    );

    expect(screen.getByText(intro)).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("filters auto-numbered sections for soloTravelPositano", () => {
    const sections: NormalisedSection[] = [
      { id: "section-1", title: "Filtered", body: ["Hidden"] },
      { id: "custom", title: "Keep", body: ["Visible"] },
    ];
    render(
      <StructuredTocBlock
        itemsBase={baseItems}
        context={makeContext("soloTravelPositano", { sections, intro: ["Intro"] })}
        tGuides={makeTranslator()}
        guideKey="soloTravelPositano"
        sections={sections}
        faqs={[]}
        renderGenericContent={false}
        hasLocalizedContent={true}
        showTocWhenUnlocalized={true}
      />,
    );

    expect(screen.queryByText("Filtered")).toBeNull();
    expect(screen.getByText("Keep")).toBeInTheDocument();
  });

  it("allows the generic ToC title for weekend48Positano", () => {
    render(
      <StructuredTocBlock
        itemsBase={baseItems}
        context={makeContext("weekend48Positano")}
        tGuides={makeTranslator({ "labels.onThisPage": "On this page" })}
        guideKey="weekend48Positano"
        sections={[]}
        faqs={[]}
        renderGenericContent={false}
        hasLocalizedContent={true}
        showTocWhenUnlocalized={true}
        fallbackToEnTocTitle={false}
      />,
    );

    const toc = screen.getByTestId("structured-toc");
    expect(toc.getAttribute("data-title")).toBe("On this page");
  });

  it("falls back to EN ToC title for etiquetteItalyAmalfi", () => {
    render(
      <StructuredTocBlock
        itemsBase={baseItems}
        context={makeContext("etiquetteItalyAmalfi")}
        tGuides={makeTranslator({ "labels.onThisPage": "On this page" })}
        guideKey="etiquetteItalyAmalfi"
        sections={[]}
        faqs={[]}
        renderGenericContent={false}
        hasLocalizedContent={true}
        showTocWhenUnlocalized={true}
        suppressTocTitle={true}
        fallbackToEnTocTitle={false}
      />,
    );

    const toc = screen.getByTestId("structured-toc");
    expect(toc.getAttribute("data-title")).toBe("Outline");
  });
});