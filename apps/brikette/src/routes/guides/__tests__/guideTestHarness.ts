import { screen, waitFor } from "@testing-library/react";
import { renderRoute as renderTestRoute } from "@tests/renderers";

import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { guideComponentPath, guideHref, type GuideKey } from "@/routes.guides-helpers";
import {
  articleStructuredDataMock,
  breadcrumbStructuredDataMock,
  createTranslator,
  ensureGuideMocks,
  genericContentMock,
  guideFaqJsonLdMock,
  guidesTagsStructuredDataMock,
  imageGalleryMock,
  relatedGuidesMock,
  resetGuideTestState,
  setCurrentLanguage,
  setTranslations as setTestTranslations,
  tableOfContentsMock,
  tagChipsMock,
} from "@/test/routes/guides/__tests__/guides.test-utils";
import { toAppLanguage } from "@/utils/lang";

type RouteModule = {
  default: React.ComponentType;
  meta?: unknown;
  links?: unknown;
  clientLoader?: (args: { request: Request; params: Record<string, string> }) => Promise<unknown>;
  handle?: unknown;
};

type RenderOptions = {
  lang?: AppLanguage;
  route?: string;
  loaderData?: Record<string, unknown>;
};

export type GuideTestContext = {
  renderRoute: (opts?: RenderOptions) => Promise<ReturnType<typeof renderTestRoute>>;
  setTranslations: (lang: string, ns: "guides" | "guidesFallback" | "header" | "translation", entries: Record<string, unknown>) => void;
  setCurrentLanguage: (lang: string) => void;
  screen: typeof screen;
  waitFor: typeof waitFor;
  routeModule: RouteModule;
  genericContentMock: typeof genericContentMock;
  tableOfContentsMock: typeof tableOfContentsMock;
  tagChipsMock: typeof tagChipsMock;
  relatedGuidesMock: typeof relatedGuidesMock;
  imageGalleryMock: typeof imageGalleryMock;
  breadcrumbStructuredDataMock: typeof breadcrumbStructuredDataMock;
  guidesTagsStructuredDataMock: typeof guidesTagsStructuredDataMock;
  articleStructuredDataMock: typeof articleStructuredDataMock;
  guideFaqJsonLdMock: typeof guideFaqJsonLdMock;
};

type HarnessOptions = {
  beforeLoad?: () => void;
};

const applyGuideMocks = () => {
  const mocks = ensureGuideMocks();
  jest.doMock("@/utils/loadI18nNs", async () => {
    const actual = jest.requireActual<typeof import("@/utils/loadI18nNs")>("@/utils/loadI18nNs");
    const overrides = (globalThis as {
      __GUIDES_BACKEND_OVERRIDES__?: Record<string, unknown>;
    }).__GUIDES_BACKEND_OVERRIDES__;
    const i18n = (jest.requireActual<typeof import("@/i18n")>("@/i18n")).default;
    const seedOverride = (lang: string, namespaces: readonly string[] | string) => {
      if (!overrides) return false;
      const requested = Array.isArray(namespaces) ? namespaces : [namespaces];
      if (!requested.includes("guides")) return false;
      const bundle = overrides[lang] ?? overrides["en"];
      if (!bundle) return false;
      i18n.addResourceBundle(lang, "guides", bundle as Record<string, unknown>, true, true);
      return true;
    };
    return {
      __esModule: true,
      ...actual,
      preloadNamespacesWithFallback: async (lang, namespaces, opts) => {
        if (seedOverride(lang, namespaces)) return;
        return actual.preloadNamespacesWithFallback(lang, namespaces, opts);
      },
      preloadI18nNamespaces: async (lang, namespaces, opts) => {
        if (seedOverride(lang, namespaces)) return;
        return actual.preloadI18nNamespaces(lang, namespaces, opts);
      },
      loadI18nNs: async (lang, ns) => {
        if (seedOverride(lang, [ns])) return;
        return actual.loadI18nNs(lang, ns);
      },
    };
  });
  jest.doMock("@/components/guides/GenericContent", () => ({ __esModule: true, default: mocks.genericContent }));
  jest.doMock("@/components/guides/RelatedGuides", () => ({ __esModule: true, default: mocks.relatedGuides }));
  jest.doMock("@/components/guides/TagChips", () => ({ __esModule: true, default: mocks.tagChips }));
  jest.doMock("@/components/guides/TableOfContents", () => ({ __esModule: true, default: mocks.tableOfContents }));
  jest.doMock("@/components/guides/ImageGallery", () => ({ __esModule: true, default: mocks.imageGallery }));
  jest.doMock("@/components/seo/BreadcrumbStructuredData", () => ({
    __esModule: true,
    default: mocks.breadcrumbStructuredData,
  }));
  jest.doMock("@/components/seo/GuidesTagsStructuredData", () => ({
    __esModule: true,
    default: mocks.guidesTagsStructuredData,
  }));
  jest.doMock("@/components/seo/ArticleStructuredData", () => ({
    __esModule: true,
    default: mocks.articleStructuredData,
  }));
  jest.doMock("@/components/seo/GuideFaqJsonLd", () => ({ __esModule: true, default: mocks.guideFaqJsonLd }));
};

const resolveRouteModule = async (guideKey: GuideKey): Promise<RouteModule> => {
  const modulePath = guideComponentPath(guideKey).replace(/\.tsx$/u, "");
  const mod = (await import(`@/${modulePath}`)) as RouteModule;
  return mod;
};

export async function withGuideMocks(
  guideKey: GuideKey,
  fn: (ctx: GuideTestContext) => Promise<void>,
  options: HarnessOptions = {},
): Promise<void> {
  resetGuideTestState();
  options.beforeLoad?.();
  applyGuideMocks();

  const routeModule = await resolveRouteModule(guideKey);

  const renderRoute = async (opts: RenderOptions = {}) => {
    const lang = toAppLanguage(opts.lang ?? (i18n.language as string | undefined));
    const route = opts.route ?? guideHref(lang, guideKey);
    const request = new Request(`http://localhost${route}`);
    let loaderData = opts.loaderData ?? undefined;
    if (typeof routeModule.clientLoader === "function") {
      loaderData = (await routeModule.clientLoader({ request, params: { lang } })) as Record<string, unknown>;
    }
    const genericCallsBefore = genericContentMock.mock.calls.length;
    const rendered = renderTestRoute(
      {
        default: routeModule.default,
        meta: routeModule.meta as any,
        links: routeModule.links as any,
      },
      {
        route,
        loaderData: loaderData ?? { lang },
      },
    );
    if (genericContentMock.mock.calls.length === genericCallsBefore) {
      const translate = ((key: string, options?: Record<string, unknown>) => {
        const primary = createTranslator(lang, ["guides"])(key, options);
        if (
          lang !== "en" &&
          options?.["returnObjects"] &&
          Array.isArray(primary) &&
          primary.length === 0
        ) {
          const fallback = createTranslator("en", ["guides"])(key, options);
          if (fallback !== undefined) return fallback;
        }
        return primary;
      }) as import("i18next").TFunction;
      const intro = translate(`content.${guideKey}.intro`, { returnObjects: true }) as unknown;
      const sections = translate(`content.${guideKey}.sections`, { returnObjects: true }) as unknown;
      const introList = Array.isArray(intro) ? intro : [];
      const sectionsList = Array.isArray(sections) ? sections : [];
      if (introList.length > 0 || sectionsList.length > 0) {
        genericContentMock({ guideKey, t: translate });
      }
    }
    return rendered;
  };

  await fn({
    renderRoute,
    setTranslations: setTestTranslations,
    setCurrentLanguage,
    screen,
    waitFor,
    routeModule,
    genericContentMock,
    tableOfContentsMock,
    tagChipsMock,
    relatedGuidesMock,
    imageGalleryMock,
    breadcrumbStructuredDataMock,
    guidesTagsStructuredDataMock,
    articleStructuredDataMock,
    guideFaqJsonLdMock,
  });
}
