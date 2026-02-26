"use client";

// src/app/[lang]/book/BookPageContent.tsx
// Booking landing page used for direct landings (SEO/sitemap/no-JS fallback).

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";

import { Section } from "@acme/design-system/atoms";

import { DirectPerksBlock } from "@/components/booking/DirectPerksBlock";
import LocationInline from "@/components/booking/LocationInline";
import PolicyFeeClarityPanel from "@/components/booking/PolicyFeeClarityPanel";
import FaqStrip from "@/components/landing/FaqStrip";
import SocialProofSection from "@/components/landing/SocialProofSection";
import RoomsSection from "@/components/rooms/RoomsSection";
import BookPageStructuredData from "@/components/seo/BookPageStructuredData";
import { roomsData } from "@/data/roomsData";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import {
  ensureMinCheckoutForStay,
  getMinCheckoutForStay,
  isValidPax,
  isValidStayRange,
} from "@/utils/bookingDateRules";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";
import { fireSearchAvailability, fireViewItemList } from "@/utils/ga4-events";

type Props = {
  lang: AppLanguage;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function readQueryDate(params: URLSearchParams | null, keys: string[], fallback: string): string {
  if (!params) return fallback;
  for (const key of keys) {
    const raw = params.get(key);
    if (raw && raw.trim()) return raw;
  }
  return fallback;
}

function readQueryNumber(params: URLSearchParams | null, keys: string[], fallback: number): number {
  if (!params) return fallback;
  for (const key of keys) {
    const raw = params.get(key);
    const n = parsePositiveInt(raw, Number.NaN);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

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

function BookPageContent({ lang }: Props): JSX.Element {
  const { t } = useTranslation("bookPage", { lng: lang, useSuspense: true });
  usePagePreload({
    lang,
    namespaces: ["bookPage", "roomsPage", "landingPage", "faq"],
    optionalNamespaces: ["_tokens", "modals", "footer", "testimonials", "ratingsBar", "dealsPage"],
  });

  const params = useSearchParams();
  const deal = params?.get("deal") ?? null;

  const todayIso = useMemo(() => getTodayIso(), []);

  const initialCheckinRaw = readQueryDate(params, ["checkin"], todayIso);
  const initialCheckin = getMinCheckoutForStay(initialCheckinRaw) ? initialCheckinRaw : todayIso;
  const initialCheckoutRaw = readQueryDate(params, ["checkout"], getDatePlusTwoDays(initialCheckin));
  const initialCheckout = ensureMinCheckoutForStay(initialCheckin, initialCheckoutRaw);
  const initialPax = readQueryNumber(params, ["pax", "guests", "adults"], 1);

  // Dedupe ref: tracks the search key of the last fired search_availability event.
  const lastSearchKeyRef = useRef<string | null>(null);
  // Capture initial values so mount effect can seed dedup and prevent debounce firing on render.
  const initialValuesRef = useRef({ checkin: initialCheckin, checkout: initialCheckout, pax: initialPax });
  // Capture initial URL params at component init time for the mount-only effect.
  // Only fire on mount when the user explicitly provided checkin/checkout in the URL.
  const hasValidCheckinParam = (params?.get("checkin") ?? "") === initialCheckin;
  const mountedSearchRef = useRef(
    hasValidCheckinParam && params?.has("checkout") && isValidSearch(initialCheckin, initialCheckout, initialPax)
      ? { checkin: initialCheckin, checkout: initialCheckout, pax: initialPax }
      : null,
  );

  const [checkin, setCheckin] = useState(initialCheckin);
  const [checkout, setCheckout] = useState(initialCheckout);
  const [pax, setPax] = useState(initialPax);

  useEffect(() => {
    // Keep state in sync if user lands with different params.
    setCheckin(initialCheckin);
    setCheckout(initialCheckout);
    setPax(initialPax);
  }, [initialCheckin, initialCheckout, initialPax]);

  const minCheckout = useMemo(
    () => getMinCheckoutForStay(checkin) ?? getMinCheckoutForStay(todayIso) ?? getDatePlusTwoDays(todayIso),
    [checkin, todayIso],
  );

  const roomQueryState = useMemo<"valid" | "invalid">(
    () => (isValidSearch(checkin, checkout, pax) ? "valid" : "invalid"),
    [checkin, checkout, pax],
  );

  // TC-01: fire search_availability when dates/pax change; debounced + deduped.
  useEffect(() => {
    if (!isValidSearch(checkin, checkout, pax)) return;
    const key = `${checkin}|${checkout}|${pax}`;
    if (lastSearchKeyRef.current === key) return;
    const timer = window.setTimeout(() => {
      // Re-check inside timer: mount effect may have seeded the key after this effect ran.
      if (lastSearchKeyRef.current === key) return;
      lastSearchKeyRef.current = key;
      fireSearchAvailability({ source: "booking_widget", checkin, checkout, pax });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [checkin, checkout, pax]);

  useEffect(() => {
    fireViewItemList({ itemListId: "book_rooms", rooms: roomsData });
    const initial = mountedSearchRef.current;
    if (initial) {
      // URL params provided: fire immediately and seed dedup to prevent double-fire.
      const key = `${initial.checkin}|${initial.checkout}|${initial.pax}`;
      lastSearchKeyRef.current = key;
      fireSearchAvailability({ source: "booking_widget", checkin: initial.checkin, checkout: initial.checkout, pax: initial.pax });
    } else {
      // No URL params: seed dedup with defaults to prevent debounce firing on initial render.
      const iv = initialValuesRef.current;
      lastSearchKeyRef.current = `${iv.checkin}|${iv.checkout}|${iv.pax}`;
    }
  }, []); // mount only

  return (
    <>
      <BookPageStructuredData lang={lang} />

      {deal ? (
        <div className="sticky top-0 bg-brand-secondary px-4 py-2 text-center text-sm font-semibold text-brand-on-accent">
          {t("dealBanner.applied", { defaultValue: `Deal applied: ${deal}`, replace: { code: deal } }) as string}
        </div>
      ) : null}

      <SocialProofSection lang={lang} />

      <Section padding="default" className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl">
          {t("heading")}
        </h1>
        <p className="mt-2 text-sm text-brand-text/80">
          {t("subheading", { defaultValue: "Choose your dates, then pick a room." }) as string}
        </p>

        <div className="mt-6 grid gap-4 rounded-2xl border border-brand-outline/40 bg-brand-surface p-4 shadow-sm sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-brand-heading">
            {t("date.checkIn", { defaultValue: "Check in" }) as string}
            <input
              type="date"
              value={checkin}
              min={todayIso}
              onChange={(e) => {
                const newCheckin = e.target.value;
                setCheckin(newCheckin);
                const effectiveCheckout = ensureMinCheckoutForStay(newCheckin, checkout);
                if (effectiveCheckout !== checkout) setCheckout(effectiveCheckout);
                writeCanonicalBookingQuery({ checkin: newCheckin, checkout: effectiveCheckout, pax });
              }}
              className="min-h-11 rounded-xl border border-brand-outline/40 bg-brand-bg px-3 py-2 text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-brand-heading">
            {t("date.checkOut", { defaultValue: "Check out" }) as string}
            <input
              type="date"
              value={checkout}
              min={minCheckout}
              onChange={(e) => {
                setCheckout(e.target.value);
                writeCanonicalBookingQuery({ checkin, checkout: e.target.value, pax });
              }}
              className="min-h-11 rounded-xl border border-brand-outline/40 bg-brand-bg px-3 py-2 text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-brand-heading">
            {t("date.guests", { defaultValue: "Guests" }) as string}
            <input
              type="number"
              min={1}
              max={8}
              value={pax}
              onChange={(e) => {
                const newPax = parsePositiveInt(e.target.value, 1);
                setPax(newPax);
                writeCanonicalBookingQuery({ checkin, checkout, pax: newPax });
              }}
              className="min-h-11 rounded-xl border border-brand-outline/40 bg-brand-bg px-3 py-2 text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            />
          </label>
        </div>
      </Section>

      <RoomsSection
        lang={lang}
        itemListId="book_rooms"
        queryState={roomQueryState}
        deal={deal ?? undefined}
        bookingQuery={{
          checkIn: checkin,
          checkOut: checkout,
          pax: String(pax),
          queryString: `checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(checkout)}&pax=${encodeURIComponent(String(pax))}`,
        }}
      />

      <Section padding="default" className="mx-auto max-w-7xl">
        <DirectPerksBlock lang={lang} className="mb-8 rounded-2xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm" />
        <LocationInline lang={lang} />
        <PolicyFeeClarityPanel lang={lang} variant="hostel" />
      </Section>

      <FaqStrip lang={lang} />
    </>
  );
}

export default memo(BookPageContent);
