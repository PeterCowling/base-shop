import { describe, expect, it } from "vitest";

import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { SLUGS } from "@/slug-map";
import { getSlug } from "@/utils/slug";
import { ARTICLE_KEYS, articleSlug } from "@/routes.assistance-helpers";
import { guideSlug, type GuideKey } from "@/routes.guides-helpers";
import { buildBreadcrumb, buildLinks, buildMeta } from "@/utils/seo";

(i18nConfig.supportedLngs as unknown as string[]) = [
  "de",
  "en",
  "es",
  "fr",
  "it",
  "ja",
  "ko",
  "pt",
  "ru",
  "zh",
];

describe("buildLinks", () => {
  const origin = "https://example.com";

  it("returns canonical + alternates on home", () => {
    const links = buildLinks({ lang: "en", origin, path: "/" });

    const canonical = links[0];
    expect(canonical).toEqual({ rel: "canonical", href: origin });

    const alternates = links.slice(1, -1);
    expect(alternates).toHaveLength(i18nConfig.supportedLngs.length - 1);
    expect(alternates.map((link) => link.hrefLang)).not.toContain("en");

    const xDefault = links.at(-1);
    expect(xDefault).toEqual(
      expect.objectContaining({ rel: "alternate", hrefLang: "x-default" }),
    );
  });

  it("handles localized subpaths with stripped prefix", () => {
    const links = buildLinks({ lang: "en", origin, path: "/en/rooms" });
    expect(links[0].href).toBe(`${origin}/en/rooms`);
    expect(links.some((link) => link.href.includes("/fr/chambres"))).toBe(true);
  });

  it("produces localized alternates for deals page", () => {
    const links = buildLinks({ lang: "en", origin, path: "/en/deals" });
    const fr = links.find((link) => link.hrefLang === "fr");
    const it = links.find((link) => link.hrefLang === "it");
    expect(fr?.href).toBe(`${origin}/fr/offres`);
    expect(it?.href).toBe(`${origin}/it/offerte`);
  });

  it("produces localized alternates for about page", () => {
    const links = buildLinks({ lang: "en", origin, path: "/en/about" });
    const fr = links.find((link) => link.hrefLang === "fr");
    const it = links.find((link) => link.hrefLang === "it");
    expect(fr?.href).toBe(`${origin}/fr/a-propos`);
    expect(it?.href).toBe(`${origin}/it/chi-siamo`);
  });

  it("produces localized alternates for help root", () => {
    const path = `/en/${getSlug("assistance", "en")}`;
    const links = buildLinks({ lang: "en", origin, path });
    const fr = links.find((link) => link.hrefLang === "fr");
    const it = links.find((link) => link.hrefLang === "it");
    expect(fr?.href).toBe(`${origin}/fr/${getSlug("assistance", "fr")}`);
    expect(it?.href).toBe(`${origin}/it/${getSlug("assistance", "it")}`);
  });

  it("produces localized alternates for help articles", () => {
    const path = `/en/${getSlug("assistance", "en")}/arriving-by-ferry`;
    const links = buildLinks({ lang: "en", origin, path });
    const fr = links.find((link) => link.hrefLang === "fr");
    const it = links.find((link) => link.hrefLang === "it");
    expect(fr?.href).toBe(`${origin}/fr/${getSlug("assistance", "fr")}/arriver-en-ferry`);
    expect(it?.href).toBe(`${origin}/it/${getSlug("assistance", "it")}/arrivo-in-traghetto`);
  });

  it("produces localized alternates for apartment page", () => {
    const links = buildLinks({ lang: "en", origin, path: "/en/apartment" });
    const fr = links.find((link) => link.hrefLang === "fr");
    const it = links.find((link) => link.hrefLang === "it");
    expect(fr?.href).toBe(`${origin}/fr/appartements`);
    expect(it?.href).toBe(`${origin}/it/appartamenti`);
  });

  it("produces localized alternates for guides pages", () => {
    const guideKey: GuideKey = "ferrySchedules";
    const baseLang: AppLanguage = "en";
    const frLang: AppLanguage = "fr";
    const itLang: AppLanguage = "it";
    const page = buildLinks({ lang: baseLang, origin, path: "/en/guides/ferry-schedules" });
    const frPage = page.find((link) => link.hrefLang === "fr");
    const itPage = page.find((link) => link.hrefLang === "it");
    expect(frPage?.href).toBe(
      `${origin}/${frLang}/${getSlug("guides", frLang)}/${guideSlug(frLang, guideKey)}`,
    );
    expect(itPage?.href).toBe(
      `${origin}/${itLang}/${getSlug("guides", itLang)}/${guideSlug(itLang, guideKey)}`,
    );
  });

  it("produces localized alternates for rooms detail pages (slug preserved)", () => {
    const links = buildLinks({ lang: "en", origin, path: "/en/rooms/double_room" });
    const fr = links.find((link) => link.hrefLang === "fr");
    const it = links.find((link) => link.hrefLang === "it");
    expect(fr?.href).toBe(`${origin}/fr/chambres/double_room`);
    expect(it?.href).toBe(`${origin}/it/camere/double_room`);
  });

  it("produces localized alternates for careers page", () => {
    const links = buildLinks({ lang: "en", origin, path: "/en/careers" });
    const fr = links.find((link) => link.hrefLang === "fr");
    const it = links.find((link) => link.hrefLang === "it");
    expect(fr?.href).toBe(`${origin}/fr/carrieres`);
    expect(it?.href).toBe(`${origin}/it/carriere`);
  });

  it("includes x-default pointing to fallback language on subpage", () => {
    const links = buildLinks({ lang: "en", origin, path: "/en/rooms" });
    const xDefault = links.find((link) => link.hrefLang === "x-default");
    expect(xDefault?.href).toBe(`${origin}/en/rooms`);
  });

  it("home '/' canonical and alternates are correct", () => {
    const links = buildLinks({ lang: "xx", origin, path: "/" });
    const canonical = links.find((link) => link.rel === "canonical");
    const alternates = links.filter((link) => link.rel === "alternate");
    expect(canonical?.href).toBe(origin);
    expect(alternates).toHaveLength(i18nConfig.supportedLngs.length);
    const xDefault = alternates.find((link) => link.hrefLang === "x-default");
    expect(xDefault?.href).toBe(`${origin}/${i18nConfig.fallbackLng}`);
  });

  it("home '/en' canonical and alternates match supported languages", () => {
    const links = buildLinks({ lang: "en", origin, path: "/en" });
    const canonical = links.find((link) => link.rel === "canonical");
    const alternates = links.filter((link) => link.rel === "alternate");
    expect(canonical?.href).toBe(`${origin}/en`);
    expect(alternates).toHaveLength(i18nConfig.supportedLngs.length);
    const langs = alternates.map((link) => link.hrefLang).filter(Boolean);
    expect(langs).toContain("x-default");
    for (const lng of i18nConfig.supportedLngs) {
      if (lng === "en") continue;
      expect(langs).toContain(lng);
    }
  });

  it("produces no duplicate alternates and excludes current language", () => {
    const path = `/en/${getSlug("assistance", "en")}`;
    const links = buildLinks({ lang: "en", origin, path });
    const alternates = links.filter((link) => link.rel === "alternate");

    const langs = alternates.map((link) => link.hrefLang);
    const uniqueLangs = new Set(langs);
    expect(uniqueLangs.size).toBe(alternates.length);
    expect(uniqueLangs.has("en")).toBe(false);
    expect(uniqueLangs.has("x-default")).toBe(true);
  });

  it("normalizes alternate hrefs (no double slashes after protocol)", () => {
    const cases = [
      "/en",
      "/en/rooms",
      `/en/${getSlug("assistance", "en")}/arriving-by-ferry`,
    ];
    for (const path of cases) {
      const links = buildLinks({ lang: "en", origin, path });
      const alternates = links.filter((link) => link.rel === "alternate");
      for (const link of alternates) {
        expect(link.href).not.toMatch(/:\/\/[A-Za-z0-9.-]+\/{2,}/);
      }
    }
  });

  it("translates first segment for all top-level slugs", () => {
    const base = "en" as AppLanguage;
    const keys = Object.keys(SLUGS) as Array<keyof typeof SLUGS>;
    for (const key of keys) {
      if (key === "assistance") continue;
      const path = `/${base}/${getSlug(key as never, base)}`;
      const links = buildLinks({ lang: base, origin, path });
      const alternates = links.filter(
        (link) => link.rel === "alternate" && link.hrefLang !== "x-default",
      );
      for (const lng of i18nConfig.supportedLngs as unknown as AppLanguage[]) {
        if (lng === base) continue;
        const expected = `${origin}/${lng}/${getSlug(key as never, lng)}`;
        const got = alternates.find((link) => link.hrefLang === lng)?.href;
        expect(got).toBe(expected);
      }
    }
  });

  it("maps help article slugs across all languages", () => {
    const base = "en" as AppLanguage;
    for (const article of ARTICLE_KEYS) {
      const path = `/${base}/${getSlug("assistance", base)}/${articleSlug(base, article)}`;
      const links = buildLinks({ lang: base, origin, path });
      const alternates = links.filter(
        (link) => link.rel === "alternate" && link.hrefLang !== "x-default",
      );
      for (const lng of i18nConfig.supportedLngs as unknown as AppLanguage[]) {
        if (lng === base) continue;
        const expected = `${origin}/${lng}/${getSlug("assistance", lng)}/${articleSlug(
          lng as AppLanguage,
          article,
        )}`;
        const got = alternates.find((link) => link.hrefLang === lng)?.href;
        expect(got).toBe(expected);
      }
    }
  });

  it("produces Spanish and Russian alternates for rooms and deals", () => {
    const roomLinks = buildLinks({ lang: "en", origin, path: "/en/rooms" });
    const esRooms = roomLinks.find((link) => link.hrefLang === "es");
    const ruRooms = roomLinks.find((link) => link.hrefLang === "ru");
    expect(esRooms?.href).toBe(`${origin}/es/habitaciones`);
    expect(ruRooms?.href).toBe(`${origin}/ru/komnaty`);

    const dealsLinks = buildLinks({ lang: "en", origin, path: "/en/deals" });
    const esDeals = dealsLinks.find((link) => link.hrefLang === "es");
    const ruDeals = dealsLinks.find((link) => link.hrefLang === "ru");
    expect(esDeals?.href).toBe(`${origin}/es/ofertas`);
    expect(ruDeals?.href).toBe(`${origin}/ru/skidki`);
  });

  it("produces localized alternates for help article in ES and RU", () => {
    const path = `/en/${getSlug("assistance", "en")}/arriving-by-ferry`;
    const links = buildLinks({ lang: "en", origin, path });
    const es = links.find((link) => link.hrefLang === "es");
    const ru = links.find((link) => link.hrefLang === "ru");
    expect(es?.href).toBe(`${origin}/es/${getSlug("assistance", "es")}/llegar-en-ferry`);
    expect(ru?.href).toBe(`${origin}/ru/${getSlug("assistance", "ru")}/arriving-by-ferry`);
  });
});

describe("buildMeta", () => {
  const meta = buildMeta({
    lang: "en",
    title: "Test Title",
    description: "Test Desc",
    url: "https://example.com/en/test",
  });

  it("includes required meta tags", () => {
    const nameTags = meta.filter(
      (entry): entry is { name: string; content: string } => "name" in entry && "content" in entry,
    );
    const ogTags = meta.filter(
      (entry): entry is { property: string; content: string } =>
        "property" in entry && "content" in entry,
    );

    expect(nameTags.find((entry) => entry.name === "description")).toBeDefined();
    expect(ogTags.find((entry) => entry.property === "og:url")?.content).toBe(
      "https://example.com/en/test",
    );
  });

  it("orders tags predictably", () => {
    const charSetTag = meta[0];
    const viewportTag = meta[1];
    const descriptionTag = meta[2];
    const titleTag = meta[4];

    expect(charSetTag).toEqual({ charSet: "utf-8" });
    expect("name" in viewportTag && viewportTag.name).toBe("viewport");
    expect("name" in descriptionTag && descriptionTag.name).toBe("description");
    expect("title" in titleTag && titleTag.title).toBe("Test Title");
  });
});

describe("buildBreadcrumb", () => {
  const origin = "https://example.com";

  it("returns single home item on homepage", () => {
    const graph = buildBreadcrumb({
      lang: "en",
      origin,
      path: "/en",
      title: "Home",
      homeLabel: "Home",
    });

    expect(graph.itemListElement).toHaveLength(1);
    expect(graph.itemListElement[0]).toEqual(
      expect.objectContaining({ name: "Home", item: `${origin}/en` }),
    );
  });

  it("returns two items for subpage", () => {
    const graph = buildBreadcrumb({
      lang: "en",
      origin,
      path: "/en/rooms",
      title: "Rooms",
      homeLabel: "Home",
    });

    expect(graph.itemListElement).toHaveLength(2);
    expect(graph.itemListElement[1]).toEqual(
      expect.objectContaining({ name: "Rooms", item: `${origin}/en/rooms` }),
    );
  });
});