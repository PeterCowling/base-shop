// src/components/landing/BookingWidget.tsx
"use client";

import { memo, type Ref, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

import { Section } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/primitives";
import { resolvePrimaryCtaLabel } from "@acme/ui/shared";

import { BookingCalendarPanel } from "@/components/booking/BookingCalendarPanel";
import type { DateRange } from "@/components/booking/DateRangePicker";
import type { AppLanguage } from "@/i18n.config";
import { resolveBookingControlLabels } from "@/utils/bookingControlLabels";
import {
  isValidPax,
  isValidStayRange,
} from "@/utils/bookingDateRules";
import { hydrateBookingSearch, persistBookingSearch } from "@/utils/bookingSearch";
import { formatDate, safeParseIso } from "@/utils/dateUtils";
import { fireCtaClick } from "@/utils/ga4-events";
import { resolveTranslatedCopy } from "@/utils/i18nContent";
import { getBookPath } from "@/utils/localizedRoutes";


type BookingWidgetProps = {
  lang?: AppLanguage;
  sectionRef?: Ref<HTMLElement>;
  onDatesChange?: (payload: {
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => void;
};

const FALLBACK_INVALID_DATE_RANGE_MESSAGE =
  // i18n-exempt -- BRIK-2160 [ttl=2026-12-31] fallback copy for missing booking widget namespace during static export.
  "Choose valid dates and up to 8 guests to check availability.";
const FALLBACK_CHECK_AVAILABILITY_LABEL =
  // i18n-exempt -- BRIK-2160 [ttl=2026-12-31] fallback CTA copy for missing booking widget namespace during static export.
  "Check availability";

const BookingWidget = memo(function BookingWidget({
  lang,
  sectionRef,
  onDatesChange,
}: BookingWidgetProps): JSX.Element {
  const router = useRouter();
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t: tModals } = useTranslation("modals", translationOptions);
  const { t: tRooms } = useTranslation("roomsPage", translationOptions);
  const { t: tTokens } = useTranslation("_tokens", translationOptions);
  const { t: tLanding } = useTranslation("landingPage", translationOptions);
  const bookingControlLabels = resolveBookingControlLabels(tModals, tRooms);
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

  const fallbackAvailabilityLabel = resolveTranslatedCopy(
    tModals("booking.buttonAvailability"),
    FALLBACK_CHECK_AVAILABILITY_LABEL,
  );
  const checkAvailabilityLabel =
    resolvePrimaryCtaLabel(tTokens, {
      fallback: () => fallbackAvailabilityLabel,
    }) ?? fallbackAvailabilityLabel;

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
    router.push(`${getBookPath(effectiveLang)}${qs ? `?${qs}` : ""}`);
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
          <BookingCalendarPanel
            lang={lang}
            range={range}
            onRangeChange={(r) => setRange(r ?? { from: undefined, to: undefined })}
            pax={guests}
            onPaxChange={(next) => setGuests(next)}
            minPax={1}
            maxPax={8}
            labels={{
              stayHelper: resolveTranslatedCopy(tModals("date.stayHelper"), "2–8 nights"),
              clearDates: resolveTranslatedCopy(tModals("date.clearDates"), "Clear dates"),
              checkIn: resolveTranslatedCopy(tModals("booking.checkInLabel"), "Check in"),
              checkOut: resolveTranslatedCopy(tModals("booking.checkOutLabel"), "Check out"),
              guests: resolveTranslatedCopy(tModals("booking.guestsLabel"), "Guests"),
              decreaseGuests: bookingControlLabels.decreaseGuestsAriaLabel,
              increaseGuests: bookingControlLabels.increaseGuestsAriaLabel,
            }}
            actionSlot={(
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
            )}
          />
          {showError ? (
            <p className="mt-3 text-sm text-brand-bougainvillea" role="alert">
              {resolveTranslatedCopy(
                errorMessage,
                FALLBACK_INVALID_DATE_RANGE_MESSAGE,
              )}
            </p>
          ) : null}
        </div>
      </Section>
    </section>
  );
});

export default BookingWidget;
