import type { TFunction } from "i18next";

import appI18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import { FALLBACK_GALLERY } from "./constants";
import type { FallbackContent, FallbackData, FallbackListItem } from "./types";

function getGuidesTranslator(locale: AppLanguage): TFunction<"guides"> {
  return appI18n.getFixedT(locale, "guides") as TFunction<"guides">;
}

function resolveLabel(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return fallback;
}

function toListItems(value: unknown): FallbackListItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (item && typeof item === "object" ? (item as FallbackListItem) : null))
    .filter((item): item is FallbackListItem => item != null);
}

export function createFallbackData(lang: AppLanguage): FallbackData {
  const t = getGuidesTranslator(lang);
  const fallback = getGuidesTranslator("en");

  const raw = t("content.instagramSpots.fallback", { returnObjects: true }) as FallbackContent;
  const defaults = fallback("content.instagramSpots.fallback", { returnObjects: true }) as FallbackContent;

  const intro = ensureStringArray(raw.intro ?? defaults.intro ?? "").map((paragraph) => paragraph.trim()).filter(Boolean);

  const toc = ensureArray(raw.toc ?? defaults.toc)
    .map((item) => (item && typeof item === "object" ? (item as { href?: string; label?: string }) : null))
    .filter((item): item is { href?: string; label?: string } => item != null)
    .map((item) => ({
      href: resolveLabel(item.href, ""),
      label: resolveLabel(item.label, ""),
    }))
    .filter((item) => item.href.length > 0 && item.label.length > 0);

  const galleryAlt = ensureStringArray(raw.galleryAlt ?? defaults.galleryAlt ?? [])
    .map((alt) => alt.trim())
    .filter(Boolean);

  const galleryFallbackAlt = resolveLabel(
    raw.galleryFallbackAlt,
    resolveLabel(
      defaults.galleryFallbackAlt,
      resolveLabel(fallback("content.instagramSpots.fallback.galleryFallbackAlt"), ""),
    ),
  );

  const gallery = FALLBACK_GALLERY.map((src, index) => ({
    src,
    alt: galleryAlt[index] ?? galleryAlt[galleryAlt.length - 1] ?? galleryFallbackAlt,
  }));
  const hasGalleryContent = gallery.some((item) => item.alt.trim().length > 0);

  function buildListSection(source: FallbackContent["classics"], key: "classics" | "alternatives") {
    const fallbackSection = defaults[key] as FallbackContent["classics"];
    const heading = resolveLabel(source?.heading, resolveLabel(fallbackSection?.heading, ""));
    const items = toListItems(source?.items ?? fallbackSection?.items ?? [])
      .map((item) => {
        const title = item.title?.trim();
        const description = item.description?.trim();
        return {
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
          ...(item.link ? { link: item.link } : {}),
        } as FallbackListItem;
      })
      .filter(
        (item) =>
          (typeof item.title === "string" && item.title.length > 0) ||
          (typeof item.description === "string" && item.description.length > 0),
      );
    return heading.length > 0 && items.length > 0 ? { heading, items } : null;
  }

  const classics = buildListSection(raw.classics, "classics");
  const alternatives = buildListSection(raw.alternatives, "alternatives");

  const sunsetHeading = resolveLabel(raw.sunset?.heading, resolveLabel(defaults.sunset?.heading, ""));
  const sunsetParagraphs = ensureStringArray(raw.sunset?.paragraphs ?? defaults.sunset?.paragraphs ?? [])
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const sunset = sunsetHeading.length > 0 && sunsetParagraphs.length > 0 ? { heading: sunsetHeading, paragraphs: sunsetParagraphs } : null;

  const etiquetteHeading = resolveLabel(raw.etiquette?.heading, resolveLabel(defaults.etiquette?.heading, ""));
  const etiquetteItems = ensureStringArray(raw.etiquette?.items ?? defaults.etiquette?.items ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  const etiquette = etiquetteHeading.length > 0 && etiquetteItems.length > 0 ? { heading: etiquetteHeading, items: etiquetteItems } : null;

  const faqHeading = resolveLabel(raw.faqs?.heading, resolveLabel(defaults.faqs?.heading, ""));
  const faqItems = ensureArray(raw.faqs?.items ?? defaults.faqs?.items ?? [])
    .map((item) => (item && typeof item === "object" ? (item as { summary?: string; body?: string }) : null))
    .filter((item): item is { summary?: string; body?: string } => item != null)
    .map((item) => ({
      summary: resolveLabel(item.summary ?? "", ""),
      body: resolveLabel(item.body ?? "", ""),
    }))
    .filter((item) => item.summary.length > 0 || item.body.length > 0);
  const faqs = faqHeading.length > 0 && faqItems.length > 0 ? { heading: faqHeading, items: faqItems } : null;

  const droneSummary = resolveLabel(raw.drone?.summary, resolveLabel(defaults.drone?.summary, ""));
  const droneBody = resolveLabel(raw.drone?.body, resolveLabel(defaults.drone?.body, ""));
  const drone = droneSummary.length > 0 || droneBody.length > 0 ? { summary: droneSummary, body: droneBody } : null;

  return {
    intro,
    toc,
    gallery,
    classics,
    alternatives,
    sunset,
    etiquette,
    faqs,
    drone,
    hasContent:
      intro.length > 0 ||
      toc.length > 0 ||
      hasGalleryContent ||
      classics != null ||
      alternatives != null ||
      sunset != null ||
      etiquette != null ||
      faqs != null ||
      drone != null,
  } satisfies FallbackData;
}
