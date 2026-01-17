// Copied from src/components/booking/DirectBookingPerks.tsx
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Coffee, Percent, Wine } from "lucide-react";
import { Link } from "react-router-dom";

import { getSlug } from "@/utils/slug";
import { toAppLanguage } from "@/utils/lang";
import { Section } from "../atoms/Section";

interface Props {
  limit?: number;
  lang?: string;
}

function DirectBookingPerks({ limit = 3, lang }: Props): JSX.Element | null {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t, ready } = useTranslation(undefined, translationOptions);
  const { ready: tokensReady } = useTranslation("_tokens", translationOptions);
  const { ready: dealsReady } = useTranslation("dealsPage", translationOptions);
  const perks = useMemo(() => {
    if (!ready || !tokensReady || !dealsReady) return [];
    const raw = t("dealsPage:perksList", { returnObjects: true });
    if (!Array.isArray(raw)) return [];
    // Handle both string[] and {title: string, subtitle?: string}[] formats
    return raw.map((item: unknown) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "title" in item) {
        return (item as { title: string }).title;
      }
      return "";
    }).filter((s) => s.length > 0);
  }, [t, ready, tokensReady, dealsReady]);

  if (!perks.length) return null;
  const items = perks.slice(0, limit);
  const icons = [Percent, Coffee, Wine];
  const resolvedLang = toAppLanguage(lang);
  const termsHref = `/${resolvedLang}/${getSlug("terms", resolvedLang)}`;
  const heading = t("dealsPage:perksHeading", {
    defaultValue: t("_tokens:directBookingPerks", {
      defaultValue: "Direct booking perks",
    }) as string,
  }) as string;
  const introCopy = t("dealsPage:perksIntro", {
    defaultValue: "These perks are unique to guests who book directly on our website.",
  }) as string;
  const guaranteeCopy = t("dealsPage:perksGuarantee", {
    defaultValue: "Every booking made directly on our website unlocks these exclusive perks automatically.",
  }) as string;
  const termsLabel = t("dealsPage:restrictions.other", {
    defaultValue: "Standard terms and conditions apply.",
  }) as string;
  const showIntro = introCopy.trim().length > 0;

  return (
    <Section
      aria-labelledby="perks-heading"
      as="section"
      padding="none"
      className="my-8 w-full space-y-4 rounded-3xl border border-brand-primary/20 bg-brand-primary/5 px-6 py-8 text-start shadow-sm sm:my-12 sm:px-8 sm:py-10"
    >
      <div className="space-y-3">
        <h2
          id={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] id attribute */ "perks-heading"}
          className={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "text-xl font-semibold text-brand-primary"}
        >
          {heading}
        </h2>
        {showIntro ? <p className="text-base text-brand-text/90">{introCopy}</p> : null}
        {guaranteeCopy.trim().length > 0 ? (
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary/80">
            {guaranteeCopy}
          </p>
        ) : null}
      </div>
      <Section as="div" padding="none" className="max-w-prose">
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
      </Section>
      {termsLabel.trim().length > 0 ? (
        <div>
          <Link
            to={termsHref}
            prefetch="intent"
            className="text-sm font-medium text-brand-primary underline underline-offset-4 hover:text-brand-bougainvillea"
          >
            {termsLabel}
          </Link>
        </div>
      ) : null}
    </Section>
  );
}

export { DirectBookingPerks };
export default memo(DirectBookingPerks);
