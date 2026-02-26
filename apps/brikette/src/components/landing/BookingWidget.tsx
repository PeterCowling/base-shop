// src/components/landing/BookingWidget.tsx
"use client";

import { type ChangeEvent, memo, type Ref, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

import { Section } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/primitives";
import { resolvePrimaryCtaLabel } from "@acme/ui/shared";
import { resolveBookingDateFormat } from "@acme/ui/utils/bookingDateFormat";

import type { AppLanguage } from "@/i18n.config";
import {
  ensureMinCheckoutForStay,
  getMinCheckoutForStay,
  isValidPax,
  isValidStayRange,
} from "@/utils/bookingDateRules";
import { fireCtaClick } from "@/utils/ga4-events";

const BOOKING_QUERY_KEYS = {
  checkIn: "checkin",
  checkOut: "checkout",
  guests: "guests",
} as const;

/* i18n-exempt -- DX-452 [ttl=2026-12-31] Form field ids are non-UI tokens. */
const BOOKING_FIELD_IDS = {
  checkIn: "booking-check-in",
  checkOut: "booking-check-out",
  guests: "booking-guests",
} as const;

function formatLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toPositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return parsed;
}

type BookingWidgetProps = {
  lang?: AppLanguage;
  sectionRef?: Ref<HTMLElement>;
  checkInRef?: Ref<HTMLInputElement>;
};

const BookingWidget = memo(function BookingWidget({
  lang,
  sectionRef,
  checkInRef,
}: BookingWidgetProps): JSX.Element {
  const router = useRouter();
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t: tModals } = useTranslation("modals", translationOptions);
  const { t: tTokens } = useTranslation("_tokens", translationOptions);
  const { t: tLanding } = useTranslation("landingPage", translationOptions);
  const hasHydrated = useRef(false);
  const { placeholder, inputLocale } = resolveBookingDateFormat(lang);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [showError, setShowError] = useState(false);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hydratedCheckIn = params.get(BOOKING_QUERY_KEYS.checkIn) ?? "";
    const hydratedCheckOut = params.get(BOOKING_QUERY_KEYS.checkOut) ?? "";
    setCheckIn(hydratedCheckIn);
    setCheckOut(ensureMinCheckoutForStay(hydratedCheckIn, hydratedCheckOut));
    const guestsValue = params.get(BOOKING_QUERY_KEYS.guests);
    if (guestsValue) {
      setGuests(toPositiveInt(guestsValue));
    }
  }, []);

  useEffect(() => {
    setToday(formatLocalIso(new Date()));
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;
    if (typeof window === "undefined") return;
    const next = new URLSearchParams(window.location.search);
    if (checkIn) {
      next.set(BOOKING_QUERY_KEYS.checkIn, checkIn);
    } else {
      next.delete(BOOKING_QUERY_KEYS.checkIn);
    }
    if (checkOut) {
      next.set(BOOKING_QUERY_KEYS.checkOut, checkOut);
    } else {
      next.delete(BOOKING_QUERY_KEYS.checkOut);
    }
    if (guests > 1) {
      next.set(BOOKING_QUERY_KEYS.guests, String(guests));
    } else {
      next.delete(BOOKING_QUERY_KEYS.guests);
    }
    const currentSearch = window.location.search.replace(/^\?/, "");
    if (next.toString() !== currentSearch) {
      const queryString = next.toString();
      const nextHref = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
      window.history.replaceState(null, "", nextHref);
    }
  }, [checkIn, checkOut, guests]);

  const invalidRange = (() => {
    if (!checkIn || !checkOut) return false;
    return !isValidStayRange(checkIn, checkOut) || !isValidPax(guests);
  })();

  const fallbackAvailabilityLabel = tModals("booking.buttonAvailability") as string;
  const checkAvailabilityLabel =
    resolvePrimaryCtaLabel(tTokens, {
      fallback: () => fallbackAvailabilityLabel,
    }) ?? fallbackAvailabilityLabel;

  const handleCheckInChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const newCheckIn = event.target.value;
    setCheckIn(newCheckIn);
    setShowError(false);
    const effectiveCheckOut = ensureMinCheckoutForStay(newCheckIn, checkOut);
    if (effectiveCheckOut !== checkOut) {
      setCheckOut(effectiveCheckOut);
    }
  }, [checkOut]);

  const handleCheckOutChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCheckOut(event.target.value);
    setShowError(false);
  }, []);

  const handleGuestsChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setGuests(toPositiveInt(event.target.value));
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
    const qs = params.toString();
    router.push(`/${effectiveLang}/book${qs ? `?${qs}` : ""}`);
  }, [checkIn, checkOut, guests, invalidRange, lang, router]);

  const errorMessage = tLanding("bookingWidget.invalidDateRange") as string;
  const minCheckIn = today ?? undefined;
  const minCheckOut = (() => {
    const fallbackMinCheckout = today ? getMinCheckoutForStay(today) : null;
    if (!checkIn) return fallbackMinCheckout ?? undefined;
    return getMinCheckoutForStay(checkIn) ?? fallbackMinCheckout ?? undefined;
  })();

  return (
    <section
      id="booking"
      ref={sectionRef}
      className="relative -translate-y-4 scroll-mt-24 sm:-translate-y-8 lg:-translate-y-10"
    >
      <Section as="div" padding="none" className="max-w-5xl px-4">
        <div className="rounded-2xl border border-overlay-scrim-1/10 bg-panel/95 p-3 shadow-lg backdrop-blur border-fg-inverse/10 dark:bg-brand-text/90">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-end">
            <label
              htmlFor={BOOKING_FIELD_IDS.checkIn}
              className="flex flex-col gap-1.5 text-sm font-semibold text-brand-heading text-brand-surface md:col-span-4"
            >
              {tModals("booking.checkInLabel")}
              <input
                id={BOOKING_FIELD_IDS.checkIn}
                type="date"
                lang={inputLocale}
                min={minCheckIn}
                value={checkIn}
                onChange={handleCheckInChange}
                placeholder={placeholder}
                ref={checkInRef}
                className="min-h-11 rounded-xl border border-brand-outline/40 bg-panel/90 px-3 py-2 text-sm text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:bg-brand-surface"
              />
            </label>

            <label
              htmlFor={BOOKING_FIELD_IDS.checkOut}
              className="flex flex-col gap-1.5 text-sm font-semibold text-brand-heading text-brand-surface md:col-span-4"
            >
              {tModals("booking.checkOutLabel")}
              <input
                id={BOOKING_FIELD_IDS.checkOut}
                type="date"
                lang={inputLocale}
                min={minCheckOut}
                value={checkOut}
                onChange={handleCheckOutChange}
                placeholder={placeholder}
                className="min-h-11 rounded-xl border border-brand-outline/40 bg-panel/90 px-3 py-2 text-sm text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:bg-brand-surface"
              />
            </label>

            <label
              htmlFor={BOOKING_FIELD_IDS.guests}
              className="flex flex-col gap-1.5 text-sm font-semibold text-brand-heading text-brand-surface md:col-span-2"
            >
              {tModals("booking.guestsLabel")}
              <input
                id={BOOKING_FIELD_IDS.guests}
                type="number"
                min={1}
                max={8}
                value={guests}
                onChange={handleGuestsChange}
                className="min-h-11 rounded-xl border border-brand-outline/40 bg-panel/90 px-3 py-2 text-sm text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:bg-brand-surface"
              />
            </label>

            <Button
              type="button"
              onClick={handleSubmit}
              color="accent"
              tone="solid"
              size="lg"
              className="w-full rounded-full md:col-span-2 bg-brand-secondary text-brand-on-accent hover:bg-brand-primary hover:text-brand-on-primary focus-visible:ring-brand-secondary"
            >
              {checkAvailabilityLabel}
            </Button>
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
