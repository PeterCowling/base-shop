// src/components/guides/GroupedGuideSection.tsx
"use client";

import { memo } from "react";
import clsx from "clsx";

import { CfImage } from "@acme/ui/atoms/CfImage";

import type { GuideMeta } from "@/data/guides.index";
import { getGuideImage } from "@/data/guideImages";
import type { AppLanguage } from "@/i18n.config";

import { GuideCollectionCard } from "./GuideCollectionCard";

/**
 * Converts a camelCase guide key to a human-readable title.
 * e.g., "positanoMainBeach" → "Positano Main Beach"
 */
function humanizeGuideKey(key: string): string {
  // Insert space before each uppercase letter, then capitalize first letter of each word
  const spaced = key.replace(/([A-Z])/g, " $1").trim();
  // Capitalize the first letter
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export type TopicConfig = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

export type GroupedGuideSectionProps = {
  topic: TopicConfig;
  guides: GuideMeta[];
  lang: AppLanguage;
  translate: (key: string) => string;
  fallbackTranslate?: (key: string) => string;
  cardCtaTemplate?: string;
  directionsLabel?: string;
  resolveSummary?: (guide: GuideMeta) => string | undefined;
};

// Hero-style header with image background and overlay
const HEADER_CLASSES = [
  "relative",
  "overflow-hidden",
  "rounded-2xl",
  "shadow-lg",
  // Mobile: shorter aspect ratio
  "aspect-[16/9]",
  // Tablet: slightly taller
  "sm:aspect-[21/9]",
  // Desktop: even wider for cinematic feel
  "lg:aspect-[3/1]",
] as const;

const IMAGE_CLASSES = [
  "absolute",
  "inset-0",
  "size-full",
  "object-cover",
] as const;

// Gradient overlay for text readability
const OVERLAY_CLASSES = [
  "absolute",
  "inset-0",
  // Mobile: stronger gradient from bottom
  "bg-gradient-to-t",
  "from-black/80",
  "via-black/40",
  "to-transparent",
  // Desktop: add side gradient for wider layouts
  "lg:bg-gradient-to-r",
  "lg:from-black/70",
  "lg:via-black/30",
  "lg:to-transparent",
] as const;

// Content container positioned over the image
const CONTENT_CLASSES = [
  "absolute",
  "inset-0",
  "flex",
  "flex-col",
  "justify-end",
  "p-5",
  "sm:p-6",
  "lg:justify-center",
  "lg:p-8",
  "lg:max-w-xl",
] as const;

// Badge showing guide count
const COUNT_BADGE_CLASSES = [
  "mb-2",
  "inline-flex",
  "w-fit",
  "items-center",
  "gap-1.5",
  "rounded-full",
  "bg-white/20",
  "px-3",
  "py-1",
  "text-xs",
  "font-semibold",
  "uppercase",
  "tracking-wider",
  "text-white",
  "backdrop-blur-sm",
  "lg:mb-3",
] as const;

const TITLE_CLASSES = [
  "text-2xl",
  "font-bold",
  "text-white",
  "drop-shadow-md",
  "sm:text-3xl",
  "lg:text-4xl",
] as const;

const DESCRIPTION_CLASSES = [
  "mt-2",
  "text-sm",
  "leading-relaxed",
  "text-white/90",
  "drop-shadow-sm",
  "sm:text-base",
  "lg:mt-3",
  "lg:text-lg",
  // Limit lines on mobile for cleaner look
  "line-clamp-2",
  "sm:line-clamp-3",
  "lg:line-clamp-none",
] as const;

function GroupedGuideSection({
  topic,
  guides,
  lang,
  translate,
  fallbackTranslate,
  cardCtaTemplate,
  directionsLabel,
  resolveSummary,
}: GroupedGuideSectionProps): JSX.Element | null {
  // Don't render section header if there are no guides (e.g., all guides in category are draft)
  if (!guides.length) return null;

  const guideCount = guides.length;
  const countLabel = guideCount === 1 ? "1 guide" : `${guideCount} guides`;

  const resolveLabel = (guideKey: string): string => {
    // Try content.{key}.linkLabel first (standard format)
    const linkLabelKey = `content.${guideKey}.linkLabel`;
    const linkLabel = translate(linkLabelKey);
    if (linkLabel && linkLabel !== linkLabelKey && linkLabel.trim().length > 0) {
      return linkLabel;
    }

    // Try content.{key}.seo.title as secondary
    const seoTitleKey = `content.${guideKey}.seo.title`;
    const seoTitle = translate(seoTitleKey);
    if (seoTitle && seoTitle !== seoTitleKey && seoTitle.trim().length > 0) {
      return seoTitle;
    }

    // Try English fallback for linkLabel
    if (fallbackTranslate) {
      const fallbackLinkLabel = fallbackTranslate(linkLabelKey);
      if (fallbackLinkLabel && fallbackLinkLabel !== linkLabelKey && fallbackLinkLabel.trim().length > 0) {
        return fallbackLinkLabel;
      }
      const fallbackSeoTitle = fallbackTranslate(seoTitleKey);
      if (fallbackSeoTitle && fallbackSeoTitle !== seoTitleKey && fallbackSeoTitle.trim().length > 0) {
        return fallbackSeoTitle;
      }
    }

    // Fall back to humanized version of the key
    return humanizeGuideKey(guideKey);
  };

  return (
    <section className="space-y-6" aria-labelledby={`topic-${topic.id}`}>
      {/* Hero-style topic header */}
      <div className={clsx(HEADER_CLASSES)}>
        {/* Background image */}
        <CfImage
          src={topic.imageSrc}
          preset="hero"
          alt={topic.imageAlt}
          className={clsx(IMAGE_CLASSES)}
          width={1920}
          height={640}
          priority={false}
        />

        {/* Gradient overlay */}
        <div className={clsx(OVERLAY_CLASSES)} aria-hidden="true" />

        {/* Content */}
        <div className={clsx(CONTENT_CLASSES)}>
          <span className={clsx(COUNT_BADGE_CLASSES)}>
            <svg
              className="size-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            {countLabel}
          </span>
          <h3
            id={`topic-${topic.id}`}
            className={clsx(TITLE_CLASSES)}
          >
            {topic.title}
          </h3>
          {topic.description ? (
            <p className={clsx(DESCRIPTION_CLASSES)}>
              {topic.description}
            </p>
          ) : null}
        </div>
      </div>

      {/* Guide cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => {
          const label = resolveLabel(guide.key);
          const summary = resolveSummary?.(guide);
          const ctaLabel = cardCtaTemplate
            ? cardCtaTemplate.replace("{{guideTitle}}", label)
            : undefined;
          // Use guide-specific image if available, otherwise fall back to topic image
          const thumbnailSrc = getGuideImage(guide.key, topic.imageSrc);

          return (
            <GuideCollectionCard
              key={guide.key}
              lang={lang}
              guide={guide}
              label={label}
              summary={summary}
              ctaLabel={ctaLabel}
              directionsLabel={directionsLabel}
              thumbnailSrc={thumbnailSrc}
              thumbnailAlt={label}
            />
          );
        })}
      </div>
    </section>
  );
}

export default memo(GroupedGuideSection);
