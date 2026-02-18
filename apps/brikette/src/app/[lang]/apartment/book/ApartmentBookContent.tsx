"use client";

// src/app/[lang]/apartment/book/ApartmentBookContent.tsx
// Client component for apartment booking page
import type React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/primitives";

import FitCheck from "@/components/apartment/FitCheck";
import PolicyFeeClarityPanel from "@/components/booking/PolicyFeeClarityPanel";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";
import { fireHandoffToEngine, fireWhatsappClick } from "@/utils/ga4-events";

type Props = {
  lang: AppLanguage;
};

const WHATSAPP_BASE = "https://wa.me/393287073695";
const APARTMENT_BOOKING_RETURN_KEY = "apartment_booking_return";

function buildWhatsappUrl(checkin: string, checkout: string): string {
  const text = `Hi, I'm interested in staying at the Brikette apartment. Could you tell me about availability for ${checkin} to ${checkout}?`;
  return `${WHATSAPP_BASE}?text=${encodeURIComponent(text)}`;
}

function buildOctorateLink(
  checkin: string,
  checkout: string,
  plan: "flex" | "nr"
): string {
  const base = "https://book.octorate.com/octobook/site/reservation/result.xhtml";
  const params = new URLSearchParams();
  params.set("codice", "45111");
  params.set("checkin", checkin);
  params.set("checkout", checkout);
  params.set("pax", "1");
  params.set("utm_source", "site");
  params.set("utm_medium", "cta");
  params.set("utm_campaign", `apartment_${plan}`);
  return `${base}?${params.toString()}`;
}

function ApartmentBookContent({ lang }: Props) {
  const { t } = useTranslation("apartmentPage", { lng: lang });
  const { t: tBook } = useTranslation("bookPage", { lng: lang });
  const { t: tModals } = useTranslation("modals", { lng: lang });

  usePagePreload({ lang, namespaces: ["apartmentPage", "bookPage", "footer", "modals", "translation"] });

  const [checkin, setCheckin] = useState(getTodayIso());
  const [checkout, setCheckout] = useState(getDatePlusTwoDays(getTodayIso()));
  const [selectedPlan, setSelectedPlan] = useState<"flex" | "nr" | null>(null);

  // Option A: restore dates if user returns from Octorate (TASK-09 / spike-octorate-precheck)
  useEffect(() => {
    const stored = sessionStorage.getItem(APARTMENT_BOOKING_RETURN_KEY);
    if (!stored) return;
    try {
      const data = JSON.parse(stored) as { checkin?: string; checkout?: string };
      if (data.checkin) setCheckin(data.checkin);
      if (data.checkout) setCheckout(data.checkout);
    } catch {
      // ignore malformed data
    }
    sessionStorage.removeItem(APARTMENT_BOOKING_RETURN_KEY);
  }, []);

  // Derive nights and long-stay flag reactively from date state
  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkout).getTime() - new Date(checkin).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const isLongStay = nights > 14;

  const handleCheckAvailability = useCallback(() => {
    const plan = selectedPlan || "flex";
    const octorateUrl = buildOctorateLink(checkin, checkout, plan);

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

    // Canonical handoff event (TASK-05A). Beacon transport ensures delivery before same-tab navigation.
    fireHandoffToEngine({
      handoff_mode: "same_tab",
      engine_endpoint: "result",
      checkin,
      checkout,
      pax: 1,
      source: `apartment_${plan}`,
    });

    // Store booking state before navigation so we can restore on return (Option A — TASK-09)
    sessionStorage.setItem(
      APARTMENT_BOOKING_RETURN_KEY,
      JSON.stringify({ checkin, checkout, plan }),
    );

    // Navigate to Octorate
    window.location.assign(octorateUrl);
  }, [checkin, checkout, nights, selectedPlan]);

  const handleWhatsappClick = useCallback(() => {
    fireWhatsappClick({
      placement: "apartment_book",
      prefill_present: true,
    });
  }, []);

  return (
    <Section padding="default" className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-bold text-brand-heading">{tBook("heading")}</h1>
      <p className="text-lg text-brand-text/80">{t("title")}</p>

      <div className="mt-8 space-y-6">
        {/* Date Selection */}
        <div className="rounded-xl border border-brand-outline/40 bg-brand-surface p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-brand-heading">
            {tModals("booking2.selectDatesTitle")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="checkin"
                className="mb-1 block text-sm font-medium text-brand-text"
              >
                {tModals("booking2.checkInDate")}
              </label>
              <input
                type="date"
                id="checkin"
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
                min={getTodayIso()}
                className="w-full rounded-md border border-brand-outline/50 bg-brand-bg px-3 py-2 text-brand-text focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20"
              />
            </div>
            <div>
              <label
                htmlFor="checkout"
                className="mb-1 block text-sm font-medium text-brand-text"
              >
                {tModals("booking2.checkOutDate")}
              </label>
              <input
                type="date"
                id="checkout"
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
                min={checkin}
                className="w-full rounded-md border border-brand-outline/50 bg-brand-bg px-3 py-2 text-brand-text focus:border-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Rate Options */}
        <div className="rounded-xl border border-brand-outline/40 bg-brand-surface p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-brand-heading">
            {tBook("roomLabel")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSelectedPlan("nr")}
              className={`rounded-lg border p-4 text-left transition-all ${
                selectedPlan === "nr"
                  ? "border-brand-accent bg-brand-accent/10 ring-2 ring-brand-accent"
                  : "border-brand-outline/30 bg-brand-bg hover:border-brand-accent/50"
              }`}
            >
              <h3 className="font-semibold text-brand-heading">
                {tBook("nr.title")}
              </h3>
              <ul className="mt-2 text-sm list-disc pl-5 text-brand-text/70">
                <li>{tBook("nr.bullets.0")}</li>
                <li>{tBook("nr.bullets.1")}</li>
              </ul>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlan("flex")}
              className={`rounded-lg border p-4 text-left transition-all ${
                selectedPlan === "flex"
                  ? "border-brand-primary bg-brand-primary/10 ring-2 ring-brand-primary"
                  : "border-brand-outline/30 bg-brand-bg hover:border-brand-primary/50"
              }`}
            >
              <h3 className="font-semibold text-brand-heading">
                {tBook("flex.title")}
              </h3>
              <ul className="mt-2 text-sm list-disc pl-5 text-brand-text/70">
                <li>{tBook("flex.bullets.0")}</li>
                <li>{tBook("flex.bullets.1")}</li>
              </ul>
            </button>
          </div>
        </div>

        {/* Fit Check */}
        <FitCheck />

        <PolicyFeeClarityPanel lang={lang} variant="apartment" />

        {/* CTA */}
        <div className="flex flex-col gap-4">
          <Button
            color={selectedPlan === "flex" ? "primary" : "accent"}
            tone="solid"
            onClick={handleCheckAvailability}
            className="w-full text-lg py-6"
          >
            {selectedPlan === "nr" ? tBook("cta.nr") : tBook("cta.flex")}
          </Button>
          <a
            data-testid="whatsapp-cta"
            data-long-stay-primary={isLongStay ? "true" : undefined}
            href={buildWhatsappUrl(checkin, checkout)}
            onClick={handleWhatsappClick}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-brand-outline bg-brand-surface px-6 py-3 text-base font-semibold text-brand-primary shadow-sm transition-colors hover:bg-brand-surface/80 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-brand-primary focus-visible:focus:ring-offset-2"
          >
            {t("streetLevelArrival.whatsappCta")}
          </a>
        </div>
      </div>
    </Section>
  );
}

export default memo(ApartmentBookContent);
