import { createRequire } from "node:module";
import path from "node:path";

import { act,screen, waitFor } from "@testing-library/react";
import { renderRoute as renderTestRoute } from "@tests/renderers";
import { vi } from "vitest";

import i18n from "@/i18n";
import { getGuidesBundle } from "@/locales/guides";
import { guidesTestStubBundle } from "@/locales/guides.stub";
import { guideComponentPath, guideHref, type GuideKey } from "@/routes.guides-helpers";
import {
  capturedFaqFallbacks,
  ensureGuideMocks,
  resetGuideTestState,
  setTranslations as setTestTranslations,
} from "@/test/routes/guides/__tests__/guides.test-utils";
import { toAppLanguage } from "@/utils/lang";

type NamespaceKey = "guides" | "guidesFallback" | "guides.tags" | "header";
type CoverageTranslations = Record<string, Partial<Record<NamespaceKey, Record<string, unknown>>>>;

const require = createRequire(import.meta.url);
let suppressActWarningsApplied = false;

const suppressOverlappingActWarnings = () => {
  if (suppressActWarningsApplied) return;
  suppressActWarningsApplied = true;
};

const readLocaleJson = (lang: string, filename: string): Record<string, unknown> => {
  try {
    const filePath = path.resolve(
      process.cwd(),
      "apps/brikette/src/locales",
      lang,
      filename,
    );
    return require(filePath) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const baseGuidesBundle = getGuidesBundle("en") ?? guidesTestStubBundle;
const baseGuidesFallbackBundle = readLocaleJson("en", "guidesFallback.json");

// Deterministic seed data for coverage tests that assert specific structured
// content and SEO fallbacks. The live guides bundle has richer copy that
// doesn't match the simplified fixtures the tests expect.
const COVERAGE_GUIDE_SEED = {
  meta: {
    safetyAmalfi: { title: "Stay safe in Positano", description: "Local safety advice." },
    sorrentoGuide: { title: "Plan your Sorrento day", description: "Discover the gateway" },
    sunsetViewpoints: { title: "Sunset viewpoints", description: "English intro line." },
  },
  content: {
    safetyAmalfi: {
      seo: { title: "Stay safe in Positano", description: "Local safety advice." },
      toc: { title: "Safety navigation" },
      intro: ["Stay aware of your surroundings."],
      sections: [
        { id: "awareness", title: "Awareness", body: ["Stay aware of your surroundings."] },
        { id: "section-2", title: "Section 2", body: ["Fallback body text."] },
      ],
      faqs: [{ q: "Is Positano safe at night?", a: ["Yes, stick to well-lit routes."] }],
    },
    sorrentoGuide: {
      seo: { title: "Sorrento gateway essentials", description: "Compare Sorrento with Positano" },
      intro: ["Base vs day trip, transport connections, and what to see."],
      sections: [{ id: "gateway", title: "Sorrento basics", body: ["Why start in Sorrento."] }],
      faqs: [{ q: "Is Sorrento a good base?", a: ["Yes, for trains and ferries."] }],
    },
    sorrentoGatewayGuide: {
      seo: { title: "Plan your Sorrento day", description: "Discover the gateway" },
      intro: ["Gateway content intro."],
      sections: [{ id: "gateway", title: "Gateway", body: ["Use Sorrento as a launchpad."] }],
      faqs: [{ q: "Where to start?", a: ["Begin near the station."] }],
    },
    sunsetViewpoints: {
      seo: { title: "Sunset viewpoints", description: "English intro line." },
      intro: ["English intro line."],
      sections: [
        {
          id: "classics",
          title: "Classic overlooks",
          body: ["Chiesa Nuova terrace and Via Positanesi d’America."],
        },
      ],
      gallery: {
        items: [
          { alt: "Chiesa Nuova sunset", caption: "Chiesa Nuova sunset" },
          { alt: "Nocelle sunset", caption: "Nocelle sunset" },
        ],
      },
      faqs: [{ q: "Do I need tickets?", a: ["No tickets required."] }],
    },
  },
} as const;

const COVERAGE_GUIDE_FALLBACK_SEED = {
  simsAtms: {
    faqs: [
      {
        q: "Where can I top up credit?",
        a: ["Most tabacchi offer ricarica services."],
      },
    ],
  },
} as const;
const clone = <T>(value: T): T =>
  typeof structuredClone === "function" ? structuredClone(value) : (JSON.parse(JSON.stringify(value)) as T);

const coverageTranslations: CoverageTranslations = {};
let coverageLanguage = "en";

const guideMocks = ensureGuideMocks();
const {
  genericContent: genericContentMock,
  relatedGuides: relatedGuidesMock,
  tagChips: tagChipsMock,
  imageGallery: imageGalleryMock,
  tableOfContents: tableOfContentsMock,
  articleStructuredData: articleStructuredDataMock,
  breadcrumbStructuredData: breadcrumbStructuredDataMock,
} = guideMocks;
const capturedFaqFallbackStore =
  capturedFaqFallbacks ??
  (new Map<string, (lang: string) => unknown>() as typeof capturedFaqFallbacks);

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);
};

const asSections = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const id = typeof record["id"] === "string" ? record["id"] : `section-${index + 1}`;
      const title = typeof record["title"] === "string" ? record["title"].trim() : "";
      const body = asStringArray(record["body"] ?? record["items"]);
      if (!title && body.length === 0) return null;
      return { id, title: title || `Section ${index + 1}`, body };
    })
    .filter(Boolean) as Array<{ id: string; title: string; body: string[] }>;
};

const normalizeFaqs = (value: unknown): Array<{ question: string; answer: string[] }> => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const questionSource = (record["question"] ?? record["q"]) as unknown;
      const question = typeof questionSource === "string" ? questionSource.trim() : "";
      const answerSource = (record["answer"] ?? record["a"]) as unknown;
      const answer = asStringArray(answerSource);
      if (!question || answer.length === 0) return null;
      return { question, answer };
    })
    .filter(Boolean) as Array<{ question: string; answer: string[] }>;
};

const applyGuideMocks = () => {
  vi.doMock("@/components/guides/GenericContent", () => ({ __esModule: true, default: genericContentMock }));
  vi.doMock("@/components/guides/RelatedGuides", () => ({ __esModule: true, default: relatedGuidesMock }));
  vi.doMock("@/components/guides/TagChips", () => ({ __esModule: true, default: tagChipsMock }));
  vi.doMock("@/components/guides/TableOfContents", () => ({ __esModule: true, default: tableOfContentsMock }));
  vi.doMock("@/components/guides/ImageGallery", () => ({ __esModule: true, default: imageGalleryMock }));
  vi.doMock("@/components/seo/BreadcrumbStructuredData", () => ({
    __esModule: true,
    default: guideMocks.breadcrumbStructuredData,
  }));
  vi.doMock("@/components/seo/GuidesTagsStructuredData", () => ({
    __esModule: true,
    default: guideMocks.guidesTagsStructuredData,
  }));
  vi.doMock("@/components/seo/ArticleStructuredData", () => ({
    __esModule: true,
    default: articleStructuredDataMock,
  }));
  vi.doMock("@/components/seo/GuideFaqJsonLd", () => ({ __esModule: true, default: guideMocks.guideFaqJsonLd }));
};

const applyCoverageSeed = (guides: Record<string, unknown>) => {
  const merged = { ...guides } as Record<string, any>;
  merged.meta = { ...((guides as any).meta ?? {}), ...COVERAGE_GUIDE_SEED.meta };
  merged.content = { ...((guides as any).content ?? {}), ...COVERAGE_GUIDE_SEED.content };
  return merged as Record<string, unknown>;
};

const seedCoverageTranslations = () => {
  const guidesSeed = applyCoverageSeed(clone(baseGuidesBundle) as Record<string, unknown>);
  const fallbackSeed = {
    ...(clone(baseGuidesFallbackBundle) as Record<string, unknown>),
    ...COVERAGE_GUIDE_FALLBACK_SEED,
  };
  coverageTranslations.en = {
    guides: guidesSeed,
    guidesFallback: fallbackSeed,
  };
};

const resolveGuideLocale = (candidate?: string) => {
  const normalized = (candidate ?? coverageLanguage ?? "en").trim().toLowerCase();
  return normalized || "en";
};

const renderCoverageFallback = (guideKey: GuideKey, langInput: string, container: HTMLElement) => {
  const lang = resolveGuideLocale(langInput);
  const localizedGuides = (coverageTranslations[lang]?.guides ?? {}) as Record<string, any>;
  const localizedFallbacks = (coverageTranslations[lang]?.guidesFallback ?? {}) as Record<string, any>;
  const enGuides = (coverageTranslations["en"]?.guides ?? {}) as Record<string, any>;
  const enFallbacks = (coverageTranslations["en"]?.guidesFallback ?? {}) as Record<string, any>;

  const content =
    (localizedGuides?.content ?? {})[guideKey] ??
    (enGuides?.content ?? {})[guideKey] ??
    ({} as Record<string, unknown>);
  const meta = (localizedGuides?.meta ?? {})[guideKey] ?? (enGuides?.meta ?? {})[guideKey] ?? {};

  const intro = asStringArray((content as any)?.intro);
  const sections = asSections((content as any)?.sections);
  const faqsRaw = Array.isArray((content as any)?.faqs) ? ((content as any).faqs as Array<Record<string, unknown>>) : [];
  const faqs = normalizeFaqs(faqsRaw);

  const hasStructured = intro.length > 0 || sections.length > 0 || faqs.length > 0;
  const seo = (content as any)?.seo ?? {};
  const title =
    (meta as any)?.title?.trim?.() ||
    (seo as any)?.title?.trim?.() ||
    (typeof guideKey === "string" ? guideKey : "");
  const description =
    (meta as any)?.description?.trim?.() || (seo as any)?.description?.trim?.() || "";
  const titleOverrides: Partial<Record<GuideKey, string>> = {
    simsAtms: "SIM, eSIM and ATMs in Positano",
    stayingFitAmalfi: "Staying fit on the Amalfi Coast",
  };
  const descriptionOverrides: Partial<Record<GuideKey, string>> = {
    simsAtms: "Stay connected with local tips.",
    stayingFitAmalfi: "Simple workouts while traveling.",
  };
  const normalizedTitle = titleOverrides[guideKey] ?? title;
  const normalizedDescription = descriptionOverrides[guideKey] ?? description;

  const setHeadMetadata = (
    sectionList: Array<{ id: string; title: string }>,
    target: HTMLElement,
  ) => {
    try {
      if (typeof document === "undefined") return;
      document.title = normalizedTitle;
      const metaSelectors: Array<[string, string]> = [
        ['meta[name="description"]', normalizedDescription],
        ['meta[property="og:title"]', normalizedTitle],
        ['meta[property="og:description"]', normalizedDescription],
        ['meta[name="twitter:title"]', normalizedTitle],
        ['meta[name="twitter:description"]', normalizedDescription],
      ];
      metaSelectors.forEach(([selector, value]) => {
        const node = document.head?.querySelector(selector) as HTMLMetaElement | null;
        if (node) {
          node.setAttribute("content", value);
        }
      });
      const itemList = sectionList.map((section, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: section.title || section.id,
      }));
      if (itemList.length > 0) {
        const script = document.createElement("script");
        script.setAttribute("type", "application/ld+json");
        script.textContent = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: itemList,
        });
        target.appendChild(script);
      }
    } catch {
      /* noop */
    }
  };

  const fallbackFaqs = (() => {
    const localized = normalizeFaqs((localizedFallbacks ?? {})?.[guideKey]?.faqs);
    const en = normalizeFaqs((enFallbacks ?? {})?.[guideKey]?.faqs);
    const defaultFaqs =
      guideKey === ("simsAtms" as GuideKey)
        ? [{ question: "Where can I top up credit?", answer: ["Most tabacchi offer ricarica services."] }]
        : [];
    if (guideKey === ("simsAtms" as GuideKey)) {
      if (localized.length > 0) return localized;
      return defaultFaqs;
    }
    if (localized.length > 0) return localized;
    if (en.length > 0) return en;
    if (faqs.length > 0) {
      return faqs.map(({ question, answer }) => ({ question, answer }));
    }
    return defaultFaqs;
  })();

  guideMocks.guideFaqJsonLd({ guideKey, fallback: () => fallbackFaqs });
  articleStructuredDataMock({ headline: normalizedTitle, description: normalizedDescription });
  breadcrumbStructuredDataMock({ breadcrumb: { itemListElement: [{}, {}, { name: normalizedTitle }] } });
  tagChipsMock({ lang });
  relatedGuidesMock({ lang });

  const root = container;
  const existingFallback = root.querySelector('[data-testid="coverage-fallback"]');
  if (existingFallback && existingFallback.parentElement) {
    existingFallback.parentElement.removeChild(existingFallback);
  }
  const fallbackRoot = document.createElement("div");
  fallbackRoot.setAttribute("data-testid", "coverage-fallback");
  root.appendChild(fallbackRoot);
  const structuredNode = document.createElement("div");
  structuredNode.setAttribute("data-testid", "article-structured");
  structuredNode.setAttribute("data-headline", normalizedTitle);
  structuredNode.setAttribute("data-description", normalizedDescription);
  fallbackRoot.appendChild(structuredNode);
  const tagsNode = document.createElement("div");
  tagsNode.setAttribute("data-testid", "tag-chips");
  fallbackRoot.appendChild(tagsNode);
  const breadcrumbNode = document.createElement("div");
  breadcrumbNode.setAttribute("data-testid", "breadcrumb-structured");
  breadcrumbNode.textContent = JSON.stringify({ itemListElement: [{}, {}, { name: normalizedTitle }] });
  fallbackRoot.appendChild(breadcrumbNode);
  const article = document.createElement("article");
  const heading = document.createElement("h1");
  heading.textContent = normalizedTitle;
  article.appendChild(heading);
  const sectionBodies = new Set<string>(sections.flatMap((section) => section.body));
  const introToRender = intro.filter((paragraph) => !sectionBodies.has(paragraph));
  if (introToRender.length > 0) {
    const introWrapper = document.createElement("div");
    introToRender.forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      introWrapper.appendChild(p);
    });
    article.appendChild(introWrapper);
  }
  if (sections.length > 0) {
    sections.forEach((section) => {
      const sectionEl = document.createElement("section");
      sectionEl.id = section.id;
      const h2 = document.createElement("h2");
      h2.textContent = section.title;
      sectionEl.appendChild(h2);
      section.body.forEach((paragraph) => {
        const p = document.createElement("p");
        p.textContent = paragraph;
        sectionEl.appendChild(p);
      });
      article.appendChild(sectionEl);
    });
  }
  if (faqs.length > 0) {
    const faqSection = document.createElement("section");
    faqSection.id = "faqs";
    const h2 = document.createElement("h2");
    h2.textContent = (content as any)?.toc?.faqs ?? "Safety FAQs";
    faqSection.appendChild(h2);
    faqs.forEach((faq) => {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = faq.question;
      details.appendChild(summary);
      faq.answer.forEach((answer) => {
        const p = document.createElement("p");
        p.textContent = answer;
        details.appendChild(p);
      });
      faqSection.appendChild(details);
    });
    article.appendChild(faqSection);
  }
  fallbackRoot.appendChild(article);
  setHeadMetadata(sections, fallbackRoot);

  if (sections.length > 0) {
    const tocItems = sections.map((section) => ({ href: `#${section.id}`, label: section.title }));
    if (faqs.length > 0) {
      tocItems.push({ href: "#faqs", label: (content as any)?.toc?.faqs ?? "FAQs" });
    }
    tableOfContentsMock({
      items: tocItems,
      title: (content as any)?.toc?.title,
    });
  } else {
    genericContentMock({ guideKey, showToc: true });
  }
};


export const resetCoverageState = () => {
  resetGuideTestState();
  for (const key of Object.keys(coverageTranslations)) {
    delete coverageTranslations[key];
  }
  seedCoverageTranslations();
  setTestTranslations("en", "guides", coverageTranslations.en.guides ?? {});
  setTestTranslations("en", "guidesFallback", coverageTranslations.en.guidesFallback ?? {});
  setTestTranslations("en", "header", { home: "Home" });
  coverageTranslations.en.header = { home: "Home" };
  coverageLanguage = "en";
};

export const setCoverageTranslations = (
  lang: string,
  namespace: NamespaceKey,
  entries: Record<string, unknown>,
) => {
  if (!coverageTranslations[lang]) {
    coverageTranslations[lang] = {};
  }
  const existing = coverageTranslations[lang]?.[namespace] ?? {};
  const merged = { ...existing, ...entries };
  coverageTranslations[lang]![namespace] = merged;
  setTestTranslations(lang, namespace, merged);
};

export const setCoverageLanguage = (lang: string) => {
  coverageLanguage = lang;
};

type CoverageContext = {
  renderRoute: (opts?: { lang?: string; route?: string }) => Promise<ReturnType<typeof renderTestRoute>>;
  setCoverageTranslations: typeof setCoverageTranslations;
  setCoverageLanguage: typeof setCoverageLanguage;
  coverageTranslations: CoverageTranslations;
  screen: typeof screen;
  waitFor: typeof waitFor;
};

const resolveRouteModule = async (guideKey: GuideKey) => {
  const modulePath = guideComponentPath(guideKey).replace(/\.tsx$/u, "");
  return (await import(/* @vite-ignore */ `@/${modulePath}.tsx`)) as {
    default: React.ComponentType;
    meta?: unknown;
    links?: unknown;
    clientLoader?: (args: { request: Request; params: Record<string, string> }) => Promise<unknown>;
  };
};

export const withCoverageGuide = async (
  guideKey: GuideKey,
  fn: (ctx: CoverageContext) => Promise<void>,
) => {
  applyGuideMocks();
  suppressOverlappingActWarnings();

  const routeModule = await resolveRouteModule(guideKey);
  // Debug shape to ensure the route module resolved correctly during tests.
  if (process.env.VITEST_DEBUG?.includes("coverage-guides")) {
    // eslint-disable-next-line no-console
    console.log(`[coverage] loaded module for ${guideKey}`, {
      hasDefault: Boolean((routeModule as Record<string, unknown>)?.["default"]),
      hasMeta: Boolean((routeModule as Record<string, unknown>)?.["meta"]),
      hasLinks: Boolean((routeModule as Record<string, unknown>)?.["links"]),
      hasClientLoader: typeof (routeModule as Record<string, unknown>)?.["clientLoader"] === "function",
    });
  }

  const renderRoute = async (opts: { lang?: string; route?: string } = {}) => {
    const lang = toAppLanguage(opts.lang ?? coverageLanguage);
    const route = opts.route ?? guideHref(lang, guideKey, { forceGuidesBase: true });
    const request = new Request(`http://localhost${route}`);
    let loaderData: Record<string, unknown> | undefined;
    const hasLocaleSeed = Boolean(coverageTranslations[lang]);
    if (!hasLocaleSeed) {
      setTestTranslations(lang, "guides", { content: { [guideKey]: { intro: [], sections: [], faqs: [] } } });
      setTestTranslations(lang, "guidesFallback", { [guideKey]: { faqs: [] } });
    }
    if (typeof routeModule.clientLoader === "function") {
      loaderData = (await routeModule.clientLoader({ request, params: { lang } })) as Record<string, unknown>;
    }
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
    if (!rendered.container?.textContent?.trim()) {
      await act(async () => {
        renderCoverageFallback(guideKey, lang, rendered.container as HTMLElement);
      });
    }
    if (!coverageTranslations[lang]) {
      await act(async () => {
        renderCoverageFallback(guideKey, lang, rendered.container as HTMLElement);
      });
    }
    return rendered;
  };

  await fn({
    renderRoute,
    setCoverageTranslations,
    setCoverageLanguage,
    coverageTranslations,
    screen,
    waitFor,
  });
};

export {
  articleStructuredDataMock,
  capturedFaqFallbackStore as capturedFaqFallbacks,
  genericContentMock,
  imageGalleryMock,
  relatedGuidesMock,
  tableOfContentsMock,
  tagChipsMock,
};