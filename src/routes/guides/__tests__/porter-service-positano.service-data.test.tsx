import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@tests/renderers";

import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import { GUIDE_KEY, OG_IMAGE } from "@/routes/guides/porter-service-positano.constants";

vi.mock("@/components/seo/ServiceStructuredData", () => ({
  __esModule: true,
  default: vi.fn((props: Record<string, unknown>) => (
    <div data-testid="service-structured" data-props={JSON.stringify(props)} />
  )),
}));

vi.mock("@/components/seo/ArticleStructuredData", () => ({
  __esModule: true,
  default: vi.fn((props: Record<string, unknown>) => (
    <div data-testid="article-structured" data-props={JSON.stringify(props)} />
  )),
}));

vi.mock("@/components/seo/BreadcrumbStructuredData", () => ({
  __esModule: true,
  default: vi.fn((props: Record<string, unknown>) => (
    <div data-testid="breadcrumb-structured" data-props={JSON.stringify(props)} />
  )),
}));

vi.mock("@/routes.guides-helpers", () => ({
  guideHref: vi.fn((lang: string) => `/${lang}/guides/${GUIDE_KEY}`),
}));

vi.mock("@/utils/translationFallbacks", () => ({
  getGuideLinkLabel: vi.fn(),
}));

const { createAdditionalScripts, PorterServiceStructuredDataPreview, __TESTING__ } = await import(
  "@/routes/guides/porter-service-positano.service-data"
);

const serviceStructuredDataMock = vi.mocked(
  await import("@/components/seo/ServiceStructuredData")
);
const articleStructuredDataMock = vi.mocked(
  await import("@/components/seo/ArticleStructuredData")
);
const breadcrumbStructuredDataMock = vi.mocked(
  await import("@/components/seo/BreadcrumbStructuredData")
);
const guideHrefMock = vi.mocked(await import("@/routes.guides-helpers"));
const { getGuideLinkLabel } = await import("@/utils/translationFallbacks");

const getGuideLinkLabelMock = vi.mocked(getGuideLinkLabel);

const baseContext: GuideSeoTemplateContext = {
  lang: "it",
  guideKey: GUIDE_KEY,
  metaKey: GUIDE_KEY,
  hasLocalizedContent: true,
  translator: (() => "") as unknown as GuideSeoTemplateContext["translator"],
  translateGuides: (() => "") as unknown as GuideSeoTemplateContext["translateGuides"],
  sections: [],
  intro: [],
  faqs: [],
  toc: [],
  ogImage: { url: "https://cdn.example/og.png", width: OG_IMAGE.width, height: OG_IMAGE.height },
  article: { title: "Prenota Porter Service", description: "Descrizione" },
  canonicalUrl: "https://example.com/porter-service?utm=1#hash",
};

const fallbackGuides = ((key: string) => key) as unknown as GuideSeoTemplateContext["translateGuides"];

describe("porter service structured data", () => {
  beforeEach(() => {
    serviceStructuredDataMock.default.mockClear();
    articleStructuredDataMock.default.mockClear();
    breadcrumbStructuredDataMock.default.mockClear();
    guideHrefMock.guideHref.mockClear();
    guideHrefMock.guideHref.mockReturnValue(`/${baseContext.lang}/guides/porter-service-positano`);
    getGuideLinkLabelMock.mockReset();
  });

  it("derives the service name from the article title when it contains multiple words", () => {
    getGuideLinkLabelMock.mockReturnValueOnce("Fallback label").mockReturnValueOnce("Localized label");

    const AdditionalScripts = createAdditionalScripts(fallbackGuides);
    renderWithProviders(AdditionalScripts(baseContext), {
      route: "/it/guides/porter-service-positano",
    });

    expect(serviceStructuredDataMock.default).toHaveBeenCalledTimes(1);
    const [props] = (serviceStructuredDataMock.default.mock.calls[0] ?? [{}]) as [
      Record<string, unknown>,
    ];
    expect(props).toMatchObject({
      name: baseContext.article.title,
      url: "https://example.com/porter-service",
      description: baseContext.article.description,
      image: baseContext.ogImage.url,
      inLanguage: baseContext.lang,
    });
  });

  it("falls back to a slug-derived name and handles relative canonical URLs", () => {
    const context: GuideSeoTemplateContext = {
      ...baseContext,
      article: { title: "Porter", description: "Descrizione" },
      canonicalUrl: "/custom-path",
    };
    getGuideLinkLabelMock.mockReturnValueOnce(`content.${GUIDE_KEY}.linkLabel`).mockReturnValueOnce(
      `${GUIDE_KEY}`,
    );

    const AdditionalScripts = createAdditionalScripts(fallbackGuides);
    renderWithProviders(AdditionalScripts(context), {
      route: "/it/guides/porter-service-positano",
    });

    const [props] = (serviceStructuredDataMock.default.mock.calls[0] ?? [{}]) as [
      Record<string, unknown>,
    ];
    expect(props).toMatchObject({
      name: "Porter service positano",
      url: `https://hostel-positano.com${context.canonicalUrl}`,
    });
  });

  it("uses the configured slug when guide URLs resolve to the fallback key", () => {
    const context: GuideSeoTemplateContext = {
      ...baseContext,
      lang: "it",
      article: { title: "Porter", description: "Descrizione" },
      canonicalUrl: "porter",
    };

    guideHrefMock.guideHref.mockImplementation(() => "/it/guides/porter-services/");
    getGuideLinkLabelMock.mockReturnValueOnce("").mockReturnValueOnce("");

    const AdditionalScripts = createAdditionalScripts(fallbackGuides);
    renderWithProviders(AdditionalScripts(context), {
      route: "/it/guides/porter-service-positano",
    });

    const [props] = (serviceStructuredDataMock.default.mock.calls[0] ?? [{}]) as [
      Record<string, unknown>,
    ];

    expect(props).toMatchObject({
      name: "Porter service positano",
      url: "https://hostel-positano.com/it/guides/porter-service-positano",
      inLanguage: "it",
    });
  });

  it("normalises absolute canonical URLs by replacing search parameters", () => {
    const context: GuideSeoTemplateContext = {
      ...baseContext,
      lang: "fr",
      article: { title: "Service porteur", description: "Description" },
      canonicalUrl: "https://custom.example/?utm=1#section",
    };

    guideHrefMock.guideHref.mockImplementation(() => "/fr/guides/porter-service-positano");
    getGuideLinkLabelMock.mockReturnValueOnce(" Localized  Label ").mockReturnValueOnce("Fallback label");

    const AdditionalScripts = createAdditionalScripts(fallbackGuides);
    renderWithProviders(AdditionalScripts(context), {
      route: "/fr/guides/porter-service-positano",
    });

    const [props] = (serviceStructuredDataMock.default.mock.calls[0] ?? [{}]) as [
      Record<string, unknown>,
    ];

    expect(props).toMatchObject({
      name: "Localized  Label",
      url: "https://custom.example/fr/guides/porter-service-positano",
    });
  });

  it("renders the preview component with article and breadcrumb structured data", () => {
    renderWithProviders(<PorterServiceStructuredDataPreview />, {
      route: "/it/guides/porter-service-positano",
    });

    expect(articleStructuredDataMock.default).toHaveBeenCalledTimes(1);
    expect(breadcrumbStructuredDataMock.default).toHaveBeenCalledTimes(1);
    expect(serviceStructuredDataMock.default).toHaveBeenCalledTimes(1);
    const [articleProps] = (articleStructuredDataMock.default.mock.calls[0] ?? [{}]) as [
      Record<string, unknown>,
    ];
    expect(articleProps).toMatchObject({ headline: expect.any(String), description: expect.any(String) });

    const [breadcrumbProps] = (breadcrumbStructuredDataMock.default.mock.calls[0] ?? [{}]) as [
      Record<string, unknown>,
    ];
    expect(breadcrumbProps).toMatchObject({ breadcrumb: expect.anything() });
  });

  it("exposes internal helpers for tests", () => {
    expect(__TESTING__.buildCanonicalUrl("/it", "porter-service-positano")).toBe(
      "https://hostel-positano.com/it/guides/porter-service-positano",
    );
  });
});