"use client";

// src/app/[lang]/experiences/[slug]/GuideContent.tsx
// Client component for guide pages (App Router version)
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import { IS_DEV } from "@/config/env";
import { GuideBoundary } from "@/components/guides/GuideBoundary";
import PlanChoiceAnalytics from "@/components/guides/PlanChoiceAnalytics";
import type { GuideSection } from "@/data/guides.index";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import GuideSeoTemplate from "@/routes/guides/_GuideSeoTemplate";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { getSlug } from "@/utils/slug";
import { resolveLabel, useEnglishFallback } from "@/utils/translation-fallback";

type Props = {
  lang: AppLanguage;
  guideKey: GuideKey;
  section: GuideSection;
};

function GuideContent({ lang, guideKey, section }: Props) {
  const { t } = useTranslation("guides", { lng: lang });
  const [loadError, setLoadError] = useState(false);

  // Preload guide namespaces on mount
  useEffect(() => {
    let cancelled = false;
    const loadNamespaces = async () => {
      try {
        await preloadNamespacesWithFallback(lang, ["guides", "guidesFallback"], {
          fallbackOptional: false,
        });
        await preloadNamespacesWithFallback(lang, ["guides.tags"], {
          optional: true,
          fallbackOptional: true,
        });
        await i18n.changeLanguage(lang);
      } catch (err) {
        if (IS_DEV) console.debug("[GuideContent] namespace load failed", guideKey, err);
        if (!cancelled) setLoadError(true);
      }
    };
    void loadNamespaces();
    return () => { cancelled = true; };
  }, [lang, guideKey]);

  const fallbackGuides = useEnglishFallback("guides");
  const backLabel = resolveLabel(t, "labels.backLink",
    resolveLabel(fallbackGuides, "labels.backLink", "Back")
  );

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
      {loadError ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center text-neutral-600">
          <p className="text-sm">This content could not be loaded. Please try refreshing the page.</p>
        </div>
      ) : (
        <GuideBoundary guideKey={guideKey}>
          <GuideSeoTemplate guideKey={guideKey} metaKey={metaKey} />
        </GuideBoundary>
      )}
    </div>
  );
}

export default memo(GuideContent);
