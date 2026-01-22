// src/components/landing/BookingWidget.tsx
"use client";

import { type ChangeEvent, memo, type Ref, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

import { Grid } from "@acme/ui/atoms";
import { Section } from "@acme/ui/atoms";
import { resolvePrimaryCtaLabel } from "@acme/ui/shared";
import { resolveBookingDateFormat } from "@acme/ui/utils/bookingDateFormat";

import { useOptionalModal } from "@/context/ModalContext";
import type { AppLanguage } from "@/i18n.config";

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

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatLocalIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string, dateFormat: string): Date | null {
  if (!value) return null;
  if (ISO_DATE_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
    if (!year || !month || !day) return null;
    const parsed = new Date(year, month - 1, day);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }
  const parts = value.split(/[./-]/);
  if (parts.length !== 3) return null;
  const [first, second, third] = parts;
  if (!first || !second || !third) return null;
  const format = dateFormat.toLowerCase();
  const monthFirst = format.startsWith("mm");
  const day = Number.parseInt(monthFirst ? second : first, 10);
  const month = Number.parseInt(monthFirst ? first : second, 10);
  const year = Number.parseInt(third, 10);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function isValidDate(value: string, dateFormat: string): boolean {
  if (!value) return false;
  return Boolean(parseDateInput(value, dateFormat));
}

function toPositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return parsed;
}

function getDateParts(value: string, dateFormat: string): number {
  const parsed = parseDateInput(value, dateFormat);
  if (!parsed) return Number.NaN;
  return parsed.getTime();
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
  const { openModal } = useOptionalModal();
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t: tModals } = useTranslation("modals", translationOptions);
  const { t: tTokens } = useTranslation("_tokens", translationOptions);
  const { t: tLanding } = useTranslation("landingPage", translationOptions);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useRef(false);
  const { dateFormat, placeholder, inputLocale } = useMemo(
    () => resolveBookingDateFormat(lang),
    [lang]
  );

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [showError, setShowError] = useState(false);
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    setCheckIn(searchParams?.get(BOOKING_QUERY_KEYS.checkIn) ?? "");
    setCheckOut(searchParams?.get(BOOKING_QUERY_KEYS.checkOut) ?? "");
    const guestsValue = searchParams?.get(BOOKING_QUERY_KEYS.guests);
    if (guestsValue) {
      setGuests(toPositiveInt(guestsValue));
    }
  }, [searchParams]);

  useEffect(() => {
    setToday(formatLocalIso(new Date()));
  }, []);

  useEffect(() => {
    if (!hasHydrated.current) return;
    const next = new URLSearchParams(searchParams?.toString() ?? "");
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
    const currentSearch = searchParams?.toString() ?? "";
    if (next.toString() !== currentSearch) {
      const queryString = next.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    }
  }, [checkIn, checkOut, guests, searchParams, router, pathname]);

  const invalidRange = useMemo(() => {
    if (!checkIn || !checkOut) return false;
    if (!isValidDate(checkIn, dateFormat) || !isValidDate(checkOut, dateFormat)) return false;
    return getDateParts(checkOut, dateFormat) <= getDateParts(checkIn, dateFormat);
  }, [checkIn, checkOut, dateFormat]);

  const fallbackAvailabilityLabel = useMemo(
    () => tModals("booking.buttonAvailability") as string,
    [tModals]
  );
  const checkAvailabilityLabel = useMemo(() => {
    return (
      resolvePrimaryCtaLabel(tTokens, {
        fallback: () => fallbackAvailabilityLabel,
      }) ?? fallbackAvailabilityLabel
    );
  }, [fallbackAvailabilityLabel, tTokens]);

  const handleCheckInChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setCheckIn(event.target.value);
    setShowError(false);
  }, []);

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
    openModal("booking", {
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      adults: guests,
    });
  }, [checkIn, checkOut, guests, invalidRange, openModal]);

  const errorMessage = tLanding("bookingWidget.invalidDateRange") as string;
  const minCheckIn = today ?? undefined;
  const minCheckOut = (() => {
    if (!checkIn) return today || undefined;
    const parsed = parseDateInput(checkIn, dateFormat);
    if (!parsed) return today || undefined;
    return formatLocalIso(parsed);
  })();

  return (
    <section
      id="booking"
      ref={sectionRef}
      className="relative -translate-y-4 scroll-mt-24 sm:-translate-y-8 lg:-translate-y-10"
    >
      <Section as="div" padding="none" className="max-w-6xl px-6">
        <div className="rounded-2xl border border-black/10 bg-white/95 p-4 shadow-lg backdrop-blur md:p-6 dark:border-white/10 dark:bg-brand-text/90">
          <Grid columns={{ base: 1, md: 12 }} gap={4} className="md:items-end">
            <label
              htmlFor={BOOKING_FIELD_IDS.checkIn}
              className="flex flex-col gap-2 text-sm font-semibold text-brand-heading md:col-span-4"
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
                className="min-h-11 rounded-xl border border-brand-outline/40 bg-white/90 px-3 py-2 text-sm text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:bg-brand-surface"
              />
            </label>

            <label
              htmlFor={BOOKING_FIELD_IDS.checkOut}
              className="flex flex-col gap-2 text-sm font-semibold text-brand-heading md:col-span-4"
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
                className="min-h-11 rounded-xl border border-brand-outline/40 bg-white/90 px-3 py-2 text-sm text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:bg-brand-surface"
              />
            </label>

            <label
              htmlFor={BOOKING_FIELD_IDS.guests}
              className="flex flex-col gap-2 text-sm font-semibold text-brand-heading md:col-span-2"
            >
              {tModals("booking.guestsLabel")}
              <input
                id={BOOKING_FIELD_IDS.guests}
                type="number"
                min={1}
                max={8}
                value={guests}
                onChange={handleGuestsChange}
                className="min-h-11 rounded-xl border border-brand-outline/40 bg-white/90 px-3 py-2 text-sm text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary dark:bg-brand-surface"
              />
            </label>

            <button
              type="button"
              onClick={handleSubmit}
              className="min-h-11 min-w-11 rounded-full bg-brand-secondary px-6 py-3 text-sm font-semibold text-brand-text shadow-lg transition-colors hover:bg-brand-primary/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary md:col-span-2"
            >
              {checkAvailabilityLabel}
            </button>
          </Grid>
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
