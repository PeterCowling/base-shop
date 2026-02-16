"use client";

// src/app/[lang]/book/BookPageContent.tsx
// Booking landing page used for direct landings (SEO/sitemap/no-JS fallback).

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";

import { Section } from "@acme/design-system/atoms";

import { DirectPerksBlock } from "@/components/booking/DirectPerksBlock";
import PolicyFeeClarityPanel from "@/components/booking/PolicyFeeClarityPanel";
import RoomsSection from "@/components/rooms/RoomsSection";
import BookStructuredData from "@/components/seo/BookStructuredData";
import { roomsData } from "@/data/roomsData";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";
import { fireViewItemList } from "@/utils/ga4-events";

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

function BookPageContent({ lang }: Props): JSX.Element {
  const { t } = useTranslation("bookPage", { lng: lang, useSuspense: true });
  usePagePreload({
    lang,
    namespaces: ["bookPage", "roomsPage"],
    optionalNamespaces: ["_tokens", "modals", "footer"],
  });

  const params = useSearchParams();

  const todayIso = useMemo(() => getTodayIso(), []);

  const initialCheckin = readQueryDate(params, ["checkin"], todayIso);
  const initialCheckout = readQueryDate(params, ["checkout"], getDatePlusTwoDays(initialCheckin));
  const initialPax = readQueryNumber(params, ["pax", "guests", "adults"], 1);

  const [checkin, setCheckin] = useState(initialCheckin);
  const [checkout, setCheckout] = useState(initialCheckout);
  const [pax, setPax] = useState(initialPax);

  useEffect(() => {
    // Keep state in sync if user lands with different params.
    setCheckin(initialCheckin);
    setCheckout(initialCheckout);
    setPax(initialPax);
  }, [initialCheckin, initialCheckout, initialPax]);

  const minCheckout = useMemo(() => getDatePlusTwoDays(checkin), [checkin]);

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
  }, [checkin, checkout, minCheckout, pax, todayIso]);

  useEffect(() => {
    fireViewItemList({
      itemListId: "book_rooms",
      rooms: roomsData,
    });
  }, []);

  return (
    <>
      <BookStructuredData lang={lang} />
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
              onChange={(e) => setCheckin(e.target.value)}
              className="min-h-11 rounded-xl border border-brand-outline/40 bg-brand-bg px-3 py-2 text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-brand-heading">
            {t("date.checkOut", { defaultValue: "Check out" }) as string}
            <input
              type="date"
              value={checkout}
              min={minCheckout}
              onChange={(e) => setCheckout(e.target.value)}
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
              onChange={(e) => setPax(parsePositiveInt(e.target.value, 1))}
              className="min-h-11 rounded-xl border border-brand-outline/40 bg-brand-bg px-3 py-2 text-brand-heading shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            />
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={applyQuery}
              className="min-h-11 min-w-11 w-full rounded-full bg-brand-secondary px-6 py-3 text-sm font-semibold tracking-wide text-neutral-900 shadow-lg transition-colors duration-200 hover:bg-brand-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary focus-visible:ring-offset-2"
            >
              {t("date.apply", { defaultValue: "Update" }) as string}
            </button>
          </div>
        </div>
      </Section>

      <RoomsSection
        lang={lang}
        itemListId="book_rooms"
        bookingQuery={{
          checkIn: checkin,
          checkOut: checkout,
          pax: String(pax),
          queryString: `checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(checkout)}&pax=${encodeURIComponent(String(pax))}`,
        }}
      />

      <Section padding="default" className="mx-auto max-w-7xl">
        <DirectPerksBlock lang={lang} className="mb-8 rounded-2xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm" />
        <PolicyFeeClarityPanel lang={lang} variant="hostel" />
      </Section>
    </>
  );
}

export default memo(BookPageContent);
