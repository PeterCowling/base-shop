import { beforeEach, describe, expect, it } from "vitest";

import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import {
  createTranslator,
  resetGuideTestState,
  setTranslations,
} from "@/routes/guides/__tests__/guides.test-utils";

import { createGuideExtras } from "./guideExtras";
import { GUIDE_KEY, STOP_IMAGE_SRC } from "./constants";

const FALLBACK_LABELS = {
  onThisPage: "Fallback on this page",
  before: "Fallback before",
  steps: "Fallback steps",
  knees: "Fallback knees",
  faqs: "Fallback faqs",
} as const;

const buildContext = (lang: "it" | "fr" | "ru" | "en" = "it"): GuideSeoTemplateContext => ({
  lang,
  guideKey: GUIDE_KEY,
  metaKey: GUIDE_KEY,
  hasLocalizedContent: true,
  translator: createTranslator(lang, ["guides"], { allowEnglishFallback: false }),
  translateGuides: createTranslator(lang, ["guides"], { allowEnglishFallback: false }),
  sections: [],
  intro: [],
  faqs: [],
  toc: [],
  ogImage: { url: "", width: 0, height: 0 },
  article: { title: "", description: "" },
  canonicalUrl: "",
});

describe("createGuideExtras (chiesaNuovaArrivals)", () => {
  beforeEach(() => {
    resetGuideTestState();
    setTranslations("en", "guidesFallback", {
      labels: FALLBACK_LABELS,
    });
  });

  it("reads primary content and builds fallbacks from multiple locales", () => {
    setTranslations("it", "guides", {
      content: {
        [GUIDE_KEY]: {
          intro: [],
          sections: [],
          beforeList: ["Bring cash"],
          stepsList: ["Primary step"],
          stepsMapEmbedUrl: " https://primary.example/map ",
          kneesList: [],
          kneesDockPrefix: "   ",
          kneesDockLinkLabel: `content.${GUIDE_KEY}.kneesDockLinkLabel`,
          kneesPorterPrefix: `content.${GUIDE_KEY}.kneesPorterPrefix`,
          kneesPorterLinkLabel: `content.${GUIDE_KEY}.kneesPorterLinkLabel`,
          image: { alt: " Primary alt ", caption: "Primary caption" },
          faqs: [],
          faqsTitle: "   ",
          howtoSteps: ["Step A", "Step B"],
          toc: {
            onThisPage: "On this page",
            before: "Before label",
            steps: "Steps label",
            knees: " ",
            faqs: undefined,
          },
          tocItems: [],
        },
      },
    });

    setTranslations("it", "guidesFallback", {
      [GUIDE_KEY]: {
        intro: ["Fallback intro"],
        sections: [
          { title: "  Piazza  ", id: "", body: ["Walk down", ""] },
          { title: "", body: ["Second paragraph"] },
        ],
        kneesList: ["Fallback knees"],
        kneesDockPrefix: "Dock prefix",
        kneesDockLinkLabel: "Dock link",
        kneesPorterLinkLabel: "Porter link",
        faqs: [],
        faq: [{ q: "Legacy Q", a: ["Legacy A"] }],
        faqsTitle: " ",
        tocItems: [],
      },
      labels: FALLBACK_LABELS,
    });

    setTranslations("en", "guidesFallback", {
      [GUIDE_KEY]: {
        intro: ["English intro"],
        faqs: [],
        faqsTitle: "English fallback Title",
        kneesPorterPrefix: "English porter prefix",
        tocItems: [{ href: "#en", label: "English fallback" }],
      },
      labels: FALLBACK_LABELS,
    });

    const context = buildContext("it");
    const translationKey = `content.${GUIDE_KEY}.kneesDockPrefix`;
    const rawTranslator = context.translator;
    context.translator = ((key: string, options?: Record<string, unknown>) => {
      if (key === translationKey) return "   ";
      return rawTranslator(key, options);
    }) as GuideSeoTemplateContext["translator"];

    const extras = createGuideExtras(context);

    expect(extras.intro).toEqual(["Fallback intro"]);
    expect(extras.sections).toEqual([
      { id: "piazza", title: "Piazza", body: ["Walk down"] },
      { id: "section-2", title: "Section 2", body: ["Second paragraph"] },
    ]);
    expect(extras.beforeList).toEqual(["Bring cash"]);
    expect(extras.stepsList).toEqual(["Primary step"]);
    expect(extras.stepsMapEmbedUrl).toBe("https://primary.example/map");
    expect(extras.kneesList).toEqual(["Fallback knees"]);
    expect(extras.kneesDockPrefix).toBe("");
    expect(extras.kneesDockLinkText).toBe("Dock link");
    expect(extras.kneesPorterPrefix).toBe("English porter prefix");
    expect(extras.kneesPorterLinkText).toBe("Porter link");
    expect(extras.image).toEqual({ src: STOP_IMAGE_SRC, alt: "Primary alt", caption: "Primary caption" });
    expect(extras.faqs).toEqual([{ q: "Legacy Q", a: ["Legacy A"] }]);
    expect(extras.faqsTitle).toBe("English fallback Title");
    expect(extras.tocTitle).toBe("On this page");
    expect(extras.tocItems).toEqual([{ href: "#en", label: "English fallback" }]);
    expect(extras.howToSteps).toEqual(["Step A", "Step B"]);
    expect(extras.labels).toEqual(FALLBACK_LABELS);
  });

  it("derives toc candidates when explicit entries are missing and handles blank strings", () => {
    setTranslations("it", "guides", {
      content: {
        [GUIDE_KEY]: {
          intro: ["Primary intro"],
          sections: [
            { title: "  First section  ", id: "", body: ["Line one", ""] },
            { title: "Second", body: ["Line two"] },
          ],
          beforeList: ["Carry ID"],
          stepsList: [],
          stepsMapEmbedUrl: undefined,
          kneesList: [],
          kneesDockPrefix: undefined,
          kneesDockLinkLabel: undefined,
          kneesPorterPrefix: undefined,
          kneesPorterLinkLabel: undefined,
          image: { alt: "  ", caption: "  " },
          faqs: [{ q: "Primary Q", a: ["Primary A"] }],
          faqsTitle: undefined,
          howtoSteps: [],
          toc: {},
          tocItems: [],
        },
      },
    });

    setTranslations("it", "guidesFallback", {
      [GUIDE_KEY]: {
        tocItems: [],
      },
      labels: FALLBACK_LABELS,
    });

    setTranslations("en", "guidesFallback", {
      [GUIDE_KEY]: {
        tocItems: [],
      },
      labels: FALLBACK_LABELS,
    });

    const context = buildContext("it");
    context.translator = (() => undefined) as GuideSeoTemplateContext["translator"];
    const extras = createGuideExtras(context);

    expect(extras.intro).toEqual(["Primary intro"]);
    expect(extras.sections).toEqual([
      { id: "first-section", title: "First section", body: ["Line one"] },
      { id: "second", title: "Second", body: ["Line two"] },
    ]);
    expect(extras.beforeList).toEqual(["Carry ID"]);
    expect(extras.stepsList).toEqual([]);
    expect(extras.stepsMapEmbedUrl).toBeUndefined();
    expect(extras.kneesList).toEqual([]);
    expect(extras.kneesDockPrefix).toBe("");
    expect(extras.kneesDockLinkText).toBe("");
    expect(extras.kneesPorterPrefix).toBe("");
    expect(extras.kneesPorterLinkText).toBe("");
    expect(extras.image).toBeUndefined();
    expect(extras.faqs).toEqual([{ q: "Primary Q", a: ["Primary A"] }]);
    expect(extras.faqsTitle).toBe("Fallback faqs");
    expect(extras.tocTitle).toBe("Fallback on this page");
    expect(extras.tocItems).toEqual([
      { href: "#first-section", label: "First section" },
      { href: "#second", label: "Second" },
      { href: "#before", label: "Fallback before" },
      { href: "#faqs", label: "Fallback faqs" },
    ]);
    expect(extras.howToSteps).toEqual([]);
    expect(extras.labels).toEqual(FALLBACK_LABELS);
  });
});