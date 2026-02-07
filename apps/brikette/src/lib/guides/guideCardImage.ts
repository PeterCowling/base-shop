import type { TFunction } from "i18next";

import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/guides/slugs";
import { getGuideManifestEntry } from "@/routes/guides/guide-manifest";

export type GuideCardImage = {
  src: string;
  alt?: string;
};

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function normaliseImageSrc(src: string): string {
  if (!src) return src;
  if (isAbsoluteUrl(src)) return src;
  return src.startsWith("/") ? src : `/${src}`;
}

function pickGuideImageFromSections(
  tGuides: TFunction<"guides">,
  tGuidesEn: TFunction<"guides">,
  contentKey: string,
): GuideCardImage | null {
  const sectionsKey = `content.${contentKey}.sections` as const;
  const raw = tGuides(sectionsKey, { returnObjects: true }) as unknown;
  const fallbackRaw = tGuidesEn(sectionsKey, { returnObjects: true }) as unknown;

  const sections = (Array.isArray(raw) ? raw : Array.isArray(fallbackRaw) ? fallbackRaw : []) as Array<
    Record<string, unknown>
  >;

  for (const section of sections) {
    const images = section["images"];
    if (!Array.isArray(images) || images.length === 0) continue;
    const first = images[0] as Record<string, unknown>;
    const src = typeof first["src"] === "string" ? first["src"] : "";
    const alt = typeof first["alt"] === "string" ? first["alt"] : undefined;
    if (src) return { src, alt };
  }

  return null;
}

export function resolveGuideCardImage(
  guideKey: GuideKey,
  resolvedLang: AppLanguage,
  tGuides: TFunction<"guides">,
  tGuidesEn: TFunction<"guides">,
): GuideCardImage | null {
  const entry = getGuideManifestEntry(guideKey);
  const contentKey = entry?.contentKey ?? guideKey;

  const heroImage = entry?.blocks?.find((block) => {
    const candidate = block as unknown as { type?: string; options?: { image?: unknown } };
    return (
      candidate.type === "hero" &&
      typeof candidate.options?.image === "string" &&
      candidate.options.image.trim().length > 0
    );
  }) as unknown as { options?: { image?: string } } | undefined;

  const heroSrc = heroImage?.options?.image;
  if (typeof heroSrc === "string" && heroSrc.trim().length > 0) {
    return { src: normaliseImageSrc(heroSrc), alt: undefined };
  }

  const sectionImage = pickGuideImageFromSections(tGuides, tGuidesEn, contentKey);
  if (sectionImage) {
    return { src: normaliseImageSrc(sectionImage.src), alt: sectionImage.alt };
  }

  return null;
}
