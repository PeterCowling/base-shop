/* ────────────────────────────────────────────────────────────────
   src/routes/deals.tsx
   Deals index – date-driven promo + fully localised head tags
---------------------------------------------------------------- */
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import type { LinksFunction,MetaFunction } from "react-router";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

import { Button, Grid, Section } from "@acme/ui/atoms";

import DealsStructuredData from "@/components/seo/DealsStructuredData";
import { Cluster, Inline, InlineItem, Stack } from "@/components/ui/flex";
import { BASE_URL } from "@/config/site";
import { useOptionalModal } from "@/context/ModalContext";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { OG_IMAGE } from "@/utils/headConstants";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { safeUseLoaderData } from "@/utils/safeUseLoaderData";
import { getSlug } from "@/utils/slug";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

import { DEFAULT_PERK_ICON, OG_IMAGE_PATH, PERK_ICONS } from "./deals/constants";
import { formatDateRange, formatPercent, isoDateToLocalStart } from "./deals/dates";
import DealCard from "./deals/DealCard";
import { DEALS, PRIMARY_DEAL } from "./deals/deals";
import type { DealsLoaderData } from "./deals/loader";
import { clientLoader } from "./deals/loader";
import { getDealStatus } from "./deals/status";
import { useDealContent } from "./deals/useDealContent";

export { clientLoader };

/* i18n-exempt -- DX-451 [ttl=2026-12-31] Non-UI anchor identifiers. */
const CURRENT_DEALS_ID = "current-deals";
const EXPIRED_DEALS_PANEL_ID = "expired-deals-panel";
const DIRECT_BOOKING_PERKS_ID = "direct-booking-perks";

export default memo(function Deals() {
  const loaded = safeUseLoaderData<DealsLoaderData | undefined>();
  const lang = (loaded?.lang as AppLanguage | undefined) || (i18nConfig.fallbackLng as AppLanguage);
  const { openModal } = useOptionalModal();

  const { translate: ft, perks, labels } = useDealContent(lang);
  const perksLinkLabel = typeof labels.perksLinkLabel === "string" ? labels.perksLinkLabel : "";

  const openBooking = useCallback(
    ({ kind, dealId }: { kind: "deal" | "standard"; dealId?: string }) => {
      if (kind === "deal" && dealId) {
        openModal("booking", { deal: dealId });
        return;
      }
      openModal("booking");
    },
    [openModal],
  );

  const openOffers = useCallback(() => openModal("offers"), [openModal]);
  // Head handled by meta()/links(); avoid inline tags here

  const [now, setNow] = useState<number>(() => loaded?.generatedAt ?? Date.now());
  useEffect(() => {
    // Keep build-time prerender deterministic, then snap to real client time after hydration.
    setNow(Date.now());
  }, [loaded?.generatedAt]);
  const dealsWithStatus = useMemo(() => {
    const snapshot = new Date(now);
    return DEALS.map((deal) => ({
      deal,
      status: getDealStatus(deal, snapshot),
    }));
  }, [now]);

  const activeDeals = useMemo(
    () => dealsWithStatus.filter((entry) => entry.status === "active"),
    [dealsWithStatus],
  );
  const upcomingDeals = useMemo(
    () => dealsWithStatus.filter((entry) => entry.status === "upcoming"),
    [dealsWithStatus],
  );
  const expiredDeals = useMemo(
    () => dealsWithStatus.filter((entry) => entry.status === "expired"),
    [dealsWithStatus],
  );

  const referenceDate = useMemo(() => new Date(now), [now]);
  const activeDeal = activeDeals[0]?.deal ?? PRIMARY_DEAL;
  const hasActiveDeals = activeDeals.length > 0;
  const hasUpcomingDeals = upcomingDeals.length > 0;
  const hasExpiredDeals = expiredDeals.length > 0;
  const hasIndexableDeals = hasActiveDeals || hasUpcomingDeals;

  const heroRange = useMemo(() => {
    const start = isoDateToLocalStart(activeDeal.startDate);
    const end = isoDateToLocalStart(activeDeal.endDate);
    return formatDateRange(lang, start, end, referenceDate);
  }, [activeDeal.endDate, activeDeal.startDate, lang, referenceDate]);
  const heroPercent = useMemo(() => formatPercent(lang, activeDeal.discountPct), [activeDeal.discountPct, lang]);

  const [expiredOpen, setExpiredOpen] = useState(() => !hasActiveDeals && hasExpiredDeals);
  useEffect(() => {
    if (!hasActiveDeals && hasExpiredDeals) {
      setExpiredOpen(true);
    }
  }, [hasActiveDeals, hasExpiredDeals]);
  const toggleExpired = useCallback(() => setExpiredOpen((prev) => !prev), []);

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
      isPublished: hasIndexableDeals,
    });
  }, [lang, loaded?.title, loaded?.desc, hasIndexableDeals]);
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
        as="main"
        padding="none"
        className="mx-auto w-full max-w-5xl scroll-mt-24 space-y-8 px-4 pb-16 pt-24 text-start sm:px-6 sm:pt-16 lg:px-8"
      >
        <header className="rounded-3xl border border-brand-outline/20 bg-brand-bg px-6 py-8 shadow-sm dark:bg-brand-text">
          {hasActiveDeals ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary/80">
                  {ft("hero.activeLabel")}
                </p>
                <h1 className="text-3xl font-semibold text-brand-heading">
                  {ft("hero.activeTitle", { percent: heroPercent })}
                </h1>
                <p className="text-sm text-brand-text/80">
                  {ft("hero.activeDatesLabel")}{" "}
                  <span className="whitespace-nowrap">{heroRange}</span>
                </p>
                <p className="text-sm text-brand-text/70">{ft("hero.activeSubtitle")}</p>
              </div>
              <Button
                onClick={() => openBooking({ kind: "deal", dealId: activeDeal.id })}
                className="cta-light dark:cta-dark"
              >
                {ft("dealCard.cta.bookDirect")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-brand-heading">{ft("emptyState.title")}</h1>
                <p className="text-sm text-brand-text/80">{ft("emptyState.subtitle")}</p>
              </div>
              <Stack className="gap-3 sm:flex-row sm:items-center">
                <Button onClick={() => openBooking({ kind: "standard" })} className="cta-light dark:cta-dark">
                  {labels.checkAvailabilityLabel}
                </Button>
                <Inline
                  as="a"
                  href={`#${DIRECT_BOOKING_PERKS_ID}`}
                  className="min-h-11 min-w-11 text-sm font-medium text-brand-primary hover:text-brand-bougainvillea focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                >
                  {ft("emptyState.secondaryCta")}
                </Inline>
              </Stack>
            </div>
          )}
        </header>

        <div id={CURRENT_DEALS_ID} className="space-y-6">
            {hasActiveDeals ? (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-brand-heading">{ft("sections.active")}</h2>
                <div className="space-y-5">
                  {activeDeals.map(({ deal, status }) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      status={status}
                      lang={lang}
                      translate={ft}
                      termsLabel={labels.termsLabel}
                      termsHref={`/${lang}/${getSlug("terms", lang)}`}
                      onOpenBooking={openBooking}
                      referenceDate={referenceDate}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {hasUpcomingDeals ? (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-brand-heading">{ft("sections.upcoming")}</h2>
                <div className="space-y-5">
                  {upcomingDeals.map(({ deal, status }) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      status={status}
                      lang={lang}
                      translate={ft}
                      termsLabel={labels.termsLabel}
                      termsHref={`/${lang}/${getSlug("terms", lang)}`}
                      onOpenBooking={openBooking}
                      referenceDate={referenceDate}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

        {hasExpiredDeals ? (
          <section className="rounded-2xl border border-brand-outline/30 bg-brand-bg text-start shadow-sm dark:bg-brand-text">
            <Cluster
              as="button"
              type="button"
              onClick={toggleExpired}
              aria-expanded={expiredOpen}
              aria-controls={EXPIRED_DEALS_PANEL_ID}
              className="min-h-12 min-w-12 w-full items-center justify-between gap-3 px-6 py-3 text-sm font-semibold text-brand-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            >
              <span>{ft("sections.expired")}</span>
              <Inline className="gap-3">
                <span className="rounded-full border border-brand-outline/40 px-3 py-1 text-xs font-semibold text-brand-text/80">
                  {expiredDeals.length}
                </span>
                <ChevronDown
                  className={clsx(
                    "size-4",
                    "text-brand-text/70",
                    "transition-transform",
                    expiredOpen ? "rotate-180" : "rotate-0",
                  )}
                  aria-hidden="true"
                />
              </Inline>
            </Cluster>
            {expiredOpen ? (
              <div id={EXPIRED_DEALS_PANEL_ID} className="border-t border-brand-outline/20 px-6 pb-6 pt-5">
                <div className="space-y-5">
                  {expiredDeals.map(({ deal, status }) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      status={status}
                      lang={lang}
                      translate={ft}
                      termsLabel={labels.termsLabel}
                      termsHref={`/${lang}/${getSlug("terms", lang)}`}
                      onOpenBooking={openBooking}
                      referenceDate={referenceDate}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {perks.length ? (
          <Section
            id={DIRECT_BOOKING_PERKS_ID}
            as="section"
            padding="none"
            className="rounded-3xl border border-brand-primary/20 bg-brand-primary/5 p-6 text-start shadow-sm"
          >
            <Stack className="gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-brand-heading">{labels.perksHeading}</h2>
              {perksLinkLabel.trim().length ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={openOffers}
                  className="min-h-11 min-w-11 border-transparent text-brand-primary hover:bg-brand-primary/10"
                >
                  {perksLinkLabel}
                </Button>
              ) : null}
            </Stack>

            <Grid as="ul" columns={{ base: 1, sm: 3 }} gap={4} className="mt-5 text-start">
              {perks.slice(0, 3).map((item, idx) => {
                const Icon = PERK_ICONS[idx] ?? DEFAULT_PERK_ICON;
                return (
                  <InlineItem
                    key={item.title}
                    className="gap-3 rounded-2xl border border-brand-outline/20 bg-brand-bg p-4 shadow-sm dark:bg-brand-text"
                  >
                    <Icon className="mt-0.5 size-5 shrink-0 text-brand-secondary" aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-brand-heading">{item.title}</p>
                      {item.subtitle ? <p className="text-xs text-brand-text/70">{item.subtitle}</p> : null}
                    </div>
                  </InlineItem>
                );
              })}
            </Grid>
          </Section>
        ) : null}
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
  const isPublished = DEALS.some((deal) => getDealStatus(deal) !== "expired");
  return buildRouteMeta({
    lang,
    title,
    description,
    url: `${BASE_URL}${path}`,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    isPublished,
  });
};

export const links: LinksFunction = () => buildRouteLinks();
