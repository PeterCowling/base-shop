"use client";

// src/app/[lang]/experiences/[slug]/GuideContent.tsx
// Client component for guide pages (App Router version)
import { memo, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";

import { GuideBoundary } from "@/components/guides/GuideBoundary";
import PlanChoiceAnalytics from "@/components/guides/PlanChoiceAnalytics";
import { IS_DEV } from "@/config/env";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideNamespace } from "@/routes.guides-helpers";
import GuideSeoTemplate from "@/routes/guides/_GuideSeoTemplate";
import type { ManifestOverrides } from "@/routes/guides/guide-manifest-overrides";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { resolveLabel, useEnglishFallback } from "@/utils/translation-fallback";

type Props = {
  lang: AppLanguage;
  guideKey: GuideKey;
  serverOverrides?: ManifestOverrides;
};

function GuideContent({ lang, guideKey, serverOverrides }: Props) {
  const { t } = useTranslation("guides", { lng: lang });
  const [loadError, setLoadError] = useState(false);

  // Auto-append audit cache-bust parameter in dev if audit results exist
  useEffect(() => {
    if (!IS_DEV || typeof window === "undefined") {
      console.debug("[GuideContent] Audit auto-append skipped:", { IS_DEV, hasWindow: typeof window !== "undefined" });
      return;
    }

    // Check if audit results exist
    const hasAuditResults = serverOverrides?.[guideKey]?.auditResults != null;
    console.debug("[GuideContent] Audit check:", {
      guideKey,
      hasServerOverrides: serverOverrides != null,
      hasAuditResults,
      auditScore: serverOverrides?.[guideKey]?.auditResults?.score,
    });

    if (!hasAuditResults) return;

    // Check if URL already has the audit parameter
    const url = new URL(window.location.href);
    const hasParam = url.searchParams.has("_audit");
    console.debug("[GuideContent] URL check:", { currentUrl: url.toString(), hasParam });

    if (hasParam) return;

    // Add audit timestamp to force fresh data
    url.searchParams.set("_audit", Date.now().toString());
    console.debug("[GuideContent] Appending audit parameter:", url.toString());
    window.history.replaceState({}, "", url.toString());
  }, [guideKey, serverOverrides]);

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
          <GuideSeoTemplate
            guideKey={guideKey}
            metaKey={metaKey}
            serverOverrides={serverOverrides}
          />
        </GuideBoundary>
      )}
    </div>
  );
}

export default memo(GuideContent);
