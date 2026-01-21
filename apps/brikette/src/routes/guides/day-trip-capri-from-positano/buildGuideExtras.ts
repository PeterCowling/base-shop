// src/routes/guides/day-trip-capri-from-positano/buildGuideExtras.ts
import appI18n from "@/i18n";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { ensureStringArray } from "@/utils/i18nContent";

import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";

import { GALLERY_IMAGE_SOURCES, GUIDE_KEY } from "./constants";
import { getGuidesTranslator } from "./i18n";
import { safeString } from "./safeString";
import { toFallbackSections, toFaqEntries, toGalleryCopy, toHowToSteps, toTocItems } from "./transformers";
import type { GalleryItem, GuideExtras, GuideFaq, TocEntry } from "./types";

type BuildFallbackTocArgs = {
  translate: GuideSeoTemplateContext["translateGuides"];
  fallback: ReturnType<typeof getGuidesTranslator>;
  fallbackSections: ReturnType<typeof toFallbackSections>;
  galleryItems: GalleryItem[];
  fallbackFaqs: GuideFaq[];
  fallbackFaqsTitle: string;
  galleryTitle: string;
};

function buildFallbackToc({
  translate,
  fallback,
  fallbackSections,
  galleryItems,
  fallbackFaqs,
  fallbackFaqsTitle,
  galleryTitle,
}: BuildFallbackTocArgs): TocEntry[] {
  const fallbackTocExplicit = toTocItems(fallback(`content.${GUIDE_KEY}.toc`, { returnObjects: true }));
  const fallbackTocDerived = fallbackSections.map((section) => ({ href: `#${section.id}`, label: section.title }));
  const fallbackToc: TocEntry[] = [];

  const preferredToc = fallbackTocExplicit.length > 0 ? fallbackTocExplicit : fallbackTocDerived;
  for (const item of preferredToc) {
    if (!fallbackToc.some((existing) => existing.href === item.href)) {
      fallbackToc.push(item);
    }
  }

  if (galleryItems.length > 0 && !fallbackToc.some((item) => item.href === "#gallery")) {
    const galleryLabel = safeString(
      translate(`labels.photoGallery`),
      safeString(fallback(`labels.photoGallery`)),
    );
    fallbackToc.push({ href: "#gallery", label: galleryTitle || galleryLabel });
  }

  if (fallbackFaqs.length > 0 && !fallbackToc.some((item) => item.href === "#faqs")) {
    fallbackToc.push({ href: "#faqs", label: fallbackFaqsTitle });
  }

  return fallbackToc;
}

export function buildGuideExtras(context: GuideSeoTemplateContext): GuideExtras {
  const translate = context.translateGuides;
  const fallback = getGuidesTranslator("en");

  const hasGeneric = context.lang === ("en" as GuideSeoTemplateContext["lang"]) && context.hasLocalizedContent;

  const fallbackIntro = ensureStringArray(fallback(`content.${GUIDE_KEY}.intro`, { returnObjects: true }));
  const fallbackSections = toFallbackSections(fallback(`content.${GUIDE_KEY}.sections`, { returnObjects: true }));

  const fallbackFaqs = toFaqEntries(fallback(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }));
  // Prefer a localized, per‑guide FAQs title when available. When not provided
  // for the active locale, fall back to the generic label (labels.faqsHeading)
  // instead of using an English per‑guide title. Tests expect "FAQs" here even
  // when EN content provides a custom per‑guide title string.
  const fallbackFaqsTitle = (() => {
    const localized = safeString(translate(`content.${GUIDE_KEY}.faqsTitle`));
    if (localized) return localized;
    const genericLocal = safeString(translate(`labels.faqsHeading`));
    if (genericLocal) return genericLocal;
    const genericEn = safeString(fallback(`labels.faqsHeading`), "FAQs");
    return genericEn || "FAQs";
  })();

  const galleryFallbackCopy = toGalleryCopy(
    fallback(`content.${GUIDE_KEY}.gallery.items`, { returnObjects: true }),
  );
  // Prefer raw localized resources to avoid falling back to English when the
  // locale provides a different shape (object vs array). This ensures partial
  // localized captions/alt text are preserved.
  const localizedItemsResource = appI18n.getResource(
    context.lang,
    "guides",
    `content.${GUIDE_KEY}.gallery.items`,
  );
  const galleryLocalizedCopy = toGalleryCopy(localizedItemsResource);
  const galleryTitle = safeString(
    translate(`content.${GUIDE_KEY}.galleryTitle`),
    safeString(fallback(`content.${GUIDE_KEY}.galleryTitle`)),
  );
  const galleryItems: GalleryItem[] = GALLERY_IMAGE_SOURCES.reduce<GalleryItem[]>((items, image) => {
    const fallbackEntry = galleryFallbackCopy[image.key];
    if (!fallbackEntry) return items;
    const localizedEntry = galleryLocalizedCopy[image.key];
    const alt = safeString(localizedEntry?.alt, fallbackEntry.alt);
    const caption = safeString(localizedEntry?.caption, fallbackEntry.caption);
    items.push({
      src: buildCfImageUrl(image.path, { width: 1200, height: 800, quality: 85, format: "auto" }),
      alt,
      caption,
    });
    return items;
  }, []);

  const fallbackToc = buildFallbackToc({
    translate,
    fallback,
    fallbackSections,
    galleryItems,
    fallbackFaqs,
    fallbackFaqsTitle,
    galleryTitle,
  });

  const howToLocalized = toHowToSteps(translate(`content.${GUIDE_KEY}.howTo.steps`, { returnObjects: true }));
  const howToFallback = toHowToSteps(fallback(`content.${GUIDE_KEY}.howTo.steps`, { returnObjects: true }));
  const howToSteps = howToLocalized.length > 0 ? howToLocalized : howToFallback;

  return {
    hasGeneric,
    showTranslatedToc: hasGeneric && context.toc.length > 0,
    translatedToc: context.toc,
    fallbackToc,
    fallbackIntro,
    fallbackSections,
    fallbackFaqsTitle,
    fallbackFaqs,
    galleryTitle,
    galleryItems,
    howToSteps,
  } satisfies GuideExtras;
}
