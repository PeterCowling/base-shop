"use client";

// src/app/[lang]/deals/DealsPageContent.tsx
// Client component for deals page
import { Fragment, memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { ChevronDown } from "lucide-react";

import { Button } from "@acme/design-system/primitives";
import { Grid, Section } from "@acme/ui/atoms";

import DealsStructuredData from "@/components/seo/DealsStructuredData";
import { Cluster, Inline, InlineItem, Stack } from "@/components/ui/flex";
import { useOptionalModal } from "@/context/ModalContext";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { formatDateRange, formatPercent, isoDateToLocalStart } from "@/routes/deals/dates";
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
  usePagePreload({ lang, namespaces: ["dealsPage"] });

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

  const pageTitle = (ft("hero.title") as string) || "Deals & Offers";
  const pageSubtitle = (ft("hero.subtitle") as string) || "";

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
          <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
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
          </Grid>
        </Section>
      )}

      {/* Upcoming Deals */}
      {upcomingDeals.length > 0 && (
        <Section padding="default">
          <h2 className="mb-6 text-2xl font-semibold text-brand-heading">
            {(ft("sections.upcoming") as string) || "Coming Soon"}
          </h2>
          <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
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
          </Grid>
        </Section>
      )}

      {/* Direct Booking Perks */}
      <Section id={DIRECT_BOOKING_PERKS_ID} padding="default" className="bg-brand-surface">
        <h2 className="mb-6 text-center text-2xl font-semibold text-brand-heading">
          {(ft("perks.title") as string) || "Why Book Direct"}
        </h2>
        <Grid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
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
        </Grid>
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
              <Grid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
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
              </Grid>
            </div>
          )}
        </Section>
      )}

      {/* CTA */}
      <Section padding="default" className="text-center">
        <Button onClick={() => openBooking({ kind: "standard" })} size="md">
          {(ft("cta.book") as string) || "Book Now"}
        </Button>
      </Section>
    </Fragment>
  );
}

export default memo(DealsPageContent);
