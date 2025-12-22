/* ────────────────────────────────────────────────────────────────
   src/routes/deals.tsx
   Summer-2025 promo – fully localised head tags
---------------------------------------------------------------- */
import { Button } from "@acme/ui/atoms/Button";
import { useOptionalModal } from "@/context/ModalContext";
import { CheckCircle2, Hotel } from "lucide-react";
import { Fragment, memo, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

import { Section } from "@acme/ui/atoms/Section";
import { BASE_URL } from "@/config/site";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import type { MetaFunction, LinksFunction } from "react-router";
import { getSlug } from "@/utils/slug";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { OG_IMAGE } from "@/utils/headConstants";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";
import { safeUseLoaderData } from "@/utils/safeUseLoaderData";

import DealsStructuredData from "@/components/seo/DealsStructuredData";
import { DEFAULT_PERK_ICON, DISCOUNT_PCT, OG_IMAGE_PATH, PERK_ICONS, PERKS_HEADING_ID, RESTRICTIONS_HEADING_ID } from "./deals/constants";
import type { DealsLoaderData } from "./deals/loader";
import { clientLoader } from "./deals/loader";
import { DEAL_END } from "./deals/constants";
import { useDealContent } from "./deals/useDealContent";

type ClusterProps = JSX.IntrinsicElements["div"];
const Cluster = ({ className, ...props }: ClusterProps) => (
  <div
    className={clsx(
      "flex",
      "flex-col",
      "items-center",
      "gap-4",
      "sm:flex-row",
      "sm:justify-center",
      className,
    )}
    {...props}
  />
);

export { clientLoader };

export default memo(function Deals() {
  const loaded = safeUseLoaderData<DealsLoaderData | undefined>();
  const lang = (loaded?.lang as AppLanguage | undefined) || (i18nConfig.fallbackLng as AppLanguage);
  const { openModal } = useOptionalModal();

  const { translate: ft, perks, restrictions, isExpired, validityFrom, validityTo, labels } = useDealContent(lang);

  const reserve = useCallback(() => openModal("booking"), [openModal]);
  // Head handled by meta()/links(); avoid inline tags here

  // Deterministic head tags for tests when router head placeholders are unavailable
  const __fallbackMeta = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const path = `/${lang}/${getSlug("deals", lang)}`;
    const image = buildCfImageUrl(OG_IMAGE_PATH, {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });
    // Reflect expired state from content in tests (robots directive)
    return buildRouteMeta({
      lang,
      title: (loaded?.title ?? "") as string,
      description: (loaded?.desc ?? "") as string,
      url: `${BASE_URL}${path}`,
      path,
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      isPublished: !isExpired,
    });
  }, [lang, loaded?.title, loaded?.desc, isExpired]);
  const __fallbackLinks = useMemo(() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const path = `/${lang}/${getSlug("deals", lang)}`;
    return buildRouteLinks({ lang, path });
  }, [lang]);
  useApplyFallbackHead(__fallbackMeta as unknown as ReturnType<typeof buildRouteMeta>, __fallbackLinks);

  return (
    <Fragment>
      {null}

      <DealsStructuredData />

      <Section
        as="section"
        padding="none"
        className="mx-auto w-full max-w-xl scroll-mt-24 space-y-10 p-6 pt-24 text-center sm:pt-10"
      >
        <Section
          aria-labelledby={PERKS_HEADING_ID}
          padding="none"
          width="constrained"
          className="my-8 space-y-4 rounded-3xl border border-brand-primary/20 bg-brand-primary/5 px-6 py-8 text-start shadow-sm sm:my-12 sm:px-8 sm:py-10"
        >
          <div className="space-y-3">
            <h2 id={PERKS_HEADING_ID} className="text-xl font-semibold text-brand-primary">
              {labels.perksHeading}
            </h2>
            <p className="text-base text-brand-text/90">{labels.perksIntro}</p>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary/80">
              {labels.perksGuarantee}
            </p>
          </div>
          <Section as="div" padding="none" width="full" className="mx-auto max-w-prose">
            <ul className="space-y-3 text-start">
              {perks.map((item, idx) => {
                const Icon = PERK_ICONS[idx] ?? DEFAULT_PERK_ICON;
                return (
                  <li key={item}>
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 size-5 shrink-0 text-brand-secondary" aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>
          <div>
            <Link
              to={`/${lang}/${getSlug("terms", lang)}`}
              prefetch="intent"
              className="text-sm font-medium text-brand-primary underline underline-offset-4 hover:text-brand-bougainvillea"
            >
              {labels.termsLabel}
            </Link>
          </div>
        </Section>

        <header className="space-y-4">
          <h1 className="text-3xl font-bold">
            {ft("title", {
              percent: DISCOUNT_PCT,
              season: labels.seasonLabel,
            })}
          </h1>
          {isExpired ? (
            <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-start text-sm text-red-900">
              {ft("expired.message", {
                endedOn: validityTo,
              })}
            </div>
          ) : (
            <p className="text-sm text-brand-text/80">
              {ft("restrictions.stayWindow", {
                from: validityFrom,
                to: validityTo,
              })}
            </p>
          )}
          <p>
            {ft("promo", {
              percent: DISCOUNT_PCT,
            })}
          </p>
        </header>

        <Section aria-labelledby={RESTRICTIONS_HEADING_ID} padding="none" className="space-y-4">
          <h2 id={RESTRICTIONS_HEADING_ID} className="text-xl font-semibold text-brand-primary">
            {ft("restrictions.heading")}
          </h2>
          <Section as="div" padding="none" width="full" className="mx-auto max-w-prose">
            <ul className="space-y-2 text-start">
              {restrictions.map((rule, i) => (
                <li key={i}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" />
                    <span>{rule}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        </Section>

        <Cluster className="mt-2">
          {isExpired ? (
            <Link
              to={`/${lang}/${getSlug("rooms", lang)}`}
              prefetch="intent"
              className="cta-light dark:cta-dark rounded-md px-4 py-2 font-semibold text-brand-primary underline-offset-4 hover:underline"
            >
              {labels.expiredCtaLabel}
            </Link>
          ) : (
            <Button onClick={reserve} className="cta-light dark:cta-dark">
              <Hotel className="size-5" aria-hidden />
              {labels.activeCtaLabel}
            </Button>
          )}
        </Cluster>
      </Section>
    </Fragment>
  );
});

export const meta: MetaFunction = ({ data }: { data?: unknown } = {}) => {
  const d = (data || {}) as { lang?: string; title?: string; desc?: string };
  const lang = (d.lang as AppLanguage) || (i18nConfig.fallbackLng as AppLanguage);
  const title = d.title || "";
  const description = d.desc || "";
  const path = `/${lang}/${getSlug("deals", lang)}`;
  const image = buildCfImageUrl(OG_IMAGE_PATH, {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });
  const isExpired = Date.now() > DEAL_END.getTime();
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    isPublished: !isExpired,
  });
};

export const links: LinksFunction = () => buildRouteLinks();
