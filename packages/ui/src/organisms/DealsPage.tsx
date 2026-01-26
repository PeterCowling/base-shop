// packages/ui/src/organisms/DealsPage.tsx
import { Fragment, memo, type ReactNode,useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, CheckCircle2, Coffee, Percent, Wine } from "lucide-react";

import { AppLink as Link } from "../atoms/Link";
import { Section } from "../atoms/Section";
import { Stack } from "../components/atoms/primitives/Stack";
import { Card, CardContent } from "../components/atoms/shadcn";
import DealsStructuredData from "../components/seo/DealsStructuredData";
import { useModal } from "../context/ModalContext";
import { type AppLanguage,i18nConfig } from "../i18n.config";
import { resolveBookingCtaLabel } from "../shared";
import formatDisplayDate from "../utils/formatDisplayDate";
import { getSlug } from "../utils/slug";

const DISCOUNT_PCT = 15;
const perkIcons = [Percent, Coffee, Wine];
const OG_DESCRIPTION_PROPERTY = "og:description";
const OG_LOCALE_ALTERNATE_PROPERTY = "og:locale:alternate";
const PERKS_HEADING_ID = "perks-heading";
const RESTRICTIONS_HEADING_ID = "restrictions-heading";

interface DealsPageProps {
  lang: AppLanguage;
  title: string;
  desc: string;
  structuredData?: Record<string, unknown> | unknown[];
}

function DealsPage({ lang, title, desc, structuredData }: DealsPageProps): JSX.Element {
  const { supportedLngs } = i18nConfig;
  const { t, ready } = useTranslation("dealsPage", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const { openModal } = useModal();

  const reserve = useCallback(() => openModal("booking"), [openModal]);

  const bookingCtaLabel = useMemo(() => {
    if (!ready && !tokensReady) {
      return "Reserve Now";
    }
    return (
      resolveBookingCtaLabel(tTokens, {
        fallback: () => {
          const direct = t("buttonReserve") as string;
          if (direct && direct.trim() && direct !== "buttonReserve") {
            return direct;
          }
          const fallback = t("buttonReserve", { lng: i18nConfig.fallbackLng }) as string;
          if (fallback && fallback.trim() && fallback !== "buttonReserve") {
            return fallback;
          }
          return "Reserve Now";
        },
      }) ?? "Reserve Now"
    );
  }, [t, tTokens, ready, tokensReady]);

  // Email coupon flow removed. Discount is auto-applied on direct bookings.

  const perks = useMemo<string[]>(() => {
    if (!ready) return [];
    const raw = t("perksList", { returnObjects: true });
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [t, ready]);

  const restrictions = useMemo<{ key: string; node: ReactNode }[]>(() => {
    if (!ready) return [];
    const strong =
      /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
      "font-semibold text-brand-primary";
    const from = formatDisplayDate(lang, new Date(2025, 4, 29));
    const to = formatDisplayDate(lang, new Date(2025, 9, 31));
    return [
      { key: "stayWindow", node: t("restrictions.stayWindow", { from, to }) },
      {
        key: "minAdvance",
        node: (
          <span>
            {t("restrictions.minAdvancePrefix")} <span className={strong}>10&nbsp;days</span>{" "}
            {t("restrictions.minAdvanceSuffix")}
          </span>
        ),
      },
      { key: "los", node: t("restrictions.los", { min: 2, max: 8 }) },
      {
        key: "nonRefundable",
        node: (
          <span>
            {t("restrictions.nonRefundablePrefix")}{" "}
            <span className={strong}>
              {t("restrictions.nonRefundableEmphasis", { defaultValue: "non-refundable" })}
            </span>{" "}
            {t("restrictions.nonRefundableSuffix")}
          </span>
        ),
      },
      { key: "stackable", node: t("restrictions.stackable", { percent: DISCOUNT_PCT }) },
      {
        key: "terms",
        node: (
          <Link
            href={`/${lang}/${getSlug("terms", lang)}`}
            className="underline text-brand-primary hover:text-brand-bougainvillea"
            prefetch
          >
            {t("restrictions.other")}
          </Link>
        ),
      },
    ];
  }, [t, lang, ready]);

  return (
    <Fragment>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={title} />
      <meta property={OG_DESCRIPTION_PROPERTY} content={desc} />
      <meta property="og:locale" content={lang} />
      {supportedLngs
        .filter((l) => l !== lang)
        .map((l) => (
          <meta key={l} property={OG_LOCALE_ALTERNATE_PROPERTY} content={l} />
        ))}

      <DealsStructuredData data={structuredData} />

      <Section as="main" padding="none" className="max-w-3xl space-y-10 p-6 pt-34 text-center">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold">{t("title", { percent: DISCOUNT_PCT, season: "Summer 2025" })}</h1>
          <p>{t("promo", { percent: DISCOUNT_PCT })}</p>
          {/* Coupon step removed – direct discount reflected in rates */}
        </header>

        <section aria-labelledby={PERKS_HEADING_ID} className="space-y-4">
          <h2 id={PERKS_HEADING_ID} className="text-xl font-semibold text-brand-primary">
            {t("perksHeading")}
          </h2>
          <Stack asChild gap={3} className="mx-auto text-start">
            <ul>
              {perks.map((item, idx) => {
                const Icon = perkIcons[idx] ?? Percent;
                return (
                  <li key={item} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-secondary" aria-hidden />
                    <span>{item}</span>
                  </li>
                );
              })}
            </ul>
          </Stack>
        </section>

        <section aria-labelledby={RESTRICTIONS_HEADING_ID} className="space-y-4">
          <h2 id={RESTRICTIONS_HEADING_ID} className="text-xl font-semibold text-brand-primary">
            {t("restrictions.heading")}
          </h2>
          <Card className="mx-auto text-start">
            <CardContent>
              <Stack asChild gap={2}>
                <ul>
                  {restrictions.map(({ key, node }) => (
                    <li key={key} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
                      <span>{node}</span>
                    </li>
                  ))}
                </ul>
              </Stack>
            </CardContent>
          </Card>
        </section>

        <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reserve}
            className="group relative inline-flex min-h-10 min-w-10 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-secondary px-6 py-3 text-base font-semibold text-brand-heading shadow-lg transition-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary hover:scale-105 hover:bg-brand-secondary/90 sm:w-auto sm:px-5 sm:py-3 sm:text-sm"
            aria-label={bookingCtaLabel}
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span className="relative flex items-center gap-2">
              <span>{bookingCtaLabel}</span>
              <ArrowRight aria-hidden className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </Section>
    </Fragment>
  );
}

export default memo(DealsPage);
export { DealsPage };
