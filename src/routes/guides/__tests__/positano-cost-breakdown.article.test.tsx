import { beforeEach, describe, expect, it, vi } from "vitest";
import { within } from "@testing-library/react";
import { renderWithProviders } from "@tests/renderers";
import { getGuideTemplateProps, resetGuideTemplateSpy } from "@tests/guides/template-spy";
import { withGuideMocks } from "./guideTestHarness";

import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import type { GuideExtras } from "../positano-cost-breakdown/types";
import type { AppLanguage } from "@/i18n.config";
import type { GenericContentTranslator } from "@/components/guides/GenericContent";
type BuildGuideExtrasFn = typeof import("../positano-cost-breakdown/extras").buildGuideExtras;
type BuildGuideFaqFallbackFn = typeof import("../positano-cost-breakdown/guideFaqFallback").buildGuideFaqFallback;

const translationStore = vi.hoisted(() => new Map<AppLanguage, Record<string, unknown>>());

const createTranslator = (locale: AppLanguage): GenericContentTranslator => {
  const dictionary = translationStore.get(locale) ?? {};
  const translator = (key: string, options?: { defaultValue?: unknown; returnObjects?: boolean }) => {
    const value = dictionary[key];
    if (options?.returnObjects) {
      if (value !== undefined) return value;
      if (options?.defaultValue !== undefined) return options.defaultValue;
      return [];
    }
    if (value !== undefined) return value;
    if (options?.defaultValue !== undefined) return options.defaultValue;
    return key;
  };
  return translator as unknown as GenericContentTranslator;
};

const getFixedTMock = vi.hoisted(() =>
  vi.fn((locale: string, namespace: string) => {
    if (namespace === "guides") {
      return createTranslator(locale as AppLanguage);
    }
    return () => "";
  }),
);

vi.mock("@/i18n", () => ({
  __esModule: true,
  default: {
    getFixedT: (locale: string, namespace: string) => getFixedTMock(locale, namespace),
  },
}));

vi.mock("@/components/guides/GenericContent", () => ({
  __esModule: true,
  default: ({ guideKey }: { guideKey: string }) => <div data-testid="generic-content">{guideKey}</div>,
}));

vi.mock("@/components/guides/TableOfContents", () => ({
  __esModule: true,
  default: ({ title, items }: { title?: string; items: { href: string; label: string }[] }) => (
    <nav data-testid="toc">
      {title ? <h2>{title}</h2> : null}
      <ul>
        {items.map((item) => (
          <li key={item.href}>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  ),
}));

vi.mock("@/components/guides/CostBreakdown", () => ({
  __esModule: true,
  default: ({ title, items }: { title: string; items: { label: string; low: number; mid: number; high: number }[] }) => (
    <section data-testid="cost-breakdown">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={`${item.label}-${item.low}-${item.mid}-${item.high}`}>
            {item.label}: {item.low}/{item.mid}/{item.high}
          </li>
        ))}
      </ul>
    </section>
  ),
}));

vi.mock("../utils/_linkTokens", () => ({
  __esModule: true,
  renderGuideLinkTokens: (value: string, lang: string, key: string) => `${lang}:${key}:${value}`,
  stripGuideLinkTokens: (value: string) => value.replace(/%LINK:[^|]+\|([^%]+)%/g, "$1"),
}));

const buildGuideExtrasMock = vi.hoisted(() =>
  vi.fn<BuildGuideExtrasFn>((...args: Parameters<BuildGuideExtrasFn>) => {
    throw new Error(`buildGuideExtras unconfigured mock called with ${JSON.stringify(args)}`);
  }),
);
const buildGuideFaqFallbackMock = vi.hoisted(() =>
  vi.fn<BuildGuideFaqFallbackFn>((...args: Parameters<BuildGuideFaqFallbackFn>) => {
    throw new Error(`buildGuideFaqFallback unconfigured mock called with ${JSON.stringify(args)}`);
  }),
);

vi.mock("../positano-cost-breakdown/extras", () => ({
  __esModule: true,
  buildGuideExtras: (...args: Parameters<BuildGuideExtrasFn>) => buildGuideExtrasMock(...args),
}));

vi.mock("../positano-cost-breakdown/guideFaqFallback", () => ({
  __esModule: true,
  buildGuideFaqFallback: (...args: Parameters<BuildGuideFaqFallbackFn>) =>
    buildGuideFaqFallbackMock(...args),
}));

function setGuideTranslations(locale: AppLanguage, values: Record<string, unknown>) {
  if (Object.keys(values).length === 0) {
    translationStore.delete(locale);
  } else {
    translationStore.set(locale, values);
  }
}

function buildContext(lang: AppLanguage): GuideSeoTemplateContext {
  const translator = createTranslator(lang);
  return {
    lang,
    guideKey: "positanoCostBreakdown",
    metaKey: "positanoCostBreakdown",
    hasLocalizedContent: true,
    translator,
    translateGuides: translator,
    sections: [],
    intro: [],
    faqs: [],
    toc: [],
    ogImage: { url: "https://example.test/img.png", width: 1200, height: 630 },
    article: { title: "t", description: "d" },
    canonicalUrl: "https://example.test/guide",
  };
}

describe("positano-cost-breakdown article lead", () => {
  beforeEach(() => {
    translationStore.clear();
    getFixedTMock.mockClear();
    buildGuideExtrasMock.mockReset();
    buildGuideFaqFallbackMock.mockReset();
    resetGuideTemplateSpy();
  });

  it("renders structured cost breakdown content when extras are available", async () => {
    const structuredExtras: GuideExtras = {
      hasStructured: true,
      intro: ["Intro 1"],
      tocItems: [{ href: "#overview", label: "Overview" }],
      tocTitle: "Contents",
      atAGlanceLabel: "At a glance",
      costItems: [{ label: "Dormitorio", low: 20, mid: 30, high: 40 }],
      costTitle: "Nightly costs",
      sections: [{ id: "stay", title: "Stay", body: ["Paragraph 1", "Paragraph 2"] }],
      tips: ["Tip one", "Tip two"],
      tipsTitle: "Money-saving tips",
      faqs: [{ q: "Question", a: ["Answer 1", "Answer 2"] }],
      faqsTitle: "FAQs",
    };

    setGuideTranslations("it", {
      "content.positanoCostBreakdown.intro": ["Intro it"],
      "content.positanoCostBreakdown.sections": structuredExtras.sections,
      "content.positanoCostBreakdown.tips": structuredExtras.tips,
      "content.positanoCostBreakdown.faqs": structuredExtras.faqs,
      "content.positanoCostBreakdown.labels.tocTitle": structuredExtras.tocTitle,
      "content.positanoCostBreakdown.labels.tipsTitle": structuredExtras.tipsTitle,
      "content.positanoCostBreakdown.labels.faqsTitle": structuredExtras.faqsTitle,
      "labels.costBreakdownTitle": structuredExtras.costTitle,
      "content.positanoCostBreakdown.table.dorm": "Dormitorio",
    });

    const { articleLead } = await renderRouteWithExtras(structuredExtras);
    const context = buildContext("it");
    const view = renderWithProviders(articleLead(context));

    expect(view.getByTestId("cost-breakdown")).toHaveTextContent("Dormitorio");
    const toc = view.getByTestId("toc");
    const tocHrefs = within(toc).getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(tocHrefs).toEqual(expect.arrayContaining(["#stay", "#tips", "#faqs"]));
    expect(view.getByText("it:tip-0:Tip one")).toBeInTheDocument();
    expect(view.getByText("it:faq-0-0:Answer 1")).toBeInTheDocument();
  });

  it("renders the fallback cost breakdown when extras lack structure", async () => {
    const extras: GuideExtras = {
      hasStructured: false,
      intro: [],
      sections: [],
      tocItems: [],
      atAGlanceLabel: "",
      costItems: [],
      costTitle: "",
      tips: [],
      faqs: [],
    };
    const { articleLead } = await renderRouteWithExtras(extras);

    const context = buildContext("en");
    const view = renderWithProviders(articleLead(context));
    expect(view.getByTestId("cost-breakdown")).toBeInTheDocument();
    const toc = view.getByTestId("toc");
    const tocLinks = within(toc).getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(tocLinks).toEqual(["#at-a-glance"]);
  });
});

async function renderRouteWithExtras(extras: GuideExtras) {
  buildGuideExtrasMock.mockReturnValue(extras);
  buildGuideFaqFallbackMock.mockReturnValue([]);

  let articleLead: ((context: GuideSeoTemplateContext) => JSX.Element) | undefined;

  await withGuideMocks("positanoCostBreakdown", async ({ renderRoute }) => {
    await renderRoute({
      route: "/it/guides/positano-cost-breakdown",
    });

    const props = getGuideTemplateProps<{ articleLead: (context: GuideSeoTemplateContext) => JSX.Element }>();
    if (!props?.articleLead) {
      throw new Error("Guide template props missing articleLead");
    }
    articleLead = props.articleLead;
  });

  if (!articleLead) {
    throw new Error("Article lead was not captured from guide template");
  }

  return { articleLead };
}