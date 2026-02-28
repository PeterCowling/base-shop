"use client";

// src/app/[lang]/private-rooms/private-stay/PrivateStayContent.tsx
// Client component for private stay page
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

function PrivateStayContent({ lang }: Props) {
  const { t } = useTranslation("apartmentPage", { lng: lang });
  usePagePreload({ lang, namespaces: ["apartmentPage"] });

  return (
    <Section padding="none" className="mx-auto max-w-6xl p-6 pt-24 sm:pt-10">
      {/* eslint-disable-next-line ds/container-widths-only-at -- BRIK-APT-001 [ttl=2026-12-31] Content wrapper, not a reusable container */}
      <div className="mx-auto max-w-3xl space-y-16">
        {/* Hero Section */}
        <section className="space-y-4 text-center">
          <h1 className="text-3xl font-bold text-brand-heading sm:text-4xl">
            {t("privateStay.heroTitle")}
          </h1>
          <p className="text-lg text-brand-text">
            {t("privateStay.heroSubtitle")}
          </p>
        </section>

        {/* Three Content Sections */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Privacy Section */}
          <div className="rounded-2xl border border-brand-outline/30 bg-brand-surface/50 p-6 shadow-sm backdrop-blur-sm">
            <h2 className="mb-3 text-xl font-semibold text-brand-heading">
              {t("privateStay.sections.privacy.title")}
            </h2>
            <p className="text-brand-text">
              {t("privateStay.sections.privacy.body")}
            </p>
          </div>

          {/* Support Section */}
          <div className="rounded-2xl border border-brand-outline/30 bg-brand-surface/50 p-6 shadow-sm backdrop-blur-sm">
            <h2 className="mb-3 text-xl font-semibold text-brand-heading">
              {t("privateStay.sections.support.title")}
            </h2>
            <p className="text-brand-text">
              {t("privateStay.sections.support.body")}
            </p>
          </div>

          {/* Amenities Section */}
          <div className="rounded-2xl border border-brand-outline/30 bg-brand-surface/50 p-6 shadow-sm backdrop-blur-sm">
            <h2 className="mb-3 text-xl font-semibold text-brand-heading">
              {t("privateStay.sections.amenities.title")}
            </h2>
            <p className="text-brand-text">
              {t("privateStay.sections.amenities.body")}
            </p>
          </div>
        </div>

        {/* Fit Check Component */}
        <FitCheck />

        {/* CTAs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href={`/${lang}/apartment/book/`}
            onClick={() => trackApartmentEvent("click_check_availability", { source: "private-stay" })}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-brand-primary px-6 py-3 font-semibold text-fg-inverse transition-colors hover:bg-brand-primary/90"
          >
            {t("privateStay.checkAvailability")}
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackApartmentEvent("click_whatsapp", { source: "private-stay" })}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-brand-outline bg-brand-surface px-6 py-3 font-semibold text-brand-heading transition-colors hover:bg-brand-surface/80"
          >
            {t("privateStay.whatsappCta")}
          </a>
        </div>
      </div>
    </Section>
  );
}

export default memo(PrivateStayContent);
