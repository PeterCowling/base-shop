// src/components/common/AlsoHelpful.tsx
import React, { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import clsx from "clsx";

import { Section } from "@acme/design-system/atoms";

import { type GuideSection,isGuideLive } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import { guideHref, type GuideKey } from "@/routes.guides-helpers";
import type { TFunction } from "@/utils/i18nSafe";
import { getNamespaceTranslator, getStringWithFallback } from "@/utils/i18nSafe";
import { relatedGuidesByTags } from "@/utils/related";
import { getSlug } from "@/utils/slug";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

// Module-level fallback translator for safe cross-namespace lookups
type DefaultValueOption = { defaultValue?: unknown } & Record<string, unknown>;
const fallbackTranslator: TFunction = ((key: string, opts?: DefaultValueOption) => {
  if (opts && Object.prototype.hasOwnProperty.call(opts, "defaultValue")) {
    const dv = (opts as DefaultValueOption).defaultValue;
    if (typeof dv === "string") {
      const trimmed = dv.trim();
      if (trimmed.length > 0) return trimmed;
    } else if (dv !== undefined && dv !== null) {
      return String(dv);
    }
  }
  return key;
}) as unknown as TFunction;

type I18nLike = Parameters<typeof getNamespaceTranslator>[0];

function safeGetNs(i18nLike: I18nLike, lng: string, ns: string): TFunction {
  if (typeof getNamespaceTranslator === "function") {
    return getNamespaceTranslator(i18nLike, lng, ns, fallbackTranslator);
  }
  const fixed = i18nLike?.getFixedT?.(lng, ns);
  if (typeof fixed === "function") return fixed as unknown as TFunction;
  return fallbackTranslator;
}

const safeGetStr: typeof getStringWithFallback =
  typeof getStringWithFallback === "function"
    ? getStringWithFallback
    : ((primary: TFunction, fallback: TFunction, key: string): string | undefined => {
        const p = typeof primary === "function" ? primary(key) : undefined;
        const s1 = typeof p === "string" ? p.trim() : "";
        if (s1 && s1 !== key) return s1;
        const fb = typeof fallback === "function" ? fallback(key) : undefined;
        const s2 = typeof fb === "string" ? fb.trim() : "";
        if (s2 && s2 !== key) return s2;
        return undefined;
      }) as typeof getStringWithFallback;

function buildSeoCta(prefix: string, subject: string): string {
  const cleanedSubject = subject.replace(/→/g, " ").replace(/\s+/g, " ").trim();
  if (!cleanedSubject) {
    return prefix;
  }
  return `${prefix} — ${cleanedSubject}`;
}

function joinTokens(value: unknown, joiner: " " | "" = " "): string {
  if (Array.isArray(value)) {
    return (value as unknown[])
      .map((v) => (typeof v === "string" ? v : String(v ?? "")))
      .join(joiner)
      .trim();
  }
  if (typeof value === "string") return value.trim();
  return String(value ?? "").trim();
}

function normaliseForAria(value: unknown): string {
  const joined = joinTokens(value, " ").replace(/→/g, " ");
  // Collapse whitespace and strip trailing punctuation artifacts after token joins
  return joined.replace(/\s+/g, " ").replace(/[\s,.;:]+$/, "").trim();
}

const SECTION_BASE_CLASSES = ["mx-auto", "mt-16", "max-w-5xl", "px-4", "sm:px-6", "lg:px-0"] as const;
const GRID_BASE_CLASSES = ["grid", "sm:grid-cols-2", "lg:grid-cols-3"] as const;

const CARD_SHARED_CLASSES = [
  "group",
  "flex",
  "h-full",
  "flex-col",
  "justify-between",
  "rounded-2xl",
  "border",
  "px-5",
  "py-4",
  "text-start",
  "text-brand-heading",
  "shadow-sm",
  "transition",
  "duration-200",
  "hover:-translate-y-1",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
] as const;

const STANDARD_CARD_VARIANTS = [
  "border-brand-outline/30",
  "bg-brand-bg/95",
  "hover:border-brand-primary/50",
  "hover:shadow-lg",
  "dark:border-brand-outline/50",
  "dark:bg-brand-surface/80",
  "dark:text-brand-text",
] as const;

const FEATURED_CARD_VARIANTS = [
  "border-brand-primary/55",
  "bg-brand-primary/5",
  "hover:border-brand-primary/70",
  "hover:bg-brand-primary/12",
  "dark:border-brand-secondary/60",
  "dark:bg-brand-secondary/25",
  "dark:text-brand-heading",
  "dark:hover:bg-brand-secondary/35",
] as const;

const STANDARD_TITLE_CLASS =
  "dark:text-brand-text group-hover:text-brand-primary dark:group-hover:text-brand-secondary";
const FEATURED_TITLE_CLASS = "group-hover:text-brand-primary dark:group-hover:text-brand-secondary";

type AlsoHelpfulCardProps = {
  href: string;
  ariaLabel: string;
  title: React.ReactNode;
  ctaText: string;
  variant?: "standard" | "featured";
  titleClassName?: string;
  prefetch?: boolean;
};

function AlsoHelpfulCard({
  href,
  ariaLabel,
  title,
  ctaText,
  variant = "standard",
  titleClassName,
  prefetch,
}: AlsoHelpfulCardProps): JSX.Element {
  const variantClasses = variant === "featured" ? FEATURED_CARD_VARIANTS : STANDARD_CARD_VARIANTS;
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={clsx(CARD_SHARED_CLASSES, variantClasses)}
      aria-label={ariaLabel}
    >
      <span
        className={clsx(
          "text-base font-semibold leading-snug text-brand-heading",
          titleClassName,
        )}
      >
        {title}
      </span>
      <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-primary dark:text-brand-secondary">
        <span>{ctaText}</span>
        <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
          <path
            d="m7.5 5.5 5 4.5-5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Link>
  );
}

type Props = {
  lang: AppLanguage;
  tags?: string[];
  excludeGuide?: GuideKey | GuideKey[];
  includeRooms?: boolean;
  titleKey?: { ns: string; key: string } | string; // default assistanceCommon.alsoHelpful
  section?: GuideSection;
};

function AlsoHelpful({
  lang,
  tags = [],
  excludeGuide,
  includeRooms = true,
  titleKey,
  section,
}: Props): JSX.Element | null {
  const { t: tAssistance, i18n } = useTranslation("assistanceCommon", { lng: lang });

  // Cross-namespace translators
  const guidesT = safeGetNs(i18n, lang, "guides");
  const guidesEnT = safeGetNs(i18n, "en", "guides");
  const assistanceEnT = safeGetNs(i18n, "en", "assistanceCommon");

  const related = useMemo<GuideKey[]>(() => {
    return relatedGuidesByTags(tags, {
      ...(excludeGuide !== undefined ? { exclude: excludeGuide } : {}),
      ...(section !== undefined ? { section } : {}),
      limit: 3,
    });
  }, [excludeGuide, section, tags]);
  const liveRelated = useMemo(() => related.filter((key) => isGuideLive(key)), [related]);

  const heading = (() => {
    if (!titleKey) {
      return safeGetStr(tAssistance, assistanceEnT, "alsoHelpful") ?? "Also helpful";
    }
    if (typeof titleKey === "string") {
      return safeGetStr(guidesT, guidesEnT, titleKey) ?? titleKey;
    }
    const translator = safeGetNs(i18n, lang, titleKey.ns);
    const fallbackT = safeGetNs(i18n, "en", titleKey.ns);
    return safeGetStr(translator, fallbackT, titleKey.key) ?? titleKey.key;
  })();

  const description = safeGetStr(tAssistance, assistanceEnT, "alsoHelpfulDescription") ?? "";

  const exploreCtaPrefix = (() => {
    const tokens = tAssistance("alsoHelpfulExplore", { returnObjects: true, defaultValue: [] }) as unknown;
    const joined = joinTokens(tokens, "");
    if (joined) return joined;
    const str = safeGetStr(tAssistance, assistanceEnT, "alsoHelpfulExplore");
    if (typeof str === "string" && str.trim()) return str.trim();
    return "Explore";
  })();

  const bookCtaPrefix = (() => {
    const tokens = tAssistance("alsoHelpfulBook", { returnObjects: true, defaultValue: [] }) as unknown;
    const joined = joinTokens(tokens, "");
    if (joined) return joined;
    const str = safeGetStr(tAssistance, assistanceEnT, "alsoHelpfulBook");
    if (typeof str === "string" && str.trim()) return str.trim();
    return "Book";
  })();

  const hasAny = includeRooms || liveRelated.length > 0;
  if (!hasAny) return null;

  return (
    <Section padding="none" width="full" className={clsx(SECTION_BASE_CLASSES)}>
      <div className="relative isolate overflow-hidden rounded-3xl border border-brand-outline/30 bg-brand-surface/80 px-6 py-8 shadow-lg backdrop-blur dark:border-brand-outline/50 dark:bg-brand-bg/85">
        <div
          className="pointer-events-none absolute inset-y-0 end-0 w-40 bg-gradient-to-l from-brand-primary/10 to-transparent"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span
                className="flex size-12 items-center justify-center rounded-2xl bg-brand-primary/15 text-brand-primary dark:bg-brand-secondary/30 dark:text-brand-secondary"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="size-6"
                  aria-hidden="true"
                >
                  <path
                    d="M6 7.5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3V18a1.5 1.5 0 0 1-2.529 1.06L12 15.5l-3.471 3.56A1.5 1.5 0 0 1 6 18z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M9 7.5h6" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-primary dark:text-brand-secondary/80">
                  {tAssistance("alsoHelpfulEyebrow", {
                    defaultValue: assistanceEnT("alsoHelpfulEyebrow"),
                  })}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-brand-heading dark:text-brand-heading">{heading}</h2>
                {description && typeof description === "string" && (
                  <p className="mt-2 text-brand-muted dark:text-brand-text/80 text-base">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <ul className={clsx(GRID_BASE_CLASSES, "gap-4")}>
            {liveRelated.map((key, index) => {
              const label = getGuideLinkLabel(guidesT, guidesEnT, key);
              const labelText = normaliseForAria(label);
              const ctaText = buildSeoCta(exploreCtaPrefix, labelText);
              const ariaLabel = ctaText.replace(/→/g, "to");
              return (
                <li key={`${key}-${index}`} className="h-full">
                  <AlsoHelpfulCard
                    href={guideHref(lang, key)}
                    prefetch={false}
                    ariaLabel={ariaLabel}
                    title={label}
                    ctaText={ctaText}
                    titleClassName={STANDARD_TITLE_CLASS}
                  />
                </li>
              );
            })}
            {includeRooms && (() => {
              // Prefer tokenised arrays for the rooms label (e.g., ["Camere", "disponibili"])
              // and only fall back to a plain string when tokens are unavailable.
              const roomsTokens = tAssistance("roomsCta", {
                returnObjects: true,
                defaultValue: [],
              }) as unknown;
              const labelFromTokens = joinTokens(roomsTokens, " ");
              const roomsLabel = labelFromTokens || (safeGetStr(tAssistance, assistanceEnT, "roomsCta") ?? "");
              const roomsLabelText = roomsLabel.trim();
              const roomsCtaText = buildSeoCta(bookCtaPrefix, roomsLabelText);
              const roomsAriaLabel = roomsCtaText.replace(/→/g, "to");
              return (
                <li key="rooms" className="h-full">
                  <AlsoHelpfulCard
                    href={`/${lang}/${getSlug("rooms", lang)}`}
                    prefetch={false}
                    ariaLabel={roomsAriaLabel}
                    title={roomsLabel}
                    ctaText={roomsCtaText}
                    variant="featured"
                    titleClassName={FEATURED_TITLE_CLASS}
                  />
                </li>
              );
            })()}
          </ul>
        </div>
      </div>
    </Section>
  );
}

export default memo(AlsoHelpful);
