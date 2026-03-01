"use client";

// src/app/[lang]/book/BookPageContent.tsx
// Booking landing page used for direct landings (SEO/sitemap/no-JS fallback).

import { memo, type MutableRefObject,useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter , useSearchParams } from "next/navigation";

import { Section } from "@acme/design-system/atoms";

import {
  BookPageIndicativeDisclosure,
  BookPageRecoverySection,
  BookPageSearchPanel,
} from "@/components/booking/BookPageSections";
import type { DateRange } from "@/components/booking/DateRangePicker";
import { DirectPerksBlock } from "@/components/booking/DirectPerksBlock";
import LocationInline from "@/components/booking/LocationInline";
import PolicyFeeClarityPanel from "@/components/booking/PolicyFeeClarityPanel";
import FaqStrip from "@/components/landing/FaqStrip";
import SocialProofSection from "@/components/landing/SocialProofSection";
import RoomsSection from "@/components/rooms/RoomsSection";
import BookPageStructuredData from "@/components/seo/BookPageStructuredData";
import indicativePricesSeed from "@/data/indicative_prices.json";
import { roomsData } from "@/data/roomsData";
import { useAvailability } from "@/hooks/useAvailability";
import { usePagePreload } from "@/hooks/usePagePreload";
import { useRecoveryResumeFallback } from "@/hooks/useRecoveryResumeFallback";
import type { AppLanguage } from "@/i18n.config";
import {
  isValidPax,
  isValidStayRange,
} from "@/utils/bookingDateRules";
import { buildBookingQueryString } from "@/utils/bookingQuery";
import {
  type BookingSearchSource,
  hydrateBookingSearch,
  persistBookingSearch,
} from "@/utils/bookingSearch";
import { formatDate, getDatePlusTwoDays, getTodayIso, safeParseIso } from "@/utils/dateUtils";
import { fireSearchAvailability, fireViewItemList } from "@/utils/ga4-events";
import { getIndicativeDisclosure, getIndicativeRoomPrices } from "@/utils/indicativePricing";

type Props = {
  lang: AppLanguage;
  heading: string;
};

type SearchAvailabilityPayload = {
  checkin: string;
  checkout: string;
  pax: number;
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string | object;

function writeCanonicalBookingQuery(next: { checkin: string; checkout: string; pax: number }): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("checkin", next.checkin);
  url.searchParams.set("checkout", next.checkout);
  url.searchParams.set("pax", String(next.pax));
  window.history.replaceState(null, "", url.toString());
}

function isValidSearch(checkIn: string, checkOut: string, pax: number): boolean {
  return checkIn.length > 0 && checkOut.length > 0 && isValidStayRange(checkIn, checkOut) && isValidPax(pax);
}

function deriveRoomQueryState(checkin: string, checkout: string, pax: number): "valid" | "invalid" | "absent" {
  if (!checkin || !checkout) return "absent";
  return isValidSearch(checkin, checkout, pax) ? "valid" : "invalid";
}

function deriveMountedSearchPayload(
  source: BookingSearchSource,
  initialCheckin: string,
  initialCheckout: string,
  initialPax: number,
): SearchAvailabilityPayload | null {
  if (source !== "url" || !isValidSearch(initialCheckin, initialCheckout, initialPax)) return null;
  return { checkin: initialCheckin, checkout: initialCheckout, pax: initialPax };
}

function seedInitialSearchTelemetry(
  mountedSearch: SearchAvailabilityPayload | null,
  initialValues: SearchAvailabilityPayload,
  lastSearchKeyRef: MutableRefObject<string | null>,
): void {
  if (mountedSearch) {
    const key = `${mountedSearch.checkin}|${mountedSearch.checkout}|${mountedSearch.pax}`;
    lastSearchKeyRef.current = key;
    fireSearchAvailability({
      source: "booking_widget",
      checkin: mountedSearch.checkin,
      checkout: mountedSearch.checkout,
      pax: mountedSearch.pax,
    });
    return;
  }

  lastSearchKeyRef.current = `${initialValues.checkin}|${initialValues.checkout}|${initialValues.pax}`;
}

function scheduleBookingSearchPersistence(
  checkin: string,
  checkout: string,
  pax: number,
): (() => void) | undefined {
  if (!checkin || !checkout) return undefined;
  const timer = window.setTimeout(() => {
    persistBookingSearch({ checkin, checkout, pax });
  }, 400);
  return () => window.clearTimeout(timer);
}

function scheduleSearchAvailabilityFire(
  checkin: string,
  checkout: string,
  pax: number,
  lastSearchKeyRef: MutableRefObject<string | null>,
): (() => void) | undefined {
  if (!isValidSearch(checkin, checkout, pax)) return undefined;
  const key = `${checkin}|${checkout}|${pax}`;
  if (lastSearchKeyRef.current === key) return undefined;
  const timer = window.setTimeout(() => {
    if (lastSearchKeyRef.current === key) return;
    lastSearchKeyRef.current = key;
    fireSearchAvailability({ source: "booking_widget", checkin, checkout, pax });
  }, 600);
  return () => window.clearTimeout(timer);
}

function renderDealBanner(deal: string | null, t: TranslateFn): JSX.Element | null {
  if (!deal) return null;
  return (
    <div className="sticky top-0 bg-brand-secondary px-4 py-2 text-center text-sm font-semibold text-brand-on-accent">
      {t("dealBanner.applied", { defaultValue: `Deal applied: ${deal}`, replace: { code: deal } }) as string}
    </div>
  );
}

function renderRecoverySection(
  availabilityRoomCount: number,
  lang: AppLanguage,
  roomQueryState: "valid" | "invalid" | "absent",
  checkin: string,
  checkout: string,
  pax: number,
): JSX.Element | null {
  if (availabilityRoomCount <= 0) return null;
  return (
    <BookPageRecoverySection
      lang={lang}
      roomQueryState={roomQueryState}
      checkin={checkin}
      checkout={checkout}
      pax={pax}
    />
  );
}

function BookPageContent({ lang, heading }: Props): JSX.Element {
  const router = useRouter();
  const { t } = useTranslation("bookPage", { lng: lang, useSuspense: true });
  usePagePreload({
    lang,
    namespaces: ["bookPage", "roomsPage", "landingPage", "faq"],
    optionalNamespaces: ["_tokens", "modals", "footer", "testimonials", "ratingsBar", "dealsPage"],
  });

  const params = useSearchParams();
  const deal = params?.get("deal") ?? null;
  const { showRebuildQuotePrompt } = useRecoveryResumeFallback(params, router.replace);

  const todayIso = useMemo(() => getTodayIso(), []);
  const hydrated = useMemo(
    () => hydrateBookingSearch(params),
    [params],
  );
  const initialCheckin = hydrated.search?.checkin ?? "";
  const initialCheckout = hydrated.search?.checkout ?? "";
  const initialPax = hydrated.search?.pax ?? 1;

  // Dedupe ref: tracks the search key of the last fired search_availability event.
  const lastSearchKeyRef = useRef<string | null>(null);
  // Capture initial values so mount effect can seed dedup and prevent debounce firing on render.
  const initialValuesRef = useRef({
    checkin: initialCheckin || todayIso,
    checkout: initialCheckout || getDatePlusTwoDays(initialCheckin || todayIso),
    pax: initialPax,
  });
  // Capture initial URL params at component init time for the mount-only effect.
  // Only fire on mount when the user explicitly provided checkin/checkout in the URL.
  const mountedSearchRef = useRef(
    deriveMountedSearchPayload(hydrated.source, initialCheckin, initialCheckout, initialPax),
  );

  const [range, setRange] = useState<DateRange>({
    from: safeParseIso(initialCheckin),
    to: safeParseIso(initialCheckout),
  });
  const [pax, setPax] = useState(initialPax);
  const checkin = range.from ? formatDate(range.from) : "";
  const checkout = range.to ? formatDate(range.to) : "";

  useEffect(() => {
    // Keep state in sync if user lands with different params.
    setRange({
      from: safeParseIso(initialCheckin),
      to: safeParseIso(initialCheckout),
    });
    setPax(initialPax);
  }, [initialCheckin, initialCheckout, initialPax]);

  const roomQueryState = useMemo<"valid" | "invalid" | "absent">(
    () => deriveRoomQueryState(checkin, checkout, pax),
    [checkin, checkout, pax],
  );

  // TC-03-01: useAvailability called unconditionally (hooks invariant — no conditional calls).
  const availabilityCheckin = checkin || todayIso;
  const availabilityCheckout = checkout || getDatePlusTwoDays(availabilityCheckin);
  const { rooms: availabilityRooms } = useAvailability({
    checkin: availabilityCheckin,
    checkout: availabilityCheckout,
    pax: String(pax),
  });

  useEffect(() => scheduleBookingSearchPersistence(checkin, checkout, pax), [checkin, checkout, pax]);

  const showConstraintGuidance = roomQueryState === "invalid";
  const indicativeRoomPrices = useMemo(() => {
    return getIndicativeRoomPrices(
      indicativePricesSeed,
      roomsData.map((room) => room.id),
    );
  }, []);
  const indicativeDisclosure = useMemo<string | null>(() => {
    if (roomQueryState !== "absent" || !indicativeRoomPrices) return null;
    return getIndicativeDisclosure(indicativePricesSeed);
  }, [indicativeRoomPrices, roomQueryState]);

  // TC-01: fire search_availability when dates/pax change; debounced + deduped.
  useEffect(
    () => scheduleSearchAvailabilityFire(checkin, checkout, pax, lastSearchKeyRef),
    [checkin, checkout, pax],
  );

  useEffect(() => {
    fireViewItemList({ itemListId: "book_rooms", rooms: roomsData });
    seedInitialSearchTelemetry(mountedSearchRef.current, initialValuesRef.current, lastSearchKeyRef);
  }, []); // mount only

  return (
    <>
      <BookPageStructuredData lang={lang} />

      {renderDealBanner(deal, t as TranslateFn)}

      <SocialProofSection lang={lang} />

      <Section padding="default" className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl">
          {heading}
        </h1>
        <p className="mt-2 text-sm text-brand-text/80">
          {t("subheading", { defaultValue: "Choose your dates, then pick a room." }) as string}
        </p>

        <BookPageSearchPanel
          lang={lang}
          range={range}
          pax={pax}
          onRangeChange={(newRange) => setRange(newRange ?? { from: undefined, to: undefined })}
          onPaxChange={setPax}
          onCanonicalQuery={writeCanonicalBookingQuery}
          checkin={checkin}
          checkout={checkout}
          stayHelperText={t("date.stayHelper", { defaultValue: "2–8 nights" }) as string}
          clearDatesText={t("date.clearDates", { defaultValue: "Clear dates" }) as string}
          checkInLabelText={t("date.checkInLabel", { defaultValue: "Check in" }) as string}
          checkOutLabelText={t("date.checkOutLabel", { defaultValue: "Check out" }) as string}
          guestsLabelText={t("date.guests", { defaultValue: "Guests" }) as string}
          showConstraintGuidance={showConstraintGuidance}
          showRebuildQuotePrompt={showRebuildQuotePrompt}
        />
      </Section>

      <DirectPerksBlock
        lang={lang}
        className="mb-6 rounded-2xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm"
        savingsEyebrow={t("hostel.directSavings.eyebrow", { defaultValue: "Book direct and save" /* i18n-exempt -- BRIK-005 [ttl=2026-03-15] */ })}
        savingsHeadline={t("hostel.directSavings.headline", { defaultValue: "Up to 25% less than Booking.com" /* i18n-exempt -- BRIK-005 [ttl=2026-03-15] */ })}
      />

      <RoomsSection
        lang={lang}
        itemListId="book_rooms"
        queryState={roomQueryState}
        deal={deal ?? undefined}
        availabilityRooms={availabilityRooms}
        roomPricesOverride={indicativeRoomPrices}
        bookingQuery={{
          checkIn: checkin,
          checkOut: checkout,
          pax: String(pax),
          queryString: buildBookingQueryString(checkin, checkout, pax),
        }}
      />
      <BookPageIndicativeDisclosure indicativeDisclosure={indicativeDisclosure} />

      {renderRecoverySection(availabilityRooms?.length ?? 0, lang, roomQueryState, checkin, checkout, pax)}

      <Section padding="default" className="mx-auto max-w-7xl">
        <LocationInline lang={lang} />
        <PolicyFeeClarityPanel lang={lang} variant="hostel" />
      </Section>

      <FaqStrip lang={lang} />
    </>
  );
}

export default memo(BookPageContent);
