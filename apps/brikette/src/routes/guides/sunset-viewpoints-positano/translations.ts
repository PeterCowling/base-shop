import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import appI18n from "@/i18n";

export type GuidesTranslator = TFunction<"guides">;
export type HeaderTranslator = TFunction<"header">;
export type GenericTranslator = TFunction;

type UseTranslatorsResult = {
  t: GuidesTranslator;
  fallbackT: GuidesTranslator;
  tHeader: HeaderTranslator;
  headerFallback: HeaderTranslator;
  tTranslation: GenericTranslator;
};

function getFallbackTranslator<Namespace extends string>(
  namespace: Namespace,
  translator: TFunction<Namespace>,
): TFunction<Namespace> {
  try {
    return appI18n.getFixedT("en", namespace) as TFunction<Namespace>;
  } catch {
    return translator;
  }
}

export function useSunsetViewpointsTranslators(lang: string): UseTranslatorsResult {
  const { t } = useTranslation<"guides">("guides", { lng: lang });
  const { t: tHeader } = useTranslation("header", { lng: lang });
  const { t: tTranslation } = useTranslation("translation", { lng: lang });

  const fallbackT = useMemo(() => getFallbackTranslator("guides", t), [t]);

  const headerFallback = useMemo(() => getFallbackTranslator("header", tHeader), [tHeader]);

  return {
    t,
    fallbackT: fallbackT as GuidesTranslator,
    tHeader: tHeader as HeaderTranslator,
    headerFallback: headerFallback as HeaderTranslator,
    tTranslation,
  };
}
