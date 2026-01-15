// src/routes/guides/__tests__/seven-day-no-car.fallback.test.tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, within } from "@testing-library/react";

import { commonBeforeEach, defineTranslations, renderGuide, guideFaqFallbackResults } from "../__tests__/guides.test.utils";

// Mocks (hoisted by Vitest)
const HOISTED = vi.hoisted(() => {
  const G: any = ((globalThis as any).__GUIDES_TEST__ ??= {});
  G.resources ??= {};
  G.currentLanguageRef ??= { value: "en" };
  G.guideFaqFallbackResults ??= [];
  const ensureNamespace = (lng: string, ns: string) => {
    const bucket = (G.resources[lng] ??= { guides: {}, guidesFallback: {}, header: {}, translation: {} });
    return (bucket as any)[ns] ?? ((bucket as any)[ns] = {});
  };
  const getNested = (target: Record<string, any> | undefined, key: string): unknown => {
    if (!target) return undefined;
    const segments = key.split(".");
    let pointer: any = target;
    for (const segment of segments) {
      if (typeof pointer !== "object" || pointer === null) return undefined;
      pointer = pointer[segment];
      if (pointer === undefined) return undefined;
    }
    return pointer;
  };
  const resolveOptions = (options: unknown): { defaultValue?: unknown; returnObjects?: boolean } => {
    if (typeof options === "string") return { defaultValue: options };
    if (options && typeof options === "object") return options as any;
    return {};
  };
  const SUPPORTED_NAMESPACES = ["guides", "guidesFallback", "header", "translation"] as const;
  const translatorFactory = (lng: string, ns: (typeof SUPPORTED_NAMESPACES)[number]) => {
    return (key: string, rawOptions?: unknown) => {
      const options = resolveOptions(rawOptions);
      const source = ensureNamespace(lng, ns);
      const value = getNested(source, key);
      if (options.returnObjects) {
        if (value !== undefined) return value;
        if (options.defaultValue !== undefined) return options.defaultValue;
        return [];
      }
      if (value !== undefined) return value;
      if (options.defaultValue !== undefined) return options.defaultValue;
      return key;
    };
  };
  G.fakeI18n ??= {
    language: "en",
    languages: ["en", "fr", "it", "de", "es", "ru"],
    changeLanguage: async (lng: string) => translatorFactory(lng, "guides" as any),
    getFixedT: (lng: string, namespace: any) => translatorFactory(lng, namespace),
    getResource: (lng: string, namespace: any, key: string) => {
      const bucket = (G.resources[lng] ??= { guides: {}, guidesFallback: {}, header: {}, translation: {} });
      return getNested((bucket as any)[namespace], key);
    },
    loadNamespaces: async () => {},
  };
  return {
    reactI18next: {
      Trans: ({ t, i18nKey }: any) => {
        const resolved = t(i18nKey, { defaultValue: i18nKey });
        return <>{resolved as any}</>;
      },
      useTranslation: (namespace?: string, opts?: { lng?: string }) => {
        const ns = (SUPPORTED_NAMESPACES as readonly string[]).includes(namespace as any)
          ? (namespace as any)
          : "guides";
        const lng = opts?.lng ?? G.currentLanguageRef.value;
        const t = translatorFactory(lng, ns);
        return { t, i18n: G.fakeI18n } as any;
      },
      initReactI18next: { type: "3rdParty", init: () => {} },
    },
    i18nModule: { __esModule: true, default: G.fakeI18n },
    GenericContent: {
      __esModule: true,
      default: ({ guideKey }: any) => <div data-testid="generic-content">generic:{guideKey}</div>,
    },
    TableOfContents: {
      __esModule: true,
      default: ({ items, title }: any) => (
        <nav data-testid="table-of-contents">
          {title ? <span data-testid="toc-title">{title}</span> : null}
          <ul>
            {items.map((item: any) => (
              <li key={`${item.href}-${item.label}`}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      ),
    },
    TagChips: { __esModule: true, default: () => <div data-testid="tag-chips" /> },
    ArticleStructuredData: { __esModule: true, default: () => null },
    BreadcrumbStructuredData: { __esModule: true, default: () => null },
    GuideFaqJsonLd: {
      __esModule: true,
      default: ({ guideKey, fallback }: any) => {
        if (typeof fallback === "function") {
          const result = fallback(G.currentLanguageRef.value);
          G.guideFaqFallbackResults.push({ guideKey, result });
        }
        return <div data-testid={`guide-faq-json-${guideKey}`} />;
      },
    },
    TransportNotice: { __esModule: true, default: () => <div data-testid="transport-notice" /> },
    AlsoHelpful: { __esModule: true, default: () => <div data-testid="also-helpful" /> },
    RelatedGuides: { __esModule: true, default: () => <div data-testid="related-guides" /> },
    ImageGallery: {
      __esModule: true,
      default: ({ items }: any) => (
        <div data-testid="image-gallery">
          {items.map((item: any) => (
            <figure key={item.src}>
              <img alt={item.alt} src={item.src} />
              {item.caption ? <figcaption>{item.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      ),
    },
  };
});

vi.mock("react-i18next", () => HOISTED.reactI18next as any);
vi.mock("@/i18n", () => HOISTED.i18nModule as any);
vi.mock("@/components/guides/GenericContent", () => HOISTED.GenericContent as any);
vi.mock("@/components/guides/TableOfContents", () => HOISTED.TableOfContents as any);
vi.mock("@/components/guides/TagChips", () => HOISTED.TagChips as any);
vi.mock("@/components/seo/ArticleStructuredData", () => HOISTED.ArticleStructuredData as any);
vi.mock("@/components/seo/BreadcrumbStructuredData", () => HOISTED.BreadcrumbStructuredData as any);
vi.mock("@/components/seo/GuideFaqJsonLd", () => HOISTED.GuideFaqJsonLd as any);
vi.mock("@/components/guides/TransportNotice", () => HOISTED.TransportNotice as any);
vi.mock("@/components/common/AlsoHelpful", () => HOISTED.AlsoHelpful as any);
vi.mock("@/components/guides/RelatedGuides", () => HOISTED.RelatedGuides as any);
vi.mock("@/components/guides/ImageGallery", () => HOISTED.ImageGallery as any);

import SevenDayAmalfiNoCar, { GUIDE_KEY as SEVEN_DAY_GUIDE_KEY } from "../7-day-amalfi-coast-itinerary-no-car";

beforeEach(commonBeforeEach);

describe("7-day Amalfi Coast itinerary without a car", () => {
  it("mixes translated and fallback content to build the itinerary", () => {
    defineTranslations("en", "guides", {
      "content.sevenDayNoCar.seo.title": "Seven-day Amalfi without a car",
      "content.sevenDayNoCar.seo.description": "Day-by-day plan",
      "content.sevenDayNoCar.intro": "Translated overview",
      "content.sevenDayNoCar.toc": {
        onThisPage: "Plan your week",
        overview: "Overview heading",
        dayByDay: "Daily schedule",
        tips: "",
        faqs: "",
        day1: "Custom Day 1",
      },
      "content.sevenDayNoCar.days": [
        { id: "day1", label: "Translated Day 1", items: ["Check-in", "Beach time"] },
      ],
      "content.sevenDayNoCar.tips": [],
      "content.sevenDayNoCar.faq": [],
    });

    defineTranslations("en", "guidesFallback", {
      "sevenDayNoCar.intro": "Fallback overview",
      "sevenDayNoCar.toc": {
        onThisPage: "Fallback nav",
        overview: "Fallback overview heading",
        dayByDay: "Fallback day-by-day",
        tips: "Fallback tips",
        faqs: "Fallback FAQs",
      },
      "sevenDayNoCar.days": [
        { id: "day1", label: "Fallback Day 1", items: ["Fallback morning"] },
        { id: "day2", label: "Fallback Day 2", items: ["Fallback day two"] },
      ],
      "sevenDayNoCar.tips": ["Carry cash for ferries"],
      "sevenDayNoCar.faq": [
        { q: "Is it walkable?", a: ["Yes, but plan breaks"] },
      ],
    });

    renderGuide(
      <SevenDayAmalfiNoCar />,
      "/en/guides/7-day-amalfi-coast-itinerary-no-car"
    );

    expect(screen.getByText("Translated overview")).toBeInTheDocument();
    const toc = screen.getByTestId("table-of-contents");
    const tocEntries = within(toc).getAllByRole("link").map((node) => node.textContent);
    expect(tocEntries).toEqual([
      "Overview heading",
      "Daily schedule",
      "Fallback tips",
      "Fallback FAQs",
    ]);

    expect(screen.getByText("Custom Day 1")).toBeInTheDocument();
    expect(screen.getByText(/Fallback day two/)).toBeInTheDocument();
    expect(screen.getByText("Carry cash for ferries")).toBeInTheDocument();
    expect(screen.getByText("Is it walkable?")).toBeInTheDocument();
    expect(screen.getByText("Yes, but plan breaks")).toBeInTheDocument();
    const fallbackEntry = guideFaqFallbackResults.find((entry) => entry.guideKey === SEVEN_DAY_GUIDE_KEY);
    expect(fallbackEntry?.result).toEqual([
      { q: "Is it walkable?", a: ["Yes, but plan breaks"] },
    ]);
  });

  it("falls back to per-day keys and omits FAQs without summaries", () => {
    defineTranslations("en", "guides", {
      "content.sevenDayNoCar.seo.title": "Seven-day Amalfi without a car",
      "content.sevenDayNoCar.seo.description": "Day-by-day plan",
      "content.sevenDayNoCar.intro": "",
      "content.sevenDayNoCar.toc": {},
      "content.sevenDayNoCar.days": [
        { id: "day1", label: "", items: [] },
      ],
      "content.sevenDayNoCar.day1": ["Fallback narrative"],
      "content.sevenDayNoCar.tips": [],
      "content.sevenDayNoCar.faq": [
        { q: "", a: [""] },
        { q: "Packing list", a: "Bring layers" },
      ],
    });

    defineTranslations("en", "guidesFallback", {
      "sevenDayNoCar.intro": "",
      "sevenDayNoCar.toc": {},
      "sevenDayNoCar.days": [
        { id: "day1", label: "Day one", items: [] },
      ],
      "sevenDayNoCar.tips": [],
      "sevenDayNoCar.faq": [],
    });

    renderGuide(
      <SevenDayAmalfiNoCar />,
      "/en/guides/7-day-amalfi-coast-itinerary-no-car",
    );

    expect(screen.getByText(/Fallback narrative/)).toBeInTheDocument();

    const summaries = Array.from(document.querySelectorAll("summary"));
    expect(summaries.some((node) => node.textContent === "Packing list")).toBe(true);
    expect(summaries.some((node) => node.textContent === "")).toBe(false);
  });
});