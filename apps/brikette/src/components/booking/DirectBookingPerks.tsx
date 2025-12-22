// src/components/booking/DirectBookingPerks.tsx
import { memo, useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Coffee, Percent, Wine } from "lucide-react";
import clsx from "clsx";
import { Link } from "react-router-dom";

import enTokens from "@/locales/en/_tokens.json";
import enDealsPage from "@/locales/en/dealsPage.json";
import { getSlug } from "@/utils/slug";
import { toAppLanguage } from "@/utils/lang";

interface Props {
  limit?: number;
  lang?: string;
}

type SectionProps = JSX.IntrinsicElements["section"];
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

function DirectBookingPerks({ limit = 3, lang }: Props): JSX.Element | null {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t, i18n } = useTranslation(undefined, translationOptions);
  useTranslation("_tokens", translationOptions);
  useTranslation("dealsPage", translationOptions);
  const headingId = useId();
  const perks = useMemo(() => {
    const raw = t("dealsPage:perksList", { returnObjects: true });
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t]);

  const heading = useMemo(() => {
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
  }, [i18n, lang]);

  const resolvedLang = toAppLanguage(lang);
  const termsHref = useMemo(
    () => `/${resolvedLang}/${getSlug("terms", resolvedLang)}`,
    [resolvedLang]
  );
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
        {items.map((text, idx) => {
          const Icon = icons[idx] ?? Percent;
          return (
            <li key={text}>
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-brand-secondary" aria-hidden />
                <span>{text}</span>
              </div>
            </li>
          );
        })}
      </ul>
      {termsLabel.trim().length > 0 ? (
        <div>
          <Link
            to={termsHref}
            className="text-sm font-medium text-brand-primary underline underline-offset-4 hover:text-brand-bougainvillea"
            prefetch="intent"
          >
            {termsLabel}
          </Link>
        </div>
      ) : null}
    </Section>
  );
}

export default memo(DirectBookingPerks);
