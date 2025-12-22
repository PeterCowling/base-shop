import i18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "@/i18n.config";

export type I18nResourcesPayload = {
  lang: AppLanguage;
  resources: Record<string, unknown>;
  fallback?: {
    lang: AppLanguage;
    resources: Record<string, unknown>;
  };
};

const readResourceStore = (lang: AppLanguage): Record<string, unknown> => {
  const data =
    i18n.getDataByLanguage?.(lang) ??
    (i18n.services?.resourceStore?.data?.[lang] as unknown);

  if (!data || typeof data !== "object") {
    return {};
  }

  return data as Record<string, unknown>;
};

export const collectI18nResources = (
  lang: AppLanguage,
  namespaces?: readonly string[],
): I18nResourcesPayload => {
  const data = readResourceStore(lang);

  const filterNamespaces = (input: Record<string, unknown>): Record<string, unknown> => {
    if (!namespaces) {
      return input;
    }

    const resources: Record<string, unknown> = {};
    for (const ns of namespaces) {
      if (input[ns] !== undefined) {
        resources[ns] = input[ns];
      }
    }
    return resources;
  };

  const resources = filterNamespaces(data);
  const payload: I18nResourcesPayload = { lang, resources };

  const fallbackLang = i18nConfig.fallbackLng as AppLanguage;
  if (fallbackLang && fallbackLang !== lang) {
    const fallbackResources = filterNamespaces(readResourceStore(fallbackLang));
    if (Object.keys(fallbackResources).length > 0) {
      payload.fallback = { lang: fallbackLang, resources: fallbackResources };
    }
  }

  return payload;
};
