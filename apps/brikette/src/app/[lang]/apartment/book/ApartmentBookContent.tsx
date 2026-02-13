"use client";

// src/app/[lang]/apartment/book/ApartmentBookContent.tsx
// Client component for apartment booking page
import type React from "react";
import { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import { Section } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/primitives";

import FitCheck from "@/components/apartment/FitCheck";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { getDatePlusTwoDays, getTodayIso } from "@/utils/dateUtils";

type Props = {
  lang: AppLanguage;
};

const BOOKING_COM_URL = "https://www.booking.com/hotel/it/stepfree-chiesa-nuova.en-gb.html";
const WHATSAPP_URL = "https://wa.me/393287073695";

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
  usePagePreload({ lang, namespaces: ["apartmentPage", "translation"] });

  const [checkin, setCheckin] = useState(getTodayIso());
  const [checkout, setCheckout] = useState(getDatePlusTwoDays(getTodayIso()));
  const [selectedPlan, setSelectedPlan] = useState<"flex" | "nr" | null>(null);

  const handleCheckAvailability = useCallback(() => {
    const plan = selectedPlan || "flex";
    const octorateUrl = buildOctorateLink(checkin, checkout, plan);

    // Calculate nights for GA4 e-commerce (GA4-07)
    const nights = Math.max(
      1,
      Math.round(
        (new Date(checkout).getTime() - new Date(checkin).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    // Fire GA4 event
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof win.gtag === "function") {
      win.gtag("event", "begin_checkout", {
        currency: "EUR",
        value: nights * 150,
        items: [
          {
            item_id: "apartment",
            item_name: "apartment",
            item_category: plan,
            price: 150,
            quantity: nights,
          },
        ],
      });
    }

    // Navigate to Octorate
    window.location.assign(octorateUrl);
  }, [checkin, checkout, selectedPlan]);

  return (
    <Section padding="default" className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-3xl font-bold text-brand-heading">
        {t("book.heroTitle")}
      </h1>
      <p className="text-lg text-brand-text/80">{t("book.heroSubtitle")}</p>

      <div className="mt-8 space-y-6">
        {/* Date Selection */}
        <div className="rounded-xl border border-brand-outline/40 bg-brand-surface p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-brand-heading">
            {t("book.dateLabel")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="checkin"
                className="mb-1 block text-sm font-medium text-brand-text"
              >
                {t("book.checkinLabel")}
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
                {t("book.checkoutLabel")}
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
            {t("book.dateLabel")}
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
                {t("book.rateNonRefundable")}
              </h3>
              {/* eslint-disable-next-line ds/no-hardcoded-copy -- LINT-1008 [ttl=2026-12-31] Rate plan description pending i18n */}
              <p className="mt-1 text-sm text-brand-text/70">
                Best rate, no refunds
              </p>
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
                {t("book.rateFlexible")}
              </h3>
              {/* eslint-disable-next-line ds/no-hardcoded-copy -- LINT-1008 [ttl=2026-12-31] Rate plan description pending i18n */}
              <p className="mt-1 text-sm text-brand-text/70">
                Free cancellation until 48h before
              </p>
            </button>
          </div>
        </div>

        {/* Fit Check */}
        <FitCheck />

        {/* CTA */}
        <div className="flex flex-col gap-4">
          <Button
            color={selectedPlan === "flex" ? "primary" : "accent"}
            tone="solid"
            onClick={handleCheckAvailability}
            className="w-full text-lg py-6"
          >
            {t("book.checkAvailability")}
          </Button>

          <div className="text-center">
            <p className="text-sm text-brand-text/60">
              {t("book.orBookingCom")}
            </p>
            <a
              href={BOOKING_COM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-primary hover:underline"
            >
              Booking.com
            </a>
          </div>

          <div className="mt-2 text-center">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2 text-sm font-medium text-brand-primary hover:underline"
            >
              {t("book.whatsappCta")}
            </a>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="mt-8 text-sm">
        <Link
          href={`/${lang}/apartment`}
          prefetch={true}
          className="text-brand-primary hover:underline"
        >
          {t("book.backLink")}
        </Link>
      </div>
    </Section>
  );
}

export default memo(ApartmentBookContent);
