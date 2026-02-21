"use client";
/* eslint-disable ds/container-widths-only-at, ds/no-hardcoded-copy -- GS-001 [ttl=2026-12-31] Guide content wrapper uses inline layout; error text is non-UI */

// src/app/[lang]/experiences/[slug]/GuideContent.tsx
// Client component for guide pages (App Router version)
import { memo, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import { ContentStickyCta } from "@/components/cta/ContentStickyCta";
import { GuideBoundary } from "@/components/guides/GuideBoundary";
import PlanChoiceAnalytics from "@/components/guides/PlanChoiceAnalytics";
import { IS_DEV } from "@/config/env";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideNamespace } from "@/routes.guides-helpers";
import GuideSeoTemplate from "@/routes/guides/_GuideSeoTemplate";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { resolveLabel, useEnglishFallback } from "@/utils/translation-fallback";

type Props = {
  lang: AppLanguage;
  guideKey: GuideKey;
  serverGuides?: Record<string, unknown>;
  serverGuidesEn?: Record<string, unknown>;
};

function GuideContent({ lang, guideKey, serverGuides, serverGuidesEn }: Props) {
  const { t } = useTranslation("guides", { lng: lang });
  const [loadError, setLoadError] = useState(false);

  // Seed i18n store from server data on mount/update.
  // This must not run during render because i18n emits updates.
  useEffect(() => {
    if (!serverGuides) return;

    i18n.addResourceBundle(lang, "guides", serverGuides, true, true);
    if (serverGuidesEn) {
      i18n.addResourceBundle("en", "guides", serverGuidesEn, true, true);
    }
  }, [lang, serverGuides, serverGuidesEn]);

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

  const base = guideNamespace(lang, guideKey);
  const listingPath = `/${lang}/${base.baseSlug}`;

  // Use guideKey as metaKey (GuideMeta doesn't have metaKey override)
  const metaKey = guideKey;

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:max-w-4xl lg:px-8">
        <Link
          href={listingPath}
          className="mb-6 inline-flex min-h-11 min-w-11 items-center gap-2 text-sm font-medium text-primary-700 underline decoration-primary-200 underline-offset-4 transition hover:text-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <span aria-hidden="true">←</span>
          {backLabel}
        </Link>
        <PlanChoiceAnalytics />
        {loadError ? (
          <div className="rounded-lg border border-1 bg-surface-1 p-6 text-center text-muted">
            <p className="text-sm">This content could not be loaded. Please try refreshing the page.</p>
          </div>
        ) : (
          <GuideBoundary guideKey={guideKey}>
            <Suspense fallback={null}>
              <GuideSeoTemplate
                guideKey={guideKey}
                metaKey={metaKey}
              />
            </Suspense>
          </GuideBoundary>
        )}
      </div>
      <ContentStickyCta lang={lang} ctaLocation="guide_detail" />
    </>
  );
}

export default memo(GuideContent);
