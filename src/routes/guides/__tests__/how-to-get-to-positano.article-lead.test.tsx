import { describe, expect, it, beforeEach, vi } from "vitest";
import { renderWithProviders } from "@tests/renderers";

import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import type { GuideExtras } from "../how-to-get-to-positano.types";
import type { AppLanguage } from "@/i18n.config";
import { getGuidesTranslator } from "../how-to-get-to-positano.translators";
import { resetGuideTestState, setCurrentLanguage } from "./guides.test-utils";

vi.mock("@/components/seo/ArticleStructuredData", () => ({
  __esModule: true,
  default: ({ headline, description }: { headline: string; description: string }) => (
    <div data-testid="article-structured" data-headline={headline} data-description={description} />
  ),
}));

vi.mock("@/components/seo/BreadcrumbStructuredData", () => ({
  __esModule: true,
  default: ({ breadcrumb }: { breadcrumb: unknown }) => (
    <pre data-testid="breadcrumb-structured">{JSON.stringify(breadcrumb)}</pre>
  ),
}));

vi.mock("@/components/seo/HowToReachPositanoStructuredData", () => ({
  __esModule: true,
  default: () => <div data-testid="how-to-reach" />,
}));

vi.mock("@acme/ui/atoms/Section", () => ({
  __esModule: true,
  Section: ({ children }: { children: React.ReactNode }) => <section data-testid="ui-section">{children}</section>,
}));

vi.mock("@/components/guides/TableOfContents", () => ({
  __esModule: true,
  default: ({ items }: { items: { href: string; label: string }[] }) => (
    <nav data-testid="toc">{items.map((item) => `${item.href}:${item.label}`).join("|")}</nav>
  ),
}));

vi.mock("../utils/_linkTokens", () => ({
  __esModule: true,
  renderGuideLinkTokens: (value: string, lang: string, key: string) => `${lang}:${key}:${value}`,
}));

const { renderAdditionalScripts, HowToGetToPositanoStructuredDataPreview } = await import(
  "../how-to-get-to-positano.additional-scripts"
);
const { renderArticleLead } = await import("../how-to-get-to-positano.article-lead");

function buildContext(lang: AppLanguage): GuideSeoTemplateContext {
  setCurrentLanguage(lang);
  const translateGuides = getGuidesTranslator(lang) as GuideSeoTemplateContext["translateGuides"];
  return {
    lang,
    guideKey: "howToGetToPositano",
    metaKey: "howToGetToPositano",
    hasLocalizedContent: true,
    translator: translateGuides as GuideSeoTemplateContext["translator"],
    translateGuides,
    sections: [],
    intro: [],
    faqs: [],
    toc: [],
    ogImage: { url: "https://example.test/og.jpg", width: 1200, height: 630 },
    article: { title: "", description: "" },
    canonicalUrl: "https://example.test/en/guides/how-to-get-to-positano",
  };
}

beforeEach(() => {
  resetGuideTestState();
});

describe("renderAdditionalScripts", () => {
  it("returns structured data wrappers for the preview", () => {
    const view = renderWithProviders(<HowToGetToPositanoStructuredDataPreview />);
    expect(view.getByTestId("article-structured")).toBeInTheDocument();
    expect(view.getByTestId("breadcrumb-structured")).toBeInTheDocument();
    expect(view.getByTestId("how-to-reach")).toBeInTheDocument();
    view.unmount();

    const context = buildContext("en");
    const scripts = renderWithProviders(renderAdditionalScripts(context));
    expect(scripts.getByTestId("how-to-reach")).toBeInTheDocument();
    scripts.unmount();
  });
});

describe("renderArticleLead", () => {
  it("renders sections, intro, and table of contents when structured content exists", () => {
    const extras: GuideExtras = {
      hasStructured: true,
      intro: ["Intro paragraph"],
      sections: [
        { id: "ferries", title: "Ferries", body: ["Take the ferry"] },
      ],
      toc: [{ href: "#ferries", label: "Ferries" }],
      when: { heading: "When", items: [] },
      cheapest: { heading: "Cheapest", steps: [] },
      seasonal: { heading: "Seasonal", points: [] },
    };

    const context = buildContext("en");
    const view = renderWithProviders(renderArticleLead(context, () => extras));
    expect(view.getByTestId("ui-section")).toBeInTheDocument();
    expect(view.getByTestId("toc")).toHaveTextContent("Ferries");
    expect(view.getByText("Intro paragraph")).toBeInTheDocument();
    expect(view.getByRole("heading", { level: 2, name: "Ferries" })).toBeInTheDocument();
    expect(view.getByText("Take the ferry")).toBeInTheDocument();
    view.unmount();
  });

  it("falls back to list sections when detailed sections are missing", () => {
    const extras: GuideExtras = {
      hasStructured: false,
      intro: [],
      sections: [],
      toc: [],
      when: {
        heading: "Schedules",
        items: [
          { label: "Summer", body: "Frequent" },
          { label: "Winter", body: "Limited" },
        ],
      },
      cheapest: {
        heading: "Cheapest",
        steps: ["Megabus", "SITA bus"],
      },
      seasonal: {
        heading: "Seasonal",
        points: ["Check timetables"],
      },
    };

    const context = buildContext("it");
    const view = renderWithProviders(renderArticleLead(context, () => extras));
    expect(view.getByText("Schedules")).toBeInTheDocument();
    expect(view.getByText("Cheapest")).toBeInTheDocument();
    expect(view.getByText("Check timetables")).toBeInTheDocument();
    view.unmount();
  });
});