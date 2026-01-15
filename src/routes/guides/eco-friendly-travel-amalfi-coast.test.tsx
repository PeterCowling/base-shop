import { beforeAll, describe, expect, it, vi } from "vitest";
import { getGuidesBundle } from "../../locales/guides";
import { withGuideMocks } from "./__tests__/guideTestHarness";
import { createTranslator, genericContentMock } from "./__tests__/guides.test-utils.tsx";
import { GUIDE_KEY } from "./eco-friendly-travel-amalfi-coast";

vi.mock("@/components/seo/GuideFaqJsonLd", () => ({ default: () => null }));

type GuidesNs = Record<string, any>;

let baseGuides: GuidesNs;
let baseFallback: GuidesNs;

const cloneGuides = <T extends GuidesNs>(source: T): T => JSON.parse(JSON.stringify(source));
const escapeForRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const buildTitleMatcher = (title: string): RegExp =>
  new RegExp(escapeForRegex(title).replace(/-/g, "[-\\u2010-\\u2015]"), "i");

describe("Eco-friendly travel guide", () => {
  beforeAll(async () => {
    baseGuides = (getGuidesBundle("en") ?? {}) as GuidesNs;
    const { default: fallbackBundle } = await import("@/locales/en/guidesFallback.json");
    baseFallback = { content: {}, ...fallbackBundle } as GuidesNs;
  });

  const baseTitle =
    (baseGuides?.content?.ecoFriendlyAmalfi?.seo?.title as string | undefined) ??
    "Eco-friendly travel on the Amalfi Coast";

  it("renders structured content when localized sections exist", async () => {
    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("en", "guides", baseGuides);
      setTranslations("en", "guidesFallback", baseFallback);
      setCurrentLanguage("en");

      const { findByRole } = await renderRoute({ lang: "en" });
      const headingMatcher = buildTitleMatcher(baseTitle);
      expect(await findByRole("heading", { level: 1, name: headingMatcher })).toBeInTheDocument();
    });
  });

  it("falls back to curated copy when localized content is missing", async () => {
    const italianGuides = cloneGuides(baseGuides);
    italianGuides.content.ecoFriendlyAmalfi.intro = [];
    italianGuides.content.ecoFriendlyAmalfi.sections = [];
    italianGuides.content.ecoFriendlyAmalfi.faqs = [];


    const italianFallback = cloneGuides(baseFallback);
    italianFallback.ecoFriendlyAmalfi = {
      intro: ["  Introduzione sostenibile  "],
      toc: [
        { label: "  Trasporti  " },
        { href: "#tips", label: "Suggerimenti" },
      ],
      sections: [
        {
          title: "  Trasporti  ",
          items: ["  Usa i bus SITA  ", ""],
        },
        {
          id: "riuso",
          title: "Riduci i rifiuti",
          body: ["Porta una borraccia riutilizzabile"],
        },
      ],
      faqs: [
        {
          question: "  Come riciclo a Positano?  ",
          answer: ["Segui i bidoni differenziati"],
        },
      ],
      faqsTitle: "  Domande sostenibili  ",
    };

    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("en", "guides", baseGuides);
      setTranslations("en", "guidesFallback", baseFallback);
      setTranslations("it", "guides", italianGuides);
      setTranslations("it", "guidesFallback", italianFallback);
      setCurrentLanguage("it");

      const { findByRole, findByText } = await renderRoute({ lang: "it" });
      const toc = await findByRole("navigation", { name: /on this page/i });
      const hrefs = Array.from(toc.querySelectorAll("a")).map((link) => link.getAttribute("href"));

      expect(hrefs).toEqual(expect.arrayContaining(["#s-0", "#tips"]));
      expect(await findByText("Introduzione sostenibile")).toBeInTheDocument();
      expect(await findByRole("heading", { level: 2, name: "Trasporti" })).toBeInTheDocument();
      expect(await findByText("Usa i bus SITA")).toBeInTheDocument();
      expect(await findByRole("heading", { level: 2, name: "Domande sostenibili" })).toBeInTheDocument();
      expect(await findByText("Come riciclo a Positano?")).toBeInTheDocument();
      expect(await findByText("Segui i bidoni differenziati")).toBeInTheDocument();
    });
  });

  it("renders only the heading when both structured and fallback content are empty", async () => {
    const norwegianGuides = cloneGuides(baseGuides);
    norwegianGuides.content.ecoFriendlyAmalfi = {
      intro: [],
      sections: [],
      faqs: [],
    };

    const norwegianFallback = cloneGuides(baseFallback);
    norwegianFallback.ecoFriendlyAmalfi = {
      intro: ["   "],
      toc: [{ href: "", label: "" }],
      sections: [{ title: "", body: [] }],
      faqs: [{ q: "", a: [] }],
      faqsTitle: " ",
    };

    const englishFallbackPatched = cloneGuides(baseFallback);
    englishFallbackPatched.ecoFriendlyAmalfi = {
      intro: [],
      toc: [],
      sections: [],
      faqs: [],
      faqsTitle: "",
    };

    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("en", "guides", baseGuides);
      setTranslations("en", "guidesFallback", englishFallbackPatched);
      setTranslations("no", "guides", norwegianGuides);
      setTranslations("no", "guidesFallback", norwegianFallback);
      setCurrentLanguage("no");

      const { queryByRole } = await renderRoute({ lang: "no" });
      const toc = queryByRole("navigation", { name: /on this page/i });
      expect(toc).toBeTruthy();
      const hrefs = Array.from(toc?.querySelectorAll("a") ?? []).map((link) => link.getAttribute("href"));
      expect(hrefs).toEqual(["#s-0"]);
      expect(document.querySelector("#faqs")).toBeNull();
      expect(document.querySelectorAll("article section").length).toBe(0);
    });
  });

  it("defaults the fallback FAQ heading to 'FAQs' when the title is blank", async () => {
    const portugueseGuides = cloneGuides(baseGuides);
    portugueseGuides.content.ecoFriendlyAmalfi.intro = [];
    portugueseGuides.content.ecoFriendlyAmalfi.sections = [];
    portugueseGuides.content.ecoFriendlyAmalfi.faqs = [];

    const portugueseFallback = cloneGuides(baseFallback);
    portugueseFallback.ecoFriendlyAmalfi = {
      intro: ["Introdução verde"],
      toc: [{ href: "#dicas", label: "Dicas" }],
      sections: [
        { title: "Transporte", items: ["Prefira ônibus regionais"] },
      ],
      faqs: [
        { question: "Como posso reduzir plástico?", answer: ["Traga uma garrafa reutilizável"] },
      ],
      faqsTitle: "   ",
    };

    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("en", "guides", baseGuides);
      setTranslations("en", "guidesFallback", baseFallback);
      setTranslations("pt", "guides", portugueseGuides);
      setTranslations("pt", "guidesFallback", portugueseFallback);
      setCurrentLanguage("pt");

      const { findByRole, findByText } = await renderRoute({ lang: "pt" });
      await expect(findByText("Introdução verde")).resolves.toBeInTheDocument();
      const toc = await findByRole("navigation", { name: /on this page/i });
      expect(Array.from(toc.querySelectorAll("a")).map((link) => link.getAttribute("href"))).toEqual(["#dicas"]);
      await expect(findByRole("heading", { level: 2, name: "Transporte" })).resolves.toBeInTheDocument();
      await expect(findByText("Prefira ônibus regionais")).resolves.toBeInTheDocument();
      await expect(findByRole("heading", { level: 2, name: "FAQs" })).resolves.toBeInTheDocument();
      await expect(findByText("Como posso reduzir plástico?")).resolves.toBeInTheDocument();
      await expect(findByText("Traga uma garrafa reutilizável")).resolves.toBeInTheDocument();
    });
  });

  it("renders fallback sections and derived anchors when the intro is missing", async () => {
    const swedishGuides = cloneGuides(baseGuides);
    swedishGuides.content.ecoFriendlyAmalfi.intro = [];
    swedishGuides.content.ecoFriendlyAmalfi.sections = [];
    swedishGuides.content.ecoFriendlyAmalfi.faqs = [];

    const swedishFallback = cloneGuides(baseFallback);
    swedishFallback.ecoFriendlyAmalfi = {
      intro: [],
      toc: [{ href: "", label: 123 }, { href: "#stays", label: "  Hållbara boenden  " }],
      sections: [
        { title: 99, items: ["Ignoreras"] },
        { id: "", title: "  Hållbara boenden  ", items: ["  Stöd lokala pensionat  "] },
      ],
      faqs: [],
      faqsTitle: "",
    };

    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("en", "guides", baseGuides);
      setTranslations("en", "guidesFallback", baseFallback);
      setTranslations("sv", "guides", swedishGuides);
      setTranslations("sv", "guidesFallback", swedishFallback);
      setCurrentLanguage("sv");

      const { findByRole, queryByRole } = await renderRoute({ lang: "sv" });
      console.log("genericContentMock calls (sv):", genericContentMock.mock.calls.length);
      const tocNav = await findByRole("navigation", { name: /on this page/i });
      const tocHrefs = Array.from(tocNav.querySelectorAll("a")).map((link) => link.getAttribute("href"));
      expect(tocHrefs).toEqual(expect.arrayContaining(["#s-0", "#stays"]));
      expect(await findByRole("heading", { level: 2, name: "Hållbara boenden" })).toBeInTheDocument();
      expect(queryByRole("heading", { level: 2, name: /faq/i })).toBeNull();
    });
  });

  it("renders fallback FAQs sourced from question fields when other content is empty", async () => {
    const polishGuides = cloneGuides(baseGuides);
    polishGuides.content.ecoFriendlyAmalfi.intro = [];
    polishGuides.content.ecoFriendlyAmalfi.sections = [];
    polishGuides.content.ecoFriendlyAmalfi.faqs = [];

    const polishFallback = cloneGuides(baseFallback);
    polishFallback.ecoFriendlyAmalfi = {
      intro: [],
      toc: [],
      sections: [],
      faqs: [
        { question: "  Czy są kosze na recykling?  ", answer: ["  Tak, w centrum miasta  "] },
      ],
      faqsTitle: "  Pytania ekologiczne  ",
    };

    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("en", "guides", baseGuides);
      setTranslations("en", "guidesFallback", baseFallback);
      setTranslations("pl", "guides", polishGuides);
      setTranslations("pl", "guidesFallback", polishFallback);
      setCurrentLanguage("pl");

      const { findByRole, findByText } = await renderRoute({ lang: "pl" });
      expect(await findByRole("heading", { level: 2, name: "Pytania ekologiczne" })).toBeInTheDocument();
      expect(await findByText("Czy są kosze na recykling?")).toBeInTheDocument();
      expect(await findByText("Tak, w centrum miasta")).toBeInTheDocument();
    });
  });

  it("renders fallback navigation when only toc entries remain after sanitisation", async () => {
    const germanGuides = cloneGuides(baseGuides);
    germanGuides.content.ecoFriendlyAmalfi.intro = [];
    germanGuides.content.ecoFriendlyAmalfi.sections = [];
    germanGuides.content.ecoFriendlyAmalfi.faqs = [];

    const germanFallback = cloneGuides(baseFallback);
    germanFallback.ecoFriendlyAmalfi = {
      intro: [],
      toc: [{ label: "  Nachhaltige Tipps  " }],
      sections: [{ title: "", body: [] }],
      faqs: [],
      faqsTitle: "",
    };

    await withGuideMocks(GUIDE_KEY, async ({ renderRoute, setTranslations, setCurrentLanguage }) => {
      setTranslations("en", "guides", baseGuides);
      setTranslations("en", "guidesFallback", baseFallback);
      setTranslations("de", "guides", germanGuides);
      setTranslations("de", "guidesFallback", germanFallback);
      setCurrentLanguage("de");

      const { findByRole } = await renderRoute({ lang: "de" });
      console.log("genericContentMock calls (de):", genericContentMock.mock.calls.length);
      const tocNav = await findByRole("navigation", { name: /on this page/i });
      expect(Array.from(tocNav.querySelectorAll("a")).map((link) => link.getAttribute("href"))).toEqual(["#s-0"]);
      expect(document.querySelector("article section")).toBeNull();
      expect(document.querySelector("#faqs")).toBeNull();
    });
  });
});