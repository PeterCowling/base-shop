import { beforeEach, describe, expect, it } from "vitest";

import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import {
  createTranslator,
  resetGuideTestState,
  setTranslations,
} from "@/routes/guides/__tests__/guides.test-utils";

import { createGuideExtras } from "./guideExtras";
import { GUIDE_KEY, STOP_IMAGE_SRC } from "./constants";

const getFixedTSpy = vi.spyOn(appI18n, "getFixedT");

const buildContext = (lang: "it" | "fr" | "ru" | "en" = "it"): GuideSeoTemplateContext => ({
  lang,
  guideKey: GUIDE_KEY,
  metaKey: GUIDE_KEY,
  hasLocalizedContent: true,
  translator: createTranslator(lang, ["guides"]),
  translateGuides: createTranslator(lang, ["guides"]),
  sections: [],
  intro: [],
  faqs: [],
  toc: [],
  ogImage: { url: "", width: 0, height: 0 },
  article: { title: "", description: "" },
  canonicalUrl: "",
});

describe("chiesaNuovaDepartures guide extras", () => {
  beforeEach(() => {
    resetGuideTestState();
    setTranslations("en", "guidesFallback", {
      labels: {
        onThisPage: "English On This Page",
        before: "English Before",
        steps: "English Steps",
        knees: "English Knees",
        faqs: "English FAQs",
      },
    });
  });

  it("uses localized content and explicit toc data", () => {
    setTranslations("it", "guides", {
      content: {
        [GUIDE_KEY]: {
          intro: ["Localized intro"],
          sections: [
            { id: "", title: " Piazza ", body: [" Walk down ", ""] },
            { id: "", title: "", body: ["Second paragraph"] },
          ],
          beforeList: ["Check departure board"],
          stepsList: ["Buy ticket"],
          stepsMapEmbedUrl: " https://primary.example/map ",
          kneesList: [],
          kneesDockPrefix: "  Dock prefix  ",
          kneesDockLinkLabel: " Dock link ",
          kneesPorterPrefix: " Porter prefix ",
          kneesPorterLinkLabel: " Porter link ",
          image: { alt: " Primary alt ", caption: "Primary caption" },
          faqs: [{ q: "  Local FAQ?  ", a: [" Use %LINK:naplesPositano|Naples%"] }],
          faqsTitle: " Local FAQs ",
          howtoSteps: ["Step A", "Step B"],
          tocTitle: " Local TOC ",
        },
      },
    });
    setTranslations("it", "guides", {
      [`content.${GUIDE_KEY}.toc`]: [{ href: "#custom", label: "Custom anchor" }],
    });
    setTranslations("it", "guidesFallback", {
      labels: {
        onThisPage: "Localized On This Page",
        before: "Localized Before",
        steps: "Localized Steps",
        knees: "Localized Knees",
        faqs: "Localized FAQs",
      },
    });

    const extras = createGuideExtras(buildContext("it"));

    expect(extras.intro).toEqual(["Localized intro"]);
    expect(extras.sections).toEqual([
      { id: "piazza", title: "Piazza", body: [" Walk down "] },
      { id: "section-2", title: "Section 2", body: ["Second paragraph"] },
    ]);
    expect(extras.beforeList).toEqual(["Check departure board"]);
    expect(extras.stepsList).toEqual(["Buy ticket"]);
    expect(extras.stepsMapEmbedUrl).toBe("https://primary.example/map");
    expect(extras.kneesDockPrefix).toBe("Dock prefix");
    expect(extras.kneesDockLinkText).toBe("Dock link");
    expect(extras.kneesPorterPrefix).toBe("Porter prefix");
    expect(extras.kneesPorterLinkText).toBe("Porter link");
    expect(extras.image).toEqual({ src: STOP_IMAGE_SRC, alt: "Primary alt", caption: "Primary caption" });
    expect(extras.faqs).toEqual([{ q: "Local FAQ?", a: [" Use %LINK:naplesPositano|Naples%"] }]);
    expect(extras.faqsTitle).toBe("Local FAQs");
    expect(extras.tocTitle).toBe("Local TOC");
    expect(extras.tocItems).toEqual([
      { href: "#piazza", label: "Piazza" },
      { href: "#section-2", label: "Section 2" },
      { href: "#before", label: "Localized Before" },
      { href: "#steps", label: "Localized Steps" },
      { href: "#knees", label: "Localized Knees" },
      { href: "#faqs", label: "Local FAQs" },
    ]);
    expect(extras.howToSteps).toEqual(["Step A", "Step B"]);
    expect(extras.labels.onThisPage).toBe("Localized On This Page");
  });

  it("falls back to locale fallback data and English when localized content is missing", () => {
    setTranslations("fr", "guides", {
      content: { [GUIDE_KEY]: {} },
    });
    setTranslations("fr", "guidesFallback", {
      [GUIDE_KEY]: {
        intro: ["Fallback intro"],
        sections: [{ id: "", title: "Fallback Piazza", body: ["Walk down"] }],
        beforeList: ["Fallback before"],
        stepsList: ["Fallback step"],
        kneesList: ["Fallback knees"],
        kneesDockPrefix: "Fallback dock prefix",
        kneesDockLinkLabel: "Fallback dock link",
        kneesPorterPrefix: "Fallback porter prefix",
        kneesPorterLinkLabel: "Fallback porter link",
        faqs: [{ q: "Fallback Q", a: ["Fallback A"] }],
        faqsTitle: "",
        toc: [],
        howtoSteps: ["Fallback HowTo"],
      },
      labels: {
        onThisPage: "Fallback On This Page",
        before: "Fallback Before",
        steps: "Fallback Steps",
        knees: "Fallback Knees",
        faqs: "Fallback FAQs",
      },
    });
    setTranslations("en", "guidesFallback", {
      [GUIDE_KEY]: {
        toc: [{ href: "#en", label: "English fallback" }],
        faqsTitle: "English fallback Title",
      },
    });

    const extras = createGuideExtras(buildContext("fr"));

    expect(extras.intro).toEqual(["Fallback intro"]);
    expect(extras.sections).toEqual([{ id: "fallback-piazza", title: "Fallback Piazza", body: ["Walk down"] }]);
    expect(extras.beforeList).toEqual(["Fallback before"]);
    expect(extras.stepsList).toEqual(["Fallback step"]);
    expect(extras.kneesList).toEqual(["Fallback knees"]);
    expect(extras.kneesDockPrefix).toBe("Fallback dock prefix");
    expect(extras.kneesPorterLinkText).toBe("Fallback porter link");
    expect(extras.faqs).toEqual([{ q: "Fallback Q", a: ["Fallback A"] }]);
    expect(extras.faqsTitle).toBe("English fallback Title");
    expect(extras.tocItems).toEqual([
      { href: "#fallback-piazza", label: "Fallback Piazza" },
      { href: "#before", label: "Fallback Before" },
      { href: "#steps", label: "Fallback Steps" },
      { href: "#knees", label: "Fallback Knees" },
      { href: "#faqs", label: "English fallback Title" },
    ]);
    expect(extras.howToSteps).toEqual(["Fallback HowTo"]);
    expect(extras.labels.onThisPage).toBe("Fallback On This Page");
  });

  it("falls back to English data for locales that suppress English fallback", () => {
    setTranslations("ru", "guides", {
      content: { [GUIDE_KEY]: {} },
    });
    setTranslations("ru", "guidesFallback", {
      [GUIDE_KEY]: {},
      labels: {},
    });
    setTranslations("en", "guidesFallback", {
      [GUIDE_KEY]: {
        intro: ["English intro"],
        sections: [{ id: "", title: "English Section", body: ["Body"] }],
        beforeList: ["English before"],
        stepsList: ["English steps"],
        kneesList: ["English knees"],
        faqs: [{ q: "English Q", a: ["English A"] }],
        faqsTitle: "English FAQs",
        toc: [{ href: "#en", label: "English fallback" }],
        howtoSteps: ["English HowTo"],
      },
    });

    const extras = createGuideExtras(buildContext("ru"));

    expect(extras.intro).toEqual(["English intro"]);
    expect(extras.sections).toEqual([{ id: "english-section", title: "English Section", body: ["Body"] }]);
    expect(extras.beforeList).toEqual(["English before"]);
    expect(extras.stepsList).toEqual(["English steps"]);
    expect(extras.kneesList).toEqual(["English knees"]);
    expect(extras.faqs).toEqual([{ q: "English Q", a: ["English A"] }]);
    expect(extras.faqsTitle).toBe("English FAQs");
    expect(extras.tocItems).toEqual([
      { href: "#english-section", label: "English Section" },
      { href: "#before", label: "English Before" },
      { href: "#steps", label: "English Steps" },
      { href: "#knees", label: "English Knees" },
      { href: "#faqs", label: "English FAQs" },
    ]);
    expect(extras.howToSteps).toEqual(["English HowTo"]);
    expect(extras.labels.onThisPage).toBe("English On This Page");
  });
});