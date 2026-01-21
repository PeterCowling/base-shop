// src/components/guides/GuideCollectionCard.tsx
import Link from "next/link";
import clsx from "clsx";

import type { GuideMeta } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import { guideSlug } from "@/routes.guides-helpers";
import { GUIDE_DIRECTION_LINKS } from "@/routes/experiences/guideDirectionLinks";
import { getSlug } from "@/utils/slug";

const CARD_CLASSES = [
  "group",
  "flex",
  "h-full",
  "flex-col",
  "justify-between",
  "rounded-xl",
  "border",
  "border-brand-outline/40",
  "bg-brand-surface",
  "p-4",
  "shadow-sm",
  "transition",
  "hover:border-brand-primary/60",
  "hover:shadow-md",
  "dark:border-brand-outline/50",
  "dark:bg-brand-text/10",
  "dark:hover:border-brand-secondary/70",
] as const;

const SUMMARY_CLASSES = [
  "mt-2",
  "text-sm",
  "leading-snug",
  "text-brand-paragraph",
  "text-pretty",
  "dark:text-brand-muted-dark",
] as const;

const TAG_CLASSES = [
  "mt-3",
  "flex",
  "flex-wrap",
  "gap-2",
  "text-xs",
  "font-medium",
  "text-brand-muted",
  "dark:text-brand-muted-dark",
] as const;

const TAG_BADGE_CLASSES = [
  "rounded-full",
  "bg-brand-surface/60",
  "px-2",
  "py-1",
  "leading-none",
  "tracking-wide",
  "text-brand-primary",
  "dark:bg-brand-text/20",
  "dark:text-brand-secondary",
] as const;

const CTA_BUTTON_CLASSES = [
  "mt-6",
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
  "dark:text-brand-muted-dark",
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
}

export const GuideCollectionCard = ({
  lang,
  guide,
  label,
  summary,
  ctaLabel,
  directionsLabel,
}: GuideCollectionCardProps): JSX.Element => {
  // Always link under the Guides base for UI consistency
  const base = getSlug("guides", lang);
  const slug = guideSlug(lang, guide.key);
  const href = `/${lang}/${base}/${slug}`;
  const howToBase = `/${lang}/${getSlug("howToGetHere", lang)}`;
  const directionLinks = GUIDE_DIRECTION_LINKS[guide.key];

  return (
    <article className={clsx(CARD_CLASSES)}>
      <div>
        <h3 className="text-base font-semibold text-brand-heading dark:text-brand-surface">
          {ctaLabel ? (
            <Link href={href} prefetch={true} className="hover:underline">
              {label}
            </Link>
          ) : (
            <span>{label}</span>
          )}
        </h3>
        {summary ? <p className={clsx(SUMMARY_CLASSES)}>{summary}</p> : null}
        {guide.tags.length ? (
          <div className={clsx(TAG_CLASSES)} aria-label="Tags">
            {guide.tags.map((tag) => (
              <span key={tag} className={clsx(TAG_BADGE_CLASSES)}>
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
        {directionLinks?.length && directionsLabel ? (
          <div className={clsx(DIRECTION_WRAPPER_CLASSES)}>
            <p className={clsx(DIRECTION_LABEL_CLASSES)}>{directionsLabel}</p>
            <div className="flex flex-wrap gap-2">
              {directionLinks.map((link) => (
                <Link
                  key={`${guide.key}-${link.slug}`}
                  href={`${howToBase}/${link.slug}`}
                  prefetch={true}
                  className={clsx(DIRECTION_PILL_CLASSES)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {ctaLabel ? (
        <Link href={href} prefetch={true} className={clsx(CTA_BUTTON_CLASSES)}>
          {ctaLabel}
        </Link>
      ) : null}
    </article>
  );
};
