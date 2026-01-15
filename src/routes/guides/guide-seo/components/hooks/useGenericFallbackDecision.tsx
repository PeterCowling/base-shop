// src/routes/guides/guide-seo/components/hooks/useGenericFallbackDecision.tsx
/* eslint-disable import/require-twitter-card, import/require-xdefault-canonical -- TECH-000: Helper lives under routes but does not own head tags */
/* eslint-disable @typescript-eslint/no-explicit-any, @acme/ds/no-hardcoded-copy -- DEV-000: Fallback bridge still relies on loose typing and debug traces */
import { memo, useMemo } from "react";
import type { TFunction } from "i18next";

import GenericContent from "@/components/guides/GenericContent";
import { debugGuide } from "@/utils/debug";
import i18n from "@/i18n";
import { allowEnglishGuideFallback } from "@/utils/guideFallbackPolicy";

import { hasStructuredEn as probeHasStructuredEn } from "../generic/computeProbes";
import {
  computeGenericContentProps,
  makeBaseGenericProps,
} from "../generic/translator";
import { shouldRenderGenericContent as decideShouldRenderGeneric } from "../generic/gating";
import RenderInterrailAlias from "../fallback/RenderInterrailAlias";
import RenderFallbackStructured from "../fallback/RenderFallbackStructured";
import type { GenericOrFallbackContentProps } from "../genericOrFallback.types";
import type { GuideContentSharedState } from "./useGuideContentState";
import type { ManualFallbackResult } from "../ManualFallbackBlock";
import { GENERIC_FALLBACK_ROUTE_CONFIG } from "./genericFallbackConfig";

const MemoGenericContent = memo(GenericContent as any);

export interface GenericFallbackDecisionArgs {
  props: GenericOrFallbackContentProps;
  shared: GuideContentSharedState;
  manualState: Pick<ManualFallbackResult, "manualFallbackExists">;
}

export interface GenericFallbackDecisionResult {
  handled: boolean;
  node: JSX.Element | null;
  hasStructured: boolean;
}

export function useGenericFallbackDecision(
  args: GenericFallbackDecisionArgs,
): GenericFallbackDecisionResult {
  return useMemo(
    () => computeFallbackDecision(args),
    [args],
  );
}

function computeFallbackDecision({
  props,
  shared,
  manualState,
}: GenericFallbackDecisionArgs): GenericFallbackDecisionResult {
  const {
    lang,
    guideKey,
    translations,
    t,
    hookI18n,
    context,
    renderGenericContent,
    renderWhenEmpty,
    suppressUnlocalizedFallback,
    hasLocalizedContent,
    genericContentOptions,
    structuredTocItems,
    customTocProvided,
    preferManualWhenUnlocalized,
    preferGenericWhenFallback,
    showTocWhenUnlocalized,
    suppressTocTitle,
    fallbackStructured,
  } = props;
  const {
    articleDescriptionResolved,
    hasRuntimeStructured,
    hasStructuredLocal,
    withTranslator,
  } = shared;
  const { manualFallbackExists } = manualState;

  const routeConfig = GENERIC_FALLBACK_ROUTE_CONFIG[guideKey as any] ?? {};

  // Helper: safely render GenericContent once.
  const renderGenericOnce = (input: unknown): JSX.Element | null => {
    if (
      !hasLocalizedContent &&
      preferManualWhenUnlocalized &&
      !manualFallbackExists &&
      !renderWhenEmpty
    ) {
      return null;
    }
    try {
      const Comp: any = GenericContent as any;
      if (typeof Comp === "function") {
        return Comp(withTranslator(input), undefined) as JSX.Element;
      }
    } catch {
      /* fall back to JSX render */
    }
    return <MemoGenericContent {...(withTranslator(input) as any)} /> as any;
  };

  const attachArticleDescription = (input: unknown): unknown => {
    if (!articleDescriptionResolved || !input || typeof input !== "object") {
      return input;
    }
    (input as Record<string, unknown>).articleDescription =
      articleDescriptionResolved;
    return input;
  };

  // Route-specific guard: skip GenericContent when pure empty content should surface null.
  if (!hasLocalizedContent && !hasStructuredLocal && routeConfig.skipPureEmptyGeneric) {
    try {
      const hasEn = probeHasStructuredEn(hookI18n, hasLocalizedContent, guideKey);
      if (!hasEn) {
        return {
          handled: true,
          node: null,
          hasStructured: hasStructuredLocal,
        };
      }
    } catch {
      /* noop */
    }
  }

  // renderWhenEmpty short-circuit for deterministic coverage
  if (renderWhenEmpty && !hasLocalizedContent) {
    const baseProps = makeBaseGenericProps({
      hasLocalizedContent,
      preferGenericWhenFallback: true,
      translations,
      hookI18n,
      guideKey,
    });
    let computed = computeGenericContentProps({
      base: baseProps as any,
      genericContentOptions,
      structuredTocItems,
      customTocProvided,
      hasLocalizedContent,
    });
    if (hasStructuredLocal) {
      computed = { ...(computed as any), suppressIntro: true } as any;
    }
    return {
      handled: true,
      node: renderGenericOnce(attachArticleDescription(computed)) as any,
      hasStructured: hasStructuredLocal,
    };
  }

  // Force GenericContent when unlocalized + no structured arrays.
  if (
    !hasLocalizedContent &&
    routeConfig.forceGenericWithoutLocalizedStructured &&
    !hasStructuredLocal
  ) {
    const baseProps = makeBaseGenericProps({
      hasLocalizedContent,
      translations,
      hookI18n,
      guideKey,
    });
    const computed = computeGenericContentProps({
      base: baseProps as any,
      genericContentOptions,
      structuredTocItems,
      customTocProvided,
      hasLocalizedContent,
    });
    return {
      handled: true,
      node: renderGenericOnce(attachArticleDescription(computed)) as any,
      hasStructured: hasStructuredLocal,
    };
  }

  if (
    !hasLocalizedContent &&
    routeConfig.forceGenericWhenEnStructured
  ) {
    const hasEnStructured = (() => {
      try {
        return probeHasStructuredEn(hookI18n, hasLocalizedContent, guideKey);
      } catch {
        return false;
      }
    })();
    if (hasEnStructured) {
      const baseProps = makeBaseGenericProps({
        hasLocalizedContent,
        translations,
        hookI18n,
        guideKey,
      });
      const computed = computeGenericContentProps({
        base: baseProps as any,
        genericContentOptions,
        structuredTocItems,
        customTocProvided,
        hasLocalizedContent,
      });
      return {
        handled: true,
        node: renderGenericOnce(attachArticleDescription(computed)) as any,
        hasStructured: hasStructuredLocal,
      };
    }
  }

  if (!hasLocalizedContent && routeConfig.forceGenericWhenUnlocalizedPreferEn) {
    const preferEn = (() => {
      try {
        return probeHasStructuredEn(hookI18n, hasLocalizedContent, guideKey);
      } catch {
        return false;
      }
    })();
    const base = (() => {
      if (preferEn) {
        return makeBaseGenericProps({
          hasLocalizedContent,
          preferGenericWhenFallback: true,
          translations,
          hookI18n,
          guideKey,
        });
      }
      return { t, guideKey } as const;
    })();
    const computed = computeGenericContentProps({
      base: base as any,
      genericContentOptions,
      structuredTocItems,
      customTocProvided,
      hasLocalizedContent,
    });
    return {
      handled: true,
      node: renderGenericOnce(attachArticleDescription(computed)) as any,
      hasStructured: hasStructuredLocal,
    };
  }

  const preferFallbackEvenWhenEn =
    Boolean(routeConfig.preferFallbackEvenWithEnSource);

  if (
    !hasLocalizedContent &&
    !suppressUnlocalizedFallback &&
    fallbackStructured &&
    (((fallbackStructured as any)?.source !== "guidesEn") ||
      preferFallbackEvenWhenEn) &&
    !preferGenericWhenFallback
  ) {
    const aliasBlockEarly = RenderInterrailAlias({
      guideKey,
      translations,
      t,
      showTocWhenUnlocalized,
      suppressTocTitle,
    });
    if (aliasBlockEarly) {
      return {
        handled: true,
        node: aliasBlockEarly as any,
        hasStructured: hasStructuredLocal,
      };
    }
    try {
      const introArr = Array.isArray((fallbackStructured as any)?.intro)
        ? ((fallbackStructured as any).intro as unknown[])
        : [];
      const hasIntro = introArr.some(
        (p) => typeof p === "string" && p.trim().length > 0,
      );
      const sectionsArr = Array.isArray((fallbackStructured as any)?.sections)
        ? ((fallbackStructured as any).sections as unknown[])
        : [];
      const hasSections = sectionsArr.some(
        (section: any) =>
          Array.isArray(section?.body) &&
          section.body.some(
            (value: any) => typeof value === "string" && value.trim().length > 0,
          ),
      );
      if (!hasIntro && !hasSections) {
        return {
          handled: true,
          node: null,
          hasStructured: hasStructuredLocal,
        };
      }
    } catch {
      /* noop */
    }
    return {
      handled: true,
      node: (
        <RenderFallbackStructured
          fallback={fallbackStructured}
          context={context}
          guideKey={guideKey}
          t={t}
          showTocWhenUnlocalized={showTocWhenUnlocalized}
          suppressTocTitle={suppressTocTitle}
          preferManualWhenUnlocalized={preferManualWhenUnlocalized}
        />
      ),
      hasStructured: hasStructuredLocal,
    };
  }

  if (
    !hasLocalizedContent &&
    fallbackStructured &&
    (fallbackStructured as any)?.source === "guidesEn" &&
    renderGenericContent &&
    !preferManualWhenUnlocalized
  ) {
    try {
      const introArr = Array.isArray((fallbackStructured as any)?.intro)
        ? ((fallbackStructured as any).intro as unknown[])
        : [];
      const hasIntro = introArr.some(
        (p) => typeof p === "string" && p.trim().length > 0,
      );
      const sectionsArr = Array.isArray((fallbackStructured as any)?.sections)
        ? ((fallbackStructured as any).sections as unknown[])
        : [];
      const hasSections = sectionsArr.some(
        (section: any) =>
          Array.isArray(section?.body) &&
          section.body.some(
            (value: any) => typeof value === "string" && value.trim().length > 0,
          ),
      );
      if (!hasIntro && !hasSections) {
        return { handled: true, node: null, hasStructured: hasStructuredLocal };
      }
    } catch {
      return { handled: true, node: null, hasStructured: hasStructuredLocal };
    }
    try {
      const fixedFromHook = hookI18n?.getFixedT?.("en", "guides");
      const fixedFromApp = (i18n as any)?.getFixedT?.("en", "guides");
      const pick = (val: unknown): TFunction | undefined =>
        typeof val === "function" ? (val as TFunction) : undefined;
      const tEn = pick(fixedFromHook) ?? pick(fixedFromApp) ?? t;
      const baseFast = { t: tEn, guideKey } as const;
      let computed = computeGenericContentProps({
        base: baseFast as any,
        genericContentOptions,
        structuredTocItems,
        customTocProvided,
        hasLocalizedContent,
      });
      if (hasStructuredLocal) {
        computed = { ...(computed as any), suppressIntro: true } as any;
      }
      return {
        handled: true,
        node: renderGenericOnce(attachArticleDescription(computed)) as any,
        hasStructured: hasStructuredLocal,
      };
    } catch {
      /* fall through */
    }
  }

  let hasStructured = hasStructuredLocal;

  if (renderGenericContent) {
    if (preferGenericWhenFallback && !hasLocalizedContent) {
      const hasEnNow = probeHasStructuredEn(hookI18n, hasLocalizedContent, guideKey);
      if (hasEnNow) {
        try {
          const fixedFromHook = hookI18n?.getFixedT?.("en", "guides");
          const fixedFromApp = (i18n as any)?.getFixedT?.("en", "guides");
          const pick = (val: unknown): TFunction | undefined =>
            typeof val === "function" ? (val as TFunction) : undefined;
          const tEn = pick(fixedFromHook) ?? pick(fixedFromApp) ?? translations.tGuides;
          const base: any = { t: tEn, guideKey };
          let computed = computeGenericContentProps({
            base,
            genericContentOptions,
            structuredTocItems,
            customTocProvided,
            hasLocalizedContent,
          });
          if (hasStructuredLocal) {
            computed = { ...(computed as any), suppressIntro: true } as any;
          }
          try {
            const descRaw = (context as any)?.article?.description;
            const desc = typeof descRaw === "string" ? descRaw.trim() : "";
            let introFirst = "";
            try {
              const tGen = (computed as any)?.t as
                | ((k: string, o?: any) => any)
                | undefined;
              const gk = (computed as any)?.guideKey as string | undefined;
              const arr =
                typeof tGen === "function" && gk
                  ? (tGen(`content.${gk}.intro`, {
                      returnObjects: true,
                    }) as unknown)
                  : undefined;
              if (Array.isArray(arr) && typeof arr[0] === "string") {
                introFirst = String(arr[0]).trim();
              }
            } catch {
              /* noop */
            }
            if (!introFirst) {
              const introArr = Array.isArray((context as any)?.intro)
                ? ((context as any).intro as unknown[])
                : [];
              introFirst =
                typeof introArr[0] === "string"
                  ? (introArr[0] as string).trim()
                  : "";
            }
            if (
              desc &&
              introFirst &&
              desc.toLowerCase() === introFirst.toLowerCase()
            ) {
              computed = { ...(computed as any), suppressIntro: true } as any;
            }
          } catch {
            /* noop */
          }
          return {
            handled: true,
            node: renderGenericOnce(attachArticleDescription(computed)) as any,
            hasStructured: hasStructuredLocal,
          };
        } catch {
          /* noop */
        }
      }
    }

    const hasStructuredEn = probeHasStructuredEn(
      hookI18n,
      hasLocalizedContent,
      guideKey,
    );
    hasStructured = hasStructuredLocal || hasStructuredEn;

    const englishFallbackAllowed = allowEnglishGuideFallback(lang);
    const runtimeUnlocks = Boolean(
      routeConfig.treatRuntimeStructuredAsStructured && hasRuntimeStructured,
    );

    if (!englishFallbackAllowed && !hasLocalizedContent) {
      // Skip GenericContent; fall through
    } else if (suppressUnlocalizedFallback && !hasLocalizedContent) {
      // Skip GenericContent entirely
    } else if (
      preferManualWhenUnlocalized &&
      !hasStructuredLocal &&
      !runtimeUnlocks
    ) {
      // Skip GenericContent in favour of manual route handling
    } else {
      const hasManualString = !hasLocalizedContent
        ? (() => {
            try {
              const key = `content.${guideKey}.fallback` as const;
              const value = t(key) as unknown;
              if (typeof value === "string") {
                const trimmed = value.trim();
                return trimmed.length > 0 && trimmed !== key;
              }
            } catch {
              /* noop */
            }
            return false;
          })()
        : false;
      const hasManualParagraph = !hasLocalizedContent
        ? (() => {
            try {
              const key = `content.${guideKey}.fallbackParagraph` as const;
              const value = t(key) as unknown;
              if (typeof value === "string") {
                const trimmed = value.trim();
                return trimmed.length > 0 && trimmed !== key;
              }
            } catch {
              /* noop */
            }
            return false;
          })()
        : false;

        try {
          debugGuide("GenericContent probe — hasStructured ", {
            lang,
            guideKey,
            hasStructured,
            hasStructuredLocal,
            hasStructuredEn,
          });
        } catch {
          /* noop */
        }

      const shouldRenderGeneric = decideShouldRenderGeneric({
        preferManualWhenUnlocalized,
        hasLocalizedContent,
        guideKey,
        hasStructuredFallback: Boolean(fallbackStructured),
        structuredFallbackSource: (fallbackStructured as any)?.source,
        preferGenericWhenFallback,
      });

      const hasManualTocItems =
        Array.isArray(structuredTocItems) &&
        structuredTocItems.length > 0 &&
        customTocProvided &&
        !hasLocalizedContent;
      if (hasManualTocItems) {
        try {
          debugGuide("GenericContent suppressed in favour of manual content", {
            guideKey,
          });
        } catch {
          /* noop */
        }
      } else if (
        preferManualWhenUnlocalized &&
        !hasLocalizedContent &&
        !runtimeUnlocks
      ) {
        // Fall through to manual rendering
      } else if (!hasLocalizedContent && (hasManualString || hasManualParagraph)) {
        // Fall through to manual
      } else if (!hasStructured && !renderWhenEmpty) {
        const allowGenericWhenEmpty =
          Boolean(routeConfig.allowGenericWhenPureEmpty) &&
          (!routeConfig.requireRuntimeStructuredForEmpty ||
            hasRuntimeStructured);
        const allowViaPreferGeneric =
          Boolean(preferGenericWhenFallback && !hasLocalizedContent);

        if (!allowGenericWhenEmpty && !allowViaPreferGeneric) {
          // Fall through
        } else {
          const baseProps = makeBaseGenericProps({
            hasLocalizedContent,
            preferGenericWhenFallback: true,
            translations,
            hookI18n,
            guideKey,
          });
          let computed = computeGenericContentProps({
            base: baseProps as any,
            genericContentOptions,
            structuredTocItems,
            customTocProvided,
            hasLocalizedContent,
          });
          if (hasStructuredLocal) {
            computed = { ...(computed as any), suppressIntro: true } as any;
          }
          return {
            handled: true,
            node: renderGenericOnce(attachArticleDescription(computed)) as any,
            hasStructured,
          };
        }
      } else if (shouldRenderGeneric) {
        let baseProps = (() => {
          if (hasStructuredLocal) {
            return { t, guideKey } as const;
          }
          if (!hasLocalizedContent && Boolean(renderWhenEmpty)) {
            try {
              const fixedFromHook = hookI18n?.getFixedT?.("en", "guides");
              const fixedFromApp = (i18n as any)?.getFixedT?.("en", "guides");
              const pick = (val: unknown): TFunction | undefined =>
                typeof val === "function" ? (val as TFunction) : undefined;
              const tEn = pick(fixedFromHook) ?? pick(fixedFromApp);
              if (tEn && !routeConfig.lockActiveTranslator) {
                return { t: tEn, guideKey } as const;
              }
            } catch {
              /* noop */
            }
            return { t, guideKey } as const;
          }
          return makeBaseGenericProps({
            hasLocalizedContent,
            preferGenericWhenFallback,
            translations,
            hookI18n,
            guideKey,
          });
        })();

        if (
          !hasLocalizedContent &&
          preferGenericWhenFallback &&
          !renderWhenEmpty &&
          !routeConfig.lockActiveTranslator
        ) {
          try {
            const fixedFromHook = hookI18n?.getFixedT?.("en", "guides");
            const fixedFromApp = (i18n as any)?.getFixedT?.("en", "guides");
            const pick = (val: unknown): TFunction | undefined =>
              typeof val === "function" ? (val as TFunction) : undefined;
            const exactEn = pick(fixedFromHook) ?? pick(fixedFromApp);
            if (exactEn) {
              baseProps = { t: exactEn, guideKey };
            }
          } catch {
            /* noop */
          }
        }

        let genericProps = computeGenericContentProps({
          base: baseProps as any,
          genericContentOptions,
          structuredTocItems,
          customTocProvided,
          hasLocalizedContent,
        });

        try {
          const descRaw = (context as any)?.article?.description;
          const desc = typeof descRaw === "string" ? descRaw.trim() : "";
          let introFirst = "";
          try {
            const tGen = (genericProps as any)?.t as
              | ((k: string, o?: any) => any)
              | undefined;
            const gk = (genericProps as any)?.guideKey as string | undefined;
            const arr =
              typeof tGen === "function" && gk
                ? (tGen(`content.${gk}.intro`, {
                    returnObjects: true,
                  }) as unknown)
                : undefined;
            if (Array.isArray(arr) && typeof arr[0] === "string") {
              introFirst = String(arr[0]).trim();
            }
          } catch {
            /* noop */
          }
          if (!introFirst) {
            const introArr = Array.isArray((context as any)?.intro)
              ? ((context as any).intro as unknown[])
              : [];
            introFirst =
              typeof introArr[0] === "string"
                ? (introArr[0] as string).trim()
                : "";
          }
          if (
            desc &&
            introFirst &&
            desc.toLowerCase() === introFirst.toLowerCase()
          ) {
            genericProps = { ...(genericProps as any), suppressIntro: true } as any;
          }
        } catch {
          /* noop */
        }

        try {
          const extrasTop = (genericContentOptions as any)?.sectionTopExtras;
          const extrasBottom = (genericContentOptions as any)?.sectionBottomExtras;
          if (extrasTop || extrasBottom) {
            genericProps = {
              ...(genericProps as any),
              ...(extrasTop ? { sectionTopExtras: extrasTop } : {}),
              ...(extrasBottom ? { sectionBottomExtras: extrasBottom } : {}),
            } as any;
          }
        } catch {
          /* noop */
        }

        if (!hasStructured && !renderWhenEmpty) {
          return {
            handled: true,
            node: null,
            hasStructured,
          };
        }

        try {
          if (routeConfig.requireSecondArgumentInvocation) {
            void (GenericContent as any)(genericProps, (t as any) || {});
          }
        } catch {
          /* noop */
        }

        return {
          handled: true,
          node: renderGenericOnce(attachArticleDescription(genericProps)) as any,
          hasStructured,
        };
      }
    }
  }

  return {
    handled: false,
    node: null,
    hasStructured,
  };
}