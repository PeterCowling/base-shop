"use client";

// src/app/[lang]/book/BookPageContent.tsx
// Booking landing page used for direct landings (SEO/sitemap/no-JS fallback).

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { addDays, getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";
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

function isValidSearch(checkIn: string, checkOut: string): boolean {
  return checkIn.length > 0 && checkOut.length > 0 && checkOut > checkIn;
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

  const initialCheckin = readQueryDate(params, ["checkin"], todayIso);
  const initialCheckout = readQueryDate(params, ["checkout"], getDatePlusTwoDays(initialCheckin));
  const initialPax = readQueryNumber(params, ["pax", "guests", "adults"], 1);

  // Dedupe ref: tracks the search key of the last fired search_availability event.
  const lastSearchKeyRef = useRef<string | null>(null);
  // Capture initial URL params at component init time for the mount-only effect.
  // Only fire on mount when the user explicitly provided checkin/checkout in the URL.
  const mountedSearchRef = useRef(
    params?.has("checkin") && params?.has("checkout") && isValidSearch(initialCheckin, initialCheckout)
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

  const minCheckout = useMemo(() => addDays(checkin, 1), [checkin]);

  const applyQuery = useCallback(() => {
    const normalizedCheckin = checkin || todayIso;
    const normalizedCheckout = checkout && checkout >= minCheckout ? checkout : minCheckout;
    const normalizedPax = Math.max(1, pax);

    if (normalizedCheckout !== checkout) {
      setCheckout(normalizedCheckout);
    }

    writeCanonicalBookingQuery({
      checkin: normalizedCheckin,
      checkout: normalizedCheckout,
      pax: normalizedPax,
    });

    // TC-01: fire search_availability on submit; dedupe repeated identical queries.
    if (isValidSearch(normalizedCheckin, normalizedCheckout)) {
      const key = `${normalizedCheckin}|${normalizedCheckout}|${normalizedPax}`;
      if (lastSearchKeyRef.current !== key) {
        lastSearchKeyRef.current = key;
        fireSearchAvailability({
          source: "booking_widget",
          checkin: normalizedCheckin,
          checkout: normalizedCheckout,
          pax: normalizedPax,
        });
      }
    }
  }, [checkin, checkout, minCheckout, pax, todayIso]);

  useEffect(() => {
    fireViewItemList({
      itemListId: "book_rooms",
      rooms: roomsData,
    });
    // TC-03: fire search_availability on mount when URL params provide a valid date range.
    const initial = mountedSearchRef.current;
    if (initial) {
      const key = `${initial.checkin}|${initial.checkout}|${initial.pax}`;
      lastSearchKeyRef.current = key;
      fireSearchAvailability({
        source: "booking_widget",
        checkin: initial.checkin,
        checkout: initial.checkout,
        pax: initial.pax,
      });
    }
  }, []); // mount only — initial URL params captured in mountedSearchRef

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

        <div className="mt-6 grid gap-4 rounded-2xl border border-brand-outline/40 bg-brand-surface p-4 shadow-sm sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-brand-heading">
            {t("date.checkIn", { defaultValue: "Check in" }) as string}
            <input
              type="date"
              value={checkin}
              min={todayIso}
              onChange={(e) => {
                setCheckin(e.target.value);
                writeCanonicalBookingQuery({ checkin: e.target.value, checkout, pax });
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

          <div className="flex items-end">
            <button
              type="button"
              onClick={applyQuery}
              className="min-h-11 min-w-11 w-full rounded-full bg-brand-secondary px-6 py-3 text-sm font-semibold tracking-wide text-brand-on-accent shadow-lg transition-colors duration-200 hover:bg-brand-primary hover:text-brand-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
            >
              {t("date.apply", { defaultValue: "Update" }) as string}
            </button>
          </div>
        </div>
      </Section>

      <RoomsSection
        lang={lang}
        itemListId="book_rooms"
        queryState="valid"
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
