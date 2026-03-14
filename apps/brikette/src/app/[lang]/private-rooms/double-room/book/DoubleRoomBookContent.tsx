"use client";

// apps/brikette/src/app/[lang]/private-rooms/double-room/book/DoubleRoomBookContent.tsx
// Client component for the double private room booking page.
// Separate endpoint from the apartment booking page (TASK-12a decision: Option B).
// Rate codes: NR=433883, flex=433894. Pax fixed at 2.

import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

import { Section } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";

import { BookingCalendarPanel } from "@/components/booking/BookingCalendarPanel";
import type { DateRange } from "@/components/booking/DateRangePicker";
import PolicyFeeClarityPanel from "@/components/booking/PolicyFeeClarityPanel";
import { buildWhatsappMessageUrl } from "@/config/hotel";
import { BOOKING_CODE } from "@/context/modal/constants";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { resolveBookingControlLabels } from "@/utils/bookingControlLabels";
import { countNights, formatDate, getDatePlusTwoDays, getTodayIso, safeParseIso } from "@/utils/dateUtils";
import { readAttribution } from "@/utils/entryAttribution";
import { createBrikClickId } from "@/utils/ga4-events";
import { getDoubleRoomBookingPath } from "@/utils/localizedRoutes";
import { buildOctorateCalendarUrl } from "@/utils/octorateLinks";
import { trackThenNavigate } from "@/utils/trackThenNavigate";

type Props = {
  lang: AppLanguage;
};

const DOUBLE_ROOM_BOOKING_RETURN_KEY = "double_room_booking_return";

// Rate codes for the double private room (separate from apartment, TASK-12a).
const DOUBLE_ROOM_RATE_CODES = {
  nr: "433883",
  flex: "433894",
} as const;

function buildWhatsappUrl(checkin: string, checkout: string): string {
  return buildWhatsappMessageUrl(
    `Hi, I'm interested in booking the private double room at Brikette. Could you tell me about availability for ${checkin} to ${checkout}?`,
  );
}

function buildOctorateLink(
  checkin: string,
  checkout: string,
  plan: "flex" | "nr",
): string {
  return buildOctorateCalendarUrl({
    codice: BOOKING_CODE,
    checkin,
    checkout,
    pax: 2, // double room — fixed occupancy
    room: DOUBLE_ROOM_RATE_CODES[plan],
    utm_source: "site",
    utm_medium: "cta",
    utm_campaign: `double_room_${plan}`,
  });
}

function DoubleRoomBookContent({ lang }: Props) {
  const { t: tBook } = useTranslation("bookPage", { lng: lang });
  const { t: tRooms } = useTranslation("roomsPage", { lng: lang });
  const { t: tModals } = useTranslation("modals", { lng: lang });
  const bookingControlLabels = resolveBookingControlLabels(tBook, tRooms, tModals);

  usePagePreload({ lang, namespaces: ["bookPage", "roomsPage", "footer", "modals", "translation"] });

  const [range, setRange] = useState<DateRange>({
    from: safeParseIso(getTodayIso()),
    to: safeParseIso(getDatePlusTwoDays(getTodayIso())),
  });

  const checkinIso = range.from ? formatDate(range.from) : "";
  const checkoutIso = range.to ? formatDate(range.to) : "";

  // Restore dates if user returns from Octorate.
  useEffect(() => {
    const stored = sessionStorage.getItem(DOUBLE_ROOM_BOOKING_RETURN_KEY);
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
    sessionStorage.removeItem(DOUBLE_ROOM_BOOKING_RETURN_KEY);
  }, []);

  const nights = range.from && range.to ? countNights(range.from, range.to) : 1;
  const isValidRange = Boolean(checkinIso && checkoutIso);

  const handleCheckout = useCallback((plan: "flex" | "nr") => {
    if (!checkinIso || !checkoutIso) return;
    const octorateUrl = buildOctorateLink(checkinIso, checkoutIso, plan);

    // Read entry attribution carrier written at CTA click on private summary page.
    const attribution = readAttribution();
    const attributionFields: Record<string, unknown> = attribution
      ? {
          entry_source_surface: attribution.source_surface,
          entry_source_cta: attribution.source_cta,
          entry_resolved_intent: attribution.resolved_intent,
          ...(attribution.product_type !== null ? { entry_product_type: attribution.product_type } : {}),
          entry_decision_mode: attribution.decision_mode,
          entry_destination_funnel: attribution.destination_funnel,
          entry_locale: attribution.locale,
          entry_fallback_triggered: attribution.fallback_triggered,
        }
      : {};

    sessionStorage.setItem(
      DOUBLE_ROOM_BOOKING_RETURN_KEY,
      JSON.stringify({ checkin: checkinIso, checkout: checkoutIso, plan }),
    );

    trackThenNavigate(
      "handoff_to_engine",
      {
        handoff_mode: "same_tab",
        engine_endpoint: "calendar",
        checkin: checkinIso,
        checkout: checkoutIso,
        pax: 2,
        rate_plan: plan,
        room_id: "double_room",
        source_route: getDoubleRoomBookingPath(lang),
        cta_location: "double_room_book_cta",
        brik_click_id: createBrikClickId(),
        ...attributionFields,
      },
      () => { window.location.assign(octorateUrl); },
    );
  }, [checkinIso, checkoutIso, lang]);

  return (
    <Section padding="default" className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-bold text-brand-heading">
        {tRooms("rooms.double_room.title") as string}
      </h1>
      <p className="text-lg text-brand-text/80">
        {tRooms("rooms.double_room.bed_description") as string}
      </p>

      <div className="mt-8 space-y-6">
        {/* Date Selection */}
        <div className="rounded-xl border border-brand-outline/40 bg-brand-surface p-6 shadow-sm dark:border-white/30">
          <div className="mb-4 flex items-center gap-3">
            <Inline gap={0} wrap={false} className="size-6 shrink-0 justify-center rounded-full bg-brand-primary text-xs font-bold text-brand-on-primary" aria-hidden>1</Inline>
            <h2 className="text-lg font-semibold text-brand-heading">
              {tModals("booking2.selectDatesTitle") as string}
            </h2>
          </div>
          <BookingCalendarPanel
            lang={lang}
            range={range}
            onRangeChange={(r) => setRange(r ?? { from: undefined, to: undefined })}
            pax={2}
            onPaxChange={() => {/* fixed pax, no-op */}}
            minPax={2}
            maxPax={2}
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
            {tBook("apartment.nightsSummary", { count: nights }) as string}
          </p>
        </div>

        {/* Rate Options */}
        <div className="rounded-xl border border-brand-outline/40 bg-brand-surface p-6 shadow-sm dark:border-white/30">
          <div className="mb-4 flex items-center gap-3">
            <Inline gap={0} wrap={false} className="size-6 shrink-0 justify-center rounded-full bg-brand-primary text-xs font-bold text-brand-on-primary" aria-hidden>2</Inline>
            <h2 className="text-lg font-semibold text-brand-heading">
              {tBook("apartment.rateLabel") as string}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Non-Refundable */}
            <button
              type="button"
              onClick={() => handleCheckout("nr")}
              disabled={!isValidRange}
              className="group flex min-h-11 min-w-11 flex-col rounded-lg border border-brand-outline/30 bg-brand-bg text-start transition-all hover:border-brand-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-brand-heading">{tBook("apartment.nr.title") as string}</h3>
                  <span className="shrink-0 rounded-full bg-brand-secondary px-2 py-0.5 text-xs font-semibold text-brand-on-accent">
                    {tBook("apartment.nr.saving") as string}
                  </span>
                </div>
                <ul className="list-disc ps-5 text-sm text-brand-text/70">
                  <li>{tBook("apartment.nr.bullets.0") as string}</li>
                  <li>{tBook("apartment.nr.bullets.1") as string}</li>
                </ul>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-b-lg border-t border-brand-outline/20 bg-brand-primary/10 px-4 py-3 transition-colors group-hover:bg-brand-primary">
                <span className="text-sm font-semibold text-brand-primary group-hover:text-brand-on-primary">
                  {tBook("apartment.cta.nr") as string}
                </span>
                <ArrowRight size={15} className="shrink-0 text-brand-primary group-hover:text-brand-on-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
              </div>
            </button>

            {/* Flexible */}
            <button
              type="button"
              onClick={() => handleCheckout("flex")}
              disabled={!isValidRange}
              className="group flex min-h-11 min-w-11 flex-col rounded-lg border border-brand-outline/30 bg-brand-bg text-start transition-all hover:border-brand-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-50"
            >
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-brand-heading">{tBook("apartment.flex.title") as string}</h3>
                  <span className="shrink-0 rounded-full bg-brand-secondary px-2 py-0.5 text-xs font-semibold text-brand-on-accent">
                    {tBook("apartment.flex.saving") as string}
                  </span>
                </div>
                <ul className="list-disc ps-5 text-sm text-brand-text/70">
                  <li>{tBook("apartment.flex.bullets.0") as string}</li>
                  <li>{tBook("apartment.flex.bullets.1") as string}</li>
                </ul>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-b-lg border-t border-brand-outline/20 bg-brand-primary/10 px-4 py-3 transition-colors group-hover:bg-brand-primary">
                <span className="text-sm font-semibold text-brand-primary group-hover:text-brand-on-primary">
                  {tBook("apartment.cta.flex") as string}
                </span>
                <ArrowRight size={15} className="shrink-0 text-brand-primary group-hover:text-brand-on-primary transition-transform group-hover:translate-x-0.5" aria-hidden />
              </div>
            </button>
          </div>
        </div>

        <PolicyFeeClarityPanel lang={lang} variant="apartment" />

        {/* WhatsApp fallback */}
        <div className="flex flex-col gap-3">
          <a
            href={buildWhatsappUrl(checkinIso, checkoutIso)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-brand-outline bg-brand-surface px-6 py-3 text-base font-semibold text-brand-primary shadow-sm transition-colors hover:bg-brand-surface/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 dark:border-white/30"
          >
            {tBook("whatsappCta") as string}
          </a>
        </div>
      </div>
    </Section>
  );
}

export default memo(DoubleRoomBookContent);
