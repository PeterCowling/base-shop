import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { ensureStringArray } from "@/utils/i18nContent";

import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import {
  ALSO_HELPFUL_TAGS,
  GALLERY_IMAGES,
  GUIDE_KEY,
  HERO_IMAGE_PATH,
  RELATED_GUIDES,
} from "./porter-service-positano.constants";
import {
  type GuideExtras,
  type GuideFaq,
  type ResourceLink,
  type TocEntry,
} from "./porter-service-positano.types";
import { normaliseFaqs, normaliseSections, normaliseToc } from "./porter-service-positano.normalisers";

import type { TFunction } from "i18next";

export function computePorterGuideExtras(
  context: GuideSeoTemplateContext,
  translators: {
    fallbackGuides: TFunction<"guides">;
    fallbackLocal: TFunction<"guidesFallback">;
    fallbackEn: TFunction<"guidesFallback">;
  },
): GuideExtras {
  const translate = context.translateGuides;
  const { fallbackGuides, fallbackLocal, fallbackEn } = translators;

  const readArray = <T,>(suffix: string, normaliser: (value: unknown) => T[]): T[] => {
    const primary = normaliser(translate(`content.${GUIDE_KEY}.${suffix}`, { returnObjects: true }));
    if (primary.length > 0) return primary;
    const fallbackValue = normaliser(
      fallbackGuides(`content.${GUIDE_KEY}.${suffix}`, { returnObjects: true }),
    );
    if (fallbackValue.length > 0) return fallbackValue;
    const fallbackLocalValue = normaliser(
      fallbackLocal(`${GUIDE_KEY}.${suffix}`, { returnObjects: true }),
    );
    if (fallbackLocalValue.length > 0) return fallbackLocalValue;
    return normaliser(fallbackEn(`${GUIDE_KEY}.${suffix}`, { returnObjects: true }));
  };

  const normaliseCandidate = (value: unknown, invalidTokens: string[]): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    if (invalidTokens.includes(trimmed)) return null;
    return trimmed;
  };

  const readString = (suffix: string, defaultValue?: string): string => {
    const primaryKey = `content.${GUIDE_KEY}.${suffix}`;
    const fallbackKey = `${GUIDE_KEY}.${suffix}`;
    const invalidTokens = [primaryKey, fallbackKey];

    const primary = normaliseCandidate(translate(primaryKey), invalidTokens);
    if (primary) return primary;

    const fallbackValue = normaliseCandidate(
      fallbackGuides(primaryKey, { defaultValue }),
      invalidTokens,
    );
    if (fallbackValue) return fallbackValue;

    const localValue = normaliseCandidate(
      fallbackLocal(fallbackKey, { defaultValue }),
      invalidTokens,
    );
    if (localValue) return localValue;

    const enValue = normaliseCandidate(fallbackEn(fallbackKey, { defaultValue }), invalidTokens);
    if (enValue) return enValue;

    const defaultNormalised = normaliseCandidate(defaultValue, invalidTokens);
    return defaultNormalised ?? "";
  };

  const cleanStrings = (values: string[]): string[] =>
    values
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

  const introTitle = readString("introTitle", "Intro");
  const intro = cleanStrings(readArray("intro", ensureStringArray));
  const sections = (() => {
    if (context.sections.length > 0) {
      return context.sections.map(({ id, title, body }) => ({ id, title, body }));
    }

    const primary = normaliseSections(
      translate(`content.${GUIDE_KEY}.sections`, { returnObjects: true }),
    );
    if (primary.length > 0) return primary;

    const fallback = normaliseSections(
      fallbackGuides(`content.${GUIDE_KEY}.sections`, { returnObjects: true }),
    );
    if (fallback.length > 0) return fallback;

    return [];
  })();
  let steps = cleanStrings(readArray("steps", ensureStringArray));
  let howTitle = readString("howTitle", fallbackGuides(`content.${GUIDE_KEY}.howTitle`));
  const fallbackSteps = cleanStrings(
    ensureStringArray(fallbackGuides(`content.${GUIDE_KEY}.steps`, { returnObjects: true })),
  );

  const isUsingFallbackSteps =
    context.lang !== "en" &&
    steps.length > 0 &&
    fallbackSteps.length > 0 &&
    steps.length === fallbackSteps.length &&
    steps.every((step, index) => step === fallbackSteps[index]);

  if (isUsingFallbackSteps) {
    steps = [];
    howTitle = "";
  }

  const resources = cleanStrings(readArray("resources", ensureStringArray));
  const etiquette = cleanStrings(readArray("etiquette", ensureStringArray));
  const faqs = (() => {
    const sources: Array<() => GuideFaq[]> = [
      () => normaliseFaqs(translate(`content.${GUIDE_KEY}.faqs`, { returnObjects: true })),
      () => normaliseFaqs(translate(`content.${GUIDE_KEY}.faq`, { returnObjects: true })),
      () => normaliseFaqs(fallbackGuides(`content.${GUIDE_KEY}.faqs`, { returnObjects: true })),
      () => normaliseFaqs(fallbackGuides(`content.${GUIDE_KEY}.faq`, { returnObjects: true })),
      () => normaliseFaqs(fallbackEn(`${GUIDE_KEY}.faqs`, { returnObjects: true })),
      () => normaliseFaqs(fallbackEn(`${GUIDE_KEY}.faq`, { returnObjects: true })),
      () => normaliseFaqs(fallbackLocal(`${GUIDE_KEY}.faqs`, { returnObjects: true })),
      () => normaliseFaqs(fallbackLocal(`${GUIDE_KEY}.faq`, { returnObjects: true })),
    ];
    for (const read of sources) {
      const result = read();
      if (result.length > 0) return result;
    }
    return [];
  })();

  const resourcesTitle = readString(
    "resourcesTitle",
    fallbackGuides(`content.${GUIDE_KEY}.resourcesTitle`),
  );
  const etiquetteTitle = readString(
    "etiquetteTitle",
    fallbackGuides(`content.${GUIDE_KEY}.etiquetteTitle`),
  );
  const faqsTitle = readString("faqTitle", fallbackGuides("labels.faqsHeading"));

  const resourceLinks: ResourceLink[] = [
    {
      label: readString(
        "resourcesLinkBounceLabel",
        fallbackGuides(`content.${GUIDE_KEY}.resourcesLinkBounceLabel`),
      ),
      href: readString("resourcesLinkBounceHref"),
    },
    {
      label: readString(
        "resourcesLinkRadicalLabel",
        fallbackGuides(`content.${GUIDE_KEY}.resourcesLinkRadicalLabel`),
      ),
      href: readString("resourcesLinkRadicalHref"),
    },
  ].filter((link) => link.label.length > 0 && link.href.length > 0);

  const tocExplicit = normaliseToc(
    translate(`content.${GUIDE_KEY}.toc`, { returnObjects: true }),
  );
  const tocFallback = normaliseToc(
    fallbackGuides(`content.${GUIDE_KEY}.toc`, { returnObjects: true }),
  );
  const tocTitle = readString("tocTitle", fallbackGuides("labels.onThisPage"));

  const galleryTitle = readString(
    "galleryTitle",
    fallbackGuides(`content.${GUIDE_KEY}.galleryTitle`),
  );
  const standsCaption = readString(
    "gallery.standsCaption",
    fallbackGuides(`content.${GUIDE_KEY}.gallery.standsCaption`),
  );
  const cartsCaption = readString(
    "gallery.cartsCaption",
    fallbackGuides(`content.${GUIDE_KEY}.gallery.cartsCaption`),
  );
  const galleryItems = GALLERY_IMAGES.map((image, index) => {
    const src = buildCfImageUrl(image.path, {
      width: image.width,
      height: image.height,
      quality: 85,
      format: "auto",
    });
    const caption = index === 0 ? standsCaption : cartsCaption;
    return { src, alt: caption, caption };
  });
  const heroImage = {
    src: buildCfImageUrl(HERO_IMAGE_PATH, {
      width: 1200,
      height: 630,
      quality: 85,
      format: "auto",
    }),
    alt: galleryTitle,
    width: 1200,
    height: 630,
  };

  const tocCandidates: TocEntry[] = [];
  const pushItem = (item: TocEntry | null | undefined) => {
    if (!item) return;
    if (tocCandidates.some((existing) => existing.href === item.href)) return;
    tocCandidates.push(item);
  };

  if (intro.length > 0) {
    pushItem({ href: "#intro", label: introTitle });
  }

  sections.forEach((section) => {
    pushItem({ href: `#${section.id}`, label: section.title });
  });
  if (steps.length > 0) {
    pushItem({ href: "#how", label: howTitle });
  }
  if (resources.length > 0) {
    pushItem({ href: "#resources", label: resourcesTitle });
  }
  if (etiquette.length > 0) {
    pushItem({ href: "#etiquette", label: etiquetteTitle });
  }
  if (faqs.length > 0) {
    pushItem({ href: "#faqs", label: faqsTitle });
  }

  const finalTocItems = (() => {
    if (tocExplicit.length > 0) return tocExplicit;
    if (tocCandidates.length > 0) return tocCandidates;
    return tocFallback;
  })();

  return {
    introTitle,
    intro,
    sections,
    steps,
    howTitle,
    resources,
    resourcesTitle,
    resourceLinks,
    etiquette,
    etiquetteTitle,
    faqs,
    faqsTitle,
    galleryTitle,
    galleryItems,
    tocItems: finalTocItems,
    tocTitle,
    heroImage,
  } satisfies GuideExtras;
}

export function createPorterHowToSteps(
  _context: GuideSeoTemplateContext,
  extras: GuideExtras,
):
  | { name: string; text: string }[]
  | { name: string }[]
  | null {
  if (extras.sections.length > 0) {
    return extras.sections.map((section) => ({ name: section.title, text: section.body.join(" ") }));
  }
  if (extras.steps.length > 0) {
    return extras.steps.map((name) => ({ name }));
  }
  return null;
}

export { ALSO_HELPFUL_TAGS, RELATED_GUIDES };
