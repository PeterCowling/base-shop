import appI18n from "@/i18n";

import type { TFunction } from "i18next";

function createTranslator<TNamespace extends string>(
  locale: string,
  namespace: TNamespace
): TFunction<TNamespace> {
  const translator = appI18n.getFixedT(locale, namespace);
  if (typeof translator === "function") {
    return translator as TFunction<TNamespace>;
  }

  const defaults = { lng: locale, ns: namespace } as const;

  const fallbackTranslator = ((key: string | string[], options?: Record<string, unknown>) => {
    const finalOptions = options ? { ...defaults, ...options } : defaults;
    return appI18n.t(key, finalOptions);
  }) as TFunction<TNamespace>;

  return fallbackTranslator;
}

export function getGuidesTranslator(locale: string): TFunction<"guides"> {
  return createTranslator(locale, "guides");
}

export function getGuidesFallbackTranslator(locale: string): TFunction<"guidesFallback"> {
  return createTranslator(locale, "guidesFallback");
}
