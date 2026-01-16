// src/routes/guides/guide-seo/components/ManualFallbackBlock.tsx
/* eslint-disable import/require-twitter-card, import/require-xdefault-canonical -- TECH-000: Non-route helper under routes; head tags come from the guide route */
/* eslint-disable @typescript-eslint/no-explicit-any -- SEO-2743: Template helper keeps legacy any casts for harness parity */
import RenderManualObject from "./fallback/RenderManualObject";
import type { GenericOrFallbackContentProps } from "./genericOrFallback.types";
import type { GuideContentSharedState } from "./hooks/useGuideContentState";
import { debugGuide } from "@/utils/debug";
import { manualFallbackHasMeaningfulContent } from "../manualFallbackUtils";

export interface ManualFallbackResult {
  element: JSX.Element | null;
  manualFallbackExists: boolean;
  manualLocalMeaningful: boolean;
  manualEnMeaningful: boolean;
  shouldHalt: boolean;
}

export function renderManualFallbackPreGeneric(
  props: GenericOrFallbackContentProps,
  shared: GuideContentSharedState,
): ManualFallbackResult {
  const {
    guideKey,
    hasLocalizedContent,
    hookI18n,
    lang,
    preferGenericWhenFallback,
    preferManualWhenUnlocalized,
    showTocWhenUnlocalized,
    suppressTocTitle,
    suppressUnlocalizedFallback,
    t,
    translations,
  } = props;
  const { localizedManualFallback } = shared;

  let manualLocalMeaningful = false;
  let manualEnMeaningful = false;
  let manualFallbackExists = false;

  const baseResult: ManualFallbackResult = {
    element: null,
    manualFallbackExists,
    manualLocalMeaningful,
    manualEnMeaningful,
    shouldHalt: false,
  };

  if (!hasLocalizedContent && !preferGenericWhenFallback && !suppressUnlocalizedFallback) {
    try {
      const probeKey = `content.${guideKey}.fallback` as const;
      const raw = translations?.tGuides?.(probeKey, { returnObjects: true }) as unknown;
      if (raw != null && (typeof raw !== "object" || Array.isArray(raw))) {
        if (!Array.isArray(raw) || raw.length > 0) {
          return { ...baseResult, shouldHalt: true };
        }
        return baseResult;
      }
    } catch {
      /* noop */
    }
    try {
      const manualKey = `content.${guideKey}.fallback` as const;
      const localManualRaw =
        localizedManualFallback &&
        typeof localizedManualFallback === "object" &&
        !Array.isArray(localizedManualFallback)
          ? localizedManualFallback
          : (translations?.tGuides?.(manualKey, { returnObjects: true }) as unknown);
      const enManualRaw = (() => {
        try {
          const fixed = hookI18n?.getFixedT?.("en", "guides");
          if (typeof fixed === "function") {
            return fixed(manualKey, { returnObjects: true }) as unknown;
          }
        } catch {
          /* noop */
        }
        return undefined;
      })();
      manualLocalMeaningful = manualFallbackHasMeaningfulContent(localManualRaw);
      manualEnMeaningful = manualFallbackHasMeaningfulContent(enManualRaw);
      const allowEnglishManual = !preferManualWhenUnlocalized;
      const hasManual = manualLocalMeaningful || (allowEnglishManual && manualEnMeaningful);
      if (manualLocalMeaningful) manualFallbackExists = true;
      if (manualLocalMeaningful || manualEnMeaningful) {
        try {
          // i18n-exempt -- TECH-000 [ttl=2026-12-31] Debug logging only
          debugGuide("Manual fallback detected", {
            guideKey,
            lang,
            source: manualLocalMeaningful ? "local" : manualEnMeaningful ? "en" : "none",
          });
        } catch {
          /* noop */
        }
      }
      if (hasManual) {
        manualFallbackExists = true;
        const element = (
          <RenderManualObject
            translations={translations}
            hookI18n={hookI18n}
            guideKey={guideKey as any}
            t={t as any}
            showTocWhenUnlocalized={showTocWhenUnlocalized}
            suppressTocTitle={suppressTocTitle}
          />
        );
        return {
          element,
          manualEnMeaningful,
          manualFallbackExists,
          manualLocalMeaningful,
          shouldHalt: true,
        };
      }
    } catch {
      /* noop */
    }
  }

  if (!hasLocalizedContent && !suppressUnlocalizedFallback) {
    const allowEnglishManual = !preferManualWhenUnlocalized;
    const shouldRenderManual =
      manualLocalMeaningful || (allowEnglishManual && manualEnMeaningful);
    if (shouldRenderManual) {
      const manualEarly = RenderManualObject({
        translations,
        hookI18n,
        guideKey: guideKey as any,
        t: t as any,
        showTocWhenUnlocalized,
        suppressTocTitle,
      });
      if (manualEarly) {
        manualFallbackExists = true;
        try {
          // i18n-exempt -- TECH-000 [ttl=2026-12-31] Debug logging only
          debugGuide("Manual fallback rendered early", { guideKey, lang });
        } catch {
          /* noop */
        }
        return {
          element: manualEarly as any,
          manualEnMeaningful,
          manualFallbackExists,
          manualLocalMeaningful,
          shouldHalt: true,
        };
      }
    }
  }

  return {
    element: null,
    manualEnMeaningful,
    manualFallbackExists,
    manualLocalMeaningful,
    shouldHalt: false,
  };
}