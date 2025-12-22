// src/routes/guides/laundry-positano/buildGuideExtras.ts
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { ensureStringArray } from "@/utils/i18nContent";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

import type { GuideSeoTemplateContext } from "../_GuideSeoTemplate";
import { stripGuideLinkTokens } from "../utils/linkTokens";

import { GALLERY_IMAGES, GUIDE_KEY } from "./constants";
import { getGuidesTranslator } from "./faq";
import type { GuideExtras, GuideFaq, GuideSection } from "./types";

const toTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const buildGuideFaq = (value: unknown): GuideFaq[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const q = typeof record["q"] === "string" ? record["q"].trim() : "";
      const a = ensureStringArray(record["a"])
        .map((answer) => stripGuideLinkTokens(answer).trim())
        .filter((answer) => answer.length > 0);
      if (q.length === 0 || a.length === 0) return null;
      return { q, a } satisfies GuideFaq;
    })
    .filter((faq): faq is GuideFaq => faq != null);
};

export function buildGuideExtras(context: GuideSeoTemplateContext): GuideExtras {
  const translate = context.translateGuides;
  const fallback = getGuidesTranslator("en");

  const readStringArrayWithFallback = (
    suffix: string,
  ): { values: string[]; usedFallback: boolean } => {
    const fallbackValues = ensureStringArray(
      fallback(`content.${GUIDE_KEY}.${suffix}`, { returnObjects: true }),
    );
    const primary = ensureStringArray(
      translate(`content.${GUIDE_KEY}.${suffix}`, { returnObjects: true }),
    );
    if (primary.length > 0) {
      const usedFallback =
        context.lang !== "en" &&
        fallbackValues.length > 0 &&
        primary.length === fallbackValues.length &&
        primary.every((value, index) => value === fallbackValues[index]);
      return { values: primary, usedFallback };
    }
    return { values: fallbackValues, usedFallback: fallbackValues.length > 0 };
  };

  const readStringArray = (suffix: string): string[] => {
    const { values } = readStringArrayWithFallback(suffix);
    return values;
  };

  const normaliseSections = (value: unknown): GuideSection[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        const record = entry as Record<string, unknown>;
        const title = typeof record["title"] === "string" ? record["title"].trim() : "";
        const fallbackTitle = title || `Section ${index + 1}`;
        const explicitId = typeof record["id"] === "string" ? record["id"].trim() : "";
        const derivedId = fallbackTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        const id = explicitId || derivedId || `section-${index + 1}`;
        const body = ensureStringArray(record["body"]);
        if (title.length === 0 && body.length === 0) return null;
        return { id, title: fallbackTitle, body } satisfies GuideSection;
      })
      .filter((section): section is GuideSection => section != null);
  };

  const readSections = (): GuideSection[] => {
    const primary = normaliseSections(
      translate(`content.${GUIDE_KEY}.sections`, { returnObjects: true }),
    );
    if (primary.length > 0) return primary;

    const fallbackStructured = normaliseSections(
      fallback(`content.${GUIDE_KEY}.sections`, { returnObjects: true }),
    );
    if (fallbackStructured.length > 0) return fallbackStructured;

    const fallbackStrings = ensureStringArray(
      fallback(`content.${GUIDE_KEY}.sections`, { returnObjects: true }),
    );
    const fallbackDefaultStrings =
      fallbackStrings.length > 0
        ? fallbackStrings
        : ensureStringArray(
            fallback(`content.${GUIDE_KEY}.sections.default`, { returnObjects: true }),
          );
    if (fallbackDefaultStrings.length === 0) return [];

    const fallbackSelfServiceTitle =
      toTrimmedString(fallback(`content.${GUIDE_KEY}.toc.selfService`)) ??
      toTrimmedString(getGuideLinkLabel(fallback, fallback, GUIDE_KEY)) ??
      toTrimmedString(fallback("labels.onThisPage")) ??
      "Self service";

    return [
      { id: "self-service", title: fallbackSelfServiceTitle, body: fallbackDefaultStrings },
    ];
  };

  const readFaqs = (): GuideFaq[] => {
    const primary = translate(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }) as unknown;
    const fallbackFaq = fallback(`content.${GUIDE_KEY}.faqs`, { returnObjects: true }) as unknown;
    const legacyFallback = fallback(`content.${GUIDE_KEY}.faq`, { returnObjects: true }) as unknown;
    const candidates = [primary, fallbackFaq, legacyFallback]
      .filter((value): value is unknown[] => Array.isArray(value))
      .map((value) => buildGuideFaq(value));
    return candidates.find((faqList) => faqList.length > 0) ?? [];
  };

  const intro = readStringArray("intro");
  const sections = readSections();
  const { values: howToSteps, usedFallback: howToStepsUsedFallback } =
    readStringArrayWithFallback("howtoSteps");
  const tips = readStringArray("tips");
  const faqs = readFaqs();

  const galleryConfig = translate(`content.${GUIDE_KEY}.gallery`, {
    returnObjects: true,
  }) as Record<string, unknown> | undefined;
  const fallbackGalleryConfig = fallback(`content.${GUIDE_KEY}.gallery`, {
    returnObjects: true,
  }) as Record<string, unknown> | undefined;

  const readGalleryField = (
    source: Record<string, unknown> | undefined,
    index: number,
    field: "alt" | "caption",
  ): string | undefined => {
    if (!source) return undefined;
    const rawItems = source["items"];
    if (!Array.isArray(rawItems)) return undefined;
    const entry = rawItems[index];
    if (!entry || typeof entry !== "object") return undefined;
    return toTrimmedString((entry as Record<string, unknown>)[field]);
  };

  const galleryItems = GALLERY_IMAGES.map((image, index) => {
    const src = buildCfImageUrl(image.path, {
      width: image.width,
      height: image.height,
      quality: 85,
      format: "auto",
    });
    const alt =
      readGalleryField(galleryConfig, index, "alt") ??
      readGalleryField(fallbackGalleryConfig, index, "alt") ??
      sections[index]?.title ??
      toTrimmedString(getGuideLinkLabel(fallback, fallback, GUIDE_KEY)) ??
      fallback("labels.photoGallery");
    const caption =
      readGalleryField(galleryConfig, index, "caption") ??
      readGalleryField(fallbackGalleryConfig, index, "caption") ??
      alt;
    return { src, alt, caption };
  });

  const tocConfig = translate(`content.${GUIDE_KEY}.toc`, {
    returnObjects: true,
  }) as Record<string, unknown> | undefined;
  const fallbackToc = fallback(`content.${GUIDE_KEY}.toc`, {
    returnObjects: true,
  }) as Record<string, unknown> | undefined;

  const getLabel = (key: string): string => {
    const explicit = toTrimmedString(tocConfig?.[key]);
    if (explicit) return explicit;

    const fallbackExplicit = toTrimmedString(fallbackToc?.[key]);
    const fallbackFromGuide = toTrimmedString(
      fallback(`content.${GUIDE_KEY}.toc.${key}`),
    );
    const primaryLabel = toTrimmedString(translate(`labels.${key}`));
    if (primaryLabel && primaryLabel !== `labels.${key}`) {
      return primaryLabel;
    }

    const fallbackLabel = toTrimmedString(fallback(`labels.${key}`));
    const fallbackCandidate = fallbackExplicit ?? fallbackFromGuide;
    if (fallbackLabel && fallbackLabel !== `labels.${key}`) {
      if (
        fallbackCandidate &&
        (fallbackLabel === fallbackCandidate ||
          fallbackLabel.startsWith(`${fallbackCandidate} `))
      ) {
        return fallbackCandidate;
      }
      return fallbackLabel;
    }

    if (fallbackCandidate) return fallbackCandidate;

    const fallbackLink = toTrimmedString(getGuideLinkLabel(fallback, fallback, GUIDE_KEY));
    if (fallbackLink) return fallbackLink;

    return key;
  };

  const tocTitle = getLabel("onThisPage");
  const howToTitle = getLabel("howto");
  const tipsTitle = getLabel("tips");
  const faqsTitle = getLabel("faqs");
  const tocItems: GuideExtras["tocItems"] = [];
  sections.forEach((section) => {
    tocItems.push({ href: `#${section.id}`, label: section.title });
  });
  if (howToSteps.length > 0) tocItems.push({ href: "#howto", label: howToTitle });
  if (tips.length > 0) tocItems.push({ href: "#tips", label: tipsTitle });
  if (faqs.length > 0) tocItems.push({ href: "#faqs", label: faqsTitle });

  return {
    intro,
    sections,
    howToSteps,
    howToStepsUsedFallback,
    tips,
    faqs,
    galleryItems,
    tocItems,
    tocTitle,
    howToTitle,
    tipsTitle,
    faqsTitle,
  } satisfies GuideExtras;
}
