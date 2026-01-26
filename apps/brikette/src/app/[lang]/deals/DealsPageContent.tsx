"use client";

// src/app/[lang]/deals/DealsPageContent.tsx
// Client component for deals page
import { Fragment, memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

import { Button } from "@acme/design-system/primitives";
import { Section } from "@acme/design-system/atoms";

import DealsStructuredData from "@/components/seo/DealsStructuredData";
import { Cluster, Inline, InlineItem, Stack } from "@/components/ui/flex";
import { useOptionalModal } from "@/context/ModalContext";
import { usePagePreload } from "@/hooks/usePagePreload";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { formatMonthDay, formatPercent, isoDateToLocalStart, shouldIncludeYear } from "@/routes/deals/dates";
import DealCard from "@/routes/deals/DealCard";
import { DEALS, PRIMARY_DEAL } from "@/routes/deals/deals";
import { getDealStatus } from "@/routes/deals/status";
import { useDealContent } from "@/routes/deals/useDealContent";

type Props = {
  lang: AppLanguage;
};

const CURRENT_DEALS_ID = "current-deals";
const EXPIRED_DEALS_PANEL_ID = "expired-deals-panel";
const DIRECT_BOOKING_PERKS_ID = "direct-booking-perks";

function DealsPageContent({ lang }: Props) {
  const { t } = useTranslation("dealsPage", { lng: lang });
  const { openModal } = useOptionalModal();
  usePagePreload({ lang, namespaces: ["dealsPage", "_tokens"] });

  const { translate: ft, perks, labels } = useDealContent(lang);
  const checkAvailabilityCta =
    labels.checkAvailabilityLabel && labels.checkAvailabilityLabel !== "checkAvailability"
      ? labels.checkAvailabilityLabel
      : "Check Availability";
  const perksLinkLabel = typeof labels.perksLinkLabel === "string" ? labels.perksLinkLabel : "";

  const openBooking = useCallback(
    ({ kind, dealId }: { kind: "deal" | "standard"; dealId?: string }) => {
      if (kind === "deal" && dealId) {
        openModal("booking", { deal: dealId });
        return;
      }
      openModal("booking");
    },
    [openModal]
  );

  const openOffers = useCallback(() => openModal("offers"), [openModal]);

  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const referenceDate = new Date(now);

  const dealsWithStatus = DEALS.map((deal) => ({
    deal,
    status: getDealStatus(deal, referenceDate),
  }));

  // Get terms label and href for deal cards
  const termsLabel = typeof labels.termsLabel === "string" ? labels.termsLabel : "";
  const termsHref = `/${lang}/terms`;

  const activeDeals = dealsWithStatus.filter((entry) => entry.status === "active");
  const upcomingDeals = dealsWithStatus.filter((entry) => entry.status === "upcoming");
  const expiredDeals = dealsWithStatus.filter((entry) => entry.status === "expired");

  const [showExpired, setShowExpired] = useState(false);

  const percentValue = PRIMARY_DEAL.discountPct;
  const percentLabel = formatPercent(lang, percentValue);
  const percentNumberLabel = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 }).format(percentValue);
  const percentToken = (() => {
    const titleTemplate = i18n.getResource(lang, "dealsPage", "title");
    const promoTemplate = i18n.getResource(lang, "dealsPage", "promo");
    const template = `${titleTemplate ?? ""} ${promoTemplate ?? ""}`;
    return typeof template === "string" && template.includes("%") ? percentNumberLabel : percentLabel;
  })();
  const dealStart = isoDateToLocalStart(PRIMARY_DEAL.startDate);
  const dealEnd = isoDateToLocalStart(PRIMARY_DEAL.endDate);
  const includeYear = shouldIncludeYear(referenceDate, dealStart, dealEnd);
  const dealFromLabel = formatMonthDay(lang, dealStart, { includeYear });
  const dealToLabel = formatMonthDay(lang, dealEnd, { includeYear });

  const heroTitle = t("hero.activeTitle", { percent: percentLabel, defaultValue: "" }) as string;
  const heroSubtitle = t("hero.activeSubtitle", { percent: percentLabel, defaultValue: "" }) as string;
  const defaultTitle =
    (t("title", {
      percent: percentToken,
      from: dealFromLabel,
      to: dealToLabel,
      defaultValue: "Deals & Offers",
    }) as string) || "Deals & Offers";
  const defaultSubtitle =
    (t("promo", {
      percent: percentToken,
      defaultValue: "Auto-applied at checkout. Direct bookings only.",
    }) as string) || "Auto-applied at checkout. Direct bookings only.";

  const pageTitle = heroTitle.trim().length > 0 ? heroTitle : defaultTitle;
  const pageSubtitle = heroSubtitle.trim().length > 0 ? heroSubtitle : defaultSubtitle;

  return (
    <Fragment>
      <DealsStructuredData />

      {/* Hero Section */}
      <Section padding="default" className="text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl lg:text-5xl">
          {pageTitle}
        </h1>
        {pageSubtitle && (
          <p className="mx-auto max-w-2xl text-lg text-brand-text/80">{pageSubtitle}</p>
        )}
      </Section>

      {/* Active Deals */}
      {activeDeals.length > 0 && (
        <Section id={CURRENT_DEALS_ID} padding="default">
          <h2 className="mb-6 text-2xl font-semibold text-brand-heading">
            {(ft("sections.active") as string) || "Current Deals"}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeDeals.map(({ deal, status }) => (
              <DealCard
                key={deal.id}
                deal={deal}
                status={status}
                lang={lang}
                translate={ft}
                termsLabel={termsLabel}
                termsHref={termsHref}
                onOpenBooking={openBooking}
                referenceDate={referenceDate}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Upcoming Deals */}
      {upcomingDeals.length > 0 && (
        <Section padding="default">
          <h2 className="mb-6 text-2xl font-semibold text-brand-heading">
            {(ft("sections.upcoming") as string) || "Coming Soon"}
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingDeals.map(({ deal, status }) => (
              <DealCard
                key={deal.id}
                deal={deal}
                status={status}
                lang={lang}
                translate={ft}
                termsLabel={termsLabel}
                termsHref={termsHref}
                onOpenBooking={openBooking}
                referenceDate={referenceDate}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Direct Booking Perks */}
      <Section id={DIRECT_BOOKING_PERKS_ID} padding="default" className="bg-brand-surface">
        <h2 className="mb-6 text-center text-2xl font-semibold text-brand-heading">
          {labels.perksHeading || "Direct booking perks"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((perk, index) => (
            <div
              key={index}
              className="flex flex-col items-center rounded-lg border border-brand-outline/20 bg-brand-bg p-4 text-center"
            >
              <h3 className="font-medium text-brand-heading">{perk.title}</h3>
              {perk.subtitle && (
                <p className="mt-1 text-sm text-brand-text/70">{perk.subtitle}</p>
              )}
            </div>
          ))}
          </div>
      </Section>

      {/* Expired Deals (collapsible) */}
      {expiredDeals.length > 0 && (
        <Section padding="default">
          <button
            type="button"
            onClick={() => setShowExpired(!showExpired)}
            aria-expanded={showExpired}
            aria-controls={EXPIRED_DEALS_PANEL_ID}
            className="flex w-full items-center justify-between text-start"
          >
            <h2 className="text-xl font-semibold text-brand-heading">
        {(ft("sections.expired") as string) || "Past Deals"}
            </h2>
            <ChevronDown
              className={clsx(
                "h-5 w-5 text-brand-text/60 transition-transform",
                showExpired && "rotate-180"
              )}
            />
          </button>
          {showExpired && (
            <div id={EXPIRED_DEALS_PANEL_ID} className="mt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {expiredDeals.map(({ deal, status }) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    status={status}
                    lang={lang}
                    translate={ft}
                    termsLabel={termsLabel}
                    termsHref={termsHref}
                    onOpenBooking={openBooking}
                    referenceDate={referenceDate}
                  />
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* CTA */}
      <Section padding="default" className="text-center">
        <Button onClick={() => openBooking({ kind: "standard" })} size="md">
          {checkAvailabilityCta}
        </Button>
      </Section>
    </Fragment>
  );
}

export default memo(DealsPageContent);
