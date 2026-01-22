import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { debugGuide } from "@/utils/debug";
import { DEFAULT_TWITTER_CARD } from "@/utils/headConstants";

import {
  resolveGuidesLabel,
  resolveHomeLabel,
  resolveMetaDescription,
  resolveMetaTitle,
} from "./meta-resolution";
import type { GuideTranslationSuite } from "./translations";

type HookI18n = { getFixedT?: (lng: string, ns?: string) => TFunction };

function useGuidesI18n(): HookI18n | undefined {
  try {
    const translation = useTranslation("guides", { useSuspense: false }) as unknown as { i18n?: HookI18n };
    return translation?.i18n;
  } catch {
    void 0;
    return undefined;
  }
}

interface GuideMetaArgs extends GuideTranslationSuite {
  metaKey: string;
  twitterCardKey: string;
  twitterCardDefault?: string;
  /** Treat translator-provided structured arrays as localized and suppress EN fallbacks */
  hasLocalizedContent?: boolean;
  /** Optional i18n instance from useGuideTranslations for reliable getFixedT access in tests */
  i18n?: { getFixedT?: (lng: string, ns?: string) => TFunction };
  /** When true and no localized content exists, suppress English string fallbacks. */
  suppressUnlocalizedFallback?: boolean;
  /**
   * Allow English fallback strings even when suppressUnlocalizedFallback=true. This is used
   * by manual fallback routes so article metadata (title/description) remains populated when
   * there is no localized structured content.
   */
  allowEnglishFallbackWhenManual?: boolean;
}

export interface GuideMetaResult {
  title: string;
  description: string;
  twitterCardType: string;
  homeLabel: string;
  guidesLabel: string;
}

export function useGuideMeta({
  metaKey,
  twitterCardDefault,
  twitterCardKey: _twitterCardKey,
  tGuides,
  guidesEn,
  tAny,
  anyEn: _anyEn,
  tHeader,
  headerEn: _headerEn,
  tCommon: _tCommon,
  commonEn: _commonEn,
  lang,
  hasLocalizedContent,
  i18n: hookFromTranslations,
  suppressUnlocalizedFallback,
  allowEnglishFallbackWhenManual,
}: GuideMetaArgs): GuideMetaResult {
  // Access the i18n instance from react-i18next hook once
  const guidesI18n = useGuidesI18n();
  const hookI18n: HookI18n | undefined = hookFromTranslations ?? guidesI18n;

  // Pre-fetch English resources for labels
  const englishHomeResource = (() => {
    try {
      return getGuideResource<unknown>("en", "labels.homeBreadcrumb", { includeFallback: false });
    } catch {
      return undefined;
    }
  })();

  const englishGuidesResource = (() => {
    try {
      return getGuideResource<unknown>("en", "labels.guidesBreadcrumb", { includeFallback: false });
    } catch {
      return undefined;
    }
  })();

  const englishHomeTranslatorValue = (() => {
    try {
      return guidesEn("labels.homeBreadcrumb") as unknown;
    } catch {
      return undefined;
    }
  })();

  const englishGuidesTranslatorValue = (() => {
    try {
      return guidesEn("labels.guidesBreadcrumb") as unknown;
    } catch {
      return undefined;
    }
  })();

  // Caching refs for label stability
  const homeLabelCache = useRef<{ lang: string; value: string } | null>(null);
  const guidesLabelCache = useRef<{ lang: string; value: string } | null>(null);

  const allowEnglishFallback = Boolean(
    hasLocalizedContent || !suppressUnlocalizedFallback || allowEnglishFallbackWhenManual,
  );

  // Resolve meta title
  const title = useMemo(
    () => resolveMetaTitle({ metaKey, lang, tGuides, guidesEn }),
    [guidesEn, lang, metaKey, tGuides],
  );

  // Resolve meta description
  const description = useMemo(
    () => resolveMetaDescription({ metaKey, lang, tGuides, guidesEn, allowEnglishFallback }),
    [allowEnglishFallback, guidesEn, lang, metaKey, tGuides],
  );

  // Twitter card type
  const twitterCardType = useMemo(
    () => twitterCardDefault ?? DEFAULT_TWITTER_CARD,
    [twitterCardDefault],
  );

  // Resolve home label
  const computedHomeLabel = useMemo(
    () =>
      resolveHomeLabel({
        lang,
        tGuides,
        tHeader,
        tAny,
        hookI18n,
        englishHomeResource,
        englishHomeTranslatorValue,
      }),
    [englishHomeResource, englishHomeTranslatorValue, hookI18n, lang, tAny, tGuides, tHeader],
  );

  // Cache home label
  if (!homeLabelCache.current || homeLabelCache.current.lang !== lang) {
    homeLabelCache.current = { lang, value: computedHomeLabel };
  } else if (homeLabelCache.current.value !== "labels.homeBreadcrumb") {
    homeLabelCache.current = { lang, value: computedHomeLabel };
  }
  const homeLabel = homeLabelCache.current?.value ?? computedHomeLabel;

  // Resolve guides label
  const computedGuidesLabel = useMemo(
    () =>
      resolveGuidesLabel({
        lang,
        tGuides,
        guidesEn,
        hookI18n,
        englishGuidesResource,
        englishGuidesTranslatorValue,
      }),
    [englishGuidesResource, englishGuidesTranslatorValue, guidesEn, hookI18n, lang, tGuides],
  );

  // Cache guides label
  if (!guidesLabelCache.current || guidesLabelCache.current.lang !== lang) {
    guidesLabelCache.current = { lang, value: computedGuidesLabel };
  } else if (guidesLabelCache.current.value !== "labels.guidesBreadcrumb") {
    guidesLabelCache.current = { lang, value: computedGuidesLabel };
  }
  const guidesLabel = guidesLabelCache.current?.value ?? computedGuidesLabel;

  // Debug output
  try {
    debugGuide({
      context: "guides.useGuideMeta.labels",
      lang,
      hasLocalizedContent,
      homeLabel,
      guidesLabel,
      englishHomeResource,
      englishGuidesResource,
      englishHomeTranslatorValue,
      englishGuidesTranslatorValue,
    });
  } catch {
    // no-op for test environments without console
  }

  return {
    title,
    description,
    twitterCardType,
    homeLabel,
    guidesLabel,
  };
}
