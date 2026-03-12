/* eslint-disable ds/no-hardcoded-copy, ds/container-widths-only-at, ds/enforce-layout-primitives -- BRIK-DS-001: in-progress design-system migration */
"use client";

// src/app/[lang]/deals/DealsPageContent.tsx
// Client component for deals page
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

import { Section } from "@acme/design-system/atoms";

import DealsStructuredData from "@/components/seo/DealsStructuredData";
import { useEntryAttribution } from "@/hooks/useEntryAttribution";
import { usePagePreload } from "@/hooks/usePagePreload";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { formatMonthDay, formatPercent, isoDateToLocalStart, shouldIncludeYear } from "@/routes/deals/dates";
import DealCard from "@/routes/deals/DealCard";
import { DEALS, PRIMARY_DEAL } from "@/routes/deals/deals";
import { DealsPerksSection, DealsPrimaryCtaSection } from "@/routes/deals/PerksAndCtaSections";
import { getDealStatus } from "@/routes/deals/status";
import { useDealContent } from "@/routes/deals/useDealContent";
import { writeAttribution } from "@/utils/entryAttribution";
import { fireSelectPromotion, fireViewItemList, fireViewPromotion } from "@/utils/ga4-events";
import { HEADER_BOOKING_OPTIONS_ID } from "@/utils/headerPrimaryCtaTarget";
import { buildIntentAwareBookingCopy } from "@/utils/intentAwareBookingCopy";
import { resolveIntentAwareBookingSurface } from "@/utils/intentAwareBookingSurface";
import { getBookPath } from "@/utils/localizedRoutes";
import { getPrivateRoomsPath } from "@/utils/privateRoomPaths";

type Props = {
  lang: AppLanguage;
};

const CURRENT_DEALS_ID = "current-deals";
const DIRECT_BOOKING_PERKS_ID = "direct-booking-perks";
const FALLBACK_DEALS_TITLE = "Deals & Offers";
const FALLBACK_DEALS_SUBTITLE = "Auto-applied at checkout. Direct bookings only.";
const FALLBACK_EMPTY_SUBTITLE = "Book direct for the best rate and perks.";

type DealEntry = {
  deal: (typeof DEALS)[number];
  status: ReturnType<typeof getDealStatus>;
};

type PageCopy = {
  title: string;
  subtitle: string;
};

type DealStatus = "active" | "upcoming" | "expired";

type DealGridSectionProps = {
  heading: string;
  lang: AppLanguage;
  entries: DealEntry[];
  translate: ReturnType<typeof useDealContent>["translate"];
  termsLabel: string;
  termsHref: string;
  onOpenBooking: ({ kind, dealId }: { kind: "deal" | "standard"; dealId?: string }) => void;
  referenceDate: Date;
  id?: string;
};

type DealListingsProps = {
  lang: AppLanguage;
  activeDeals: DealEntry[];
  upcomingDeals: DealEntry[];
  translate: ReturnType<typeof useDealContent>["translate"];
  termsLabel: string;
  termsHref: string;
  onOpenBooking: ({ kind, dealId }: { kind: "deal" | "standard"; dealId?: string }) => void;
  referenceDate: Date;
};

type RoutedDealOption = {
  href: string;
  resolvedIntent: "hostel" | "private";
  productType: string | null;
  decisionMode: "direct_resolution" | "chooser";
  destinationFunnel: "hostel_central" | "private";
};

type DealsPrimaryCtaModel = {
  title: string;
  subtitle: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    tone?: "outline";
  }>;
};

function appendDealParam(href: string, dealId?: string | null): string {
  if (!dealId) return href;
  const [pathname, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("deal", dealId);
  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function DealGridSection({
  heading,
  lang,
  entries,
  translate,
  termsLabel,
  termsHref,
  onOpenBooking,
  referenceDate,
  id,
}: DealGridSectionProps): JSX.Element {
  return (
    <Section id={id} padding="default">
      <h2 className="mb-6 text-2xl font-semibold text-brand-heading">{heading}</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {entries.map(({ deal, status }) => (
          <DealCard
            key={deal.id}
            deal={deal}
            status={status}
            lang={lang}
            translate={translate}
            termsLabel={termsLabel}
            termsHref={termsHref}
            onOpenBooking={onOpenBooking}
            referenceDate={referenceDate}
          />
        ))}
      </div>
    </Section>
  );
}

function DealListings({
  lang,
  activeDeals,
  upcomingDeals,
  translate,
  termsLabel,
  termsHref,
  onOpenBooking,
  referenceDate,
}: DealListingsProps): JSX.Element {
  return (
    <Fragment>
      {activeDeals.length > 0 && (
        <DealGridSection
          id={CURRENT_DEALS_ID}
          heading={(translate("sections.active") as string) || "Current Deals"}
          lang={lang}
          entries={activeDeals}
          translate={translate}
          termsLabel={termsLabel}
          termsHref={termsHref}
          onOpenBooking={onOpenBooking}
          referenceDate={referenceDate}
        />
      )}

      {upcomingDeals.length > 0 && (
        <DealGridSection
          heading={(translate("sections.upcoming") as string) || "Coming Soon"}
          lang={lang}
          entries={upcomingDeals}
          translate={translate}
          termsLabel={termsLabel}
          termsHref={termsHref}
          onOpenBooking={onOpenBooking}
          referenceDate={referenceDate}
        />
      )}
    </Fragment>
  );
}

function resolveHeadlineStatus(activeDeals: DealEntry[], upcomingDeals: DealEntry[]): DealStatus {
  if (activeDeals.length > 0) return "active";
  if (upcomingDeals.length > 0) return "upcoming";
  return "expired";
}

function resolvePercentToken({
  lang,
  percentLabel,
  percentNumberLabel,
}: {
  lang: AppLanguage;
  percentLabel: string;
  percentNumberLabel: string;
}): string {
  const titleTemplate = i18n.getResource(lang, "dealsPage", "title");
  const promoTemplate = i18n.getResource(lang, "dealsPage", "promo");
  const template = `${titleTemplate ?? ""} ${promoTemplate ?? ""}`;
  return typeof template === "string" && template.includes("%")
    ? percentNumberLabel
    : percentLabel;
}

function resolvePageCopy({
  status,
  t,
  percentLabel,
  dealFromLabel,
  dealToLabel,
  defaultTitle,
  defaultSubtitle,
}: {
  status: DealStatus;
  t: ReturnType<typeof useTranslation>["t"];
  percentLabel: string;
  dealFromLabel: string;
  dealToLabel: string;
  defaultTitle: string;
  defaultSubtitle: string;
}): PageCopy {
  if (status === "active") {
    const heroTitle = t("hero.activeTitle", {
      percent: percentLabel,
      defaultValue: defaultTitle,
    }) as string;
    const activeSubtitle = t("status.banner.active", {
      endDate: dealToLabel,
      defaultValue: defaultSubtitle,
    }) as string;

    return {
      title: heroTitle.trim().length > 0 ? heroTitle : defaultTitle,
      subtitle: activeSubtitle.trim().length > 0 ? activeSubtitle : defaultSubtitle,
    };
  }

  if (status === "upcoming") {
    const upcomingSubtitle = t("status.banner.upcoming", {
      startDate: dealFromLabel,
      defaultValue: defaultSubtitle,
    }) as string;
    return {
      title: defaultTitle,
      subtitle: upcomingSubtitle.trim().length > 0 ? upcomingSubtitle : defaultSubtitle,
    };
  }

  const expiredTitle = t("emptyState.title", { defaultValue: FALLBACK_DEALS_TITLE }) as string;
  const expiredSubtitle = t("emptyState.subtitle", {
    defaultValue: FALLBACK_EMPTY_SUBTITLE,
  }) as string;

  return {
    title: expiredTitle.trim().length > 0 ? expiredTitle : FALLBACK_DEALS_TITLE,
    subtitle: expiredSubtitle.trim().length > 0 ? expiredSubtitle : "",
  };
}

function buildDealsPrimaryCta(params: {
  bookingCopy: ReturnType<typeof buildIntentAwareBookingCopy>;
  bookingSurface: ReturnType<typeof resolveIntentAwareBookingSurface>;
  lang: AppLanguage;
  routeDealsSelection: (input: RoutedDealOption) => void;
}): DealsPrimaryCtaModel {
  const { bookingCopy, bookingSurface, lang, routeDealsSelection } = params;

  if (bookingSurface.mode === "direct") {
    const branch =
      bookingSurface.primary.resolvedIntent === "private"
        ? bookingCopy.direct.private
        : bookingCopy.direct.hostel;

    return {
      title: branch.heading,
      subtitle: branch.subcopy,
      actions: [
        {
          label: branch.primaryLabel,
          onClick: () => routeDealsSelection(bookingSurface.primary),
        },
        {
          label: branch.secondaryLabel,
          tone: "outline",
          onClick: () =>
            routeDealsSelection(
              bookingSurface.primary.resolvedIntent === "private"
                ? {
                    href: getBookPath(lang),
                    resolvedIntent: "hostel",
                    productType: null,
                    decisionMode: "chooser",
                    destinationFunnel: "hostel_central",
                  }
                : {
                    href: getPrivateRoomsPath(lang),
                    resolvedIntent: "private",
                    productType: null,
                    decisionMode: "chooser",
                    destinationFunnel: "private",
                  },
            ),
        },
      ],
    };
  }

  return {
    title: bookingCopy.chooser.heading,
    subtitle: bookingCopy.chooser.subcopy,
    actions: [
      {
        label: bookingCopy.chooser.primaryLabel,
        onClick: () => routeDealsSelection(bookingSurface.hostel),
      },
      {
        label: bookingCopy.chooser.secondaryLabel,
        tone: "outline",
        onClick: () => routeDealsSelection(bookingSurface.private),
      },
    ],
  };
}

function DealsPageContent({ lang }: Props) {
  const { t } = useTranslation("dealsPage", { lng: lang });
  const { t: tHeader } = useTranslation("header", { lng: lang });
  const router = useRouter();
  const currentAttribution = useEntryAttribution();
  usePagePreload({ lang, namespaces: ["dealsPage", "header", "_tokens"] });

  const { translate: ft, perks, labels } = useDealContent(lang);
  const openBooking = useCallback(
    ({ kind, dealId }: { kind: "deal" | "standard"; dealId?: string }) => {
      if (kind === "deal" && dealId) {
        // TC-02: fire select_promotion before navigating to /book?deal=ID
        const deal = DEALS.find((d) => d.id === dealId);
        fireSelectPromotion({
          promotion: {
            promotion_id: dealId,
            promotion_name: deal ? `${deal.discountPct}% off` : dealId,
          },
        });
        router.push(`${getBookPath(lang)}?deal=${encodeURIComponent(dealId)}`);
        return;
      }
      router.push(getBookPath(lang));
    },
    [router, lang]
  );

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const referenceDate = new Date(now);

  const dealsWithStatus = DEALS.map((deal): DealEntry => ({
    deal,
    status: getDealStatus(deal, referenceDate),
  }));

  // Get terms label and href for deal cards
  const termsLabel = typeof labels.termsLabel === "string" ? labels.termsLabel : "";
  const termsHref = `/${lang}/terms`;

  const activeDeals = dealsWithStatus.filter((entry) => entry.status === "active");
  const upcomingDeals = dealsWithStatus.filter((entry) => entry.status === "upcoming");
  const visibleDeals = useMemo(
    () => [...activeDeals, ...upcomingDeals],
    [activeDeals, upcomingDeals],
  );

  useEffect(() => {
    if (visibleDeals.length === 0) return;

    fireViewItemList({
      itemListId: "deals_index",
      rooms: visibleDeals.map(({ deal }) => ({ sku: deal.id })),
    });

    fireViewPromotion({
      promotions: visibleDeals.map(({ deal }) => ({
        promotion_id: deal.id,
        promotion_name: `${deal.discountPct}% off`,
      })),
    });
  }, [visibleDeals]);

  const headlineDeal = activeDeals[0]?.deal ?? upcomingDeals[0]?.deal ?? PRIMARY_DEAL;
  const headlineStatus = resolveHeadlineStatus(activeDeals, upcomingDeals);
  const activeDealId = headlineStatus === "active" ? headlineDeal.id : null;

  const percentValue = headlineDeal.discountPct;
  const percentLabel = formatPercent(lang, percentValue);
  const percentNumberLabel = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }).format(percentValue);
  const percentToken = resolvePercentToken({
    lang,
    percentLabel,
    percentNumberLabel,
  });
  const dealStart = isoDateToLocalStart(headlineDeal.startDate);
  const dealEnd = isoDateToLocalStart(headlineDeal.endDate);
  const includeYear = shouldIncludeYear(referenceDate, dealStart, dealEnd);
  const dealFromLabel = formatMonthDay(lang, dealStart, { includeYear });
  const dealToLabel = formatMonthDay(lang, dealEnd, { includeYear });

  const defaultTitle =
    (t("title", {
      percent: percentToken,
      from: dealFromLabel,
      to: dealToLabel,
      defaultValue: FALLBACK_DEALS_TITLE,
    }) as string) || FALLBACK_DEALS_TITLE;
  const defaultSubtitle =
    (t("promo", {
      percent: percentToken,
      defaultValue: FALLBACK_DEALS_SUBTITLE,
    }) as string) || FALLBACK_DEALS_SUBTITLE;

  const pageCopy = resolvePageCopy({
    status: headlineStatus,
    t,
    percentLabel,
    dealFromLabel,
    dealToLabel,
    defaultTitle,
    defaultSubtitle,
  });
  const bookingSurface = useMemo(
    () => resolveIntentAwareBookingSurface(lang, currentAttribution, { dealId: activeDealId }),
    [activeDealId, currentAttribution, lang],
  );
  const dormsLabel = (tHeader("rooms", { defaultValue: "Dorms" }) as string) || "Dorms";
  const privateBookingLabel =
    (tHeader("navChildren.apartment.bookPrivate", {
      defaultValue: "Book private accommodations",
    }) as string) || "Book private accommodations";
  const bookingCopy = useMemo(
    () => buildIntentAwareBookingCopy({ dormsLabel, privateBookingLabel }),
    [dormsLabel, privateBookingLabel],
  );
  const routeDealsSelection = useCallback((input: RoutedDealOption) => {
    const nextHref =
      input.resolvedIntent === "hostel"
        ? appendDealParam(input.href, activeDealId)
        : input.href;

    writeAttribution({
      source_surface: "deals_page",
      source_cta: "deals_primary_cta",
      resolved_intent: input.resolvedIntent,
      product_type: input.productType,
      decision_mode: input.decisionMode,
      destination_funnel: input.destinationFunnel,
      locale: lang,
      fallback_triggered: false,
      next_page: nextHref,
    });

    router.push(nextHref);
  }, [activeDealId, lang, router]);
  const dealsPrimaryCta = useMemo(
    () => buildDealsPrimaryCta({ bookingCopy, bookingSurface, lang, routeDealsSelection }),
    [bookingCopy, bookingSurface, lang, routeDealsSelection],
  );

  return (
    <Fragment>
      <DealsStructuredData />

      {/* Hero Section */}
      <Section padding="default" className="text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl lg:text-5xl">
          {pageCopy.title}
        </h1>
        {pageCopy.subtitle && (
          <p className="mx-auto max-w-2xl text-lg text-brand-text/80">{pageCopy.subtitle}</p>
        )}
      </Section>

      <DealListings
        lang={lang}
        activeDeals={activeDeals}
        upcomingDeals={upcomingDeals}
        translate={ft}
        termsLabel={termsLabel}
        termsHref={termsHref}
        onOpenBooking={openBooking}
        referenceDate={referenceDate}
      />

      <DealsPerksSection
        sectionId={DIRECT_BOOKING_PERKS_ID}
        heading={labels.perksHeading || "Direct booking perks"}
        perks={perks}
      />

      <DealsPrimaryCtaSection
        sectionId={HEADER_BOOKING_OPTIONS_ID}
        title={dealsPrimaryCta.title}
        subtitle={dealsPrimaryCta.subtitle}
        actions={dealsPrimaryCta.actions}
      />
    </Fragment>
  );
}

export default memo(DealsPageContent);
