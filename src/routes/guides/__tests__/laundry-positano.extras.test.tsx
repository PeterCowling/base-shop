import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

vi.mock("@/lib/buildCfImageUrl", () => ({
  __esModule: true,
  default: vi.fn((path: string, params: Record<string, unknown> = {}) => {
    const width = typeof params.width === "number" ? params.width : "";
    return `${path}?w=${width}`;
  }),
}));

import buildCfImageUrl from "@/lib/buildCfImageUrl";

import { buildGuideExtras } from "../laundry-positano/buildGuideExtras";
import { createArticleLead } from "../laundry-positano/_createArticleLead";
import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import type { GuideExtras } from "../laundry-positano/types";
import * as faqModule from "../laundry-positano/faq";
import { renderWithProviders } from "@tests/renderers";

const buildCfImageUrlMock = vi.mocked(buildCfImageUrl);
const getGuidesTranslatorSpy = vi.spyOn(faqModule, "getGuidesTranslator");

type Dictionary = Record<string, unknown>;
const translations = new Map<string, Dictionary>();

const ensureDictionary = (lang: string) => {
  const existing = translations.get(lang);
  if (existing) return existing;
  const next: Dictionary = {};
  translations.set(lang, next);
  return next;
};

const setTranslations = (lang: string, entries: Dictionary) => {
  Object.assign(ensureDictionary(lang), entries);
};

const createTranslator = (lang: string) =>
  (key: string, options: { returnObjects?: boolean; defaultValue?: unknown } = {}) => {
    const dictionary = translations.get(lang) ?? {};
    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      const value = dictionary[key];
      if (options.returnObjects) {
        return value;
      }
      return value;
    }
    if (options.returnObjects) {
      return options.defaultValue ?? [];
    }
    return options.defaultValue ?? key;
  };

const createContext = (): GuideSeoTemplateContext => {
  const translateGuides = createTranslator("it") as GuideSeoTemplateContext["translateGuides"];
  return {
    lang: "it",
    guideKey: "laundryPositano",
    metaKey: "laundryPositano",
    hasLocalizedContent: true,
    translator: vi.fn() as unknown as GuideSeoTemplateContext["translator"],
    translateGuides,
    sections: [],
    intro: [],
    faqs: [],
    toc: [],
    ogImage: { url: "https://example.com/og.jpg", width: 1200, height: 630 },
    article: { title: "Laundry", description: "Laundry guide" },
    canonicalUrl: "https://example.com/it/guide/laundry",
  };
};

beforeEach(() => {
  translations.clear();
  translations.set("it", {});
  translations.set("en", {});
  buildCfImageUrlMock.mockClear();
  getGuidesTranslatorSpy.mockImplementation(
    (locale: string) => createTranslator(locale) as ReturnType<typeof faqModule.getGuidesTranslator>,
  );
});

describe("Laundry Positano guide extras", () => {
  it("combines primary and fallback content, flagging reused how-to steps", () => {
    setTranslations("it", {
      "content.laundryPositano.intro": ["Intro"],
      "content.laundryPositano.sections": [
        { title: " Section title ", id: "", body: ["Body"] },
        { title: "", body: [] },
      ],
      "content.laundryPositano.howtoSteps": ["Step"],
      "content.laundryPositano.tips": ["Tip"],
      "content.laundryPositano.faqs": [{ q: "Question", a: [" Answer "] }],
      "content.laundryPositano.gallery": {
        items: [{ alt: "Primary alt", caption: "Primary caption" }],
      },
      "content.laundryPositano.toc": {
        onThisPage: "Indice",
        howto: "Come fare",
      },
      "content.laundryPositano.linkLabel": "Laundry link",
    });

    setTranslations("en", {
      "content.laundryPositano.intro": ["Fallback intro"],
      "content.laundryPositano.sections": [{ id: "fallback", title: "Fallback", body: ["Fallback body"] }],
      "content.laundryPositano.howtoSteps": ["Step"],
      "content.laundryPositano.tips": ["Fallback tip"],
      "content.laundryPositano.faqs": [{ q: "Fallback", a: ["Fallback answer"] }],
      "content.laundryPositano.gallery": {
        items: [
          { alt: "Fallback alt", caption: "Fallback caption" },
          { alt: "Fallback second alt" },
        ],
      },
      "content.laundryPositano.toc": {
        tips: "Consigli",
        faqs: "Domande",
      },
      "labels.photoGallery": "Galleria",
      "labels.onThisPage": "Sommario",
      "labels.tips": "Suggerimenti",
      "labels.faqs": "Domande frequenti",
    });

    const extras = buildGuideExtras(createContext());

    expect(extras.intro).toEqual(["Intro"]);
    expect(extras.sections).toEqual([{ id: "section-title", title: "Section title", body: ["Body"] }]);
    expect(extras.howToSteps).toEqual(["Step"]);
    expect(extras.howToStepsUsedFallback).toBe(true);
    expect(extras.tips).toEqual(["Tip"]);
    expect(extras.faqs).toEqual([{ q: "Question", a: ["Answer"] }]);
    expect(extras.galleryItems[0]).toEqual({
      src: "/img/positano-laundry.avif?w=1200",
      alt: "Primary alt",
      caption: "Primary caption",
    });
    expect(extras.galleryItems[1]).toEqual({
      src: "/img/positano-sink.avif?w=1200",
      alt: "Fallback second alt",
      caption: "Fallback second alt",
    });
    expect(extras.tocItems).toEqual([
      { href: "#section-title", label: "Section title" },
      { href: "#howto", label: "Come fare" },
      { href: "#tips", label: "Suggerimenti" },
      { href: "#faqs", label: "Domande" },
    ]);
    expect(extras.tocTitle).toBe("Indice");
    expect(extras.faqsTitle).toBe("Domande");
  });

  it("falls back to self-service section when only string fallback exists", () => {
    setTranslations("it", { "content.laundryPositano.sections": [] });
    setTranslations("en", {
      "content.laundryPositano.sections": [],
      "content.laundryPositano.sections.default": ["Fallback body"],
      "content.laundryPositano.toc.selfService": "Self service",
    });

    const extras = buildGuideExtras(createContext());
    expect(extras.sections).toEqual([{ id: "self-service", title: "Self service", body: ["Fallback body"] }]);
  });

  it("prefers translator labels and collapses fallback phrasing", () => {
    setTranslations("it", {
      "content.laundryPositano.sections": [{ title: "Section", id: "section", body: [] }],
      "content.laundryPositano.tips": ["Tip"],
      "content.laundryPositano.faqs": [],
      "labels.tips": "Suggerimenti primari",
    });
    setTranslations("en", {
      "content.laundryPositano.sections": [{ title: "Fallback", id: "fallback", body: [] }],
      "content.laundryPositano.tips": ["Tip"],
      "content.laundryPositano.toc": { tips: "Indice consigli" },
      "labels.tips": "Indice consigli (IT)",
    });

    const extras = buildGuideExtras(createContext());
    expect(extras.tipsTitle).toBe("Suggerimenti primari");
    expect(extras.tocItems).toContainEqual({ href: "#tips", label: "Suggerimenti primari" });
  });

  it("returns fallback candidate when localisation strings share prefixes", () => {
    setTranslations("it", {
      "content.laundryPositano.sections": [{ title: "Section", id: "section", body: [] }],
      "content.laundryPositano.tips": ["Tip"],
      "labels.tips": "labels.tips",
    });
    setTranslations("en", {
      "content.laundryPositano.sections": [{ title: "Fallback", id: "fallback", body: [] }],
      "content.laundryPositano.tips": ["Tip"],
      "content.laundryPositano.toc": { tips: "Guida consigli" },
    });

    const extras = buildGuideExtras(createContext());
    expect(extras.tipsTitle).toBe("Guida consigli");
  });

  it("derives self-service sections and toc labels from guide link fallbacks", () => {
    setTranslations("it", { "content.laundryPositano.sections": [] });
    setTranslations("en", {
      "content.laundryPositano.sections.default": ["Fallback body"],
      "content.laundryPositano.toc.selfService": "",
      "content.laundryPositano.linkLabel": "Self‑service",
    });

    const extras = buildGuideExtras(createContext());
    expect(extras.sections).toEqual([{ id: "self-service", title: "Self‑service", body: ["Fallback body"] }]);
    expect(extras.tocItems).toContainEqual({ href: "#self-service", label: "Self‑service" });
  });
});

describe("Laundry Positano article lead", () => {
  const context = createContext();

  it("renders each section from extras", () => {
    const extras: GuideExtras = {
      intro: ["Intro"],
      sections: [{ id: "overview", title: "Overview", body: ["Body"] }],
      howToSteps: ["Step 1", "Step 2"],
      howToStepsUsedFallback: false,
      tips: ["Tip"],
      faqs: [{ q: "Cost?", a: ["€10"] }],
      galleryItems: [
        { src: "hero.avif", alt: "Hero" },
        { src: "gallery.avif", alt: "Gallery", caption: "Caption" },
      ],
      tocItems: [{ href: "#overview", label: "Overview" }],
      tocTitle: "On this page",
      howToTitle: "How it works",
      tipsTitle: "Tips",
      faqsTitle: "FAQs",
    };

    renderWithProviders(createArticleLead(() => extras, context));

    expect(screen.getByText("Intro")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tips" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "FAQs" })).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Tip")).toBeInTheDocument();
    expect(screen.getByText("€10")).toBeInTheDocument();
  });

  it("omits optional sections when extras are empty", () => {
    const extras: GuideExtras = {
      intro: [],
      sections: [],
      howToSteps: [],
      howToStepsUsedFallback: false,
      tips: [],
      faqs: [],
      galleryItems: [],
      tocItems: [],
      tocTitle: "On this page",
      howToTitle: "How it works",
      tipsTitle: "Tips",
      faqsTitle: "FAQs",
    };

    renderWithProviders(createArticleLead(() => extras, context));

    expect(screen.queryByRole("heading", { name: "How it works" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Tips" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "FAQs" })).toBeNull();
    expect(screen.queryByTestId("toc")).toBeNull();
  });
});