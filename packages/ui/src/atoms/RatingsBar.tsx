"use client"; // i18n-exempt: Next.js directive string, not user-facing copy

import type { FC } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { Inline } from "../components/atoms/primitives/Inline";
import hotel from "../config/hotel";

type Props = { className?: string; lang?: string };

type RatingSourceMeta = {
  url: string;
  badgeBgClass: string;
  initials: string;
  translationKey: string;
  defaultLabel: string;
  badgeTextClass?: string;
};

const RATING_SOURCES: Record<string, RatingSourceMeta> = {
  Hostelworld: {
    url: "https://www.hostelworld.com/hostels/p/7763/hostel-brikette/",
    badgeBgClass: "bg-[var(--color-rating-hostelworld)]",
    initials: "HW",
    translationKey: "hostelworld",
    defaultLabel: "Hostelworld",
    badgeTextClass: "text-brand-heading",
  },
  "Booking.com": {
    url: "https://www.booking.com/hotel/it/hostel-brikette.en-gb.html",
    badgeBgClass: "bg-[var(--color-rating-booking)]",
    initials: "B",
    translationKey: "booking",
    defaultLabel: "Booking.com",
    badgeTextClass: "text-brand-bg",
  },
};

const ROOT_CONTAINER_CLASSES = [
  "mx-auto",
  "my-8",
  "w-full",
  "max-w-screen-xl",
  "px-4",
  "sm:px-6",
  "lg:my-10",
] as const;
const PANEL_CLASSES = [
  "relative",
  "overflow-hidden",
  "rounded-3xl",
  "border",
  "border-brand-outline/20",
  "bg-[linear-gradient(135deg,var(--color-brand-gradient-start)_0%,var(--color-brand-gradient-mid)_45%,var(--color-brand-gradient-end)_100%)]",
  "px-5",
  "py-6",
  "text-brand-bg",
  "shadow-2xl",
  "transition-colors",
  "duration-300",
  "sm:px-8",
  "sm:py-8",
  "dark:border-brand-outline/30",
  "dark:bg-[linear-gradient(135deg,rgb(var(--rgb-brand-bg)_/_0.95)_0%,rgb(var(--rgb-brand-bg)_/_0.9)_55%,rgb(var(--rgb-brand-surface)_/_0.7)_100%)]",
  "dark:text-brand-text",
] as const;
const PANEL_OVERLAY_CLASSES = [
  "pointer-events-none",
  "absolute",
  "inset-0",
  "opacity-70",
  "mix-blend-screen",
  /* i18n-exempt -- ABC-123 [ttl=2026-12-31] decorative gradient class */
  "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_55%)]",
  "dark:mix-blend-normal",
  "dark:bg-[radial-gradient(circle_at_top_left,rgba(var(--rgb-brand-primary),0.28),transparent_60%)]",
] as const;
const PANEL_CONTENT_CLASSES = [
  "relative",
  "z-10",
  "flex",
  "flex-col",
  "gap-6",
  "md:flex-row",
  "md:items-center",
  "md:justify-between",
] as const;
const LINK_BASE_CLASSES = [
  "group",
  "relative",
  "flex",
  "min-h-[3.5rem]",
  "min-w-[10rem]",
  "items-center",
  "gap-3",
  "rounded-2xl",
  "border",
  "border-brand-outline/30",
  "bg-brand-bg/10",
  "px-4",
  "py-3",
  "text-left",
  "backdrop-blur-sm",
  "transition",
  "duration-200",
  "hover:-translate-y-0.5",
  "hover:bg-brand-bg/15",
  "hover:no-underline",
  "hover:shadow-lg",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-brand-bg/70",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-transparent",
  "dark:border-brand-outline/40",
  "dark:bg-brand-bg/5",
  "dark:hover:bg-brand-bg/10",
  "dark:focus-visible:ring-brand-primary/50",
] as const;

const BADGE_BASE_CLASSES = [
  "inline-flex",
  "size-9",
  "items-center",
  "justify-center",
  "rounded-full",
  "text-sm",
  "font-bold",
  "shadow-md",
  "shadow-black/10",
  "ring-1",
  "ring-brand-bg/40",
  "transition",
  "duration-200",
  "group-hover:scale-105",
  "group-hover:shadow-lg",
  "dark:ring-brand-bg/20",
] as const;

const LAST_UPDATED = "2025-10-01"; // YYYY-MM-DD

function formatDateISOToLocale(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale || "en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  }
}

const RatingsBar: FC<Props> = ({ className, lang }) => {
  const { t, i18n } = useTranslation("ratingsBar", { lng: lang });
  const ratings = hotel.ratings ?? [];
  if (!ratings.length) return null;

  const activeLang = lang ?? i18n.language;
  const localizedDate = formatDateISOToLocale(LAST_UPDATED, activeLang);
  const lastCheckedLabel = t("lastChecked");

  return (
    <div
      className={clsx(ROOT_CONTAINER_CLASSES, className)}
      role="region"
      aria-label={t("aria.regionLabel")}
    >
      <div className={clsx(PANEL_CLASSES)}>
        <div aria-hidden="true" className={clsx(PANEL_OVERLAY_CLASSES)} />
        <div className={clsx(PANEL_CONTENT_CLASSES)}>
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-brand-outline/30 bg-brand-bg/10 px-3 py-1 text-xs font-semibold text-brand-bg/90 backdrop-blur-sm dark:border-brand-outline/40 dark:bg-brand-bg/5 dark:text-brand-text/80">
              <span aria-hidden="true" className="text-sm leading-none">★</span>
              {t("reviewed")}
            </span>
            <Inline gap={3} className="md:gap-4">
              {ratings.map((r) => {
                const meta = RATING_SOURCES[r.provider];
                const formattedCount = r.count.toLocaleString(activeLang);
                const reviewText = t("countReviews", { count: r.count, formattedCount });

                const sourceTranslationKey = meta?.translationKey;
                const accessibleProvider = sourceTranslationKey
                  ? t(`sources.${sourceTranslationKey}.ariaName`, {
                      defaultValue: meta?.defaultLabel ?? r.provider,
                    })
                  : meta?.defaultLabel ?? r.provider;
                const providerLabel = sourceTranslationKey
                  ? t(`sources.${sourceTranslationKey}.label`, {
                      defaultValue: meta?.defaultLabel ?? r.provider,
                    })
                  : meta?.defaultLabel ?? r.provider;
                const aria = t("aria.linkSummary", {
                  score: r.value.toFixed(1),
                  provider: accessibleProvider,
                  reviews: reviewText,
                  lastChecked: lastCheckedLabel,
                  date: localizedDate,
                });

                const badgeBgClass = meta?.badgeBgClass ?? "bg-[var(--color-brand-primary)]";

                return (
                  <a
                    key={r.provider}
                    href={meta?.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer external nofollow"
                    aria-label={aria}
                    className={clsx(LINK_BASE_CLASSES)}
                  >
                    <span
                      aria-hidden="true"
                      className={clsx(
                        BADGE_BASE_CLASSES,
                        badgeBgClass,
                        meta?.badgeTextClass ?? "text-brand-bg",
                      )}
                    >
                      {meta?.initials ?? r.provider[0]}
                    </span>
                    <span className="text-lg font-semibold tabular-nums text-brand-bg transition duration-200 sm:text-xl dark:text-brand-text">
                      {r.value.toFixed(1)}
                    </span>
                    <span className="text-sm font-medium text-brand-bg/95 transition duration-200 dark:text-brand-text/90">
                      {providerLabel}
                    </span>
                    <span className="hidden items-center gap-2 text-sm text-brand-bg/80 md:inline-flex dark:text-brand-text/75">
                      <span aria-hidden="true" className="text-brand-bg/50 dark:text-brand-text/50">
                        •
                      </span>
                      <span>{reviewText}</span>
                    </span>
                    <span className="text-xs text-brand-bg/75 md:hidden dark:text-brand-text/70">{reviewText}</span>
                  </a>
                );
              })}
            </Inline>
          </div>

          <div className="flex flex-col gap-2 text-sm text-brand-bg/80 md:items-end md:text-end dark:text-brand-text/70">
            <span className="inline-block rounded-full border border-brand-outline/20 bg-brand-bg/10 px-3 py-1 text-xs font-medium text-brand-bg/80 dark:border-brand-outline/40 dark:bg-brand-bg/5 dark:text-brand-text/70">
              {lastCheckedLabel}
            </span>
            <time
              className="text-base font-semibold text-brand-bg dark:text-brand-text"
              dateTime={LAST_UPDATED}
            >
              {localizedDate}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingsBar;
