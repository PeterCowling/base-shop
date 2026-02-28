"use client";

// src/app/[lang]/private-rooms/street-level-arrival/StreetLevelArrivalContent.tsx
// Client component for street-level arrival page
import { memo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import { Section } from "@acme/design-system/atoms";

import FitCheck from "@/components/apartment/FitCheck";
import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { trackApartmentEvent } from "@/utils/trackApartmentEvent";

type Props = {
  lang: AppLanguage;
};

const WHATSAPP_URL = "https://wa.me/393287073695";

function StreetLevelArrivalContent({ lang }: Props) {
  const { t } = useTranslation("apartmentPage", { lng: lang });
  usePagePreload({ lang, namespaces: ["apartmentPage"] });

  return (
    <Section padding="none" className="mx-auto max-w-4xl p-6 pt-24 sm:pt-10">
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-brand-heading sm:text-5xl">
              {t("streetLevelArrival.heroTitle")}
            </h1>
            <p className="text-xl text-brand-primary sm:text-2xl">
              {t("streetLevelArrival.heroSubtitle")}
            </p>
          </div>
          {/* eslint-disable-next-line ds/container-widths-only-at -- BRIK-APT-001 [ttl=2026-12-31] Hero body text constraint */}
          <p className="mx-auto max-w-xl text-lg text-brand-text">
            {t("streetLevelArrival.heroBody")}
          </p>
        </section>

        {/* Video Placeholder */}
        <section className="flex items-center justify-center">
          {/* eslint-disable-next-line ds/container-widths-only-at -- BRIK-APT-001 [ttl=2026-12-31] Video placeholder constraint */}
          <div className="flex h-64 w-full max-w-xl items-center justify-center rounded-2xl bg-brand-surface/50 border border-brand-outline/30 shadow-sm sm:h-80">
            <p className="text-brand-text/60">{t("streetLevelArrival.videoPlaceholder")}</p>
          </div>
        </section>

        {/* Clarification */}
        <section className="rounded-2xl border border-brand-outline/30 bg-brand-surface/50 p-6 shadow-sm backdrop-blur-sm">
          <p className="text-base text-brand-text sm:text-lg">
            {t("streetLevelArrival.clarification")}
          </p>
        </section>

        {/* Fit Check */}
        <section>
          <FitCheck />
        </section>

        {/* CTAs */}
        <section className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href={`/${lang}/apartment/book/`}
            onClick={() => trackApartmentEvent("click_check_availability", { source: "street-level-arrival" })}
            className="min-h-11 min-w-11 rounded-lg bg-brand-primary px-8 py-3 text-center font-semibold text-fg-inverse transition-colors hover:bg-brand-primary/90 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-brand-primary focus-visible:focus:ring-offset-2"
          >
            {t("streetLevelArrival.checkAvailability")}
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackApartmentEvent("click_whatsapp", { source: "street-level-arrival" })}
            className="min-h-11 min-w-11 rounded-lg border border-brand-outline bg-brand-surface px-8 py-3 text-center font-semibold text-brand-primary transition-colors hover:bg-brand-surface/80 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-brand-primary focus-visible:focus:ring-offset-2"
          >
            {t("streetLevelArrival.whatsappCta")}
          </a>
        </section>
      </div>
    </Section>
  );
}

export default memo(StreetLevelArrivalContent);
