// src/components/booking/DirectBookingPerks.tsx
import React, { memo, useId } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import clsx from "clsx";
import { Coffee, Percent, Wine } from "@/icons";

import enTokens from "@/locales/en/_tokens.json";
import enDealsPage from "@/locales/en/dealsPage.json";
import { toAppLanguage } from "@/utils/lang";
import { getSlug } from "@/utils/slug";

interface Props {
  limit?: number;
  lang?: string;
}

type SectionProps = React.ComponentProps<"section">;
const SECTION_BASE_CLASS = ["mx-auto", "w-full"] as const;
function Section({ className, ...props }: SectionProps): JSX.Element {
  return <section className={clsx(SECTION_BASE_CLASS, className)} {...props} />;
}

const FALLBACK_HEADING =
  (enTokens.directBookingPerks as string | undefined) ??
  (enDealsPage.perksHeading as string | undefined) ??
  "";
const FALLBACK_INTRO = (enDealsPage.perksIntro as string | undefined) ?? "";
const FALLBACK_GUARANTEE = (enDealsPage.perksGuarantee as string | undefined) ?? "";
const FALLBACK_TERMS_LABEL =
  (enDealsPage.restrictions?.other as string | undefined) ?? "";

type PerkItem = {
  title: string;
  subtitle?: string;
};

const normalizePerkItem = (item: unknown): PerkItem | null => {
  if (typeof item === "string") {
    return { title: item };
  }
  if (typeof item === "object" && item !== null) {
    const maybe = item as { title?: unknown; subtitle?: unknown };
    if (typeof maybe.title === "string") {
      const perk: PerkItem = { title: maybe.title };
      if (typeof maybe.subtitle === "string") {
        perk.subtitle = maybe.subtitle;
      }
      return perk;
    }
  }
  return null;
};

function DirectBookingPerks({ limit = 3, lang }: Props): JSX.Element | null {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t, i18n } = useTranslation(undefined, translationOptions);
  useTranslation("_tokens", translationOptions);
  useTranslation("dealsPage", translationOptions);
  const headingId = useId();
  const perks = (() => {
    const raw = t("dealsPage:perksList", { returnObjects: true });
    if (!Array.isArray(raw)) return [];
    return raw.map(normalizePerkItem).filter((item): item is PerkItem => Boolean(item?.title?.trim()));
  })();

  const heading = (() => {
    const activeLanguage = (lang && lang.trim()) || i18n.language || i18n.languages?.[0];

    if (typeof activeLanguage === "string" && activeLanguage.trim()) {
      const directToken = i18n.getResource(activeLanguage, "_tokens", "directBookingPerks");
      if (typeof directToken === "string" && directToken.trim()) {
        return directToken;
      }

      const dealsHeading = i18n.getResource(activeLanguage, "dealsPage", "perksHeading");
      if (typeof dealsHeading === "string" && dealsHeading.trim()) {
        return dealsHeading;
      }
    }

    return FALLBACK_HEADING;
  })();

  const resolvedLang = toAppLanguage(lang);
  const termsHref = `/${resolvedLang}/${getSlug("terms", resolvedLang)}`;
  const introCopy = t("dealsPage:perksIntro", { defaultValue: FALLBACK_INTRO }) as string;
  const guaranteeCopy = t("dealsPage:perksGuarantee", {
    defaultValue: FALLBACK_GUARANTEE,
  }) as string;
  const termsLabel = t("dealsPage:restrictions.other", {
    defaultValue: FALLBACK_TERMS_LABEL,
  }) as string;
  if (!perks.length) return null;
  const items = perks.slice(0, limit);
  const icons = [Percent, Coffee, Wine];
  const showIntro = introCopy.trim().length > 0;

  return (
    <Section
      aria-labelledby={headingId}
      className="my-8 w-full max-w-screen-2xl space-y-4 rounded-3xl border border-brand-primary/20 bg-brand-primary/5 px-6 py-8 text-start shadow-sm sm:my-12 sm:px-8 sm:py-10"
    >
      <div className="space-y-3">
        <h2 id={headingId} className="text-xl font-semibold text-brand-primary">
          {heading}
        </h2>
        {showIntro ? <p className="text-base text-brand-text/90">{introCopy}</p> : null}
        {guaranteeCopy.trim().length > 0 ? (
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary/80">
            {guaranteeCopy}
          </p>
        ) : null}
      </div>
      <ul className="space-y-3 text-start">
        {items.map((item, idx) => {
          const Icon = icons[idx] ?? Percent;
          return (
            <li key={item.title}>
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-brand-secondary" aria-hidden />
                <div className="space-y-1">
                  <p>{item.title}</p>
                  {item.subtitle ? <p className="text-sm text-brand-text/80">{item.subtitle}</p> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {termsLabel.trim().length > 0 ? (
        <div>
          <Link
            href={termsHref}
            className="text-sm font-medium text-brand-primary underline underline-offset-4 hover:text-brand-bougainvillea"
            prefetch={true}
          >
            {termsLabel}
          </Link>
        </div>
      ) : null}
    </Section>
  );
}

export default memo(DirectBookingPerks);
