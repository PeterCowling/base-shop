// src/components/guides/GuideCollectionCard.tsx
import { Link } from "react-router-dom";
import clsx from "clsx";

import type { AppLanguage } from "@/i18n.config";
import type { GuideMeta } from "@/data/guides.index";
import { guideSlug } from "@/routes.guides-helpers";
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
  "inline-flex",
  "w-fit",
  "items-center",
  "justify-center",
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

interface GuideCollectionCardProps {
  lang: AppLanguage;
  guide: GuideMeta;
  label: string;
  summary?: string;
  ctaLabel?: string;
}

export const GuideCollectionCard = ({
  lang,
  guide,
  label,
  summary,
  ctaLabel,
}: GuideCollectionCardProps): JSX.Element => {
  // Always link under the Guides base for UI consistency
  const base = getSlug("guides", lang);
  const slug = guideSlug(lang, guide.key);
  const href = `/${lang}/${base}/${slug}`;

  return (
    <article className={clsx(CARD_CLASSES)}>
      <div>
        <h3 className="text-base font-semibold text-brand-heading dark:text-brand-surface">
          {ctaLabel ? (
            <Link to={href} prefetch="intent" className="hover:underline">
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
      </div>
      {ctaLabel ? (
        <Link to={href} prefetch="intent" className={clsx(CTA_BUTTON_CLASSES)}>
          {ctaLabel}
        </Link>
      ) : null}
    </article>
  );
};
