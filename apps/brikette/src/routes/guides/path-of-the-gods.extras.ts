import { debugGuide, isGuideDebugEnabled } from "@/utils/debug";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import { getGuidesBundle } from "../../locales/guides";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { GUIDE_KEY } from "./path-of-the-gods.constants";

export type PathOfTheGodsGuideExtras = {
  intro: string[];
  essentialsTitle: string;
  essentials: string[];
  costsTitle: string;
  costs: string[];
  sections: GuideSeoTemplateContext["sections"];
  tipsTitle: string | undefined;
  tips: string[];
  faqsTitle: string;
  tocTitle: string;
  tocItems: Array<{ href: string; label: string }>;
  galleryTitle: string;
  galleryItems: Array<{ src: string; alt: string; caption?: string }>;
};

const readString = (
  translate: GuideSeoTemplateContext["translateGuides"],
  key: string,
): string => {
  const value = translate(key);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0 && trimmed !== key) {
      return trimmed;
    }
  }
  return "";
};

const readStringWithFallback = (
  translate: GuideSeoTemplateContext["translateGuides"],
  ...keys: string[]
): string => {
  for (const candidate of keys) {
    const result = readString(translate, candidate);
    if (result.length > 0) {
      return result;
    }
  }
  return "";
};

const arrayFrom = (
  translate: GuideSeoTemplateContext["translateGuides"],
  key: string,
): string[] => ensureStringArray(translate(key, { returnObjects: true }));

const buildFallbackLabels = (translate: GuideSeoTemplateContext["translateGuides"]) => ({
  onThisPage: readString(translate, "labels.onThisPage"),
  tips: readString(translate, "labels.tipsHeading"),
  faqs: readString(translate, "labels.faqsHeading"),
  gallery: readString(translate, "labels.photoGallery"),
});

const buildTocRecord = (context: GuideSeoTemplateContext) => {
  const tocRaw = context.translateGuides(`content.${GUIDE_KEY}.toc`, { returnObjects: true });
  if (tocRaw && typeof tocRaw === "object" && !Array.isArray(tocRaw)) {
    return tocRaw as Record<string, unknown>;
  }
  return {} as Record<string, unknown>;
};

const resolveLabel = (
  tocRecord: Record<string, unknown>,
  key: string,
  fallback?: string,
): string | undefined => {
  const raw = tocRecord[key];
  return typeof raw === "string" && raw.trim().length > 0
    ? raw.trim()
    : fallback && fallback.trim().length > 0
      ? fallback
      : undefined;
};

const buildGalleryItems = (
  gallerySources: readonly string[],
  context: GuideSeoTemplateContext,
  galleryTitle: string,
): Array<{ src: string; alt: string; caption?: string }> => {
  const galleryConfigRaw = context.translateGuides(`content.${GUIDE_KEY}.gallery.items`, { returnObjects: true });
  const galleryConfig = ensureArray<{ alt?: unknown; caption?: unknown }>(galleryConfigRaw);

  return gallerySources.map((src, index) => {
    const config = galleryConfig[index];
    const alt =
      typeof config?.alt === "string" && config.alt.trim().length > 0
        ? config.alt.trim()
        : readStringWithFallback(
            context.translateGuides,
            `content.${GUIDE_KEY}.gallery.items.alt`,
          );
    const caption =
      typeof config?.caption === "string" && config.caption.trim().length > 0
        ? config.caption.trim()
        : readStringWithFallback(
            context.translateGuides,
            `content.${GUIDE_KEY}.gallery.items.${index}.caption`,
            `content.${GUIDE_KEY}.gallery.items.caption`,
          );

    return {
      src,
      alt: alt || galleryTitle,
      ...(caption ? { caption } : {}),
    };
  });
};

export function createPathOfTheGodsExtras(
  context: GuideSeoTemplateContext,
  gallerySources: readonly string[],
): PathOfTheGodsGuideExtras {
  const translate = context.translateGuides;
  const fallbackLabels = buildFallbackLabels(translate);

  // Primary via translateGuides
  let intro = arrayFrom(translate, `content.${GUIDE_KEY}.intro`);
  let essentials = arrayFrom(translate, `content.${GUIDE_KEY}.essentials`);
  let essentialsTitle = readStringWithFallback(
    translate,
    `content.${GUIDE_KEY}.essentialsTitle`,
    `content.${GUIDE_KEY}.toc.essentials`,
  );
  let costs = arrayFrom(translate, `content.${GUIDE_KEY}.typicalCosts`);
  let costsTitle = readStringWithFallback(
    translate,
    `content.${GUIDE_KEY}.typicalCostsTitle`,
    `content.${GUIDE_KEY}.toc.costs`,
  );
  let tips = arrayFrom(translate, `content.${GUIDE_KEY}.tips`);
  let tipsTitle =
    readStringWithFallback(
      translate,
      `content.${GUIDE_KEY}.tipsTitle`,
      `content.${GUIDE_KEY}.toc.tips`,
      "labels.tipsHeading",
    ) || fallbackLabels.tips;
  let faqsTitle =
    readStringWithFallback(
      translate,
      `content.${GUIDE_KEY}.faqsTitle`,
      `content.${GUIDE_KEY}.toc.faqs`,
      "labels.faqsHeading",
    ) || fallbackLabels.faqs;

  const tocRecord = buildTocRecord(context);
  let sections = context.sections;

  // Fallback: compute sections from translateGuides if none present
  if (!sections || sections.length === 0) {
    const rawSections = translate(`content.${GUIDE_KEY}.sections`, { returnObjects: true }) as unknown;
    const normalized = ensureArray<{ id?: string; title?: string; body?: unknown }>(rawSections)
      .map((entry, index) => {
        const id = typeof entry?.id === "string" && entry.id.trim().length > 0 ? entry.id.trim() : `section-${index}`;
        const title = typeof entry?.title === "string" ? entry.title : "";
        const body = ensureStringArray(entry?.body);
        return { id, title, body };
      })
      .filter((s) => s.title.length > 0 || s.body.length > 0);
    if (normalized.length > 0) sections = normalized as GuideSeoTemplateContext["sections"];
  }

  let tocTitle =
    resolveLabel(
      tocRecord,
      "onThisPage",
      readStringWithFallback(translate, `content.${GUIDE_KEY}.toc.onThisPage`, "labels.onThisPage"),
    ) ?? fallbackLabels.onThisPage;

  const tocItems: Array<{ href: string; label: string }> = [];
  if (essentials.length > 0) {
    const label = resolveLabel(tocRecord, "essentials", essentialsTitle) ?? essentialsTitle;
    tocItems.push({ href: "#essentials", label });
  }
  if (costs.length > 0) {
    const label = resolveLabel(tocRecord, "costs", costsTitle) ?? costsTitle;
    tocItems.push({ href: "#costs", label });
  }
  sections.forEach((section) => {
    if (section.id && section.title) {
      tocItems.push({ href: `#${section.id}`, label: section.title });
    }
  });
  if (tips.length > 0) {
    const label =
      tipsTitle || resolveLabel(tocRecord, "tips", fallbackLabels.tips) || fallbackLabels.tips;
    tocItems.push({ href: "#tips", label });
  }
  if (context.faqs.length > 0) {
    const label =
      faqsTitle || resolveLabel(tocRecord, "faqs", fallbackLabels.faqs) || fallbackLabels.faqs;
    tocItems.push({ href: "#faqs", label });
  }

  const galleryTitleExplicit = readString(translate, `content.${GUIDE_KEY}.galleryTitle`);
  let galleryTitle =
    galleryTitleExplicit ||
    readStringWithFallback(
      translate,
      `content.${GUIDE_KEY}.toc.gallery`,
      "labels.photoGallery",
    ) ||
    fallbackLabels.gallery;

  let galleryItems = buildGalleryItems(gallerySources, context, galleryTitle);
  const galleryLabel = resolveLabel(tocRecord, "gallery") ?? galleryTitleExplicit;
  if (galleryLabel) {
    tocItems.push({ href: "#gallery", label: galleryLabel });
  }

  // Bundle-level fallbacks when translateGuides returns unresolved keys
  try {
    const bundleLocal = getGuidesBundle(context.lang);
    const bundleEn = context.lang === "en" ? bundleLocal : getGuidesBundle("en");
    const src = (bundleLocal?.content?.[GUIDE_KEY] ?? bundleEn?.content?.[GUIDE_KEY]) as Record<string, unknown> | undefined;
    if (src) {
      const scrubKeys = (arr: string[]) => arr.filter((s) => typeof s === "string" && !s.trim().startsWith("content."));
      const arrayFromSrc = (key: string): string[] => {
        const value = (src as Record<string, unknown>)[key];
        return scrubKeys(ensureStringArray(value));
      };
      // textFromSrc helper removed (unused)
      const tocFromSrc = () => {
        const toc = (src as Record<string, unknown>)["toc"] as Record<string, unknown> | undefined;
        return toc && typeof toc === "object" ? (toc as Record<string, string>) : undefined;
      };

      if (intro.length === 0 || intro.some((s) => s.startsWith("content."))) {
        const fb = arrayFromSrc("intro");
        if (fb.length > 0) intro = fb;
      }
      if (essentials.length === 0 || essentials.some((s) => s.startsWith("content."))) {
        const fb = arrayFromSrc("essentials");
        if (fb.length > 0) essentials = fb;
      }
      if (costs.length === 0 || costs.some((s) => s.startsWith("content."))) {
        const fb = arrayFromSrc("typicalCosts");
        if (fb.length > 0) costs = fb;
      }
      if (tips.length === 0 || tips.some((s) => s.startsWith("content."))) {
        const fb = arrayFromSrc("tips");
        if (fb.length > 0) tips = fb;
      }
      const tocObj = tocFromSrc();
      if (tocObj) {
        if (!essentialsTitle || essentialsTitle.startsWith("content.")) {
          essentialsTitle = tocObj["essentials"] || essentialsTitle;
        }
        if (!costsTitle || costsTitle.startsWith("content.")) {
          costsTitle = tocObj["costs"] || costsTitle;
        }
      }
      if (!tipsTitle || tipsTitle.startsWith("content.")) tipsTitle = tocObj?.["tips"] || tipsTitle;
      if (!faqsTitle || faqsTitle.startsWith("content.")) faqsTitle = tocObj?.["faqs"] || faqsTitle;
      if (!tocTitle || tocTitle.startsWith("content.")) tocTitle = tocObj?.["onThisPage"] || tocTitle;
      if ((!galleryTitle || galleryTitle.startsWith("content.")) && typeof tocObj?.["gallery"] === "string") {
        galleryTitle = tocObj["gallery"];
      }
      if (!galleryItems || galleryItems.length === 0) {
        galleryItems = buildGalleryItems(gallerySources, context, galleryTitle || fallbackLabels.gallery);
      }
    }
  } catch {
    // ignore fallback errors
  }

  if (isGuideDebugEnabled()) {
    try {
      debugGuide("PathOfTheGods extras", { // i18n-exempt -- TECH-000 [ttl=2026-12-31]
        lang: context.lang,
        guideKey: GUIDE_KEY,
        counts: {
          intro: intro.length,
          essentials: essentials.length,
          costs: costs.length,
          sections: sections.length,
          tips: tips.length,
          faqs: context.faqs.length,
          toc: tocItems.length,
          gallery: galleryItems.length,
        },
      });
    } catch { /* noop: debug logging optional */ }
  }

  return {
    intro,
    essentialsTitle,
    essentials,
    costsTitle,
    costs,
    sections,
    tipsTitle,
    tips,
    faqsTitle,
    tocTitle,
    tocItems,
    galleryTitle,
    galleryItems,
  } satisfies PathOfTheGodsGuideExtras;
}
