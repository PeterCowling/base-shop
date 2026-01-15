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

type I18nResourceOptions = {
  guideContentKeys?: readonly string[];
  guideSummaryKeys?: readonly string[];
  guideLabelKeys?: readonly string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const pruneGuidesNamespace = (
  value: unknown,
  fullKeys: Set<string>,
  summaryKeys: Set<string>,
  labelKeys?: Set<string>,
): unknown => {
  if (!isRecord(value)) return value;

  const content = value["content"];
  if (!isRecord(content)) {
    return value;
  }

  const slimContent: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(content)) {
    if (fullKeys.has(key)) {
      slimContent[key] = entry;
      continue;
    }

    if (isRecord(entry)) {
      const slimEntry: Record<string, unknown> = {};
      if (summaryKeys.has(key)) {
        const seo = entry["seo"];
        if (isRecord(seo)) {
          if ("description" in seo && seo["description"] !== undefined) {
            slimEntry["seo"] = { description: seo["description"] };
          }
        } else if (seo !== undefined) {
          slimEntry["seo"] = seo;
        }
      }
      const shouldIncludeLabel = !labelKeys || labelKeys.has(key);
      if (shouldIncludeLabel && "linkLabel" in entry && entry["linkLabel"] !== undefined) {
        slimEntry["linkLabel"] = entry["linkLabel"];
      }
      if (Object.keys(slimEntry).length > 0) {
        slimContent[key] = slimEntry;
      }
      continue;
    }

    if (entry !== undefined) {
      slimContent[key] = entry;
    }
  }

  return { ...value, content: slimContent };
};

const pruneGuidesFallbackNamespace = (value: unknown, fullKeys: Set<string>): unknown => {
  if (!isRecord(value)) return value;

  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === "labels" || fullKeys.has(key)) {
      next[key] = entry;
    }
  }

  return next;
};

const applyGuidesFilters = (
  resources: Record<string, unknown>,
  fullKeys: Set<string>,
  summaryKeys: Set<string>,
  labelKeys?: Set<string>,
): Record<string, unknown> => {
  if (resources["guides"] === undefined && resources["guidesFallback"] === undefined) {
    return resources;
  }

  const next: Record<string, unknown> = { ...resources };
  if (resources["guides"] !== undefined) {
    next["guides"] = pruneGuidesNamespace(resources["guides"], fullKeys, summaryKeys, labelKeys);
  }
  if (resources["guidesFallback"] !== undefined) {
    next["guidesFallback"] = pruneGuidesFallbackNamespace(resources["guidesFallback"], fullKeys);
  }
  return next;
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
  options?: I18nResourceOptions,
): I18nResourcesPayload => {
  const data = readResourceStore(lang);
  const guideContentKeys = new Set(options?.guideContentKeys ?? []);
  const guideSummaryKeys = new Set(options?.guideSummaryKeys ?? []);
  const guideLabelKeys = options?.guideLabelKeys ? new Set(options.guideLabelKeys) : undefined;

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

  const resources = applyGuidesFilters(
    filterNamespaces(data),
    guideContentKeys,
    guideSummaryKeys,
    guideLabelKeys,
  );
  const payload: I18nResourcesPayload = { lang, resources };

  const fallbackLang = i18nConfig.fallbackLng as AppLanguage;
  if (fallbackLang && fallbackLang !== lang) {
    const fallbackResources = applyGuidesFilters(
      filterNamespaces(readResourceStore(fallbackLang)),
      guideContentKeys,
      guideSummaryKeys,
      guideLabelKeys,
    );
    if (Object.keys(fallbackResources).length > 0) {
      payload.fallback = { lang: fallbackLang, resources: fallbackResources };
    }
  }

  return payload;
};
