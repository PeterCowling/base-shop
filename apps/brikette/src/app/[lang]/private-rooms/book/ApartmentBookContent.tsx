"use client";

// src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx
// Client component for apartment booking page
import type React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

import { Section } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";

import FitCheck from "@/components/apartment/FitCheck";
import { BookingCalendarPanel } from "@/components/booking/BookingCalendarPanel";
import type { DateRange } from "@/components/booking/DateRangePicker";
import PolicyFeeClarityPanel from "@/components/booking/PolicyFeeClarityPanel";
import { buildWhatsappMessageUrl } from "@/config/hotel";
import { BOOKING_CODE } from "@/context/modal/constants";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { resolveBookingControlLabels } from "@/utils/bookingControlLabels";
import { countNights, formatDate, getDatePlusTwoDays, getTodayIso, safeParseIso } from "@/utils/dateUtils";
import type { EntryAttributionPayload } from "@/utils/entryAttribution";
import { readAttribution } from "@/utils/entryAttribution";
import { createBrikClickId, fireWhatsappClick } from "@/utils/ga4-events";
import { getPrivateBookingPath } from "@/utils/localizedRoutes";
import { buildOctorateCalendarUrl } from "@/utils/octorateLinks";
import { trackThenNavigate } from "@/utils/trackThenNavigate";

type Props = {
  lang: AppLanguage;
};

const APARTMENT_BOOKING_RETURN_KEY = "apartment_booking_return";

function buildWhatsappUrl(checkin: string, checkout: string): string {
  return buildWhatsappMessageUrl(
    `Hi, I'm interested in staying at the Brikette apartment. Could you tell me about availability for ${checkin} to ${checkout}?`,
  );
}

const APARTMENT_RATE_CODES = {
  nr:   { 2: "804934", 3: "805559" },
  flex: { 2: "804933", 3: "805578" },
} as const;

function buildOctorateLink(
  checkin: string,
  checkout: string,
  plan: "flex" | "nr",
  pax: 2 | 3
): string {
  return buildOctorateCalendarUrl({
    codice: BOOKING_CODE,
    checkin,
    checkout,
    pax,
    room: APARTMENT_RATE_CODES[plan][pax],
    utm_source: "site",
    utm_medium: "cta",
    utm_campaign: `apartment_${plan}_${pax}pax`,
  });
}

function buildAttributionFields(attribution: EntryAttributionPayload | null): Record<string, unknown> {
  if (!attribution) return {};
  return {
    entry_source_surface: attribution.source_surface,
    entry_source_cta: attribution.source_cta,
    entry_resolved_intent: attribution.resolved_intent,
    ...(attribution.product_type !== null ? { entry_product_type: attribution.product_type } : {}),
    entry_decision_mode: attribution.decision_mode,
    entry_destination_funnel: attribution.destination_funnel,
    entry_locale: attribution.locale,
    entry_fallback_triggered: attribution.fallback_triggered,
  };
}

function ApartmentBookContent({ lang }: Props) {
  const { t } = useTranslation("apartmentPage", { lng: lang });
  const { t: tBook } = useTranslation("bookPage", { lng: lang });
  const { t: tRooms } = useTranslation("roomsPage", { lng: lang });
  const { t: tModals } = useTranslation("modals", { lng: lang });
  const bookingControlLabels = resolveBookingControlLabels(tBook, tRooms, tModals);

  usePagePreload({ lang, namespaces: ["apartmentPage", "bookPage", "footer", "modals", "translation"] });

  const [range, setRange] = useState<DateRange>({
    from: safeParseIso(getTodayIso()),
    to: safeParseIso(getDatePlusTwoDays(getTodayIso())),
  });
  const [pax, setPax] = useState<2 | 3>(2);

  const checkinIso = range.from ? formatDate(range.from) : "";
  const checkoutIso = range.to ? formatDate(range.to) : "";

  // Option A: restore dates if user returns from Octorate (TASK-09 / spike-octorate-precheck)
  useEffect(() => {
    const stored = sessionStorage.getItem(APARTMENT_BOOKING_RETURN_KEY);
    if (!stored) return;
    try {
      const data = JSON.parse(stored) as { checkin?: string; checkout?: string };
      setRange({
        from: data.checkin ? safeParseIso(data.checkin) : undefined,
        to: data.checkout ? safeParseIso(data.checkout) : undefined,
      });
    } catch {
      // ignore malformed data
    }
    sessionStorage.removeItem(APARTMENT_BOOKING_RETURN_KEY);
  }, []);

  // Derive nights and long-stay flag reactively from date state (TZ-safe via Date objects)
  const nights = range.from && range.to ? countNights(range.from, range.to) : 1;
  const isLongStay = nights > 14;
  const isValidRange = Boolean(checkinIso && checkoutIso);

  const handleCheckout = useCallback((plan: "flex" | "nr") => {
    if (!checkinIso || !checkoutIso) return;
    const octorateUrl = buildOctorateLink(checkinIso, checkoutIso, plan, pax);

    // Compat: begin_checkout kept during migration window (TASK-05B will decide cleanup policy).
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof win.gtag === "function") {
      win.gtag("event", "begin_checkout", {
        currency: "EUR",
        value: nights * 265,
        items: [
          {
            item_id: "apartment",
            item_name: "apartment",
            item_category: plan,
            price: 265,
            quantity: nights,
          },
        ],
      });
    }

    // Read entry attribution carrier written at CTA click on private summary page.
    const attributionFields = buildAttributionFields(readAttribution());

    // Store booking state before navigation so we can restore on return (Option A — TASK-09)
    sessionStorage.setItem(
      APARTMENT_BOOKING_RETURN_KEY,
      JSON.stringify({ checkin: checkinIso, checkout: checkoutIso, plan }),
    );

    // Canonical handoff event. Beacon transport ensures delivery before same-tab navigation.
    trackThenNavigate(
      "handoff_to_engine",
      {
        handoff_mode: "same_tab",
        engine_endpoint: "calendar",
        checkin: checkinIso,
        checkout: checkoutIso,
        pax,
        rate_plan: plan,
        room_id: "apartment",
        source_route: getPrivateBookingPath(lang),
        cta_location: `apartment_${plan}_cta`,
        brik_click_id: createBrikClickId(),
        ...attributionFields,
      },
      () => { window.location.assign(octorateUrl); },
    );
  }, [checkinIso, checkoutIso, lang, nights, pax]);

  const handleWhatsappClick = useCallback(() => {
    fireWhatsappClick({
      placement: "apartment_book",
      prefill_present: true,
    });
  }, []);

  return (
    <Section padding="default" className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-bold text-brand-heading">{tBook("apartment.heading")}</h1>
      <p className="text-lg text-brand-text/80">{tBook("apartment.subheading")}</p>

      <div className="mt-8 space-y-6">
        {/* Date Selection */}
        <div className="rounded-xl border border-brand-outline/40 bg-brand-surface p-6 shadow-sm dark:border-white/30">
          <div className="mb-4 flex items-center gap-3">
            <Inline gap={0} wrap={false} className="size-6 shrink-0 justify-center rounded-full bg-brand-primary text-xs font-bold text-brand-on-primary" aria-hidden>1</Inline>
            <h2 className="text-lg font-semibold text-brand-heading">
              {tModals("booking2.selectDatesTitle")}
            </h2>
          </div>
          <BookingCalendarPanel
            lang={lang}
            range={range}
            onRangeChange={(r) => setRange(r ?? { from: undefined, to: undefined })}
            pax={pax}
            onPaxChange={(next) => setPax(next === 3 ? 3 : 2)}
            minPax={2}
            maxPax={3}
            labels={{
              stayHelper: tModals("date.stayHelper") as string,
              clearDates: tModals("date.clearDates") as string,
              checkIn: tModals("booking.checkInLabel") as string,
              checkOut: tModals("booking.checkOutLabel") as string,
              guests: tBook("apartment.guestLabel") as string,
              decreaseGuests: bookingControlLabels.decreaseGuestsAriaLabel,
              increaseGuests: bookingControlLabels.increaseGuestsAriaLabel,
            }}
          />
          <p className="mt-3 text-sm text-brand-text/60">
            {tBook("apartment.nightsSummary", { count: nights })}
          </p>
        </div>

        {/* Rate Options */}
        <div className="rounded-xl border border-brand-outline/40 bg-brand-surface p-6 shadow-sm dark:border-white/30">
          <div className="mb-4 flex items-center gap-3">
            <Inline gap={0} wrap={false} className="size-6 shrink-0 justify-center rounded-full bg-brand-primary text-xs font-bold text-brand-on-primary" aria-hidden>2</Inline>
            <h2 className="text-lg font-semibold text-brand-heading">
              {tBook("apartment.rateLabel")}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Non-Refundable card */}
            <button
              type="button"
              onClick={() => handleCheckout("nr")}
              disabled={!isValidRange}
              className="group flex min-h-11 min-w-11 flex-col rounded-lg border border-brand-outline/30 bg-brand-bg text-start transition-all hover:border-brand-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-brand-heading">{tBook("apartment.nr.title")}</h3>
                  <span className="shrink-0 rounded-full bg-brand-secondary px-2 py-0.5 text-xs font-semibold text-brand-on-accent">
                    {tBook("apartment.nr.saving")}
                  </span>
                </div>
                <ul className="list-disc ps-5 text-sm text-brand-text/70">
                  <li>{tBook("apartment.nr.bullets.0")}</li>
                  <li>{tBook("apartment.nr.bullets.1")}</li>
                </ul>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-b-lg border-t border-brand-outline/20 bg-brand-primary/10 px-4 py-3 transition-colors group-hover:bg-brand-primary">
                <span className="text-sm font-semibold text-brand-primary group-hover:text-brand-on-primary">
                  {tBook("apartment.cta.nr")}
                </span>
                <ArrowRight size={15} className="shrink-0 text-brand-primary group-hover:text-brand-on-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
              </div>
            </button>

            {/* Flexible card */}
            <button
              type="button"
              onClick={() => handleCheckout("flex")}
              disabled={!isValidRange}
              className="group flex min-h-11 min-w-11 flex-col rounded-lg border border-brand-outline/30 bg-brand-bg text-start transition-all hover:border-brand-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-brand-heading">{tBook("apartment.flex.title")}</h3>
                  <span className="shrink-0 rounded-full bg-brand-secondary px-2 py-0.5 text-xs font-semibold text-brand-on-accent">
                    {tBook("apartment.flex.saving")}
                  </span>
                </div>
                <ul className="list-disc ps-5 text-sm text-brand-text/70">
                  <li>{tBook("apartment.flex.bullets.0")}</li>
                  <li>{tBook("apartment.flex.bullets.1")}</li>
                </ul>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-b-lg border-t border-brand-outline/20 bg-brand-primary/10 px-4 py-3 transition-colors group-hover:bg-brand-primary">
                <span className="text-sm font-semibold text-brand-primary group-hover:text-brand-on-primary">
                  {tBook("apartment.cta.flex")}
                </span>
                <ArrowRight size={15} className="shrink-0 text-brand-primary group-hover:text-brand-on-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
              </div>
            </button>
          </div>
        </div>

        {/* Fit Check */}
        <FitCheck lang={lang} />

        <PolicyFeeClarityPanel lang={lang} variant="apartment" />

        {/* WhatsApp fallback */}
        <div className="flex flex-col gap-3">
          <a
            data-testid="whatsapp-cta"
            data-long-stay-primary={isLongStay ? "true" : undefined}
            href={buildWhatsappUrl(checkinIso, checkoutIso)}
            onClick={handleWhatsappClick}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-brand-outline bg-brand-surface px-6 py-3 text-base font-semibold text-brand-primary shadow-sm transition-colors hover:bg-brand-surface/80 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-brand-primary focus-visible:focus:ring-offset-2 dark:border-white/30"
          >
            {t("book.whatsappCta")}
          </a>
        </div>
      </div>
    </Section>
  );
}

export default memo(ApartmentBookContent);
