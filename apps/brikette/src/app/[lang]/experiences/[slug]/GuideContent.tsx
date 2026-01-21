"use client";

// src/app/[lang]/experiences/[slug]/GuideContent.tsx
// Client component for guide pages (App Router version)
import { memo, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import PlanChoiceAnalytics from "@/components/guides/PlanChoiceAnalytics";
import type { GuideSection } from "@/data/guides.index";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import GuideSeoTemplate from "@/routes/guides/_GuideSeoTemplate";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { getSlug } from "@/utils/slug";

type Props = {
  lang: AppLanguage;
  guideKey: GuideKey;
  section: GuideSection;
};

function GuideContent({ lang, guideKey, section }: Props) {
  const { t } = useTranslation("guides", { lng: lang });

  // Preload guide namespaces on mount
  useEffect(() => {
    const loadNamespaces = async () => {
      await preloadNamespacesWithFallback(lang, ["guides", "guidesFallback"], {
        fallbackOptional: false,
      });
      await preloadNamespacesWithFallback(lang, ["guides.tags"], {
        optional: true,
        fallbackOptional: true,
      });
      await i18n.changeLanguage(lang);
    };
    void loadNamespaces();
  }, [lang]);

  const fallbackGuides = useMemo(() => i18n.getFixedT("en", "guides"), []);
  const backLabel = t("labels.backLink", {
    defaultValue: fallbackGuides("labels.backLink", { defaultValue: "Back" }) as string,
  }) as string;

  // Resolve section base path
  const sectionSlug = section === "help" ? getSlug("assistance", lang) : getSlug("guides", lang);
  const listingPath = `/${lang}/${sectionSlug}`;

  // Use guideKey as metaKey (GuideMeta doesn't have metaKey override)
  const metaKey = guideKey;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:max-w-4xl lg:px-8">
      <Link
        href={listingPath}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary-700 underline decoration-primary-200 underline-offset-4 transition hover:text-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <span aria-hidden="true">←</span>
        {backLabel}
      </Link>
      <PlanChoiceAnalytics />
      <GuideSeoTemplate guideKey={guideKey} metaKey={metaKey} />
    </div>
  );
}

export default memo(GuideContent);
