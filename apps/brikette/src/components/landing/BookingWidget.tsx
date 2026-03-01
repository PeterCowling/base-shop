// src/components/landing/BookingWidget.tsx
"use client";

import { memo, type Ref, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

import { Section } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/primitives";
import { resolvePrimaryCtaLabel } from "@acme/ui/shared";

import type { DateRange } from "@/components/booking/DateRangePicker";
import { DateRangePicker } from "@/components/booking/DateRangePicker";
import type { AppLanguage } from "@/i18n.config";
import { Minus, Plus } from "@/icons";
import {
  isValidPax,
  isValidStayRange,
} from "@/utils/bookingDateRules";
import { hydrateBookingSearch, persistBookingSearch } from "@/utils/bookingSearch";
import { formatDate, formatDisplayDate, safeParseIso } from "@/utils/dateUtils";
import { fireCtaClick } from "@/utils/ga4-events";

/* i18n-exempt -- DX-452 [ttl=2026-12-31] Form field ids are non-UI tokens. */
const BOOKING_GUESTS_ID = "booking-guests";


type BookingWidgetProps = {
  lang?: AppLanguage;
  sectionRef?: Ref<HTMLElement>;
  onDatesChange?: (payload: {
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => void;
};

const BookingWidget = memo(function BookingWidget({
  lang,
  sectionRef,
  onDatesChange,
}: BookingWidgetProps): JSX.Element {
  const router = useRouter();
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t: tModals } = useTranslation("modals", translationOptions);
  const { t: tTokens } = useTranslation("_tokens", translationOptions);
  const { t: tLanding } = useTranslation("landingPage", translationOptions);
  const hasHydrated = useRef(false);

  const [range, setRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [guests, setGuests] = useState(1);
  const [showError, setShowError] = useState(false);
  const checkIn = range.from ? formatDate(range.from) : "";
  const checkOut = range.to ? formatDate(range.to) : "";

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    if (typeof window === "undefined") return;

    const hydrated = hydrateBookingSearch(new URLSearchParams(window.location.search));
    if (!hydrated.search) return;
    setRange({
      from: safeParseIso(hydrated.search.checkin),
      to: safeParseIso(hydrated.search.checkout),
    });
    setGuests(hydrated.search.pax);
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;
    if (!checkIn || !checkOut) return;
    const timer = window.setTimeout(() => {
      persistBookingSearch({ checkin: checkIn, checkout: checkOut, pax: guests });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [checkIn, checkOut, guests]);

  useEffect(() => {
    if (!hasHydrated.current) return;
    onDatesChange?.({ checkIn, checkOut, guests });
  }, [checkIn, checkOut, guests, onDatesChange]);

  const invalidRange = (() => {
    if (!checkIn || !checkOut) return false;
    return !isValidStayRange(checkIn, checkOut) || !isValidPax(guests);
  })();

  const fallbackAvailabilityLabel = tModals("booking.buttonAvailability") as string;
  const checkAvailabilityLabel =
    resolvePrimaryCtaLabel(tTokens, {
      fallback: () => fallbackAvailabilityLabel,
    }) ?? fallbackAvailabilityLabel;

  const handleDecrementGuests = useCallback(() => {
    setGuests((g) => Math.max(1, g - 1));
  }, []);

  const handleIncrementGuests = useCallback(() => {
    setGuests((g) => Math.min(8, g + 1));
  }, []);

  const handleSubmit = useCallback(() => {
    if (invalidRange) {
      setShowError(true);
      return;
    }
    fireCtaClick({ ctaId: "booking_widget_check_availability", ctaLocation: "home_booking_widget" });
    const effectiveLang = lang ?? "en";
    const params = new URLSearchParams();
    if (checkIn) params.set("checkin", checkIn);
    if (checkOut) params.set("checkout", checkOut);
    params.set("pax", String(guests));
    if (checkIn && checkOut) {
      persistBookingSearch({ checkin: checkIn, checkout: checkOut, pax: guests });
    }
    const qs = params.toString();
    router.push(`/${effectiveLang}/book${qs ? `?${qs}` : ""}`);
  }, [checkIn, checkOut, guests, invalidRange, lang, router]);

  const errorMessage = tLanding("bookingWidget.invalidDateRange") as string;

  return (
    <section
      id="booking"
      ref={sectionRef}
      className="relative -translate-y-4 scroll-mt-24 sm:-translate-y-8 lg:-translate-y-10"
    >
      <Section as="div" padding="none" className="mx-auto max-w-2xl px-4">
        <div className="rounded-2xl border border-brand-outline/20 bg-brand-bg p-3 shadow-xl dark:bg-brand-surface dark:border-white/10">
          <div className="space-y-3 lg:flex lg:items-stretch lg:gap-6 lg:space-y-0">
            <DateRangePicker
              selected={range}
              onRangeChange={(r) => setRange(r ?? { from: undefined, to: undefined })}
              stayHelperText={tModals("date.stayHelper") as string}
              clearDatesText={tModals("date.clearDates") as string}
              checkInLabelText={tModals("booking.checkInLabel") as string}
              checkOutLabelText={tModals("booking.checkOutLabel") as string}
              lang={lang}
              className="lg:shrink-0"
            />
            <div className="flex flex-col items-center gap-3 lg:flex-none lg:w-52">
              {/* Selected date summary — desktop only (mobile uses the calendar's own summary bar) */}
              <div className="hidden w-full lg:flex lg:flex-col lg:gap-2">
                <div className="flex flex-col gap-1 rounded-xl border border-brand-outline/20 bg-brand-surface px-3 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-text/50">
                    {tModals("booking.checkInLabel") as string}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-brand-heading">
                    {range.from ? formatDisplayDate(range.from) : <span className="text-brand-text/30">—</span>}
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-xl border border-brand-outline/20 bg-brand-surface px-3 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-text/50">
                    {tModals("booking.checkOutLabel") as string}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-brand-heading">
                    {range.to ? formatDisplayDate(range.to) : <span className="text-brand-text/30">—</span>}
                  </span>
                </div>
              </div>

              {/* Spacer pushes guests + button to bottom on desktop */}
              <div className="hidden lg:block lg:flex-1" />

              <div className="flex w-full flex-col gap-1.5">
                <span
                  id={`${BOOKING_GUESTS_ID}-label`}
                  className="text-sm font-semibold text-brand-heading"
                >
                  {tModals("booking.guestsLabel")}
                </span>
                <div
                  role="group"
                  aria-labelledby={`${BOOKING_GUESTS_ID}-label`}
                  className="flex items-center overflow-hidden rounded-xl border border-brand-outline/40 bg-brand-surface shadow-sm dark:bg-brand-surface"
                >
                  <button
                    type="button"
                    onClick={handleDecrementGuests}
                    disabled={guests <= 1}
                    aria-label="Remove one guest"
                    className="flex min-h-11 min-w-11 items-center justify-center text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="size-4" aria-hidden />
                  </button>
                  <span
                    aria-live="polite"
                    aria-atomic="true"
                    className="flex-1 select-none text-center text-sm font-semibold tabular-nums text-brand-heading"
                  >
                    {guests}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrementGuests}
                    disabled={guests >= 8}
                    aria-label="Add one guest"
                    className="flex min-h-11 min-w-11 items-center justify-center text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleSubmit}
                color="accent"
                tone="solid"
                size="lg"
                className="w-full rounded-full bg-brand-secondary text-brand-on-accent hover:bg-brand-primary hover:text-brand-on-primary focus-visible:ring-brand-secondary"
              >
                {checkAvailabilityLabel}
              </Button>
            </div>
          </div>
          {showError ? (
            <p className="mt-3 text-sm text-brand-bougainvillea" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
      </Section>
    </section>
  );
});

export default BookingWidget;
