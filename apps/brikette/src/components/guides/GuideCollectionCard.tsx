// src/components/guides/GuideCollectionCard.tsx
import { useMemo } from "react";
import Link from "next/link";
import clsx from "clsx";

import { CfImage } from "@acme/ui/atoms/CfImage";

import { GUIDE_DIRECTION_LINKS } from "@/data/guideDirectionLinks";
import type { GuideMeta } from "@/data/guides.index";
import { getGuideLinkLabels } from "@/guides/slugs/labels";
import type { AppLanguage } from "@/i18n.config";
import { guideHref, type GuideKey } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

// Card with optional thumbnail - overflow hidden for image
const CARD_CLASSES = [
  "group",
  "flex",
  "h-full",
  "flex-col",
  "overflow-hidden",
  "rounded-xl",
  "border",
  "border-brand-outline/40",
  "bg-brand-surface",
  "shadow-sm",
  "transition",
  "hover:border-brand-primary/60",
  "hover:shadow-md",
  "dark:border-brand-outline/50",
  "dark:bg-brand-text/10",
  "dark:hover:border-brand-secondary/70",
] as const;

// Thumbnail image container
const THUMBNAIL_CLASSES = [
  "relative",
  "aspect-[16/9]",
  "w-full",
  "overflow-hidden",
] as const;

// Content area with padding
const CONTENT_CLASSES = [
  "flex",
  "flex-1",
  "flex-col",
  "justify-between",
  "p-4",
] as const;

const SUMMARY_CLASSES = [
  "mt-2",
  "text-sm",
  "leading-snug",
  "text-brand-paragraph",
  "text-pretty",
  "dark:text-brand-muted",
  // Limit to 3 lines for consistent card height
  "line-clamp-3",
] as const;

const CTA_BUTTON_CLASSES = [
  "mt-4",
  "inline-block",
  "w-fit",
  "max-w-full",
  "whitespace-normal",
  "text-center",
  "text-balance",
  "leading-snug",
  "rounded-full",
  "border",
  "border-brand-primary/40",
  "bg-brand-primary/10",
  "px-4",
  "py-2",
  "text-sm",
  "font-semibold",
  "text-brand-primary",
  "transition",
  "group-hover:border-brand-primary",
  "group-hover:bg-brand-primary/20",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-brand-primary",
  "focus-visible:ring-offset-2",
  "dark:border-brand-secondary/40",
  "dark:bg-brand-secondary/10",
  "dark:text-brand-secondary",
  "dark:group-hover:border-brand-secondary",
  "dark:group-hover:bg-brand-secondary/20",
  "dark:focus-visible:ring-brand-secondary",
] as const;

const DIRECTION_WRAPPER_CLASSES = ["mt-4", "space-y-2", "text-xs"] as const;
const DIRECTION_LABEL_CLASSES = [
  "text-xxxs",
  "font-semibold",
  "uppercase",
  "tracking-[0.3em]",
  "text-brand-muted",
  "dark:text-brand-muted",
] as const;
const DIRECTION_PILL_CLASSES = [
  "inline-flex",
  "items-center",
  "rounded-full",
  "border",
  "border-brand-outline/40",
  "bg-brand-surface/60",
  "px-3",
  "py-1",
  "text-xs",
  "font-semibold",
  "text-brand-primary",
  "transition",
  "hover:border-brand-primary/60",
  "hover:text-brand-primary",
  "dark:border-brand-outline/50",
  "dark:bg-brand-surface/20",
  "dark:text-brand-secondary",
] as const;

interface GuideCollectionCardProps {
  lang: AppLanguage;
  guide: GuideMeta;
  label: string;
  summary?: string;
  ctaLabel?: string;
  directionsLabel?: string;
  thumbnailSrc?: string;
  thumbnailAlt?: string;
}

export const GuideCollectionCard = ({
  lang,
  guide,
  label,
  summary,
  ctaLabel,
  directionsLabel,
  thumbnailSrc,
  thumbnailAlt,
}: GuideCollectionCardProps): JSX.Element => {
  const href = guideHref(lang, guide.key);
  const howToBase = `/${lang}/${getSlug("howToGetHere", lang)}`;
  const directionLinks = GUIDE_DIRECTION_LINKS[guide.key];

  const resolvedDirectionLinks = useMemo(() => {
    if (!directionLinks?.length) return [];

    const guideLinkLabels = getGuideLinkLabels(lang);

    return directionLinks.map((link) => {
      const resolvedLabel = link.label ?? guideLinkLabels[link.labelKey] ?? link.labelKey;
      const linkType = link.type ?? 'guide';

      let href: string;
      if (linkType === 'howToGetHere') {
        href = `${howToBase}/${link.slug}`;
      } else {
        // Link to guide page using guide key
        href = guideHref(lang, link.labelKey as GuideKey);
      }

      return {
        ...link,
        label: resolvedLabel,
        href,
      };
    });
  }, [directionLinks, lang, howToBase, guide.key]);

  return (
    <article className={clsx(CARD_CLASSES)}>
      {/* Thumbnail image */}
      {thumbnailSrc ? (
        <Link href={href} prefetch={false} className={clsx(THUMBNAIL_CLASSES)}>
          <CfImage
            src={thumbnailSrc}
            preset="thumb"
            alt={thumbnailAlt || label}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            width={400}
            height={225}
          />
        </Link>
      ) : null}

      {/* Content */}
      <div className={clsx(CONTENT_CLASSES)}>
        <div>
          <h3 className="text-base font-semibold text-brand-heading dark:text-brand-heading">
            {ctaLabel ? (
              <Link href={href} prefetch={false} className="hover:underline">
                {label}
              </Link>
            ) : (
              <span>{label}</span>
            )}
          </h3>
          {summary ? <p className={clsx(SUMMARY_CLASSES)}>{summary}</p> : null}
          {ctaLabel ? (
            <Link href={href} prefetch={false} className={clsx(CTA_BUTTON_CLASSES)}>
              {ctaLabel}
            </Link>
          ) : null}
          {resolvedDirectionLinks?.length && directionsLabel ? (
            <div className={clsx(DIRECTION_WRAPPER_CLASSES)}>
              <p className={clsx(DIRECTION_LABEL_CLASSES)}>{directionsLabel}</p>
              <div className="flex flex-wrap gap-2">
                {resolvedDirectionLinks.map((link) => (
                  <Link
                    key={`${guide.key}-${link.labelKey}`}
                    href={link.href}
                    prefetch={false}
                    className={clsx(DIRECTION_PILL_CLASSES)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};
